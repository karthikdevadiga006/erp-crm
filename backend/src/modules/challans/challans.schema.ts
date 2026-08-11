import { z } from "zod";

const challanItemInput = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().positive("Quantity must be greater than zero"),
});

export const createChallanSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  items: z.array(challanItemInput).min(1, "Add at least one product"),
});

export const updateChallanSchema = z.object({
  customerId: z.string().min(1).optional(),
  items: z.array(challanItemInput).min(1, "Add at least one product").optional(),
});

export const listChallansQuerySchema = z.object({
  status: z.enum(["DRAFT", "CONFIRMED", "CANCELLED"]).optional(),
  customerId: z.string().optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
});

export const idParamSchema = z.object({ id: z.string().min(1) });

export type CreateChallanInput = z.infer<typeof createChallanSchema>;
export type UpdateChallanInput = z.infer<typeof updateChallanSchema>;
