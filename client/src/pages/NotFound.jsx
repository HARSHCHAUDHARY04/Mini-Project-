import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Home, LayoutDashboard } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-muted dark:bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.2), transparent 70%)" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md w-full relative"
      >
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-sm">
            <ShieldCheck className="text-white" size={18} />
          </div>
          <span className="font-display font-semibold text-ink-900 dark:text-white text-lg">ClaimAssist AI</span>
        </div>

        {/* Animated 404 */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 20 }}
          className="mb-6"
        >
          <span className="text-8xl font-display font-bold bg-gradient-to-br from-brand-400 to-brand-700 bg-clip-text text-transparent select-none">
            404
          </span>
        </motion.div>

        <div className="card p-8 shadow-lg dark:bg-slate-900 dark:border-slate-800">
          <h1 className="text-xl font-display font-semibold text-ink-900 dark:text-white mb-2">
            Page not found
          </h1>
          <p className="text-sm text-ink-500 dark:text-slate-400 mb-6 leading-relaxed">
            The page you're looking for doesn't exist or has been moved. 
            Check the URL or navigate back to a known page.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/dashboard" className="btn-primary">
              <LayoutDashboard size={15} />
              Go to Dashboard
            </Link>
            <Link to="/" className="btn-secondary dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700">
              <Home size={15} />
              Back to Home
            </Link>
          </div>
        </div>

        <p className="text-xs text-ink-400 dark:text-slate-500 mt-6">
          If you believe this is an error, please contact your administrator.
        </p>
      </motion.div>
    </div>
  );
}
