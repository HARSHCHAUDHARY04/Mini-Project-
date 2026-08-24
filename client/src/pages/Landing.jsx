import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, FileSearch, BookOpen, Stethoscope, FileCheck2, BarChart3, ArrowRight, CheckCircle2 } from "lucide-react";
import ScoreGauge from "../components/ScoreGauge";

const FEATURES = [
  { icon: FileSearch, title: "AI Denial Analysis", desc: "Automatically extract claim fields and identify denial codes with a structured, editable review step." },
  { icon: BookOpen, title: "Policy RAG", desc: "Index payer policies into a real retrieval pipeline so every requirement is grounded in an actual page and section." },
  { icon: Stethoscope, title: "Clinical Evidence Extraction", desc: "Pull structured, source-tracked evidence out of clinical notes — no invented facts." },
  { icon: FileCheck2, title: "Evidence-Based Appeals", desc: "Generate a fully cited draft appeal letter, always labeled for human review before submission." },
  { icon: BarChart3, title: "Appeal Analytics", desc: "Track denials, appealability, and potential recovery from a live dashboard." },
];

const REQUIREMENTS = [
  { label: "Symptom duration ≥ 6 weeks", status: "MATCH" },
  { label: "Conservative treatment attempted", status: "MATCH" },
  { label: "Physician recommendation on file", status: "MATCH" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-surface-muted overflow-x-hidden">
      <header className="border-b border-surface-border bg-white/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-sm">
              <ShieldCheck className="text-white" size={18} />
            </div>
            <span className="font-display font-semibold text-ink-900">ClaimAssist AI</span>
          </div>
          <Link to="/login" className="btn-primary">Sign In</Link>
        </div>
      </header>

      <section className="relative max-w-6xl mx-auto px-6 pt-20 pb-24 grid lg:grid-cols-2 gap-12 items-center">
        <div
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-40 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)" }}
        />
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative">
          <span className="inline-block text-xs font-medium text-brand-700 bg-brand-50 rounded-full px-3 py-1 mb-5">
            Educational Prototype — Synthetic Data Only
          </span>
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-ink-900 tracking-tight leading-tight">
            Turn Denied Claims Into<br />Evidence-Backed Appeals
          </h1>
          <p className="mt-5 text-lg text-ink-500 max-w-xl">
            AI-assisted claim denial analysis, policy retrieval, clinical evidence matching, and
            appeal drafting in one workflow.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/login" className="btn-primary px-6 py-3 text-base group">
              Analyze a Claim
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link to="/login" className="btn-secondary px-6 py-3 text-base">View Demo</Link>
          </div>
        </motion.div>

        {/* Live demo of the product's signature output: a scored, evidence-matched claim */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div className="card p-6 shadow-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-ink-400 mono">CLM-2026-001</span>
              <span className="text-xs font-medium text-red-600 bg-red-50 rounded-full px-2 py-0.5">CO-50 Denied</span>
            </div>
            <p className="text-sm font-medium text-ink-900 mb-5">MRI Lumbar Spine — ABC Health Insurance</p>
            <div className="flex items-center gap-6">
              <ScoreGauge score={92} classification="Strong" size={132} />
              <div className="flex-1 space-y-2.5">
                {REQUIREMENTS.map((r, i) => (
                  <motion.div
                    key={r.label}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + i * 0.15, duration: 0.35 }}
                    className="flex items-center gap-2 text-xs"
                  >
                    <CheckCircle2 size={14} className="text-green-600 shrink-0" />
                    <span className="text-ink-600">{r.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-surface-border">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">
                AI-Generated Draft — Requires Human Review
              </span>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="card card-hover p-6"
            >
              <div className="h-10 w-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                <Icon size={19} />
              </div>
              <h3 className="font-display font-semibold text-ink-900">{title}</h3>
              <p className="mt-1.5 text-sm text-ink-500 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="border-t border-surface-border py-6 text-center text-xs text-ink-400">
        ClaimAssist AI is an educational prototype. It does not provide legal or medical advice and
        does not connect to real healthcare or insurance systems.
      </footer>
    </div>
  );
}
