import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ProtectedRoute, AdminRoute, RoleRoute, FeatureRoute } from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import LicenseBlocked from "./pages/LicenseBlocked";
import Platform from "./pages/Platform";
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

// Visitors see the public landing page at "/"; anything else needs a session.
// Signed-in users get the app shell, unless their client's license is blocked.
function AppShell() {
  const { user, loading, license } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading…</div>;
  }
  if (!user) {
    return location.pathname === "/" ? <Landing /> : <Navigate to="/login" replace />;
  }
  if (user.role !== "SUPER_ADMIN" && license?.blocked) {
    return <LicenseBlocked />;
  }
  return <Layout />;
}

function HomeRoute() {
  const { user } = useAuth();
  if (user?.role === "SUPER_ADMIN") return <Navigate to="/platform" replace />;
  if (user?.role === "DRIVER") return <Navigate to="/deliveries" replace />;
  return <Dashboard />;
}

const STAFF = ["ADMIN", "STAFF"];

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login mode="login" />} />
            <Route path="/register" element={<Login mode="register" />} />
            <Route
              path="/orders/:id/invoice"
              element={
                <ProtectedRoute>
                  <InvoicePrint />
                </ProtectedRoute>
              }
            />
            <Route element={<AppShell />}>
              <Route path="/" element={<HomeRoute />} />
              <Route
                path="/platform"
                element={
                  <RoleRoute roles={["SUPER_ADMIN"]}>
                    <Platform />
                  </RoleRoute>
                }
              />
              <Route path="/customers" element={<RoleRoute roles={STAFF}><Customers /></RoleRoute>} />
              <Route path="/products" element={<RoleRoute roles={STAFF}><Products /></RoleRoute>} />
              <Route path="/inventory" element={<RoleRoute roles={STAFF}><Inventory /></RoleRoute>} />
              <Route
                path="/scan"
                element={
                  <RoleRoute roles={STAFF}>
                    <FeatureRoute feature="barcode">
                      <Scan />
                    </FeatureRoute>
                  </RoleRoute>
                }
              />
              <Route path="/orders" element={<RoleRoute roles={STAFF}><Orders /></RoleRoute>} />
              <Route path="/suppliers" element={<RoleRoute roles={STAFF}><Suppliers /></RoleRoute>} />
              <Route path="/expenses" element={<RoleRoute roles={STAFF}><Expenses /></RoleRoute>} />
              <Route
                path="/deliveries"
                element={
                  <RoleRoute roles={["ADMIN", "STAFF", "DRIVER"]}>
                    <FeatureRoute feature="deliveries">
                      <Deliveries />
                    </FeatureRoute>
                  </RoleRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <RoleRoute roles={STAFF}>
                    <FeatureRoute feature="reports">
                      <Reports />
                    </FeatureRoute>
                  </RoleRoute>
                }
              />
              <Route path="/users" element={<AdminRoute><Users /></AdminRoute>} />
              <Route path="/settings" element={<AdminRoute><Settings /></AdminRoute>} />
              <Route
                path="/activity-log"
                element={
                  <AdminRoute>
                    <FeatureRoute feature="activity-log">
                      <ActivityLog />
                    </FeatureRoute>
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
