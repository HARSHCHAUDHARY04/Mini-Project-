import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, FileText, BookOpen, Stethoscope, FileCheck2, BarChart3, Settings, ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/claims", label: "Claims", icon: FileText },
  { to: "/policies", label: "Policies", icon: BookOpen },
  { to: "/clinical-documents", label: "Clinical Documents", icon: Stethoscope },
  { to: "/appeals", label: "Appeals", icon: FileCheck2 },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-surface-border bg-white">
      <div className="flex items-center gap-2 px-6 h-16 border-b border-surface-border">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-sm">
          <ShieldCheck className="h-4.5 w-4.5 text-white" size={18} />
        </div>
        <span className="font-display font-semibold text-ink-900 tracking-tight">ClaimAssist AI</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
          const isActive = pathname === to || pathname.startsWith(to + "/");
          return (
            <NavLink
              key={to}
              to={to}
              className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? "text-brand-700" : "text-ink-500 hover:bg-surface-muted hover:text-ink-900"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-pill"
                  className="absolute inset-0 bg-brand-50 rounded-lg"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <Icon size={17} className="relative z-10" />
              <span className="relative z-10">{label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="p-4 border-t border-surface-border">
        <p className="text-[11px] leading-4 text-ink-400">
          Educational prototype. Synthetic data only. Not for real patient information.
        </p>
      </div>
    </aside>
  );
}
