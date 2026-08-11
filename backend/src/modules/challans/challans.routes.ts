import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { requireRole } from "../../middleware/requireRole";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  createChallanSchema,
  updateChallanSchema,
  listChallansQuerySchema,
  idParamSchema,
} from "./challans.schema";
import * as controller from "./challans.controller";

export const challansRouter = Router();

challansRouter.use(authenticate);

// Admin + Sales can create/confirm. Warehouse + Accounts are read-only.
challansRouter.get(
  "/",
  validate({ query: listChallansQuerySchema }),
  asyncHandler(controller.listChallansHandler)
);

challansRouter.get(
  "/:id",
  validate({ params: idParamSchema }),
  asyncHandler(controller.getChallanHandler)
);

challansRouter.post(
  "/",
  requireRole("ADMIN", "SALES"),
  validate({ body: createChallanSchema }),
  asyncHandler(controller.createChallanHandler)
);

challansRouter.put(
  "/:id",
  requireRole("ADMIN", "SALES"),
  validate({ params: idParamSchema, body: updateChallanSchema }),
  asyncHandler(controller.updateChallanHandler)
);

challansRouter.post(
  "/:id/confirm",
  requireRole("ADMIN", "SALES"),
  validate({ params: idParamSchema }),
  asyncHandler(controller.confirmChallanHandler)
);

challansRouter.post(
  "/:id/cancel",
  requireRole("ADMIN", "SALES"),
  validate({ params: idParamSchema }),
  asyncHandler(controller.cancelChallanHandler)
);
