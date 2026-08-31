import React from "react";
import { Search, Filter, X } from "lucide-react";

export default function SearchFilter({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  appealabilityFilter,
  onAppealabilityChange,
  statusOptions = [],
  appealabilityOptions = ["Strong", "Moderate", "Weak", "Insufficient"],
  onClear,
}) {
  const hasActiveFilters = searchQuery || statusFilter || appealabilityFilter;

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-xl">
      {/* Search Input */}
      <div className="flex-1 min-w-[200px] relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 dark:text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by ID, patient, payer, procedure..."
          className="input pl-9 text-xs"
        />
      </div>

      {/* Status Filter */}
      {statusOptions.length > 0 && (
        <div className="flex items-center gap-1.5">
          <Filter size={14} className="text-ink-400 dark:text-slate-500 hidden sm:block" />
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="input py-1.5 text-xs w-auto cursor-pointer"
          >
            <option value="">All Statuses</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Appealability Filter */}
      {appealabilityOptions.length > 0 && (
        <select
          value={appealabilityFilter}
          onChange={(e) => onAppealabilityChange(e.target.value)}
          className="input py-1.5 text-xs w-auto cursor-pointer"
        >
          <option value="">All Appealability</option>
          {appealabilityOptions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      )}

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={onClear}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
        >
          <X size={14} /> Clear Filters
        </button>
      )}
    </div>
  );
}
