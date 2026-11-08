require("dotenv").config();
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Seeds a first client (tenant) with an admin login, for local development.
async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL || "admin@viandescorona.ca").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin user already exists: ${email}`);
    return;
  }

  const tenant =
    (await prisma.tenant.findUnique({ where: { id: "tenant_default" } })) ||
    (await prisma.tenant.create({
      data: { id: "tenant_default", name: "Viandes Corona", plan: "PRO", status: "ACTIVE", expiresAt: null, maxUsers: 50 },
    }));
  await prisma.setting.upsert({ where: { tenantId: tenant.id }, update: {}, create: { tenantId: tenant.id, companyName: tenant.name } });

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { name: "Admin", email, passwordHash, role: "ADMIN", tenantId: tenant.id } });

  console.log(`Seeded admin user: ${email} / ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
