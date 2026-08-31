import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, FileText, BookOpen, Stethoscope, FileCheck2, BarChart3, Settings, ShieldCheck, X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/claims", label: "Claims", icon: FileText },
  { to: "/policies", label: "Policies", icon: BookOpen },
  { to: "/clinical-documents", label: "Clinical Documents", icon: Stethoscope },
  { to: "/appeals", label: "Appeals", icon: FileCheck2 },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ open, onClose }) {
  const { pathname } = useLocation();

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between px-6 h-16 border-b border-surface-border dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-sm">
            <ShieldCheck className="h-4.5 w-4.5 text-white" size={18} />
          </div>
          <span className="font-display font-semibold text-ink-900 dark:text-white tracking-tight">ClaimAssist AI</span>
        </div>
        {/* Mobile close button */}
        <button onClick={onClose} className="md:hidden p-1.5 rounded-md text-ink-400 hover:bg-surface-muted dark:hover:bg-slate-800 transition-colors">
          <X size={18} />
        </button>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
          const isActive = pathname === to || pathname.startsWith(to + "/");
          return (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? "text-brand-700 dark:text-brand-400" : "text-ink-500 dark:text-slate-400 hover:bg-surface-muted dark:hover:bg-slate-800 hover:text-ink-900 dark:hover:text-white"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-pill"
                  className="absolute inset-0 bg-brand-50 dark:bg-brand-950/40 rounded-lg"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <Icon size={17} className="relative z-10" />
              <span className="relative z-10">{label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="p-4 border-t border-surface-border dark:border-slate-800">
        <p className="text-[11px] leading-4 text-ink-400 dark:text-slate-500">
          Educational prototype. Synthetic data only. Not for real patient information.
        </p>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-surface-border dark:border-slate-800 bg-white dark:bg-slate-900">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="md:hidden fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-white dark:bg-slate-900 border-r border-surface-border dark:border-slate-800 shadow-xl"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
