import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
});

// Pages reachable without being signed in; a 401 there shouldn't bounce to /login
const PUBLIC_PATHS = ["/", "/login", "/register"];

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("vc_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;

    if (status === 401) {
      // A failed sign-in attempt is a 401 too; only treat it as an expired session
      // if we actually had a token.
      if (localStorage.getItem("vc_token")) {
        localStorage.removeItem("vc_token");
        localStorage.removeItem("vc_user");
        if (!PUBLIC_PATHS.includes(window.location.pathname)) {
          window.location.href = "/login";
        }
      }
    }

    if (status === 402 && err.response?.data?.code === "LICENSE_BLOCKED") {
      window.dispatchEvent(new Event("license-blocked"));
    }

    return Promise.reject(err);
  }
);

export default api;
