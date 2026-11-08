const { PrismaClient } = require("@prisma/client");
const { AsyncLocalStorage } = require("node:async_hooks");

// Holds the current request's tenant so every query can be scoped automatically.
const tenantStorage = new AsyncLocalStorage();

// Unscoped client. Only for code that legitimately works across tenants:
// login/registration, the auth middleware, and the super-admin platform routes.
const prismaRaw = new PrismaClient();

// Models that carry a tenantId column.
const TENANT_MODELS = new Set([
  "User",
  "Customer",
  "Product",
  "StockMovement",
  "Order",
  "ActivityLog",
  "Supplier",
  "Expense",
  "Setting",
]);

const WHERE_OPS = new Set([
  "findMany",
  "findFirst",
  "findFirstOrThrow",
  "findUnique",
  "findUniqueOrThrow",
  "count",
  "aggregate",
  "groupBy",
  "update",
  "updateMany",
  "delete",
  "deleteMany",
]);

// Scoped client used by all tenant routes. Every read/update/delete gets
// `tenantId` added to its where clause and every create gets it stamped on,
// so a route cannot read or write another client's data even by mistake.
const prisma = prismaRaw.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        if (!TENANT_MODELS.has(model)) return query(args);

        const tenantId = tenantStorage.getStore()?.tenantId;
        if (!tenantId) {
          throw new Error(`No tenant context for ${model}.${operation}`);
        }

        if (WHERE_OPS.has(operation)) {
          args.where = { ...(args.where || {}), tenantId };
        } else if (operation === "create") {
          args.data = { ...args.data, tenantId };
        } else if (operation === "createMany") {
          args.data = Array.isArray(args.data) ? args.data.map((d) => ({ ...d, tenantId })) : { ...args.data, tenantId };
        } else if (operation === "upsert") {
          args.where = { ...(args.where || {}), tenantId };
          args.create = { ...args.create, tenantId };
        }
        return query(args);
      },
    },
  },
});

function runWithTenant(tenantId, fn) {
  return tenantStorage.run({ tenantId }, fn);
}

function currentTenantId() {
  return tenantStorage.getStore()?.tenantId;
}

module.exports = { prisma, prismaRaw, runWithTenant, currentTenantId };
