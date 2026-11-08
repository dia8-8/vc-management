import { createContext, useCallback, useContext, useEffect, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = localStorage.getItem("vc_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [license, setLicense] = useState(null);
  const [loading, setLoading] = useState(true);

  function clearSession() {
    localStorage.removeItem("vc_token");
    localStorage.removeItem("vc_user");
    setUser(null);
    setLicense(null);
  }

  function applySession({ user, license }) {
    setUser(user);
    setLicense(license || null);
    localStorage.setItem("vc_user", JSON.stringify(user));
  }

  // Re-read who we are + the current license state from the server
  const refresh = useCallback(async () => {
    const { data } = await api.get("/auth/me");
    applySession(data);
    return data;
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("vc_token")) {
      setLoading(false);
      return;
    }
    refresh()
      .catch(clearSession)
      .finally(() => setLoading(false));
  }, [refresh]);

  // The API client fires this when any request comes back 402 (license expired/suspended)
  useEffect(() => {
    const onBlocked = () => refresh().catch(() => {});
    window.addEventListener("license-blocked", onBlocked);
    return () => window.removeEventListener("license-blocked", onBlocked);
  }, [refresh]);

  async function login(email, password) {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("vc_token", data.token);
    applySession(data);
    return data.user;
  }

  async function register(form) {
    const { data } = await api.post("/auth/register", form);
    localStorage.setItem("vc_token", data.token);
    applySession(data);
    return data.user;
  }

  function logout() {
    clearSession();
  }

  const hasFeature = (feature) => user?.role === "SUPER_ADMIN" || !!license?.features?.includes(feature);

  return (
    <AuthContext.Provider value={{ user, license, loading, login, register, logout, refresh, hasFeature }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
