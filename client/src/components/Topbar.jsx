import React from "react";
import { Search, Bell, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

export default function Topbar({ title }) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-6 border-b border-surface-border bg-white/80 backdrop-blur">
      <h1 className="text-lg font-display font-semibold text-ink-900">{title}</h1>
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 bg-surface-muted rounded-lg px-3 py-1.5 w-64 transition-all focus-within:ring-2 focus-within:ring-brand-500 focus-within:bg-white">
          <Search size={15} className="text-ink-400" />
          <input
            placeholder="Search claims, policies…"
            className="bg-transparent text-sm outline-none w-full placeholder:text-ink-400"
          />
        </div>
        <button className="text-ink-500 hover:text-ink-900 transition-colors">
          <Bell size={18} />
        </button>
        <div className="flex items-center gap-2 pl-3 border-l border-surface-border">
          <motion.div whileHover={{ scale: 1.06 }} className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 text-brand-700 flex items-center justify-center text-sm font-semibold">
            {user?.name?.[0]?.toUpperCase() || "?"}
          </motion.div>
          <div className="hidden lg:block leading-tight">
            <p className="text-sm font-medium text-ink-900">{user?.name}</p>
            <p className="text-xs text-ink-400 capitalize">{user?.role}</p>
          </div>
          <button onClick={logout} title="Log out" className="text-ink-400 hover:text-red-600 transition-colors ml-1">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
