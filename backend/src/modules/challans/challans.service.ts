import { Prisma, PrismaClient, MovementType } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/apiError";
import { paginatedResponse, PaginationParams } from "../../utils/pagination";
import { CreateChallanInput, UpdateChallanInput } from "./challans.schema";

type Tx = Prisma.TransactionClient | PrismaClient;

interface ListFilters {
  status?: string;
  customerId?: string;
}

const challanInclude = {
  customer: { select: { id: true, name: true, businessName: true } },
  createdBy: { select: { name: true } },
  items: { include: { product: { select: { id: true, name: true, sku: true } } } },
} satisfies Prisma.ChallanInclude;

export async function listChallans(filters: ListFilters, pagination: PaginationParams) {
  const where: Prisma.ChallanWhereInput = {
    ...(filters.status && { status: filters.status as any }),
    ...(filters.customerId && { customerId: filters.customerId }),
  };

  const [data, total] = await Promise.all([
    prisma.challan.findMany({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      orderBy: { createdAt: "desc" },
      include: challanInclude,
    }),
    prisma.challan.count({ where }),
  ]);

  return paginatedResponse(data, total, pagination);
}

export async function getChallanById(id: string) {
  const challan = await prisma.challan.findUnique({ where: { id }, include: challanInclude });
  if (!challan) throw ApiError.notFound("Challan not found");
  return challan;
}

// Gap-free per-year sequence via a row-locked counter, e.g. CH-2026-0001.
// Trade-off documented in the README: a brand-new year's first row has a
// narrow create-vs-create race; every subsequent number is fully atomic.
async function nextChallanNumber(tx: Tx): Promise<string> {
  const year = new Date().getFullYear();
  const key = `challan-${year}`;
  const counter = await tx.counter.upsert({
    where: { id: key },
    create: { id: key, value: 1 },
    update: { value: { increment: 1 } },
  });
  return `CH-${year}-${String(counter.value).padStart(4, "0")}`;
}

async function buildItemsData(tx: Tx, items: { productId: string; quantity: number }[]) {
  const productIds = items.map((i) => i.productId);
  // Select only the fields we need inside the transaction to keep queries small
  const products = await tx.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, sku: true, unitPrice: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const missing = productIds.filter((id) => !productMap.has(id));
  if (missing.length > 0) {
    throw ApiError.badRequest("Some products no longer exist", { productIds: missing });
  }

  return items.map((item) => {
    const product = productMap.get(item.productId)!;
    return {
      productId: product.id,
      productNameSnapshot: product.name,
      skuSnapshot: product.sku,
      unitPriceSnapshot: product.unitPrice,
      quantity: item.quantity,
    };
  });
}

export async function createChallan(input: CreateChallanInput, createdById: string) {
  // Use a longer timeout for this specific transaction to tolerate transient
  // network latency when calling the hosted Postgres instance. Keep the
  // transaction atomic and scoped to the necessary operations only.
  return prisma.$transaction(
    async (tx) => {
      const customer = await tx.customer.findUnique({ where: { id: input.customerId }, select: { id: true } });
    if (!customer) throw ApiError.badRequest("Customer not found");

    const itemsData = await buildItemsData(tx, input.items);
    const totalQuantity = itemsData.reduce((sum, i) => sum + i.quantity, 0);
    const challanNumber = await nextChallanNumber(tx);

    return tx.challan.create({
      data: {
        challanNumber,
        customerId: input.customerId,
        createdById,
        totalQuantity,
        status: "DRAFT",
        items: { create: itemsData },
      },
      include: challanInclude,
    });
    },
    { timeout: 20000 }
  );
}

export async function updateChallan(id: string, input: UpdateChallanInput) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.challan.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Challan not found");
    if (existing.status !== "DRAFT") {
      throw ApiError.conflict(`Only DRAFT challans can be edited (current status: ${existing.status})`);
    }

    if (input.customerId) {
      const customer = await tx.customer.findUnique({ where: { id: input.customerId } });
      if (!customer) throw ApiError.badRequest("Customer not found");
    }

    if (input.items) {
      const itemsData = await buildItemsData(tx, input.items);
      const totalQuantity = itemsData.reduce((sum, i) => sum + i.quantity, 0);
      await tx.challanItem.deleteMany({ where: { challanId: id } });
      await tx.challan.update({
        where: { id },
        data: {
          ...(input.customerId && { customerId: input.customerId }),
          totalQuantity,
          items: { create: itemsData },
        },
      });
    } else if (input.customerId) {
      await tx.challan.update({ where: { id }, data: { customerId: input.customerId } });
    }

    return tx.challan.findUniqueOrThrow({ where: { id }, include: challanInclude });
  });
}

// The core business rule of this whole module: confirming a challan must
// reduce stock, must never let stock go negative, and must do both the
// stock check and the deduction atomically so two concurrent confirms
// can't both "succeed" against the same units.
export async function confirmChallan(id: string, confirmedById: string) {
  return prisma.$transaction(
    async (tx) => {
      // Select only the fields we need to keep the transaction small and fast
      const challan = await tx.challan.findUnique({
        where: { id },
        select: {
          id: true,
          challanNumber: true,
          status: true,
          items: { select: { productId: true, quantity: true, productNameSnapshot: true } },
        },
      });
    if (!challan) throw ApiError.notFound("Challan not found");
    if (challan.status !== "DRAFT") {
      throw ApiError.conflict(`Only DRAFT challans can be confirmed (current status: ${challan.status})`);
    }

    const productIds = challan.items.map((i) => i.productId);
    // Only fetch currentStock (and id) to check availability quickly
    const products = await tx.product.findMany({ where: { id: { in: productIds } }, select: { id: true, currentStock: true } });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const shortfalls = challan.items
      .map((item) => {
        const product = productMap.get(item.productId);
        const available = product?.currentStock ?? 0;
        return { item, available, short: item.quantity > available };
      })
      .filter((x) => x.short);

    if (shortfalls.length > 0) {
      throw ApiError.conflict("Insufficient stock for one or more items", {
        items: shortfalls.map((s) => ({
          productId: s.item.productId,
          productName: s.item.productNameSnapshot,
          requested: s.item.quantity,
          available: s.available,
        })),
      });
    }

    // All-or-nothing: every item is checked above before any write happens below.
    // Perform product stock updates in parallel to reduce transaction time.
    const updatePromises = challan.items.map((item) =>
      tx.product.update({ where: { id: item.productId }, data: { currentStock: { decrement: item.quantity } } })
    );

    // Prepare stock movement records and create them in bulk
    const movementRecords = challan.items.map((item) => ({
      productId: item.productId,
      quantityChanged: item.quantity,
      movementType: MovementType.OUT,
      reason: `Challan ${challan.challanNumber} confirmed`,
      createdById: confirmedById,
    }));

    // Run updates in parallel and create movements (createMany is faster than many individual creates)
    await Promise.all(updatePromises);
    await tx.stockMovement.createMany({ data: movementRecords });

    // Finally, flip the challan status to CONFIRMED and return the full challan
    return tx.challan.update({ where: { id }, data: { status: "CONFIRMED" }, include: challanInclude });
  },
    { timeout: 20000 }
  );
}

export async function cancelChallan(id: string, cancelledById: string) {
  return prisma.$transaction(
    async (tx) => {
    const challan = await tx.challan.findUnique({ where: { id }, include: { items: true } });
    if (!challan) throw ApiError.notFound("Challan not found");
    if (challan.status === "CANCELLED") {
      throw ApiError.conflict("Challan is already cancelled");
    }

    // Cancelling a confirmed challan reverses the stock deduction so
    // inventory stays accurate.
    if (challan.status === "CONFIRMED") {
      for (const item of challan.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { increment: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantityChanged: item.quantity,
            movementType: "IN",
            reason: `Challan ${challan.challanNumber} cancelled`,
            createdById: cancelledById,
          },
        });
      }
    }

      return tx.challan.update({
        where: { id },
        data: { status: "CANCELLED" },
        include: challanInclude,
      });
    },
    { timeout: 20000 }
  );
}
