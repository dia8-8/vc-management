const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const { prismaRaw, runWithTenant } = require("../lib/db");
const { requireAuthAllowBlocked } = require("../middleware/auth");
const { logActivity } = require("../lib/activityLog");
const { licenseFor, trialEndDate, TRIAL_MAX_USERS } = require("../lib/license");

const router = express.Router();

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "12h",
  });
}

function publicUser(user, tenant) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    companyName: tenant?.name || null,
  };
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  const { email, password } = parsed.data;

  const user = await prismaRaw.user.findUnique({ where: { email: email.toLowerCase() }, include: { tenant: true } });
  if (!user || !user.active) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not set");
    return res.status(500).json({ error: "Server misconfigured" });
  }

  const token = signToken(user);

  // Blocked licenses can still sign in so the app can explain why access is off.
  if (user.tenantId) {
    await runWithTenant(user.tenantId, () =>
      logActivity({ userId: user.id, action: "LOGIN", entityType: "User", entityId: user.id })
    );
  }

  res.json({
    token,
    user: publicUser(user, user.tenant),
    license: user.tenant ? licenseFor(user.tenant) : null,
  });
});

const registerSchema = z.object({
  companyName: z.string().trim().min(2, "Company name is too short").max(100),
  name: z.string().trim().min(1, "Your name is required").max(100),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

// Self-service sign-up: creates a new client (tenant) on a free trial, with the
// registering person as its first admin. Data is isolated from every other client.
router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { companyName, name, password } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  const existing = await prismaRaw.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "An account with that email already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const { tenant, user } = await prismaRaw.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: { name: companyName, plan: "TRIAL", status: "ACTIVE", expiresAt: trialEndDate(), maxUsers: TRIAL_MAX_USERS },
    });
    await tx.setting.create({ data: { tenantId: tenant.id, companyName } });
    const user = await tx.user.create({ data: { name, email, passwordHash, role: "ADMIN", tenantId: tenant.id } });
    return { tenant, user };
  });

  await runWithTenant(tenant.id, () =>
    logActivity({ userId: user.id, action: "CREATE", entityType: "Tenant", entityId: tenant.id, details: { companyName } })
  );

  res.status(201).json({
    token: signToken(user),
    user: publicUser(user, tenant),
    license: licenseFor(tenant),
  });
});

router.get("/me", requireAuthAllowBlocked, (req, res) => {
  res.json({
    user: publicUser(req.user, req.user.tenant),
    license: req.user.tenant ? req.license : null,
  });
});

module.exports = router;
