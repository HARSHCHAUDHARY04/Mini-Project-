import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, AlertTriangle, TrendingUp, FileCheck2, DollarSign, CheckCircle2, Clock, Sparkles } from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import StatCard from "../components/StatCard";
import { SkeletonStatCard, SkeletonCard } from "../components/Skeletons";
import { ChartCard, ClaimsByStatusChart, DenialCodeDistributionChart, RecoveryByMonthChart, AppealsOverTimeChart } from "../components/charts/ChartComponents";
import api, { errorMessage } from "../services/api";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loadingDemo, setLoadingDemo] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  async function loadStats() {
    try {
      const res = await api.get("/dashboard/stats");
      setStats(res.data.data);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  async function handleLoadDemoCase() {
    setLoadingDemo(true);
    try {
      const res = await api.post("/claims/demo");
      const { claim } = res.data.data;
      toast.success(`Demo case ${claim.claimId} loaded.`);
      navigate(`/claims/${claim.claimId}`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoadingDemo(false);
    }
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-ink-500">
          Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}. Here's what's moving through the pipeline.
        </p>
        <button onClick={handleLoadDemoCase} disabled={loadingDemo} className="btn-primary">
          <Sparkles size={15} className={loadingDemo ? "animate-spin" : ""} />
          {loadingDemo ? "Loading demo case…" : "Load Demo Case"}
        </button>
      </div>

      {error && (
        <div className="mb-5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
      )}

      {!stats ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 7 }).map((_, i) => <SkeletonStatCard key={i} />)}
          </div>
          <div className="grid lg:grid-cols-2 gap-5">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={4} />)}
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Claims" value={stats.totalClaims} icon={FileText} accent="brand" onClick={() => navigate("/claims")} />
            <StatCard label="Claims Denied" value={stats.deniedClaims} icon={AlertTriangle} accent="red" onClick={() => navigate("/claims")} />
            <StatCard label="Potentially Appealable" value={stats.appealableClaims} icon={TrendingUp} accent="green" onClick={() => navigate("/claims?appealability=Strong")} />
            <StatCard label="Appeals Generated" value={stats.appealsGenerated} icon={FileCheck2} accent="violet" onClick={() => navigate("/appeals")} />
            <StatCard
              label="Potential Recovery"
              value={stats.potentialRecovery}
              prefix="$"
              icon={DollarSign}
              accent="green"
              onClick={() => navigate("/analytics")}
            />
            <StatCard label="Appeals Approved" value={stats.appealsApproved} icon={CheckCircle2} accent="green" onClick={() => navigate("/appeals?status=APPROVED")} />
            <StatCard label="Appeals Pending Review" value={stats.appealsPending} icon={Clock} accent="amber" onClick={() => navigate("/appeals?status=UNDER_REVIEW")} />
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            {[
              {
                title: "Claims by Status",
                sub: "Click a bar to view those claims",
                node: <ClaimsByStatusChart data={stats.claimsByStatus} onBarClick={(status) => navigate(`/claims?status=${encodeURIComponent(status)}`)} />,
              },
              {
                title: "Denial Codes Distribution",
                sub: stats.denialCodeDistribution.length ? "Click a slice to view matching claims" : undefined,
                node: stats.denialCodeDistribution.length ? (
                  <DenialCodeDistributionChart data={stats.denialCodeDistribution} onSliceClick={(code) => navigate(`/claims?q=${encodeURIComponent(code)}`)} />
                ) : (
                  <EmptyState />
                ),
              },
              {
                title: "Potential Recovery by Month",
                node: stats.recoveryByMonth.length ? <RecoveryByMonthChart data={stats.recoveryByMonth} /> : <EmptyState />,
              },
              {
                title: "Appeals Generated Over Time",
                node: stats.appealsOverTime.length ? <AppealsOverTimeChart data={stats.appealsOverTime} /> : <EmptyState />,
              },
            ].map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
              >
                <ChartCard title={c.title}>{c.node}</ChartCard>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

function EmptyState() {
  return (
    <div className="h-full flex items-center justify-center text-sm text-ink-400">
      No data yet — try "Load Demo Case" to get started.
    </div>
  );
}
