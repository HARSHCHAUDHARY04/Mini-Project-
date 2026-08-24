import React from "react";
import { motion } from "framer-motion";
import { ShieldQuestion } from "lucide-react";
import ScoreGauge from "../ScoreGauge";
import StatusBadge from "../StatusBadge";
import { EmptyPanel } from "./Shared";

export default function AIAnalysisTab({ analysis }) {
  if (!analysis) return <EmptyPanel text='Run "Analyze Claim" to see the appealability score and requirement matching.' icon={ShieldQuestion} />;
  const s = analysis.appealability;
  return (
    <div className="space-y-5">
      <div className="card p-6 flex flex-col sm:flex-row items-center gap-8">
        <ScoreGauge score={s.score} classification={s.classification} size={168} />
        <div className="flex-1 w-full">
          <p className="text-xs text-ink-400 mb-3">How this score was calculated</p>
          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            {Object.entries(s.breakdown).map(([key, b]) => (
              <div key={key} className="bg-surface-muted rounded-lg p-3">
                <p className="text-xs text-ink-500 capitalize">{key.replace(/([A-Z])/g, " $1")}</p>
                <p className="text-lg font-display font-semibold text-ink-900">{b.value}</p>
                <p className="text-xs text-ink-400 mt-0.5">{b.detail}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-ink-400 italic border-t border-surface-border pt-3">{s.disclaimer}</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-surface-border">
          <h3 className="text-sm font-semibold text-ink-900">Requirement Matching</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-ink-500 uppercase bg-surface-muted">
              <th className="px-4 py-2.5 font-medium">Requirement</th>
              <th className="px-4 py-2.5 font-medium">Patient Evidence</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {analysis.matchedRequirements.map((r, i) => (
              <motion.tr key={r.requirementId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="border-t border-surface-border">
                <td className="px-4 py-3 text-ink-700 max-w-xs">{r.requirement}</td>
                <td className="px-4 py-3 text-ink-700 max-w-xs">{r.patientEvidence}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3 text-ink-700 tabular-nums">{r.confidence}%</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
