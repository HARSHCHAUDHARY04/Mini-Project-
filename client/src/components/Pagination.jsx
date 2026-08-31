import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  page = 1,
  pages = 1,
  total = 0,
  limit = 20,
  onPageChange,
  onLimitChange,
}) {
  if (total === 0) return null;

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-surface-border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-xl">
      <div className="flex items-center gap-2 text-xs text-ink-500 dark:text-slate-400">
        <span>
          Showing <span className="font-medium text-ink-900 dark:text-slate-200">{startItem}</span> to{" "}
          <span className="font-medium text-ink-900 dark:text-slate-200">{endItem}</span> of{" "}
          <span className="font-medium text-ink-900 dark:text-slate-200">{total}</span> results
        </span>
        {onLimitChange && (
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="ml-2 rounded border border-surface-border dark:border-slate-700 bg-surface-muted dark:bg-slate-800 px-2 py-1 text-xs text-ink-700 dark:text-slate-300"
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </select>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg border border-surface-border dark:border-slate-700 text-ink-500 dark:text-slate-400 hover:bg-surface-muted dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Previous Page"
        >
          <ChevronLeft size={16} />
        </button>

        <span className="px-3 text-xs font-medium text-ink-700 dark:text-slate-300">
          Page {page} of {pages}
        </span>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          className="p-1.5 rounded-lg border border-surface-border dark:border-slate-700 text-ink-500 dark:text-slate-400 hover:bg-surface-muted dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Next Page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
