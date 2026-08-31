import React, { useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import api, { errorMessage } from "../services/api";
import { useToast } from "../context/ToastContext";
import { KeyRound, Eye, EyeOff, Palette, Shield, User } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const toast = useToast();

  const [name, setName] = useState(user?.name || "");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);

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

  async function handleProfileUpdate(e) {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      await api.put("/auth/profile", { name });
      const stored = JSON.parse(localStorage.getItem("claimassist_user") || "{}");
      localStorage.setItem("claimassist_user", JSON.stringify({ ...stored, name }));
      toast.success("Profile updated successfully.");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setUpdatingProfile(false);
    }
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
          <form onSubmit={handleProfileUpdate} className="card p-6 space-y-4">
            <h2 className="text-sm font-semibold text-ink-900 dark:text-white flex items-center gap-2 pb-2 border-b border-surface-border dark:border-slate-800">
              <Shield size={16} className="text-brand-500" />
              Account Profile
            </h2>
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="input pl-9"
                />
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 dark:text-slate-500" />
              </div>
            </div>
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="input bg-surface-muted dark:bg-slate-800 opacity-70 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="label">Role</label>
              <p className="text-sm text-ink-900 dark:text-slate-200 font-medium capitalize mt-0.5">{user?.role}</p>
            </div>
            <button type="submit" disabled={updatingProfile} className="btn-primary w-full">
              {updatingProfile ? "Saving..." : "Save Profile"}
            </button>
          </form>

          <div className="card p-6 space-y-4">
            <h2 className="text-sm font-semibold text-ink-900 dark:text-white flex items-center gap-2 pb-2 border-b border-surface-border dark:border-slate-800">
              <Palette size={16} className="text-brand-500" />
              Appearance (Theme)
            </h2>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleThemeChange("light")}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg border transition-all ${
                  theme === "light"
                    ? "bg-brand-50 dark:bg-brand-950 border-brand-500 text-brand-700 dark:text-brand-300 shadow-sm"
                    : "bg-white dark:bg-slate-800 border-surface-border dark:border-slate-700 text-ink-500 dark:text-slate-400 hover:bg-surface-muted dark:hover:bg-slate-700"
                }`}
              >
                ☀️ Light Mode
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange("dark")}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg border transition-all ${
                  theme === "dark"
                    ? "bg-brand-50 dark:bg-brand-950 border-brand-500 text-brand-700 dark:text-brand-300 shadow-sm"
                    : "bg-white dark:bg-slate-800 border-surface-border dark:border-slate-700 text-ink-500 dark:text-slate-400 hover:bg-surface-muted dark:hover:bg-slate-700"
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
            <h2 className="text-sm font-semibold text-ink-900 dark:text-white flex items-center gap-2 pb-2 border-b border-surface-border dark:border-slate-800">
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
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-400 dark:text-slate-500 hover:text-ink-700 dark:hover:text-slate-200"
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

      <div className="mt-8 p-4 bg-white dark:bg-slate-900 rounded-xl border border-surface-border dark:border-slate-800 max-w-5xl">
        <p className="text-xs text-ink-400 dark:text-slate-400 leading-relaxed text-center">
          ClaimAssist AI is an educational prototype using synthetic healthcare data only.
          It does not connect to real EHR or insurance systems and does not provide legal or
          medical advice. All generated appeals require human review before submission.
        </p>
      </div>
    </DashboardLayout>
  );
}
