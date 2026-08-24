import React from "react";
import { motion } from "framer-motion";
import AnimatedNumber from "./AnimatedNumber";

const ACCENTS = {
  brand: "bg-brand-50 text-brand-600",
  green: "bg-green-50 text-green-600",
  amber: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
  violet: "bg-violet-50 text-violet-600",
};

export default function StatCard({ label, value, icon: Icon, accent = "brand", sub, prefix = "", animateValue = true }) {
  const numeric = typeof value === "number";
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="card p-5 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-ink-500">{label}</p>
          <p className="mt-1.5 text-2xl font-display font-semibold text-ink-900">
            {numeric && animateValue ? (
              <>
                {prefix}
                <AnimatedNumber value={value} />
              </>
            ) : (
              value
            )}
          </p>
          {sub && <p className="mt-1 text-xs text-ink-400">{sub}</p>}
        </div>
        {Icon && (
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${ACCENTS[accent] || ACCENTS.brand}`}>
            <Icon size={18} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
