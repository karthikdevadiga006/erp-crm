import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/apiError";
import { paginatedResponse, PaginationParams } from "../../utils/pagination";
import { CreateProductInput, StockAdjustInput, UpdateProductInput } from "./products.schema";

interface ListFilters {
  search?: string;
  category?: string;
  lowStock?: boolean;
}

export async function listProducts(filters: ListFilters, pagination: PaginationParams) {
  const where: Prisma.ProductWhereInput = {
    ...(filters.category && { category: filters.category }),
    ...(filters.search && {
      OR: [
        { name: { contains: filters.search, mode: "insensitive" } },
        { sku: { contains: filters.search, mode: "insensitive" } },
      ],
    }),
  };

  // lowStock filter can't be expressed as a plain Prisma where-clause
  // (comparing two columns on the same row), so filter in memory for it.
  const [rawData, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: filters.lowStock ? undefined : pagination.skip,
      take: filters.lowStock ? undefined : pagination.limit,
      orderBy: { name: "asc" },
    }),
    prisma.product.count({ where }),
  ]);

  if (!filters.lowStock) {
    return paginatedResponse(rawData, total, pagination);
  }

  const lowStockOnly = rawData.filter((p) => p.currentStock <= p.minStockAlert);
  const page = lowStockOnly.slice(pagination.skip, pagination.skip + pagination.limit);
  return paginatedResponse(page, lowStockOnly.length, pagination);
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw ApiError.notFound("Product not found");
  return product;
}

export async function createProduct(input: CreateProductInput) {
  return prisma.product.create({
    data: {
      ...input,
      currentStock: input.currentStock ?? 0,
      minStockAlert: input.minStockAlert ?? 0,
    },
  });
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  await ensureExists(id);
  return prisma.product.update({ where: { id }, data: input });
}

export async function listMovements(productId: string) {
  await ensureExists(productId);
  return prisma.stockMovement.findMany({
    where: { productId },
    orderBy: { timestamp: "desc" },
    include: { createdBy: { select: { name: true } } },
  });
}

// Manual stock adjustment (warehouse correcting counts, receiving stock, etc.)
// Shares the same "never go negative" rule as challan confirmation.
export async function adjustStock(productId: string, input: StockAdjustInput, createdById: string) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) throw ApiError.notFound("Product not found");

    const delta = input.movementType === "IN" ? input.quantity : -input.quantity;
    const nextStock = product.currentStock + delta;

    if (nextStock < 0) {
      throw ApiError.conflict(
        `Cannot remove ${input.quantity} units — only ${product.currentStock} in stock`,
        { available: product.currentStock, requested: input.quantity }
      );
    }

    const [updatedProduct, movement] = await Promise.all([
      tx.product.update({ where: { id: productId }, data: { currentStock: nextStock } }),
      tx.stockMovement.create({
        data: {
          productId,
          quantityChanged: input.quantity,
          movementType: input.movementType,
          reason: input.reason,
          createdById,
        },
      }),
    ]);

    return { product: updatedProduct, movement };
  });
}

async function ensureExists(id: string) {
  const exists = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  if (!exists) throw ApiError.notFound("Product not found");
}
