import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Eye, Sparkles, FileSearch, AlertCircle, FileText, X, Trash2, Download, Loader2 } from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import StatusBadge from "../components/StatusBadge";
import SearchFilter from "../components/SearchFilter";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ConfirmDialog";
import { SkeletonTable } from "../components/Skeletons";
import api, { errorMessage } from "../services/api";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

const STATUS_OPTIONS = [
  "UPLOADED",
  "PARSING",
  "ANALYZED",
  "NEEDS_EVIDENCE",
  "READY_FOR_APPEAL",
  "APPEAL_GENERATED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
];

export default function Claims() {
  const [claims, setClaims] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [appealabilityFilter, setAppealabilityFilter] = useState("");

  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);

  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fileInput = useRef(null);
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const loadClaims = useCallback(async (page = 1, limit = 20) => {
    try {
      const params = new URLSearchParams();
      params.set("page", page);
      params.set("limit", limit);
      if (searchQuery) params.set("q", searchQuery);
      if (statusFilter) params.set("status", statusFilter);
      if (appealabilityFilter) params.set("appealability", appealabilityFilter);

      const res = await api.get(`/claims?${params.toString()}`);
      setClaims(res.data.data);
      if (res.data.pagination) {
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [searchQuery, statusFilter, appealabilityFilter]);

  useEffect(() => {
    loadClaims(1, pagination.limit);
  }, [loadClaims, pagination.limit]);

  async function handleExportCSV() {
    setExporting(true);
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get("/claims/export/csv", {
        params,
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "claims-export.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Claims exported to CSV successfully.");
    } catch (err) {
      toast.error("Failed to export claims: " + errorMessage(err));
    } finally {
      setExporting(false);
    }
  }

  async function handleUpload(file) {
    if (!file) return;
    setPendingFile(file);
    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post("/claims/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.data.requiresManualCorrection) {
        toast.info("Some fields couldn't be auto-extracted — manual correction may be needed.");
        setError(
          "Some claim fields could not be automatically extracted. Please review and correct them manually."
        );
        setPendingFile(null);
      } else {
        toast.success(`Claim ${res.data.data.claim.claimId} uploaded and parsed.`);
        navigate(`/claims/${res.data.data.claim.claimId}`);
      }
    } catch (err) {
      toast.error(errorMessage(err));
      setError(errorMessage(err));
      setPendingFile(null);
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/claims/${deleteId}`);
      toast.success(`Claim ${deleteId} deleted.`);
      setDeleteId(null);
      loadClaims(pagination.page, pagination.limit);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <DashboardLayout title="Claims">
      <div className="mb-5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-sm rounded-lg px-4 py-2.5 flex items-start gap-2">
        <AlertCircle size={16} className="mt-0.5 shrink-0" />
        This educational prototype uses synthetic healthcare data. Do not upload real patient information.
      </div>

      {user?.role === "admin" && (
        <motion.div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files[0]); }}
          animate={dragOver ? { scale: 1.01 } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className={`card border-2 border-dashed p-8 flex flex-col items-center justify-center text-center mb-6 transition-colors duration-200 ${
            dragOver ? "border-brand-400 bg-brand-50/60 dark:bg-brand-950/40" : "border-surface-border dark:border-slate-800"
          }`}
        >
          <AnimatePresence mode="wait">
            {uploading ? (
              <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
                <div className="h-11 w-11 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3 animate-pulse">
                  <FileText size={20} />
                </div>
                <p className="text-sm font-medium text-ink-900 dark:text-white">Parsing {pendingFile?.name}…</p>
                <p className="text-xs text-ink-400 dark:text-slate-400 mt-1">Extracting claim fields with AI</p>
                <div className="mt-3 h-1 w-40 bg-surface-border dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-brand-500"
                    initial={{ width: "0%" }}
                    animate={{ width: "90%" }}
                    transition={{ duration: 2.5, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
                <motion.div
                  animate={dragOver ? { y: -4 } : { y: 0 }}
                  className="h-11 w-11 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3"
                >
                  <Upload size={20} />
                </motion.div>
                <p className="text-sm font-medium text-ink-900 dark:text-white">
                  {dragOver ? "Drop it right here" : "Drag & drop a denied claim / EOB file"}
                </p>
                <p className="text-xs text-ink-400 dark:text-slate-400 mt-1 mb-3">Supported formats: PDF, TXT, CSV, JSON</p>
                <button className="btn-secondary" onClick={() => fileInput.current?.click()}>
                  Browse Files
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <input
            ref={fileInput}
            type="file"
            accept=".pdf,.txt,.csv,.json"
            className="hidden"
            onChange={(e) => handleUpload(e.target.files[0])}
          />
        </motion.div>
      )}

      {error && (
        <div className="mb-5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-start justify-between gap-2">
          <span>{error}</span>
          <button onClick={() => setError("")} className="shrink-0 opacity-60 hover:opacity-100"><X size={14} /></button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
        <div className="flex-1">
          <SearchFilter
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            appealabilityFilter={appealabilityFilter}
            onAppealabilityChange={setAppealabilityFilter}
            statusOptions={STATUS_OPTIONS}
            onClear={() => {
              setSearchQuery("");
              setStatusFilter("");
              setAppealabilityFilter("");
            }}
          />
        </div>
        <button
          onClick={handleExportCSV}
          disabled={exporting}
          className="btn-secondary text-xs h-10 px-3 flex items-center justify-center gap-1.5 shrink-0 self-start sm:self-center"
          title="Export current filtered claims to CSV"
        >
          {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          <span>{exporting ? "Exporting…" : "Export CSV"}</span>
        </button>
      </div>


      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border dark:border-slate-800 bg-surface-muted dark:bg-slate-800/60 text-left text-xs text-ink-500 dark:text-slate-400 uppercase tracking-wide">
              <th className="px-4 py-3 font-medium">Claim ID</th>
              <th className="px-4 py-3 font-medium">Patient</th>
              <th className="px-4 py-3 font-medium">Payer</th>
              <th className="px-4 py-3 font-medium">Procedure</th>
              <th className="px-4 py-3 font-medium">Denial Code</th>
              <th className="px-4 py-3 font-medium">Denied Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Appealability</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {claims === null && <SkeletonTable rows={5} cols={10} />}
            {claims?.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-14 text-center">
                  <FileText size={28} className="mx-auto text-ink-400/50 dark:text-slate-600 mb-2" />
                  <p className="text-ink-400 dark:text-slate-400 text-sm">No claims found matching your criteria.</p>
                </td>
              </tr>
            )}
            <AnimatePresence>
              {claims?.map((c, i) => (
                <motion.tr
                  key={c.claimId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i, 8) * 0.03 }}
                  className="border-b border-surface-border dark:border-slate-800 last:border-0 hover:bg-surface-muted/60 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-ink-900 dark:text-slate-100 mono">{c.claimId}</td>
                  <td className="px-4 py-3 text-ink-700 dark:text-slate-300">{c.patientName || "—"}</td>
                  <td className="px-4 py-3 text-ink-700 dark:text-slate-300">{c.payer}</td>
                  <td className="px-4 py-3 text-ink-700 dark:text-slate-300">{c.procedure}</td>
                  <td className="px-4 py-3 text-ink-700 dark:text-slate-300 mono">{c.denialCode || "—"}</td>
                  <td className="px-4 py-3 text-ink-700 dark:text-slate-300">${(c.amount || 0).toLocaleString()}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3">
                    {c.appealabilityClassification ? <StatusBadge status={c.appealabilityClassification} /> : "—"}
                  </td>
                  <td className="px-4 py-3 text-ink-500 dark:text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <ActionButton title="View" onClick={() => navigate(`/claims/${c.claimId}`)} icon={Eye} />
                      <ActionButton title="Analyze" onClick={() => navigate(`/claims/${c.claimId}?tab=ai-analysis`)} icon={FileSearch} />
                      <ActionButton title="Generate Appeal" onClick={() => navigate(`/claims/${c.claimId}?tab=appeal`)} icon={Sparkles} />
                      {user?.role === "admin" && (
                        <ActionButton title="Delete" onClick={() => setDeleteId(c.claimId)} icon={Trash2} danger />
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>

        <Pagination
          page={pagination.page}
          pages={pagination.pages}
          total={pagination.total}
          limit={pagination.limit}
          onPageChange={(p) => loadClaims(p, pagination.limit)}
          onLimitChange={(l) => loadClaims(1, l)}
        />
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        title={`Delete Claim ${deleteId}?`}
        message="This claim will be soft-deleted and removed from active views. You can restore it if needed."
        confirmLabel="Delete Claim"
        variant="danger"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
      />
    </DashboardLayout>
  );
}

function ActionButton({ title, onClick, icon: Icon, danger = false }) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.92 }}
      title={title}
      onClick={onClick}
      className={`p-1.5 rounded-md transition-colors ${
        danger
          ? "text-ink-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400"
          : "text-ink-500 dark:text-slate-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-slate-800 dark:hover:text-white"
      }`}
    >
      <Icon size={15} />
    </motion.button>
  );
}
