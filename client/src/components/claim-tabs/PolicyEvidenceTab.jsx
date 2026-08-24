import React from "react";
import { motion } from "framer-motion";
import { EmptyPanel } from "./Shared";

export default function PolicyEvidenceTab({ analysis }) {
  if (!analysis) return <EmptyPanel text='Run "Analyze Claim" to see retrieved policy sections.' />;
  return (
    <div className="space-y-3">
      {analysis.policySections.map((p, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="card p-4">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-sm font-semibold text-ink-900">{p.section}</p>
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-surface-border rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full" style={{ width: `${p.relevance * 100}%` }} />
              </div>
              <span className="text-xs text-ink-400 tabular-nums">{(p.relevance * 100).toFixed(0)}%</span>
            </div>
          </div>
          <p className="text-xs text-ink-400 mb-2">{p.policyName} — Page {p.page}</p>
          <p className="text-sm text-ink-700 leading-relaxed">{p.text}</p>
        </motion.div>
      ))}
    </div>
  );
}
