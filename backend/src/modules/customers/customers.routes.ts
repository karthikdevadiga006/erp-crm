import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { requireRole } from "../../middleware/requireRole";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  createCustomerSchema,
  updateCustomerSchema,
  listCustomersQuerySchema,
  createFollowUpSchema,
  idParamSchema,
} from "./customers.schema";
import * as controller from "./customers.controller";

export const customersRouter = Router();

customersRouter.use(authenticate);

// Admin + Sales can write. Warehouse + Accounts are read-only on customers.
customersRouter.get(
  "/",
  validate({ query: listCustomersQuerySchema }),
  asyncHandler(controller.listCustomersHandler)
);

customersRouter.get(
  "/:id",
  validate({ params: idParamSchema }),
  asyncHandler(controller.getCustomerHandler)
);

customersRouter.post(
  "/",
  requireRole("ADMIN", "SALES"),
  validate({ body: createCustomerSchema }),
  asyncHandler(controller.createCustomerHandler)
);

customersRouter.put(
  "/:id",
  requireRole("ADMIN", "SALES"),
  validate({ params: idParamSchema, body: updateCustomerSchema }),
  asyncHandler(controller.updateCustomerHandler)
);

customersRouter.get(
  "/:id/followups",
  validate({ params: idParamSchema }),
  asyncHandler(controller.listFollowUpsHandler)
);

customersRouter.post(
  "/:id/followups",
  requireRole("ADMIN", "SALES"),
  validate({ params: idParamSchema, body: createFollowUpSchema }),
  asyncHandler(controller.addFollowUpHandler)
);
