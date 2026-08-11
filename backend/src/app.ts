import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { authRouter } from "./modules/auth/auth.routes";
import { customersRouter } from "./modules/customers/customers.routes";
import { productsRouter } from "./modules/products/products.routes";
import { challansRouter } from "./modules/challans/challans.routes";

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json());

  app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/customers", customersRouter);
  app.use("/api/v1/products", productsRouter);
  app.use("/api/v1/challans", challansRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
