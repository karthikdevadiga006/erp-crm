import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { requireRole } from "../../middleware/requireRole";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  createProductSchema,
  updateProductSchema,
  listProductsQuerySchema,
  stockAdjustSchema,
  idParamSchema,
} from "./products.schema";
import * as controller from "./products.controller";

export const productsRouter = Router();

productsRouter.use(authenticate);

// Admin + Warehouse can write. Sales + Accounts are read-only on products.
productsRouter.get(
  "/",
  validate({ query: listProductsQuerySchema }),
  asyncHandler(controller.listProductsHandler)
);

productsRouter.get(
  "/:id",
  validate({ params: idParamSchema }),
  asyncHandler(controller.getProductHandler)
);

productsRouter.post(
  "/",
  requireRole("ADMIN", "WAREHOUSE"),
  validate({ body: createProductSchema }),
  asyncHandler(controller.createProductHandler)
);

productsRouter.put(
  "/:id",
  requireRole("ADMIN", "WAREHOUSE"),
  validate({ params: idParamSchema, body: updateProductSchema }),
  asyncHandler(controller.updateProductHandler)
);

productsRouter.get(
  "/:id/movements",
  validate({ params: idParamSchema }),
  asyncHandler(controller.listMovementsHandler)
);

productsRouter.post(
  "/:id/stock-adjust",
  requireRole("ADMIN", "WAREHOUSE"),
  validate({ params: idParamSchema, body: stockAdjustSchema }),
  asyncHandler(controller.adjustStockHandler)
);
