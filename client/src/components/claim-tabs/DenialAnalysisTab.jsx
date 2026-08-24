import React from "react";
import { Field, EmptyPanel } from "./Shared";

export default function DenialAnalysisTab({ analysis }) {
  if (!analysis) return <EmptyPanel text='Run "Analyze Claim" to see denial analysis.' />;
  const d = analysis.denialInfo;
  return (
    <div className="card p-6 max-w-xl">
      <div className="grid grid-cols-2 gap-6 mb-5">
        <Field label="Denial Code" value={<span className="mono">{d.code}</span>} />
        <Field label="Denial Category" value={d.category} />
      </div>
      <p className="text-xs text-ink-400 mb-1.5">Explanation</p>
      <p className="text-sm text-ink-700 leading-relaxed">{d.explanation}</p>
    </div>
  );
}
