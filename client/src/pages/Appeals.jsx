import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, FileCheck2, Filter } from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import StatusBadge from "../components/StatusBadge";
import Pagination from "../components/Pagination";
import { SkeletonTable } from "../components/Skeletons";
import api, { errorMessage } from "../services/api";
import { useToast } from "../context/ToastContext";

const STATUS_OPTIONS = ["DRAFT", "UNDER_REVIEW", "APPROVED", "REJECTED"];

export default function Appeals() {
  const [searchParams] = useSearchParams();
  const [appeals, setAppeals] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get("status") || "");
  const navigate = useNavigate();
  const toast = useToast();

  const loadAppeals = useCallback(async (page = 1, limit = 20) => {
    try {
      const params = new URLSearchParams();
      params.set("page", page);
      params.set("limit", limit);
      if (statusFilter) params.set("status", statusFilter);
      const res = await api.get(`/appeals?${params.toString()}`);
      setAppeals(res.data.data);
      if (res.data.pagination) setPagination(res.data.pagination);
    } catch (err) {
      toast.error(errorMessage(err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    loadAppeals(1, pagination.limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadAppeals]);

  return (
    <DashboardLayout title="Appeals">
      <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-xl">
        <div className="flex items-center gap-1.5">
          <Filter size={14} className="text-ink-400 dark:text-slate-500 hidden sm:block" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input py-1.5 text-xs w-auto cursor-pointer"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>
        {statusFilter && (
          <button
            onClick={() => setStatusFilter("")}
            className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
          >
            Clear filter
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border dark:border-slate-800 bg-surface-muted dark:bg-slate-800/60 text-left text-xs text-ink-500 dark:text-slate-400 uppercase tracking-wide">
              <th className="px-4 py-3 font-medium">Claim ID</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Compliance Score</th>
              <th className="px-4 py-3 font-medium">Generated</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {appeals === null && <SkeletonTable rows={4} cols={5} />}
            {appeals?.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-14 text-center">
                <FileCheck2 size={26} className="mx-auto text-ink-400/50 dark:text-slate-600 mb-2" />
                <p className="text-ink-400 dark:text-slate-400 text-sm">No appeals {statusFilter ? "match this filter" : "generated yet"}.</p>
              </td></tr>
            )}
            {appeals?.map((a, i) => (
              <motion.tr
                key={a._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(i, 8) * 0.03 }}
                onClick={() => navigate(`/appeals/${a.claimId}/review`)}
                className="border-b border-surface-border dark:border-slate-800 last:border-0 hover:bg-surface-muted/60 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                <td className="px-4 py-3 font-medium text-ink-900 dark:text-slate-100 mono">{a.claimId}</td>
                <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                <td className="px-4 py-3">
                  {a.complianceScore != null ? (
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-surface-border dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${a.complianceScore}%`,
                            backgroundColor: a.complianceScore >= 80 ? "#16a34a" : a.complianceScore >= 60 ? "#d97706" : "#dc2626",
                          }}
                        />
                      </div>
                      <span className="text-ink-700 dark:text-slate-300 text-xs tabular-nums">{a.complianceScore}%</span>
                    </div>
                  ) : <span className="text-ink-400 dark:text-slate-500">—</span>}
                </td>
                <td className="px-4 py-3 text-ink-500 dark:text-slate-400">{new Date(a.generatedAt || a.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.92 }}
                    title="Review"
                    onClick={() => navigate(`/appeals/${a.claimId}/review`)}
                    className="p-1.5 rounded-md text-ink-500 dark:text-slate-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
                  >
                    <Eye size={15} />
                  </motion.button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        <Pagination
          page={pagination.page}
          pages={pagination.pages}
          total={pagination.total}
          limit={pagination.limit}
          onPageChange={(p) => loadAppeals(p, pagination.limit)}
          onLimitChange={(l) => loadAppeals(1, l)}
        />
      </div>
    </DashboardLayout>
  );
}
