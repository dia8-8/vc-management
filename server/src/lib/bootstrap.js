const bcrypt = require("bcryptjs");
const { prismaRaw } = require("./db");

// Creates the platform owner account (who manages every client's license) from
// env vars, so a fresh deployment needs no shell access. Safe to run on every boot.
async function ensureSuperAdmin() {
  const email = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPERADMIN_PASSWORD;
  if (!email || !password) return;

  const existing = await prismaRaw.user.findUnique({ where: { email } });
  if (existing) return;

  await prismaRaw.user.create({
    data: {
      name: process.env.SUPERADMIN_NAME || "Platform Admin",
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: "SUPER_ADMIN",
      tenantId: null,
    },
  });
  console.log(`Created super admin: ${email}`);
}

module.exports = { ensureSuperAdmin };
