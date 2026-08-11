import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/apiError";
import { paginatedResponse, PaginationParams } from "../../utils/pagination";
import { CreateCustomerInput, UpdateCustomerInput } from "./customers.schema";

interface ListFilters {
  search?: string;
  status?: string;
  customerType?: string;
}

export async function listCustomers(filters: ListFilters, pagination: PaginationParams) {
  const where: Prisma.CustomerWhereInput = {
    ...(filters.status && { status: filters.status as any }),
    ...(filters.customerType && { customerType: filters.customerType as any }),
    ...(filters.search && {
      OR: [
        { name: { contains: filters.search, mode: "insensitive" } },
        { mobile: { contains: filters.search } },
        { businessName: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      orderBy: { createdAt: "desc" },
      include: { createdBy: { select: { name: true } } },
    }),
    prisma.customer.count({ where }),
  ]);

  return paginatedResponse(data, total, pagination);
}

export async function getCustomerById(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true } },
      followUps: { orderBy: { createdAt: "desc" }, include: { createdBy: { select: { name: true } } } },
      challans: { orderBy: { createdAt: "desc" }, select: { id: true, challanNumber: true, status: true, totalQuantity: true, createdAt: true } },
    },
  });
  if (!customer) throw ApiError.notFound("Customer not found");
  return customer;
}

export async function createCustomer(input: CreateCustomerInput, createdById: string) {
  return prisma.customer.create({
    data: {
      ...input,
      email: input.email || null,
      createdById,
    },
  });
}

export async function updateCustomer(id: string, input: UpdateCustomerInput) {
  await ensureExists(id);
  return prisma.customer.update({
    where: { id },
    data: { ...input, email: input.email === "" ? null : input.email },
  });
}

export async function addFollowUp(customerId: string, note: string, createdById: string) {
  await ensureExists(customerId);
  return prisma.followUpNote.create({
    data: { customerId, note, createdById },
  });
}

export async function listFollowUps(customerId: string) {
  await ensureExists(customerId);
  return prisma.followUpNote.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { name: true } } },
  });
}

async function ensureExists(id: string) {
  const exists = await prisma.customer.findUnique({ where: { id }, select: { id: true } });
  if (!exists) throw ApiError.notFound("Customer not found");
}
