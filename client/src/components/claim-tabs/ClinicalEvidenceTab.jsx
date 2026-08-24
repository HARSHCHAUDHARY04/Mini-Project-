import React from "react";
import { Field, EmptyPanel } from "./Shared";

export default function ClinicalEvidenceTab({ analysis }) {
  if (!analysis) return <EmptyPanel text='Run "Analyze Claim" to see extracted clinical evidence.' />;
  const e = analysis.clinicalEvidence;
  return (
    <div className="card p-6 max-w-xl space-y-4">
      <Field label="Symptoms" value={e.symptoms?.join(", ")} />
      <Field label="Duration" value={e.duration} />
      <Field label="Severity" value={e.severity} />
      <Field label="Conservative Treatment" value={e.conservative_treatment?.join(", ")} />
      <Field label="Previous Medications" value={e.previous_medications?.join(", ")} />
      <Field label="Treatment Failed" value={e.treatment_failed ? "Yes" : "Not documented"} />
      <Field label="Physician Recommendation" value={e.physician_recommendation} />
      <div>
        <p className="text-xs text-ink-400 mb-1">Extraction Completeness</p>
        <div className="flex items-center gap-2">
          <div className="w-32 h-1.5 bg-surface-border rounded-full overflow-hidden">
            <div className="h-full bg-brand-500 rounded-full" style={{ width: `${(e.extractionCompleteness || 0) * 100}%` }} />
          </div>
          <span className="text-sm text-ink-900 font-medium">{Math.round((e.extractionCompleteness || 0) * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
