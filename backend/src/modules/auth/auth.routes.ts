import { Router } from "express";
import { validate } from "../../middleware/validate";
import { authenticate } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { loginSchema } from "./auth.schema";
import { loginHandler, meHandler } from "./auth.controller";

export const authRouter = Router();

authRouter.post("/login", validate({ body: loginSchema }), asyncHandler(loginHandler));
authRouter.get("/me", authenticate, asyncHandler(meHandler));
