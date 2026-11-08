const jwt = require("jsonwebtoken");
const { prismaRaw, runWithTenant } = require("../lib/db");
const { licenseFor } = require("../lib/license");

function buildAuth({ allowBlocked }) {
  return async function auth(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prismaRaw.user.findUnique({ where: { id: payload.sub }, include: { tenant: true } });

      if (!user || !user.active) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      req.user = user;

      // Platform super admins belong to no tenant and are never license-gated.
      if (user.role === "SUPER_ADMIN") return next();

      if (!user.tenant) {
        return res.status(403).json({ error: "Account is not linked to a client" });
      }

      req.license = licenseFor(user.tenant);
      if (req.license.blocked && !allowBlocked) {
        return res.status(402).json({
          error: req.license.blockedReason === "EXPIRED" ? "Your license has expired" : "Your license is suspended",
          code: "LICENSE_BLOCKED",
          reason: req.license.blockedReason,
        });
      }

      // Everything downstream (routes, Prisma queries) runs scoped to this client.
      return runWithTenant(user.tenant.id, () => next());
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }
  };
}

const requireAuth = buildAuth({ allowBlocked: false });
// For endpoints the UI must reach even when the license is blocked (to show why).
const requireAuthAllowBlocked = buildAuth({ allowBlocked: true });

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

// Plan-gated features. Must run after requireAuth.
function requireFeature(feature) {
  return (req, res, next) => {
    if (!req.license?.features.includes(feature)) {
      return res.status(403).json({ error: "This feature isn't included in your plan", code: "FEATURE_LOCKED", feature });
    }
    next();
  };
}

module.exports = { requireAuth, requireAuthAllowBlocked, requireRole, requireFeature };
