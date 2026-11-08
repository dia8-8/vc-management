import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const inputClass =
  "w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";
const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

export default function Login({ mode = "login" }) {
  const isRegister = mode === "register";
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ companyName: "", name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (isRegister) await register(form);
      else await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || (isRegister ? "Could not create your account" : "Login failed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-flex w-14 h-14 rounded-2xl bg-brand-500 text-white items-center justify-center font-bold text-xl mb-3"
          >
            VC
          </Link>
          <h1 className="text-xl font-semibold dark:text-gray-100">{isRegister ? "Start your free trial" : "Welcome back"}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isRegister ? "14 days, full features, no card required" : "Sign in to your Viandes Corona account"}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 space-y-4 shadow-sm"
        >
          {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm px-3 py-2 rounded-lg">{error}</div>}

          {isRegister && (
            <>
              <div>
                <label className={labelClass}>Company name</label>
                <input required autoFocus value={form.companyName} onChange={set("companyName")} className={inputClass} placeholder="Your business name" />
              </div>
              <div>
                <label className={labelClass}>Your name</label>
                <input required value={form.name} onChange={set("name")} className={inputClass} />
              </div>
            </>
          )}

          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              required
              autoFocus={!isRegister}
              value={form.email}
              onChange={set("email")}
              className={inputClass}
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label className={labelClass}>Password</label>
            <input
              type="password"
              required
              minLength={isRegister ? 8 : undefined}
              value={form.password}
              onChange={set("password")}
              className={inputClass}
              placeholder={isRegister ? "At least 8 characters" : "••••••••"}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg py-2.5 text-sm transition-colors disabled:opacity-60"
          >
            {submitting ? (isRegister ? "Creating account…" : "Signing in…") : isRegister ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          {isRegister ? (
            <>
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-brand-600 dark:text-brand-400 hover:underline">
                Sign in
              </Link>
            </>
          ) : (
            <>
              New here?{" "}
              <Link to="/register" className="font-medium text-brand-600 dark:text-brand-400 hover:underline">
                Start a free trial
              </Link>
            </>
          )}
        </p>
        <p className="text-center mt-2">
          <Link to="/" className="text-xs text-gray-400 dark:text-gray-500 hover:underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
