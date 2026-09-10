import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Filter, RefreshCw, Clock, User, Globe, FileText, ChevronDown, ChevronUp } from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import Pagination from "../components/Pagination";
import { SkeletonTable } from "../components/Skeletons";
import api, { errorMessage } from "../services/api";
import { useToast } from "../context/ToastContext";

const ACTION_COLORS = {
  CLAIM_CREATED: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
  CLAIM_UPLOADED: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
  APPEAL_APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
  CLAIM_DELETED: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800",
  CLAIM_SOFT_DELETED: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800",
  APPEAL_REJECTED: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800",
  USER_DELETED: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800",
  LOGIN_FAILED: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
  USER_ROLE_UPDATED: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800",
  APPEAL_GENERATED: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
  CLAIM_ANALYZED: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800",
  LOGIN_SUCCESS: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-800",
};

export default function AuditLogs() {
  const [logs, setLogs] = useState(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [actionFilter, setActionFilter] = useState("");
  const [resourceFilter, setResourceFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const toast = useToast();

  async function loadLogs() {
    setLoading(true);
    try {
      const params = { page, limit };
      if (actionFilter) params.action = actionFilter;
      if (resourceFilter) params.resource = resourceFilter;

      const res = await api.get("/audit", { params });
      setLogs(res.data.data);
      setTotal(res.data.pagination.total);
      setPages(res.data.pagination.pages);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, actionFilter, resourceFilter]);

  function getBadgeClass(action) {
    return (
      ACTION_COLORS[action] ||
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
    );
  }

  return (
    <DashboardLayout title="Audit Trail & Logs">
      <div className="space-y-5">
        {/* Top bar description & filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm text-ink-500 dark:text-slate-400">
            Immutable log of all compliance events, security actions, and workflow mutations across the system.
          </p>
          <button
            onClick={loadLogs}
            disabled={loading}
            className="btn-secondary text-xs self-start sm:self-auto flex items-center gap-1.5"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Filters Card */}
        <div className="card p-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-ink-700 dark:text-slate-300">
            <Filter size={14} className="text-brand-500" />
            Filters:
          </div>

          <div className="flex-1 sm:max-w-xs">
            <select
              value={resourceFilter}
              onChange={(e) => {
                setResourceFilter(e.target.value);
                setPage(1);
              }}
              className="input py-1.5 text-xs"
            >
              <option value="">All Resources</option>
              <option value="Claim">Claim</option>
              <option value="Appeal">Appeal</option>
              <option value="Policy">Policy</option>
              <option value="User">User</option>
              <option value="ClinicalDocument">Clinical Document</option>
            </select>
          </div>

          <div className="flex-1 sm:max-w-xs">
            <input
              type="text"
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              placeholder="Filter by action (e.g. CLAIM_CREATED)"
              className="input py-1.5 text-xs"
            />
          </div>

          {(resourceFilter || actionFilter) && (
            <button
              onClick={() => {
                setResourceFilter("");
                setActionFilter("");
                setPage(1);
              }}
              className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-muted dark:bg-slate-800/60 border-b border-surface-border dark:border-slate-800 text-xs text-ink-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 font-semibold">Timestamp</th>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                  <th className="px-4 py-3 font-semibold">Resource</th>
                  <th className="px-4 py-3 font-semibold">Target ID</th>
                  <th className="px-4 py-3 font-semibold">IP Address</th>
                  <th className="px-4 py-3 font-semibold text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border dark:divide-slate-800">
                {loading && logs === null && <SkeletonTable rows={5} cols={7} />}

                {!loading && logs?.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-ink-400 dark:text-slate-500">
                      <Shield size={32} className="mx-auto mb-2 opacity-40" />
                      <p className="font-medium">No audit logs matching current filter.</p>
                    </td>
                  </tr>
                )}

                {logs?.map((log) => {
                  const isExpanded = expandedRow === log._id;
                  const hasDetails = log.details && Object.keys(log.details).length > 0;

                  return (
                    <React.Fragment key={log._id}>
                      <tr className="hover:bg-surface-muted/40 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-ink-500 dark:text-slate-400 font-mono">
                          <div className="flex items-center gap-1.5">
                            <Clock size={12} className="text-ink-400" />
                            {new Date(log.createdAt).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-ink-900 dark:text-slate-200">
                          <div className="flex items-center gap-1.5">
                            <User size={12} className="text-brand-500" />
                            {log.userName || "System"}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${getBadgeClass(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-ink-700 dark:text-slate-300">
                          <div className="flex items-center gap-1">
                            <FileText size={12} className="text-ink-400" />
                            {log.resource}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-ink-600 dark:text-slate-400">
                          {log.resourceId ? (
                            <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                              {log.resourceId}
                            </span>
                          ) : (
                            <span className="text-ink-300 dark:text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-ink-500 dark:text-slate-400">
                          <div className="flex items-center gap-1">
                            <Globe size={12} className="text-ink-400" />
                            {log.ipAddress || "—"}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-right">
                          {hasDetails ? (
                            <button
                              onClick={() => setExpandedRow(isExpanded ? null : log._id)}
                              className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 hover:underline font-medium"
                            >
                              {isExpanded ? "Hide" : "View"}
                              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                          ) : (
                            <span className="text-ink-300 dark:text-slate-600">—</span>
                          )}
                        </td>
                      </tr>

                      {/* Expandable Details Row */}
                      <AnimatePresence>
                        {isExpanded && (
                          <tr className="bg-slate-50/70 dark:bg-slate-900/70">
                            <td colSpan={7} className="px-6 py-3">
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-1.5"
                              >
                                <span className="text-xs font-semibold text-ink-600 dark:text-slate-300 uppercase tracking-wider">
                                  Event Details Payload:
                                </span>
                                <pre className="text-xs font-mono bg-white dark:bg-slate-950 p-3 rounded-lg border border-surface-border dark:border-slate-800 overflow-x-auto text-ink-800 dark:text-slate-200">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            pages={pages}
            total={total}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(l) => {
              setLimit(l);
              setPage(1);
            }}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
