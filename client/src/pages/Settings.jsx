import React, { useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import api, { errorMessage } from "../services/api";
import { useToast } from "../context/ToastContext";
import { KeyRound, Eye, EyeOff, Palette, Shield } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);

  // Simple Theme implementation (persisted in localStorage and toggled on document elements)
  const [theme, setTheme] = useState(() => localStorage.getItem("claimassist_theme") || "light");

  function handleThemeChange(t) {
    setTheme(t);
    localStorage.setItem("claimassist_theme", t);
    if (t === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    toast.success(`Theme updated to ${t}`);
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error("New passwords do not match.");
    }
    setBusy(true);
    try {
      await api.put("/auth/password", { currentPassword, newPassword });
      toast.success("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <DashboardLayout title="Settings">
      <div className="grid md:grid-cols-2 gap-6 max-w-5xl">
        {/* Left Column: Profile & Info */}
        <div className="space-y-6">
          <div className="card p-6 space-y-5">
            <h2 className="text-sm font-semibold text-ink-900 flex items-center gap-2 pb-2 border-b border-surface-border">
              <Shield size={16} className="text-brand-500" />
              Account Profile
            </h2>
            <div>
              <p className="text-xs text-ink-400">Name</p>
              <p className="text-sm text-ink-900 font-medium mt-0.5">{user?.name}</p>
            </div>
            <div>
              <p className="text-xs text-ink-400">Email</p>
              <p className="text-sm text-ink-900 font-medium mt-0.5">{user?.email}</p>
            </div>
            <div>
              <p className="text-xs text-ink-400">Role</p>
              <p className="text-sm text-ink-900 font-medium capitalize mt-0.5">{user?.role}</p>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="text-sm font-semibold text-ink-900 flex items-center gap-2 pb-2 border-b border-surface-border">
              <Palette size={16} className="text-brand-500" />
              Appearance (Theme)
            </h2>
            <div className="flex gap-3">
              <button
                onClick={() => handleThemeChange("light")}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg border transition-all ${
                  theme === "light"
                    ? "bg-brand-50 border-brand-500 text-brand-700 shadow-sm"
                    : "bg-white border-surface-border text-ink-500 hover:bg-surface-muted"
                }`}
              >
                ☀️ Light Mode
              </button>
              <button
                onClick={() => handleThemeChange("dark")}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg border transition-all ${
                  theme === "dark"
                    ? "bg-brand-50 border-brand-500 text-brand-700 shadow-sm"
                    : "bg-white border-surface-border text-ink-500 hover:bg-surface-muted"
                }`}
              >
                🌙 Dark Mode
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Security (Change Password) */}
        <div>
          <form onSubmit={handlePasswordChange} className="card p-6 space-y-4">
            <h2 className="text-sm font-semibold text-ink-900 flex items-center gap-2 pb-2 border-b border-surface-border">
              <KeyRound size={16} className="text-brand-500" />
              Change Password
            </h2>

            <div>
              <label className="label">Current Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="Enter current password"
                  className="input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-400 hover:text-ink-700"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="At least 8 characters"
                className="input"
              />
            </div>

            <div>
              <label className="label">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Re-enter new password"
                className="input"
              />
            </div>

            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>

      <div className="mt-8 p-4 bg-white rounded-xl border border-surface-border max-w-5xl">
        <p className="text-xs text-ink-400 leading-relaxed text-center">
          ClaimAssist AI is an educational prototype using synthetic healthcare data only.
          It does not connect to real EHR or insurance systems and does not provide legal or
          medical advice. All generated appeals require human review before submission.
        </p>
      </div>
    </DashboardLayout>
  );
}
