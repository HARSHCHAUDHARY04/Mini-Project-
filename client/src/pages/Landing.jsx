import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  FileSearch,
  BookOpen,
  Stethoscope,
  FileCheck2,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Workflow,
  Link2,
} from "lucide-react";
import ScoreGauge from "../components/ScoreGauge";

const ICON_STYLES = {
  brand: "bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400",
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
  sky: "bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
};

const FEATURES = [
  { icon: FileSearch, color: "brand", title: "AI Denial Analysis", desc: "Automatically extract claim fields and identify denial codes with a structured, editable review step." },
  { icon: BookOpen, color: "emerald", title: "Policy RAG", desc: "Index payer policies into a real retrieval pipeline so every requirement is grounded in an actual page and section." },
  { icon: Stethoscope, color: "sky", title: "Clinical Evidence Extraction", desc: "Pull structured, source-tracked evidence out of clinical notes — no invented facts." },
  { icon: FileCheck2, color: "violet", title: "Evidence-Based Appeals", desc: "Generate a fully cited draft appeal letter, always labeled for human review before submission." },
  { icon: BarChart3, color: "amber", title: "Appeal Analytics", desc: "Track denials, appealability, and potential recovery from a live dashboard." },
];

const REQUIREMENTS = [
  { label: "Symptom duration ≥ 6 weeks", status: "MATCH" },
  { label: "Conservative treatment attempted", status: "MATCH" },
  { label: "Physician recommendation on file", status: "MATCH" },
];

const STEPS = [
  { step: "01", title: "Upload the denial", desc: "Drop in the EOB or denial letter — PDF, TXT, CSV, or JSON. Claim fields and denial codes are extracted automatically." },
  { step: "02", title: "AI scores appealability", desc: "The denial is matched against payer policy and clinical documentation to produce a Strong / Moderate / Weak verdict with cited reasoning." },
  { step: "03", title: "Review the evidence", desc: "Every requirement is linked to its source — a policy section or a line in the chart — so nothing is taken on faith." },
  { step: "04", title: "Generate the appeal", desc: "A fully cited draft letter is produced for human review, ready to edit, approve, and send." },
];

const STATS = [
  { icon: Workflow, value: "4", label: "Pipeline stages, start to appeal" },
  { icon: Link2, value: "100%", label: "Citations traced to source" },
  { icon: ShieldCheck, value: "0", label: "Facts invented by the model" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-surface-muted dark:bg-slate-950 overflow-x-hidden transition-colors">
      <header className="border-b border-surface-border dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-sm">
              <ShieldCheck className="text-white" size={18} />
            </div>
            <span className="font-display font-semibold text-ink-900 dark:text-white">ClaimAssist AI</span>
          </div>
          <Link to="/login" className="btn-primary">Sign In</Link>
        </div>
      </header>

      <section className="relative max-w-6xl mx-auto px-6 pt-20 pb-24 grid lg:grid-cols-2 gap-12 items-center">
        {/* Layered decorative background: color blobs + a faint dot-grid for texture */}
        <div
          className="absolute -top-24 left-1/4 w-[560px] h-[560px] rounded-full opacity-40 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.22), transparent 70%)" }}
        />
        <div
          className="absolute top-10 right-0 w-[420px] h-[420px] rounded-full opacity-30 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(16,185,129,0.18), transparent 70%)" }}
        />
        <div
          className="absolute inset-x-0 top-0 h-[520px] opacity-[0.35] dark:opacity-[0.15] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(rgba(99,102,241,0.35) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            maskImage: "radial-gradient(ellipse 60% 100% at 50% 0%, black 20%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse 60% 100% at 50% 0%, black 20%, transparent 75%)",
          }}
        />

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 rounded-full px-3 py-1 mb-5">
            <Sparkles size={12} />
            Educational Prototype — Synthetic Data Only
          </span>
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-ink-900 dark:text-white tracking-tight leading-tight">
            Turn Denied Claims Into{" "}
            <span className="bg-gradient-to-r from-brand-600 to-violet-500 bg-clip-text text-transparent">
              Evidence-Backed Appeals
            </span>
          </h1>
          <p className="mt-5 text-lg text-ink-500 dark:text-slate-400 max-w-xl">
            AI-assisted claim denial analysis, policy retrieval, clinical evidence matching, and
            appeal drafting in one workflow.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/login" className="btn-primary px-6 py-3 text-base group shadow-lg shadow-brand-600/20">
              Analyze a Claim
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link to="/login" className="btn-secondary px-6 py-3 text-base">View Demo</Link>
          </div>
        </motion.div>

        {/* Live demo of the product's signature output */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.6, rotate: -12 }}
            animate={{ opacity: 1, scale: 1, rotate: -6 }}
            transition={{ duration: 0.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute -top-5 -left-5 z-10 h-12 w-12 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 shadow-lg shadow-brand-600/30 flex items-center justify-center"
          >
            <Sparkles className="text-white" size={20} />
          </motion.div>

          <div className="card p-6 shadow-xl ring-1 ring-black/5 dark:ring-white/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-ink-400 dark:text-slate-400 mono">CLM-2026-001</span>
              <span className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 rounded-full px-2 py-0.5">CO-50 Denied</span>
            </div>
            <p className="text-sm font-medium text-ink-900 dark:text-white mb-5">MRI Lumbar Spine — ABC Health Insurance</p>
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
                    <CheckCircle2 size={14} className="text-green-600 dark:text-green-400 shrink-0" />
                    <span className="text-ink-600 dark:text-slate-300">{r.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-surface-border dark:border-slate-800">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-400 dark:text-slate-500">
                AI-Generated Draft — Requires Human Review
              </span>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, color, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="card card-hover p-6 hover:-translate-y-0.5 transition-transform"
            >
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-4 ${ICON_STYLES[color]}`}>
                <Icon size={19} />
              </div>
              <h3 className="font-display font-semibold text-ink-900 dark:text-white">{title}</h3>
              <p className="mt-1.5 text-sm text-ink-500 dark:text-slate-400 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="border-t border-surface-border dark:border-slate-800 bg-white/60 dark:bg-slate-900/40">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="max-w-2xl mb-12">
            <span className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">How it works</span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-display font-bold text-ink-900 dark:text-white tracking-tight">
              From denial letter to submitted appeal
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map(({ step, title, desc }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="relative"
              >
                <span className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white font-display text-sm font-bold shadow-sm shadow-brand-600/30">
                  {step}
                </span>
                <h3 className="mt-3 font-display font-semibold text-ink-900 dark:text-white">{title}</h3>
                <p className="mt-1.5 text-sm text-ink-500 dark:text-slate-400 leading-relaxed">{desc}</p>
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-4 left-full w-6 -translate-x-3 border-t border-dashed border-surface-border dark:border-slate-700" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid sm:grid-cols-3 gap-5">
          {STATS.map(({ icon: Icon, value, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="card p-6 flex items-center gap-4"
            >
              <div className="h-11 w-11 shrink-0 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                <Icon size={20} />
              </div>
              <div>
                <p className="font-display text-3xl font-bold text-ink-900 dark:text-white leading-none">{value}</p>
                <p className="mt-1.5 text-sm text-ink-500 dark:text-slate-400">{label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-violet-800 px-8 py-14 text-center sm:px-16">
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{ background: "radial-gradient(circle at top right, rgba(255,255,255,0.25), transparent 60%)" }}
          />
          <div
            className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(255,255,255,0.6), transparent 70%)" }}
          />
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
              Ready to see a denial turned into an appeal?
            </h2>
            <p className="mt-3 text-brand-100 max-w-xl mx-auto">
              Sign in with the demo account and walk through the full pipeline on synthetic claims.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link to="/login" className="btn bg-white text-brand-700 hover:bg-brand-50 px-6 py-3 text-base shadow-sm">
                Sign In to Try It
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-surface-border dark:border-slate-800 py-6 text-center text-xs text-ink-400 dark:text-slate-500">
        ClaimAssist AI is an educational prototype. It does not provide legal or medical advice and
        does not connect to real healthcare or insurance systems.
      </footer>
    </div>
  );
}
