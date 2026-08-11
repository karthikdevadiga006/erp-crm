import { PrismaClient } from "@prisma/client";

// A single shared Prisma client. Re-instantiating per-request would exhaust
// DB connections under load, especially on serverless/pooled Postgres (Neon).
export const prisma = new PrismaClient({
  // In development we previously enabled `warn` which surfaces frequent
  // transient pooler/connection-close messages. Keep only `error` so real
  // problems remain visible while reducing noise.
  log: ["error"],
  // Note: interactive transaction timeout adjustments were removed because
  // the installed Prisma runtime does not accept the `interactiveTransactions`
  // option. If needed, upgrade Prisma and @prisma/client and set this option
  // or increase transaction timeouts at call sites.
});
