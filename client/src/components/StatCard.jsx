import React from "react";
import { motion } from "framer-motion";
import AnimatedNumber from "./AnimatedNumber";

const ACCENTS = {
  brand: "bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400",
  green: "bg-green-50 text-green-600 dark:bg-green-950/50 dark:text-green-400",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
  red: "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400",
};

export default function StatCard({ label, value, icon: Icon, accent = "brand", sub, prefix = "", animateValue = true, onClick }) {
  const numeric = typeof value === "number";
  const clickable = typeof onClick === "function";
  const Component = clickable ? motion.button : motion.div;

  return (
    <Component
      type={clickable ? "button" : undefined}
      onClick={onClick}
      whileHover={{ y: -3 }}
      whileTap={clickable ? { scale: 0.98 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`card p-5 hover:shadow-md w-full text-left ${clickable ? "cursor-pointer group" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-ink-500 dark:text-slate-400">{label}</p>
          <p className="mt-1.5 text-2xl font-display font-semibold text-ink-900 dark:text-white">
            {numeric && animateValue ? (
              <>
                {prefix}
                <AnimatedNumber value={value} />
              </>
            ) : (
              value
            )}
          </p>
          {sub && <p className="mt-1 text-xs text-ink-400 dark:text-slate-500">{sub}</p>}
        </div>
        {Icon && (
          <div
            className={`h-9 w-9 rounded-lg flex items-center justify-center transition-transform ${clickable ? "group-hover:scale-110" : ""} ${ACCENTS[accent] || ACCENTS.brand}`}
          >
            <Icon size={18} />
          </div>
        )}
      </div>
    </Component>
  );
}
