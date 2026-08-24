import React from "react";
import { FileSearch } from "lucide-react";

export function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-ink-400">{label}</p>
      <div className="text-sm text-ink-900 font-medium mt-0.5">{value ?? "—"}</div>
    </div>
  );
}

export function EmptyPanel({ text, icon: Icon = FileSearch }) {
  return (
    <div className="card p-10 text-center">
      <Icon size={26} className="mx-auto text-ink-400/50 mb-2" />
      <p className="text-sm text-ink-400">{text}</p>
    </div>
  );
}
