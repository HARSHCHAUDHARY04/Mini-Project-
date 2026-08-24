import React from "react";

const STATUS_STYLES = {
  UPLOADED: "bg-slate-100 text-slate-700",
  PARSING: "bg-blue-100 text-blue-700",
  ANALYZED: "bg-indigo-100 text-indigo-700",
  NEEDS_EVIDENCE: "bg-amber-100 text-amber-700",
  READY_FOR_APPEAL: "bg-teal-100 text-teal-700",
  APPEAL_GENERATED: "bg-violet-100 text-violet-700",
  UNDER_REVIEW: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  DRAFT: "bg-slate-100 text-slate-700",
  MATCH: "bg-green-100 text-green-700",
  PARTIAL: "bg-amber-100 text-amber-700",
  NOT_FOUND: "bg-red-100 text-red-700",
  CONFLICT: "bg-red-100 text-red-700",
  Strong: "bg-green-100 text-green-700",
  Moderate: "bg-amber-100 text-amber-700",
  Weak: "bg-orange-100 text-orange-700",
  "Insufficient Evidence": "bg-red-100 text-red-700",
};

export default function StatusBadge({ status, className = "" }) {
  const style = STATUS_STYLES[status] || "bg-slate-100 text-slate-700";
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
