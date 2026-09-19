import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "../layouts/DashboardLayout";
import StatCard from "../components/StatCard";
import { SkeletonStatCard, SkeletonCard } from "../components/Skeletons";
import { ChartCard, DenialCodeDistributionChart, RecoveryByMonthChart, AppealsOverTimeChart, ClaimsByStatusChart } from "../components/charts/ChartComponents";
import api, { errorMessage } from "../services/api";
import { useToast } from "../context/ToastContext";
import { DollarSign, TrendingUp, FileCheck2, CheckCircle2, Download, Loader2 } from "lucide-react";

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [exporting, setExporting] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/dashboard/stats").then((res) => setStats(res.data.data)).catch((err) => toast.error(errorMessage(err)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleExportCSV() {
    setExporting(true);
    try {
      const res = await api.get("/dashboard/export/csv", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "analytics-summary.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Analytics summary exported to CSV.");
    } catch (err) {
      toast.error("Export failed: " + errorMessage(err));
    } finally {
      setExporting(false);
    }
  }

  if (!stats) {
    return (
      <DashboardLayout title="Analytics">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={4} />)}
        </div>
      </DashboardLayout>
    );
  }

  const totalDenied = stats.claimsByStatus.reduce((sum, s) => sum + s.count, 0);

  return (
    <DashboardLayout title="Analytics">
      <div className="flex items-center justify-between gap-4 mb-5">
        <p className="text-sm text-ink-500 dark:text-slate-400">
          Executive recovery metrics, denial distributions, and workflow throughput.
        </p>
        <button
          onClick={handleExportCSV}
          disabled={exporting}
          className="btn-secondary text-xs flex items-center gap-1.5"
          title="Export analytics summary to CSV"
        >
          {exporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
          {exporting ? "Exporting…" : "Export Summary (CSV)"}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Denied Amount Tracked" value={stats.totalDeniedAmount} prefix="$" icon={DollarSign} accent="red" onClick={() => navigate("/claims")} />
        <StatCard label="Potentially Recoverable" value={stats.potentialRecovery} prefix="$" icon={TrendingUp} accent="green" onClick={() => navigate("/claims?appealability=Strong")} />
        <StatCard label="Appeals Generated" value={stats.appealsGenerated} icon={FileCheck2} accent="violet" onClick={() => navigate("/appeals")} />
        <StatCard label="Appeals Approved" value={stats.appealsApproved} icon={CheckCircle2} accent="green" onClick={() => navigate("/appeals?status=APPROVED")} />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {[
          {
            title: "Denials by Code",
            sub: `${totalDenied} total claims tracked — click a slice to view`,
            node: stats.denialCodeDistribution.length ? (
              <DenialCodeDistributionChart data={stats.denialCodeDistribution} onSliceClick={(code) => navigate(`/claims?q=${encodeURIComponent(code)}`)} />
            ) : <Empty />,
          },
          {
            title: "Claims by Status",
            sub: "Click a bar to view those claims",
            node: <ClaimsByStatusChart data={stats.claimsByStatus} onBarClick={(status) => navigate(`/claims?status=${encodeURIComponent(status)}`)} />,
          },
          { title: "Recovery by Month", node: stats.recoveryByMonth.length ? <RecoveryByMonthChart data={stats.recoveryByMonth} /> : <Empty /> },
          { title: "Appeal Volume Over Time", node: stats.appealsOverTime.length ? <AppealsOverTimeChart data={stats.appealsOverTime} /> : <Empty /> },
        ].map((c, i) => (
          <motion.div key={c.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, duration: 0.3 }}>
            <ChartCard title={c.title} sub={c.sub}>{c.node}</ChartCard>
          </motion.div>
        ))}
      </div>
    </DashboardLayout>
  );
}

function Empty() {
  return <div className="h-full flex items-center justify-center text-sm text-ink-400">No data yet.</div>;
}

