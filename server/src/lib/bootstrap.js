const bcrypt = require("bcryptjs");
const { prismaRaw } = require("./db");

// Keeps the platform owner account (who manages every client's license) in sync
// with the SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD env vars, so a deployment needs
// no shell access. Runs on every boot and logs what it did so problems are visible.
async function ensureSuperAdmin() {
  const email = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPERADMIN_PASSWORD;

  if (!email || !password) {
    console.log("Super admin: SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD not set, skipping");
    return;
  }

  const existing = await prismaRaw.user.findUnique({ where: { email } });

  if (!existing) {
    await prismaRaw.user.create({
      data: {
        name: process.env.SUPERADMIN_NAME || "Platform Admin",
        email,
        passwordHash: await bcrypt.hash(password, 10),
        role: "SUPER_ADMIN",
        tenantId: null,
      },
    });
    console.log(`Super admin: created ${email}`);
    return;
  }

  if (existing.role !== "SUPER_ADMIN") {
    // Never silently convert someone's company login into a platform account
    console.warn(
      `Super admin: NOT created. ${email} already belongs to a regular ${existing.role} account. Set SUPERADMIN_EMAIL to an unused email address.`
    );
    return;
  }

  // The env vars are the source of truth: changing the password there changes the login.
  const passwordMatches = await bcrypt.compare(password, existing.passwordHash);
  if (!passwordMatches || !existing.active) {
    await prismaRaw.user.update({
      where: { id: existing.id },
      data: { passwordHash: await bcrypt.hash(password, 10), active: true },
    });
    console.log(`Super admin: updated credentials for ${email} from environment`);
    return;
  }

  console.log(`Super admin: ${email} is ready`);
}

module.exports = { ensureSuperAdmin };
