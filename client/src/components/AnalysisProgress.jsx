import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, FileSearch, Database, Stethoscope, Sparkles } from "lucide-react";

const STEPS = [
  { label: "Parsing claim details & codes", icon: FileSearch },
  { label: "Retrieving policy guidelines via RAG", icon: Database },
  { label: "Extracting clinical evidence", icon: Stethoscope },
  { label: "Matching evidence against policy rules", icon: CheckCircle2 },
  { label: "Computing explainable appealability score", icon: Sparkles },
];

export default function AnalysisProgress({ active = false }) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!active) {
      setCurrentStep(0);
      return;
    }
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 800);
    return () => clearInterval(interval);
  }, [active]);

  if (!active) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="mb-6 p-5 card border-brand-200 dark:border-brand-900 bg-brand-50/50 dark:bg-brand-950/30"
    >
      <div className="flex items-center gap-2 mb-4">
        <Loader2 className="animate-spin text-brand-600 dark:text-brand-400" size={18} />
        <h4 className="text-sm font-display font-semibold text-ink-900 dark:text-white">
          AI Analysis in Progress…
        </h4>
      </div>

      <div className="space-y-2.5">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isDone = idx < currentStep;
          const isCurrent = idx === currentStep;

          return (
            <div key={step.label} className="flex items-center gap-3 text-xs">
              <div
                className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  isDone
                    ? "bg-green-500 text-white"
                    : isCurrent
                    ? "bg-brand-600 text-white animate-pulse"
                    : "bg-surface-border dark:bg-slate-800 text-ink-400 dark:text-slate-500"
                }`}
              >
                {isDone ? (
                  <CheckCircle2 size={12} />
                ) : isCurrent ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <span className="text-[10px] font-medium">{idx + 1}</span>
                )}
              </div>
              <span
                className={`font-medium transition-colors ${
                  isDone
                    ? "text-ink-900 dark:text-slate-200"
                    : isCurrent
                    ? "text-brand-700 dark:text-brand-300 font-semibold"
                    : "text-ink-400 dark:text-slate-500"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
