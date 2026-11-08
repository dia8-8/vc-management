import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading…</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export function AdminRoute({ children }) {
  return <RoleRoute roles={["ADMIN"]}>{children}</RoleRoute>;
}

export function RoleRoute({ roles, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading…</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

// Blocks pages that aren't part of the client's plan (the server enforces this too)
export function FeatureRoute({ feature, children }) {
  const { hasFeature } = useAuth();
  if (!hasFeature(feature)) return <Navigate to="/" replace />;
  return children;
}
