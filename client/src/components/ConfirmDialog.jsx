import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

export default function ConfirmDialog({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure you want to proceed? This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger", // "danger" | "primary"
  onConfirm,
  onCancel,
  loading = false,
}) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isOpen) {
        onCancel();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onCancel}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="bg-white dark:bg-slate-900 rounded-xl border border-surface-border dark:border-slate-800 shadow-2xl max-w-md w-full p-6 relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={onCancel}
                className="absolute top-4 right-4 text-ink-400 dark:text-slate-500 hover:text-ink-900 dark:hover:text-white transition-colors"
              >
                <X size={18} />
              </button>

              <div className="flex items-start gap-4">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                  variant === "danger" ? "bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400" : "bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400"
                }`}>
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-base font-display font-semibold text-ink-900 dark:text-white mb-1">
                    {title}
                  </h3>
                  <p className="text-sm text-ink-500 dark:text-slate-400 leading-relaxed">
                    {message}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-surface-border dark:border-slate-800">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={loading}
                  className="btn-secondary dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                >
                  {cancelLabel}
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={loading}
                  className={variant === "danger" ? "btn-danger bg-red-600 hover:bg-red-700 text-white border-transparent" : "btn-primary"}
                >
                  {loading ? "Processing..." : confirmLabel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
