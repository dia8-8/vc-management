import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ProtectedRoute, AdminRoute, RoleRoute } from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Products from "./pages/Products";
import Inventory from "./pages/Inventory";
import Scan from "./pages/Scan";
import Orders from "./pages/Orders";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import Suppliers from "./pages/Suppliers";
import Expenses from "./pages/Expenses";
import Deliveries from "./pages/Deliveries";
import Reports from "./pages/Reports";
import ActivityLog from "./pages/ActivityLog";
import InvoicePrint from "./pages/InvoicePrint";

function HomeRoute() {
  const { user } = useAuth();
  if (user?.role === "DRIVER") return <Navigate to="/deliveries" replace />;
  return <Dashboard />;
}

export default function App() {
  return (
    <ThemeProvider>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/orders/:id/invoice"
            element={
              <ProtectedRoute>
                <InvoicePrint />
              </ProtectedRoute>
            }
          />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<HomeRoute />} />
            <Route
              path="/customers"
              element={
                <RoleRoute roles={["ADMIN", "STAFF"]}>
                  <Customers />
                </RoleRoute>
              }
            />
            <Route
              path="/products"
              element={
                <RoleRoute roles={["ADMIN", "STAFF"]}>
                  <Products />
                </RoleRoute>
              }
            />
            <Route
              path="/inventory"
              element={
                <RoleRoute roles={["ADMIN", "STAFF"]}>
                  <Inventory />
                </RoleRoute>
              }
            />
            <Route
              path="/scan"
              element={
                <RoleRoute roles={["ADMIN", "STAFF"]}>
                  <Scan />
                </RoleRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <RoleRoute roles={["ADMIN", "STAFF"]}>
                  <Orders />
                </RoleRoute>
              }
            />
            <Route
              path="/suppliers"
              element={
                <RoleRoute roles={["ADMIN", "STAFF"]}>
                  <Suppliers />
                </RoleRoute>
              }
            />
            <Route
              path="/expenses"
              element={
                <RoleRoute roles={["ADMIN", "STAFF"]}>
                  <Expenses />
                </RoleRoute>
              }
            />
            <Route path="/deliveries" element={<Deliveries />} />
            <Route
              path="/reports"
              element={
                <RoleRoute roles={["ADMIN", "STAFF"]}>
                  <Reports />
                </RoleRoute>
              }
            />
            <Route
              path="/users"
              element={
                <AdminRoute>
                  <Users />
                </AdminRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <AdminRoute>
                  <Settings />
                </AdminRoute>
              }
            />
            <Route
              path="/activity-log"
              element={
                <AdminRoute>
                  <ActivityLog />
                </AdminRoute>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
    </ThemeProvider>
  );
}
