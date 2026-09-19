import React from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, Label,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useIsDarkMode } from "../../hooks/useIsDarkMode";

const COLORS = ["#4f46e5", "#818cf8", "#16a34a", "#d97706", "#dc2626", "#0ea5e9", "#a855f7"];

function humanizeLabel(value) {
  return String(value || "")
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function ChartCard({ title, children, sub }) {
  return (
    <div className="card p-5" role="region" aria-label={`Chart showing ${title}`}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-ink-900 dark:text-white">{title}</h3>
        {sub && <p className="text-xs text-ink-400 dark:text-slate-400 mt-0.5">{sub}</p>}
      </div>
      <div className="h-64">{children}</div>
    </div>
  );
}

/** Themed tooltip matching the app's card styling, readable in both light and dark mode. */
function ChartTooltip({ active, payload, label, formatter, labelFormatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-surface-border dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg px-3 py-2 text-xs">
      {label != null && (
        <p className="font-medium text-ink-900 dark:text-white mb-1">{labelFormatter ? labelFormatter(label) : label}</p>
      )}
      {payload.map((p, i) => (
        <p key={i} className="text-ink-700 dark:text-slate-300 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: p.color || p.fill }} />
          {p.name ? <span className="text-ink-500 dark:text-slate-400">{p.name}:</span> : null}
          <span className="font-medium text-ink-900 dark:text-slate-100">
            {formatter ? formatter(p.value, p.name) : p.value}
          </span>
        </p>
      ))}
    </div>
  );
}

function useChartTheme() {
  const isDark = useIsDarkMode();
  return {
    grid: isDark ? "#1e293b" : "#f1f5f9",
    tick: isDark ? "#64748b" : "#94a3b8",
    axisLine: isDark ? "#334155" : "#e5e7eb",
    cursorFill: isDark ? "rgba(99, 102, 241, 0.08)" : "rgba(99, 102, 241, 0.06)",
  };
}

export function ClaimsByStatusChart({ data, onBarClick }) {
  const theme = useChartTheme();
  const clickable = typeof onBarClick === "function";
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ bottom: 12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
        <XAxis
          dataKey="status"
          tickFormatter={humanizeLabel}
          tick={{ fontSize: 11, fill: theme.tick }}
          stroke={theme.axisLine}
          interval={0}
          angle={-25}
          textAnchor="end"
          height={60}
        />
        <YAxis tick={{ fontSize: 11, fill: theme.tick }} stroke={theme.axisLine} allowDecimals={false} />
        <Tooltip content={<ChartTooltip labelFormatter={humanizeLabel} />} cursor={{ fill: theme.cursorFill }} />
        <Bar
          dataKey="count"
          fill="#4f46e5"
          radius={[4, 4, 0, 0]}
          maxBarSize={48}
          cursor={clickable ? "pointer" : "default"}
          onClick={clickable ? (d) => onBarClick(d.status) : undefined}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DenialCodeDistributionChart({ data, onSliceClick }) {
  const theme = useChartTheme();
  const clickable = typeof onSliceClick === "function";
  const total = data.reduce((sum, d) => sum + (d.count || 0), 0);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="denialCode"
          innerRadius="55%"
          outerRadius="85%"
          paddingAngle={2}
          cursor={clickable ? "pointer" : "default"}
          onClick={clickable ? (d) => onSliceClick(d.denialCode) : undefined}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
          ))}
          <Label
            position="center"
            content={({ viewBox }) => (
              <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                <tspan x={viewBox.cx} y={viewBox.cy - 6} className="fill-ink-900 dark:fill-white" fontSize={26} fontWeight={700}>
                  {total}
                </tspan>
                <tspan x={viewBox.cx} y={viewBox.cy + 16} fill={theme.tick} fontSize={11}>
                  denials
                </tspan>
              </text>
            )}
          />
        </Pie>
        <Legend verticalAlign="bottom" height={30} wrapperStyle={{ fontSize: 11, color: theme.tick }} />
        <Tooltip content={<ChartTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function RecoveryByMonthChart({ data }) {
  const theme = useChartTheme();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: theme.tick }} stroke={theme.axisLine} />
        <YAxis tick={{ fontSize: 11, fill: theme.tick }} stroke={theme.axisLine} tickFormatter={(v) => `$${v / 1000}k`} />
        <Tooltip content={<ChartTooltip formatter={(v) => `$${v.toLocaleString()}`} />} cursor={{ stroke: theme.axisLine, strokeDasharray: "4 4" }} />
        <Line type="monotone" dataKey="total" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function AppealsOverTimeChart({ data }) {
  const theme = useChartTheme();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: theme.tick }} stroke={theme.axisLine} />
        <YAxis tick={{ fontSize: 11, fill: theme.tick }} stroke={theme.axisLine} allowDecimals={false} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: theme.cursorFill }} />
        <Bar dataKey="count" fill="#818cf8" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
