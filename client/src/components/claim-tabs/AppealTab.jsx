import React from "react";
import StatusBadge from "../StatusBadge";
import { EmptyPanel } from "./Shared";

export default function AppealTab({ appeal, navigate, claimId }) {
  if (!appeal) return <EmptyPanel text='Click "Generate Appeal" above to draft an appeal letter.' />;
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <StatusBadge status={appeal.status} />
        <button onClick={() => navigate(`/appeals/${claimId}/review`)} className="btn-primary">
          Open Review Screen
        </button>
      </div>
      <pre className="whitespace-pre-wrap text-sm text-ink-700 font-sans leading-relaxed max-h-96 overflow-y-auto">
        {appeal.content}
      </pre>
    </div>
  );
}
