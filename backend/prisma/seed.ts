import 'dotenv/config';
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Read seed password from environment to avoid committing secrets.
// Usage: SEED_PASSWORD environment variable must be set when running the seed script.
const SEED_PASSWORD = process.env.SEED_PASSWORD;
if (!SEED_PASSWORD) {
  throw new Error("SEED_PASSWORD environment variable is required to run the seed script.");
}

async function main() {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  const [admin, sales, warehouse, accounts] = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@wholesaleco.test" },
      update: {},
      create: { name: "Asha Rao", email: "admin@wholesaleco.test", passwordHash, role: "ADMIN" },
    }),
    prisma.user.upsert({
      where: { email: "sales@wholesaleco.test" },
      update: {},
      create: { name: "Vikram Shah", email: "sales@wholesaleco.test", passwordHash, role: "SALES" },
    }),
    prisma.user.upsert({
      where: { email: "warehouse@wholesaleco.test" },
      update: {},
      create: { name: "Farah Sheikh", email: "warehouse@wholesaleco.test", passwordHash, role: "WAREHOUSE" },
    }),
    prisma.user.upsert({
      where: { email: "accounts@wholesaleco.test" },
      update: {},
      create: { name: "Neel Kapoor", email: "accounts@wholesaleco.test", passwordHash, role: "ACCOUNTS" },
    }),
  ]);

  const customer = await prisma.customer.upsert({
    where: { id: "seed-customer-1" },
    update: {},
    create: {
      id: "seed-customer-1",
      name: "Ramesh Traders",
      mobile: "9876543210",
      email: "ramesh@rameshtraders.test",
      businessName: "Ramesh Traders Pvt Ltd",
      customerType: "DISTRIBUTOR",
      status: "ACTIVE",
      address: "12 MG Road, Bengaluru",
      createdById: sales.id,
    },
  });

  const products = await Promise.all([
    prisma.product.upsert({
      where: { sku: "SKU-STEEL-001" },
      update: {},
      create: {
        name: "Steel Hinge 4-inch",
        sku: "SKU-STEEL-001",
        category: "Hardware",
        unitPrice: 45.5,
        currentStock: 500,
        minStockAlert: 100,
        location: "Warehouse A - Rack 3",
      },
    }),
    prisma.product.upsert({
      where: { sku: "SKU-PAINT-002" },
      update: {},
      create: {
        name: "Enamel Paint 1L - White",
        sku: "SKU-PAINT-002",
        category: "Paint",
        unitPrice: 320,
        currentStock: 40,
        minStockAlert: 50,
        location: "Warehouse A - Rack 7",
      },
    }),
  ]);

  console.log("Seed complete.");
  console.log([admin, sales, warehouse, accounts].map((u) => `${u.role}: ${u.email}`).join("\n"));
  console.log(`Sample customer: ${customer.name}`);
  console.log(`Sample products: ${products.map((p) => p.sku).join(", ")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
