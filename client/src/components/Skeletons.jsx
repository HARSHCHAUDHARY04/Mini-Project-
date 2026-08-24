import React from "react";

export function SkeletonRow({ cols = 6 }) {
  return (
    <tr className="border-b border-surface-border last:border-0">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="skeleton h-3.5 rounded" style={{ width: `${55 + ((i * 13) % 35)}%` }} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonTable({ rows = 5, cols = 6 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} cols={cols} />
      ))}
    </>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="card p-5">
      <div className="skeleton h-3 w-20 rounded mb-3" />
      <div className="skeleton h-7 w-16 rounded" />
    </div>
  );
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="card p-5">
      <div className="skeleton h-4 w-32 rounded mb-4" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton h-3 rounded mb-2.5" style={{ width: `${70 - i * 10}%` }} />
      ))}
    </div>
  );
}
