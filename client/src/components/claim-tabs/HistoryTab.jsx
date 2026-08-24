import React from "react";
import { motion } from "framer-motion";

export default function HistoryTab({ claim, appeal }) {
  const events = [
    { label: "Claim uploaded", at: claim.createdAt },
    ...(claim.appealabilityScore != null ? [{ label: "Claim analyzed", at: claim.updatedAt }] : []),
    ...(appeal ? [{ label: "Appeal generated", at: appeal.generatedAt || appeal.createdAt }] : []),
    ...(appeal?.reviewedAt ? [{ label: `Appeal ${appeal.status.toLowerCase()}`, at: appeal.reviewedAt }] : []),
  ];
  return (
    <div className="card p-6">
      <ol className="space-y-4">
        {events.map((e, i) => (
          <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-brand-500 shrink-0" />
            <span className="text-sm text-ink-900">{e.label}</span>
            <span className="text-xs text-ink-400 ml-auto">{new Date(e.at).toLocaleString()}</span>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
