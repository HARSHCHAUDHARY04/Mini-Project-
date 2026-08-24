import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "../layouts/DashboardLayout";
import StatCard from "../components/StatCard";
import { SkeletonStatCard, SkeletonCard } from "../components/Skeletons";
import { ChartCard, DenialCodeDistributionChart, RecoveryByMonthChart, AppealsOverTimeChart, ClaimsByStatusChart } from "../components/charts/ChartComponents";
import api, { errorMessage } from "../services/api";
import { useToast } from "../context/ToastContext";
import { DollarSign, TrendingUp, FileCheck2, CheckCircle2 } from "lucide-react";

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const toast = useToast();

  useEffect(() => {
    api.get("/dashboard/stats").then((res) => setStats(res.data.data)).catch((err) => toast.error(errorMessage(err)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Denied Amount Tracked" value={stats.potentialRecovery} prefix="$" icon={DollarSign} accent="red" />
        <StatCard label="Potentially Recoverable" value={stats.potentialRecovery} prefix="$" icon={TrendingUp} accent="green" />
        <StatCard label="Appeals Generated" value={stats.appealsGenerated} icon={FileCheck2} accent="violet" />
        <StatCard label="Appeals Approved" value={stats.appealsApproved} icon={CheckCircle2} accent="green" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {[
          { title: "Denials by Code", sub: `${totalDenied} total claims tracked`, node: stats.denialCodeDistribution.length ? <DenialCodeDistributionChart data={stats.denialCodeDistribution} /> : <Empty /> },
          { title: "Claims by Status", node: <ClaimsByStatusChart data={stats.claimsByStatus} /> },
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
