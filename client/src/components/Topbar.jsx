import React, { useState, useEffect, useRef } from "react";
import { Search, Bell, LogOut, Menu, CheckCheck, Info, CheckCircle2, AlertTriangle, ExternalLink, Loader2, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDebounce } from "../hooks/useDebounce";
import StatusBadge from "./StatusBadge";
import api from "../services/api";

export default function Topbar({ title, onMenuToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchRef = useRef(null);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const q = debouncedQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    api
      .get(`/claims?q=${encodeURIComponent(q)}&limit=6`)
      .then((res) => {
        if (!cancelled) setSearchResults(res.data.data || []);
      })
      .catch(() => {
        if (!cancelled) setSearchResults([]);
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [searchResults]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function goToClaim(claimId) {
    setSearchOpen(false);
    setQuery("");
    navigate(`/claims/${claimId}`);
  }

  function goToAllResults() {
    if (!query.trim()) return;
    setSearchOpen(false);
    navigate(`/claims?q=${encodeURIComponent(query.trim())}`);
  }

  function handleSearchKeyDown(e) {
    if (e.key === "Escape") {
      setSearchOpen(false);
      e.currentTarget.blur();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, searchResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && searchResults[activeIndex]) {
        goToClaim(searchResults[activeIndex].claimId);
      } else {
        goToAllResults();
      }
    }
  }

  async function fetchNotifications() {
    try {
      const res = await api.get("/notifications");
      if (res.data?.success) {
        setNotifications(res.data.data);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch {
      // silently ignore background polling errors
    }
  }

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleMarkRead(id, e) {
    if (e) e.stopPropagation();
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleMarkAllRead() {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  }

  function getNotificationIcon(type) {
    switch (type) {
      case "success":
        return <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />;
      case "warning":
        return <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />;
      default:
        return <Info size={15} className="text-brand-500 shrink-0 mt-0.5" />;
    }
  }

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
        <div className="relative hidden sm:block" ref={searchRef}>
          <div className="flex items-center gap-2 bg-surface-muted dark:bg-slate-800 rounded-lg px-3 py-1.5 w-64 transition-all focus-within:ring-2 focus-within:ring-brand-500 focus-within:bg-white dark:focus-within:bg-slate-800">
            {searching ? (
              <Loader2 size={15} className="text-ink-400 dark:text-slate-500 animate-spin shrink-0" />
            ) : (
              <Search size={15} className="text-ink-400 dark:text-slate-500 shrink-0" />
            )}
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search claims by ID, patient, payer…"
              className="bg-transparent text-sm outline-none w-full placeholder:text-ink-400 dark:placeholder:text-slate-500 text-ink-900 dark:text-slate-100"
            />
          </div>

          <AnimatePresence>
            {searchOpen && query.trim().length >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 mt-2 w-96 rounded-xl bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 shadow-2xl overflow-hidden z-50"
              >
                {searchResults.length === 0 ? (
                  <div className="p-6 text-center text-ink-400 dark:text-slate-500 text-xs">
                    {searching ? "Searching…" : `No claims match "${query.trim()}".`}
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto divide-y divide-surface-border dark:divide-slate-800">
                    {searchResults.map((c, i) => (
                      <div
                        key={c.claimId}
                        onMouseEnter={() => setActiveIndex(i)}
                        onClick={() => goToClaim(c.claimId)}
                        className={`p-3 text-xs cursor-pointer flex items-center gap-2.5 transition-colors ${
                          activeIndex === i ? "bg-brand-50 dark:bg-brand-950/40" : "hover:bg-surface-muted/60 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <FileText size={14} className="text-ink-400 dark:text-slate-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-ink-900 dark:text-slate-100 font-medium mono truncate">{c.claimId}</p>
                          <p className="text-ink-400 dark:text-slate-500 truncate">{c.patientName || c.payer}</p>
                        </div>
                        <StatusBadge status={c.status} />
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={goToAllResults}
                  className="w-full text-left px-3 py-2.5 text-xs font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/30 border-t border-surface-border dark:border-slate-800 transition-colors"
                >
                  View all results for "{query.trim()}"
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Notification Bell + Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="text-ink-500 dark:text-slate-400 hover:text-ink-900 dark:hover:text-white transition-colors relative p-1.5 rounded-lg hover:bg-surface-muted dark:hover:bg-slate-800"
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 h-4 min-w-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 shadow-2xl overflow-hidden z-50"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border dark:border-slate-800 bg-surface-muted/40 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-ink-900 dark:text-white">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                    >
                      <CheckCheck size={13} /> Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-surface-border dark:divide-slate-800">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-ink-400 dark:text-slate-500 text-xs">
                      No notifications right now.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        onClick={() => !n.read && handleMarkRead(n._id)}
                        className={`p-3 text-xs transition-colors flex items-start gap-2.5 cursor-pointer ${
                          n.read
                            ? "hover:bg-surface-muted/50 dark:hover:bg-slate-800/50 opacity-75"
                            : "bg-brand-50/40 dark:bg-brand-950/20 hover:bg-brand-50 dark:hover:bg-brand-950/40"
                        }`}
                      >
                        {getNotificationIcon(n.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-ink-900 dark:text-slate-200 leading-snug">
                            {n.message}
                          </p>
                          <div className="flex items-center justify-between gap-2 mt-1.5">
                            <span className="text-[10px] text-ink-400 dark:text-slate-500">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            {n.link && (
                              <Link
                                to={n.link}
                                onClick={() => setDropdownOpen(false)}
                                className="text-[11px] font-medium text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-0.5"
                              >
                                View <ExternalLink size={10} />
                              </Link>
                            )}
                          </div>
                        </div>
                        {!n.read && (
                          <span className="h-2 w-2 rounded-full bg-brand-500 shrink-0 mt-1.5" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Profile + Logout */}
        <div className="flex items-center gap-2 pl-3 border-l border-surface-border dark:border-slate-800">
          <motion.div
            whileHover={{ scale: 1.06 }}
            className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900 dark:to-brand-800 text-brand-700 dark:text-brand-300 flex items-center justify-center text-sm font-semibold"
          >
            {user?.name?.[0]?.toUpperCase() || "?"}
          </motion.div>
          <div className="hidden lg:block leading-tight">
            <p className="text-sm font-medium text-ink-900 dark:text-white">{user?.name}</p>
            <p className="text-xs text-ink-400 dark:text-slate-400 capitalize">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="text-ink-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors ml-1"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}

