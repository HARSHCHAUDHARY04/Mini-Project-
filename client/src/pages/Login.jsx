import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../services/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5001/api";

export default function Login() {
  const [mode, setMode] = useState("login"); // login | register
  const [form, setForm] = useState({ name: "", email: "admin@claimassist.demo", password: "Demo1234!", role: "admin" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register, completeOAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("oauth_error");
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const oauthToken = hashParams.get("oauth_token");
    if (oauthError) setError(`Google sign-in failed: ${oauthError.replaceAll("_", " ")}.`);
    if (!oauthToken) return;
    completeOAuth(oauthToken)
      .then(() => {
        window.history.replaceState({}, document.title, "/login");
        navigate("/dashboard");
      })
      .catch(() => setError("Google sign-in could not be completed. Please try again."));
  }, [completeOAuth, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        await register(form);
      }
      navigate("/dashboard");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-muted px-6 relative overflow-hidden">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-40 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)" }}
      />
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-sm relative">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-sm">
            <ShieldCheck className="text-white" size={18} />
          </div>
          <span className="font-display font-semibold text-ink-900 text-lg">ClaimAssist AI</span>
        </div>

        <div className="card p-6 shadow-lg">
          <h1 className="text-lg font-display font-semibold text-ink-900 mb-1">
            {mode === "login" ? "Sign in" : "Create an account"}
          </h1>
          <p className="text-sm text-ink-500 mb-5">
            Demo credentials are pre-filled — just hit Sign In.
          </p>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 overflow-hidden"
              >
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="label">Name</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            {mode === "register" && (
              <div>
                <label className="label">Role</label>
                <select
                  className="input"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="admin">Admin / Billing Staff</option>
                  <option value="reviewer">Reviewer</option>
                </select>
              </div>
            )}
            <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
            </motion.button>
          </form>

          {mode === "login" && (
            <>
              <div className="flex items-center gap-3 my-5 text-xs text-ink-400">
                <div className="h-px bg-ink-200 flex-1" />
                <span>OR</span>
                <div className="h-px bg-ink-200 flex-1" />
              </div>
              <a href={`${API_BASE_URL}/auth/google`} className="btn-secondary w-full text-center block">
                Continue with Google
              </a>
            </>
          )}

          <p className="text-sm text-ink-500 text-center mt-5">
            {mode === "login" ? (
              <>Need an account? <button className="text-brand-600 font-medium hover:underline" onClick={() => setMode("register")}>Register</button></>
            ) : (
              <>Already have an account? <button className="text-brand-600 font-medium hover:underline" onClick={() => setMode("login")}>Sign in</button></>
            )}
          </p>
        </div>
        <p className="text-center text-xs text-ink-400 mt-5">
          <Link to="/" className="hover:text-ink-700 transition-colors">← Back to homepage</Link>
        </p>
      </motion.div>
    </div>
  );
}
