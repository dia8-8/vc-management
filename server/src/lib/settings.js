const prisma = require("./prisma");
const { currentTenantId } = require("./db");

// Each client has exactly one settings row. Created on demand with defaults.
async function getTenantSettings() {
  return prisma.setting.upsert({
    where: { tenantId: currentTenantId() },
    update: {},
    create: {},
  });
}

module.exports = { getTenantSettings };
