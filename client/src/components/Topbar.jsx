import React from "react";
import { Search, Bell, LogOut, Menu } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

export default function Topbar({ title, onMenuToggle }) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-6 border-b border-surface-border dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="md:hidden p-1.5 rounded-lg text-ink-500 dark:text-slate-400 hover:bg-surface-muted dark:hover:bg-slate-800 transition-colors"
          title="Open Menu"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-display font-semibold text-ink-900 dark:text-white">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 bg-surface-muted dark:bg-slate-800 rounded-lg px-3 py-1.5 w-64 transition-all focus-within:ring-2 focus-within:ring-brand-500 focus-within:bg-white dark:focus-within:bg-slate-800">
          <Search size={15} className="text-ink-400 dark:text-slate-500" />
          <input
            placeholder="Search claims, policies…"
            className="bg-transparent text-sm outline-none w-full placeholder:text-ink-400 dark:placeholder:text-slate-500 text-ink-900 dark:text-slate-100"
          />
        </div>
        <button className="text-ink-500 dark:text-slate-400 hover:text-ink-900 dark:hover:text-white transition-colors relative">
          <Bell size={18} />
        </button>
        <div className="flex items-center gap-2 pl-3 border-l border-surface-border dark:border-slate-800">
          <motion.div whileHover={{ scale: 1.06 }} className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900 dark:to-brand-800 text-brand-700 dark:text-brand-300 flex items-center justify-center text-sm font-semibold">
            {user?.name?.[0]?.toUpperCase() || "?"}
          </motion.div>
          <div className="hidden lg:block leading-tight">
            <p className="text-sm font-medium text-ink-900 dark:text-white">{user?.name}</p>
            <p className="text-xs text-ink-400 dark:text-slate-400 capitalize">{user?.role}</p>
          </div>
          <button onClick={logout} title="Log out" className="text-ink-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors ml-1">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
