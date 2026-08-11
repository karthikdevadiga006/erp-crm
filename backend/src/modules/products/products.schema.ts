import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  category: z.string().min(1, "Category is required"),
  unitPrice: z.coerce.number().nonnegative("Unit price cannot be negative"),
  currentStock: z.coerce.number().int().nonnegative().optional(),
  minStockAlert: z.coerce.number().int().nonnegative().optional(),
  location: z.string().optional(),
});

export const updateProductSchema = createProductSchema
  .omit({ currentStock: true })
  .partial();

export const listProductsQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  lowStock: z.coerce.boolean().optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
});

export const stockAdjustSchema = z.object({
  quantity: z.coerce.number().int().positive("Quantity must be greater than zero"),
  movementType: z.enum(["IN", "OUT"]),
  reason: z.string().min(1, "Reason is required"),
});

export const idParamSchema = z.object({ id: z.string().min(1) });

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type StockAdjustInput = z.infer<typeof stockAdjustSchema>;
