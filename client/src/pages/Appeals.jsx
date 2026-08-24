import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, FileCheck2 } from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import StatusBadge from "../components/StatusBadge";
import { SkeletonTable } from "../components/Skeletons";
import api, { errorMessage } from "../services/api";
import { useToast } from "../context/ToastContext";

export default function Appeals() {
  const [appeals, setAppeals] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    api.get("/appeals").then((res) => setAppeals(res.data.data)).catch((err) => toast.error(errorMessage(err)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DashboardLayout title="Appeals">
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border bg-surface-muted text-left text-xs text-ink-500 uppercase">
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
                <FileCheck2 size={26} className="mx-auto text-ink-400/50 mb-2" />
                <p className="text-ink-400 text-sm">No appeals generated yet.</p>
              </td></tr>
            )}
            {appeals?.map((a, i) => (
              <motion.tr
                key={a._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(i, 8) * 0.03 }}
                className="border-b border-surface-border last:border-0 hover:bg-surface-muted/50 transition-colors"
              >
                <td className="px-4 py-3 font-medium text-ink-900 mono">{a.claimId}</td>
                <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                <td className="px-4 py-3">
                  {a.complianceScore != null ? (
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-surface-border rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${a.complianceScore}%`,
                            backgroundColor: a.complianceScore >= 80 ? "#16a34a" : a.complianceScore >= 60 ? "#d97706" : "#dc2626",
                          }}
                        />
                      </div>
                      <span className="text-ink-700 text-xs tabular-nums">{a.complianceScore}%</span>
                    </div>
                  ) : "—"}
                </td>
                <td className="px-4 py-3 text-ink-500">{new Date(a.generatedAt || a.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }} onClick={() => navigate(`/appeals/${a.claimId}/review`)} className="p-1.5 rounded-md text-ink-500 hover:bg-brand-50 hover:text-brand-600 transition-colors">
                    <Eye size={15} />
                  </motion.button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
