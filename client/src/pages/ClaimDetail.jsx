import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, FileSearch, ArrowLeft, AlertCircle } from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import StatusBadge from "../components/StatusBadge";
import AnalysisProgress from "../components/AnalysisProgress";
import { SkeletonCard } from "../components/Skeletons";
import api, { errorMessage } from "../services/api";
import { useToast } from "../context/ToastContext";

import OverviewTab from "../components/claim-tabs/OverviewTab";
import DenialAnalysisTab from "../components/claim-tabs/DenialAnalysisTab";
import PolicyEvidenceTab from "../components/claim-tabs/PolicyEvidenceTab";
import ClinicalEvidenceTab from "../components/claim-tabs/ClinicalEvidenceTab";
import AIAnalysisTab from "../components/claim-tabs/AIAnalysisTab";
import AppealTab from "../components/claim-tabs/AppealTab";
import DocumentsTab from "../components/claim-tabs/DocumentsTab";
import HistoryTab from "../components/claim-tabs/HistoryTab";

const TABS = [
  "Overview", "Denial Analysis", "Policy Evidence", "Clinical Evidence",
  "AI Analysis", "Appeal", "Documents", "History",
];

export default function ClaimDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [claim, setClaim] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [appeal, setAppeal] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [clinicalDoc, setClinicalDoc] = useState(null);
  const [tab, setTab] = useState(mapTab(searchParams.get("tab")));
  const [error, setError] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);

  function mapTab(param) {
    if (param === "ai-analysis") return "AI Analysis";
    if (param === "appeal") return "Appeal";
    return "Overview";
  }

  async function load() {
    try {
      const c = await api.get(`/claims/${id}`);
      const claimData = c.data.data;
      setClaim(claimData);
      try {
        const a = await api.get(`/claims/${id}/analysis`);
        setAnalysis(a.data.data);
      } catch {
        setAnalysis(null);
      }
      try {
        const appeals = await api.get(`/appeals?claimId=${id}`);
        setAppeal(appeals.data.data[0] || null);
      } catch {
        setAppeal(null);
      }
      try {
        const docRes = await api.get(`/clinical-documents?claimId=${id}`);
        setClinicalDoc(docRes.data.data[0] || null);
      } catch {
        setClinicalDoc(null);
      }
      try {
        const polRes = await api.get(`/policies`);
        const found = polRes.data.data.find(p => p.payer.toLowerCase() === claimData.payer.toLowerCase());
        setPolicy(found || null);
      } catch {
        setPolicy(null);
      }
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleAnalyze() {
    setAnalyzing(true);
    setError("");
    try {
      await api.post(`/claims/${id}/analyze`, {});
      await load();
      toast.success("Claim analyzed — appealability score is ready.");
      setTab("AI Analysis");
    } catch (err) {
      toast.error(errorMessage(err));
      setError(errorMessage(err));
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleGenerateAppeal() {
    setGenerating(true);
    setError("");
    try {
      await api.post(`/claims/${id}/generate-appeal`);
      await load();
      toast.success("Appeal draft generated.");
      navigate(`/appeals/${id}/review`);
    } catch (err) {
      toast.error(errorMessage(err));
      setError(errorMessage(err));
    } finally {
      setGenerating(false);
    }
  }

  if (!claim) {
    return (
      <DashboardLayout title="Claim Detail">
        {error ? <p className="text-red-600 dark:text-red-400 text-sm">{error}</p> : <div className="grid sm:grid-cols-2 gap-4"><SkeletonCard lines={4} /><SkeletonCard lines={4} /></div>}
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Claim ${claim.claimId}`}>
      <button onClick={() => navigate("/claims")} className="flex items-center gap-1.5 text-sm text-ink-500 dark:text-slate-400 hover:text-ink-900 dark:hover:text-white mb-4 transition-colors">
        <ArrowLeft size={15} /> Back to Claims
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <StatusBadge status={claim.status} />
          {claim.appealabilityClassification && <StatusBadge status={claim.appealabilityClassification} />}
        </div>
        <div className="flex gap-2">
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleAnalyze} disabled={analyzing} className="btn-secondary">
            <FileSearch size={15} className={analyzing ? "animate-pulse" : ""} />
            {analyzing ? "Analyzing…" : "Analyze Claim"}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleGenerateAppeal}
            disabled={generating || !analysis}
            className="btn-primary"
            title={!analysis ? "Run Analyze Claim first" : ""}
          >
            <Sparkles size={15} className={generating ? "animate-pulse" : ""} />
            {generating ? "Generating…" : "Generate Appeal"}
          </motion.button>
        </div>
      </div>

      {error && (
        <div className="mb-5 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2 flex items-start gap-2">
          <AlertCircle size={15} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      <AnalysisProgress active={analyzing} />

      <div className="flex gap-1 border-b border-surface-border dark:border-slate-800 mb-6 overflow-x-auto" role="tablist" aria-label="Claim Details Tabs">
        {TABS.map((t) => (
          <button
            key={t}
            id={`tab-${t.toLowerCase().replace(/\s+/g, "-")}`}
            role="tab"
            aria-selected={tab === t}
            aria-controls={`panel-${t.toLowerCase().replace(/\s+/g, "-")}`}
            onClick={() => setTab(t)}
            className={`relative px-3.5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t ? "text-brand-700 dark:text-brand-400" : "text-ink-500 dark:text-slate-400 hover:text-ink-900 dark:hover:text-white"
            }`}
          >
            {t}
            {tab === t && (
              <motion.div layoutId="claim-tab-underline" className="absolute left-0 right-0 -bottom-px h-0.5 bg-brand-600 dark:bg-brand-400" transition={{ type: "spring", stiffness: 500, damping: 35 }} />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          role="tabpanel"
          id={`panel-${tab.toLowerCase().replace(/\s+/g, "-")}`}
          aria-labelledby={`tab-${tab.toLowerCase().replace(/\s+/g, "-")}`}
        >
          {tab === "Overview" && <OverviewTab claim={claim} />}
          {tab === "Denial Analysis" && <DenialAnalysisTab analysis={analysis} />}
          {tab === "Policy Evidence" && <PolicyEvidenceTab analysis={analysis} />}
          {tab === "Clinical Evidence" && <ClinicalEvidenceTab analysis={analysis} />}
          {tab === "AI Analysis" && <AIAnalysisTab analysis={analysis} />}
          {tab === "Appeal" && <AppealTab appeal={appeal} navigate={navigate} claimId={id} />}
          {tab === "Documents" && <DocumentsTab claim={claim} policy={policy} clinicalDoc={clinicalDoc} />}
          {tab === "History" && <HistoryTab claim={claim} appeal={appeal} />}
        </motion.div>
      </AnimatePresence>
    </DashboardLayout>
  );
}
