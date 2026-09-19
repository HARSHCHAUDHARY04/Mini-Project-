import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useIsDarkMode } from "../hooks/useIsDarkMode";

const CLASSIFICATION_COLOR = {
  Strong: { ring: "#16a34a", glow: "rgba(22,163,74,0.18)", text: "text-green-700 dark:text-green-400" },
  Moderate: { ring: "#d97706", glow: "rgba(217,119,6,0.18)", text: "text-amber-700 dark:text-amber-400" },
  Weak: { ring: "#ea580c", glow: "rgba(234,88,12,0.18)", text: "text-orange-700 dark:text-orange-400" },
  "Insufficient Evidence": { ring: "#dc2626", glow: "rgba(220,38,38,0.18)", text: "text-red-700 dark:text-red-400" },
};

function colorFor(classification) {
  return CLASSIFICATION_COLOR[classification] || CLASSIFICATION_COLOR.Moderate;
}

/**
 * Animated radial gauge for the appealability score — the single most
 * important number in the app. Ring fills and the number counts up
 * together; color tracks the classification (Strong/Moderate/Weak/
 * Insufficient) so the verdict reads at a glance before you even read text.
 */
export default function ScoreGauge({ score = 0, classification = "Moderate", size = 160, strokeWidth, label }) {
  const stroke = strokeWidth || Math.max(8, size * 0.08);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const colors = colorFor(classification);
  const isDark = useIsDarkMode();

  const [displayScore, setDisplayScore] = useState(0);
  const progress = useMotionValue(0);
  const dashOffset = useTransform(progress, (v) => circumference - (v / 100) * circumference);

  useEffect(() => {
    const controls = animate(progress, score, {
      duration: 1.1,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplayScore(Math.round(v)),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  return (
    <div className="inline-flex flex-col items-center" role="meter" aria-valuenow={score} aria-valuemin="0" aria-valuemax="100" aria-label={`Appealability Score: ${score}%, classified as ${classification}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden="true" focusable="false">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={isDark ? "#1e293b" : "#eef2f7"} strokeWidth={stroke} />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colors.ring}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{ strokeDashoffset: dashOffset, filter: `drop-shadow(0 0 6px ${colors.glow})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
          <span className="font-display font-bold text-ink-900 dark:text-white" style={{ fontSize: size * 0.26 }}>
            {displayScore}
            <span className="text-ink-400 dark:text-slate-500" style={{ fontSize: size * 0.14 }}>%</span>
          </span>
          {label !== false && (
            <span className={`mt-0.5 text-[11px] font-semibold uppercase tracking-wide ${colors.text}`}>
              {classification}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
