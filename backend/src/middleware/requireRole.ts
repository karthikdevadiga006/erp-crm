import { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";
import { ApiError } from "../utils/apiError";

// Usage: router.post("/", authenticate, requireRole("ADMIN", "SALES"), handler)
export function requireRole(...allowed: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }
    if (!allowed.includes(req.user.role)) {
      throw ApiError.forbidden(
        `This action requires one of the following roles: ${allowed.join(", ")}`
      );
    }
    next();
  };
}
