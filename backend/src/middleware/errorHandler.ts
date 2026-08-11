import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/apiError";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: { message: `No route matches ${req.method} ${req.path}` },
  });
}

// Express identifies this as an error handler purely by arity (4 params) —
// keep the unused `next` parameter even though it's never called.
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  if (err instanceof ApiError) {
    res.status(err.status).json({ error: { message: err.message, details: err.details } });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({
        error: { message: `A record with this ${err.meta?.target ?? "value"} already exists` },
      });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({ error: { message: "Record not found" } });
      return;
    }
  }

  console.error(err);
  res.status(500).json({ error: { message: "Internal server error" } });
}
