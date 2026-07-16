require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const customerRoutes = require("./routes/customers");
const productRoutes = require("./routes/products");
const inventoryRoutes = require("./routes/inventory");
const orderRoutes = require("./routes/orders");
const dashboardRoutes = require("./routes/dashboard");
const settingsRoutes = require("./routes/settings");
const supplierRoutes = require("./routes/suppliers");
const expenseRoutes = require("./routes/expenses");
const reportRoutes = require("./routes/reports");
const activityLogRoutes = require("./routes/activityLog");

const app = express();

const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",").map((o) => o.trim());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/activity-log", activityLogRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server listening on port ${port}`));
