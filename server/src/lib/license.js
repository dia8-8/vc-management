const TRIAL_DAYS = 14;
const TRIAL_MAX_USERS = 3;

// Feature keys gated by plan. Everything else (customers, products, inventory,
// orders, suppliers, expenses, settings, users) is available on every plan.
const ALL_FEATURES = ["reports", "deliveries", "barcode", "activity-log"];

const PLAN_FEATURES = {
  TRIAL: ALL_FEATURES, // trial shows the full product
  BASIC: [],
  PRO: ALL_FEATURES,
};

function licenseFor(tenant) {
  const now = Date.now();
  const expiresAt = tenant.expiresAt ? new Date(tenant.expiresAt) : null;
  const expired = !!expiresAt && expiresAt.getTime() < now;
  const suspended = tenant.status === "SUSPENDED";

  let blockedReason = null;
  if (suspended) blockedReason = "SUSPENDED";
  else if (expired) blockedReason = "EXPIRED";

  return {
    tenantId: tenant.id,
    companyName: tenant.name,
    plan: tenant.plan,
    status: tenant.status,
    expiresAt,
    daysLeft: expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - now) / 86400000)) : null,
    maxUsers: tenant.maxUsers,
    features: PLAN_FEATURES[tenant.plan] || [],
    blocked: !!blockedReason,
    blockedReason,
  };
}

function trialEndDate() {
  return new Date(Date.now() + TRIAL_DAYS * 86400000);
}

module.exports = { licenseFor, trialEndDate, TRIAL_DAYS, TRIAL_MAX_USERS, PLAN_FEATURES, ALL_FEATURES };
