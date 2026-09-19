import React from "react";

const STATUS_STYLES = {
  UPLOADED: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  PARSING: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
  ANALYZED: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300",
  NEEDS_EVIDENCE: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  READY_FOR_APPEAL: "bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300",
  APPEAL_GENERATED: "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300",
  UNDER_REVIEW: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  APPROVED: "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300",
  DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  MATCH: "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300",
  PARTIAL: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  NOT_FOUND: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300",
  CONFLICT: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300",
  Strong: "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300",
  Moderate: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  Weak: "bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300",
  "Insufficient Evidence": "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300",
};

export default function StatusBadge({ status, className = "" }) {
  const style = STATUS_STYLES[status] || "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  const label = String(status || "").replace(/_/g, " ");
  const isPulsing = ["PARSING", "UNDER_REVIEW"].includes(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${style} ${className}`}
    >
      {isPulsing && <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-60" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
      </span>}
      {label}
    </span>
  );
}
