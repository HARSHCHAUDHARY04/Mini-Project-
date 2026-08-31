import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RotateCcw, Pencil, Check, X, Download, AlertTriangle, PartyPopper } from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import StatusBadge from "../components/StatusBadge";
import ScoreGauge from "../components/ScoreGauge";
import ConfirmDialog from "../components/ConfirmDialog";
import { SkeletonCard } from "../components/Skeletons";
import api, { errorMessage } from "../services/api";
import { useToast } from "../context/ToastContext";

export default function AppealReview() {
  const { claimId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [claim, setClaim] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [appeal, setAppeal] = useState(null);
  const [editing, setEditing] = useState(false);
  const [draftContent, setDraftContent] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  async function load() {
    try {
      const c = await api.get(`/claims/${claimId}`);
      setClaim(c.data.data);
      const a = await api.get(`/claims/${claimId}/analysis`);
      setAnalysis(a.data.data);
      const appeals = await api.get(`/appeals?claimId=${claimId}`);
      const found = appeals.data.data[0];
      setAppeal(found || null);
      setDraftContent(found?.content || "");
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claimId]);

  async function handleRegenerate() {
    setBusy(true);
    setError("");
    try {
      await api.post(`/claims/${claimId}/generate-appeal`);
      await load();
      toast.success("Appeal regenerated.");
    } catch (err) {
      toast.error(errorMessage(err));
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveEdit() {
    setBusy(true);
    try {
      const res = await api.put(`/appeals/${appeal._id}`, { content: draftContent });
      setAppeal(res.data.data);
      setEditing(false);
      toast.success("Changes saved.");
    } catch (err) {
      toast.error(errorMessage(err));
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDecision(action) {
    setBusy(true);
    setError("");
    try {
      const res = await api.post(`/appeals/${appeal._id}/approve`, { action });
      setAppeal(res.data.data);
      toast.success(action === "approve" ? "Appeal approved." : "Appeal rejected.");
      setShowRejectConfirm(false);
    } catch (err) {
      toast.error(errorMessage(err));
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDownload() {
    setBusy(true);
    setError("");
    try {
      const res = await api.get(`/appeals/${appeal._id}/pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${claimId}-appeal-packet.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Appeal packet downloaded.");
    } catch (err) {
      toast.error(errorMessage(err));
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!claim || !analysis || !appeal) {
    return (
      <DashboardLayout title="Appeal Review">
        {error ? <p className="text-red-600 dark:text-red-400 text-sm">{error}</p> : (
          <div className="grid lg:grid-cols-2 gap-5">
            <div className="space-y-4">
              <SkeletonCard lines={3} /><SkeletonCard lines={2} /><SkeletonCard lines={4} />
            </div>
            <SkeletonCard lines={8} />
          </div>
        )}
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Appeal Review — ${claimId}`}>
      <button onClick={() => navigate(`/claims/${claimId}`)} className="flex items-center gap-1.5 text-sm text-ink-500 dark:text-slate-400 hover:text-ink-900 dark:hover:text-white mb-4 transition-colors">
        <ArrowLeft size={15} /> Back to Claim
      </button>

      <div className="mb-4 flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg px-4 py-2.5">
        <AlertTriangle size={15} className="shrink-0" />
        AI-generated content must be reviewed by authorized billing personnel before submission.
      </div>

      <AnimatePresence>
        {appeal.status === "APPROVED" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 flex items-center gap-2 text-sm text-green-800 dark:text-green-300 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 rounded-lg px-4 py-2.5 overflow-hidden"
          >
            <PartyPopper size={15} className="shrink-0" />
            This appeal has been approved. Download the packet and submit it through your usual channel.
          </motion.div>
        )}
      </AnimatePresence>

      {error && <div className="mb-4 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">{error}</div>}

      <div className="grid lg:grid-cols-2 gap-5">
        {/* LEFT: claim, denial, policy, clinical, matching */}
        <div className="space-y-4">
          <div className="card p-5 flex items-center gap-5">
            <ScoreGauge score={analysis.appealability.score} classification={analysis.appealability.classification} size={92} strokeWidth={9} />
            <div className="grid grid-cols-2 gap-3 text-sm flex-1">
              <div><p className="text-xs text-ink-400 dark:text-slate-400">Claim ID</p><p className="text-ink-900 dark:text-slate-100 font-medium mono">{claim.claimId}</p></div>
              <div><p className="text-xs text-ink-400 dark:text-slate-400">Payer</p><p className="text-ink-900 dark:text-slate-100 font-medium">{claim.payer}</p></div>
              <div><p className="text-xs text-ink-400 dark:text-slate-400">Procedure</p><p className="text-ink-900 dark:text-slate-100 font-medium">{claim.procedure}</p></div>
              <div><p className="text-xs text-ink-400 dark:text-slate-400">Amount</p><p className="text-ink-900 dark:text-slate-100 font-medium">${(claim.amount || 0).toLocaleString()}</p></div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-semibold text-ink-900 dark:text-slate-100 mb-2">Denial</h3>
            <p className="text-sm text-ink-700 dark:text-slate-300 mono mb-1">{analysis.denialInfo.code} — {analysis.denialInfo.category}</p>
            <p className="text-sm text-ink-500 dark:text-slate-400">{analysis.denialInfo.explanation}</p>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-semibold text-ink-900 dark:text-slate-100 mb-3">Policy Evidence</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {analysis.policySections.slice(0, 3).map((p, i) => (
                <div key={i} className="text-xs text-ink-500 dark:text-slate-400 border-l-2 border-brand-200 dark:border-brand-800 pl-2">
                  <span className="font-medium text-ink-700 dark:text-slate-200">{p.section}, Page {p.page}</span> — {p.text.slice(0, 100)}…
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-semibold text-ink-900 dark:text-slate-100 mb-3">Requirement Matching</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {analysis.matchedRequirements.map((r) => (
                <div key={r.requirementId} className="flex items-start justify-between gap-3 text-xs border-b border-surface-border dark:border-slate-800 pb-2 last:border-0">
                  <span className="text-ink-700 dark:text-slate-300 flex-1">{r.requirement}</span>
                  <StatusBadge status={r.status} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: generated appeal */}
        <div className="card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <StatusBadge status={appeal.status} />
            <div className="flex gap-1.5">
              <motion.button whileTap={{ rotate: -180 }} title="Regenerate" onClick={handleRegenerate} disabled={busy} className="p-1.5 rounded-md text-ink-500 dark:text-slate-400 hover:bg-surface-muted dark:hover:bg-slate-800 transition-colors"><RotateCcw size={15} /></motion.button>
              <motion.button whileTap={{ scale: 0.9 }} title="Edit" onClick={() => setEditing((e) => !e)} className="p-1.5 rounded-md text-ink-500 dark:text-slate-400 hover:bg-surface-muted dark:hover:bg-slate-800 transition-colors"><Pencil size={15} /></motion.button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {editing ? (
              <motion.div key="editing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col flex-1">
                <textarea
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                  className="input flex-1 min-h-[24rem] font-sans text-sm leading-relaxed mono"
                />
                <div className="flex gap-2 mt-3">
                  <button onClick={handleSaveEdit} disabled={busy} className="btn-primary">Save Changes</button>
                  <button onClick={() => { setEditing(false); setDraftContent(appeal.content); }} className="btn-secondary">Cancel</button>
                </div>
              </motion.div>
            ) : (
              <motion.pre
                key="reading"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="whitespace-pre-wrap text-sm text-ink-700 dark:text-slate-300 font-sans leading-relaxed flex-1 overflow-y-auto max-h-[28rem]"
              >
                {appeal.content}
              </motion.pre>
            )}
          </AnimatePresence>

          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-surface-border dark:border-slate-800">
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => handleDecision("approve")} disabled={busy} className="btn-primary bg-green-600 hover:bg-green-700">
              <Check size={15} /> Approve
            </motion.button>
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowRejectConfirm(true)} disabled={busy} className="btn-danger">
              <X size={15} /> Reject
            </motion.button>
            <motion.button whileTap={{ scale: 0.96 }} onClick={handleDownload} disabled={busy} className="btn-secondary ml-auto">
              <Download size={15} /> Download PDF
            </motion.button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showRejectConfirm}
        title="Reject Appeal?"
        message="Rejecting this appeal will change its status to REJECTED. You can regenerate or edit it again later if needed."
        confirmLabel="Reject Appeal"
        variant="danger"
        loading={busy}
        onConfirm={() => handleDecision("reject")}
        onCancel={() => setShowRejectConfirm(false)}
      />
    </DashboardLayout>
  );
}
