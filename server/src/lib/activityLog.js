const prisma = require("./prisma");

async function logActivity({ userId, action, entityType, entityId, details }) {
  await prisma.activityLog.create({
    data: {
      userId: userId || null,
      action,
      entityType,
      entityId: entityId || null,
      details: details ? JSON.stringify(details) : null,
    },
  });
}

module.exports = { logActivity };
