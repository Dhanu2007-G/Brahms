/**
 * AstraPulse — Geometric Status Chips, Provenance Badges & Persistence Dots (Never Colour Alone)
 * Team Zenitsu — NASA Space Apps Challenge 2026
 */

import React from 'react';
import { AlertSeverity, ProvenanceSource, StatusTier } from '../analytics/types';

export function getStatusVisual(tier: StatusTier | AlertSeverity): {
  symbol: string;
  label: string;
  shortLabel: string;
  colorVar: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
} {
  switch (tier) {
    case 'nominal':
      return {
        symbol: '●',
        label: 'In your range',
        shortLabel: 'Nominal',
        colorVar: 'var(--color-nominal)',
        bgClass: 'bg-teal-500/12',
        borderClass: 'border-teal-400/35',
        textClass: 'text-[#2DD4BF]',
      };
    case 'watch':
      return {
        symbol: '▲',
        label: 'Keep watching',
        shortLabel: 'Watch',
        colorVar: 'var(--color-watch)',
        bgClass: 'bg-amber-500/15',
        borderClass: 'border-amber-400/40',
        textClass: 'text-[#FFB547]',
      };
    case 'review_required':
      return {
        symbol: '◆',
        label: 'Review suggested',
        shortLabel: 'Review',
        colorVar: 'var(--color-review)',
        bgClass: 'bg-rose-500/16',
        borderClass: 'border-rose-400/45',
        textClass: 'text-[#FF5C93]',
      };
    case 'informational':
      return {
        symbol: '■',
        label: 'Noted',
        shortLabel: 'Noted',
        colorVar: 'var(--color-info)',
        bgClass: 'bg-indigo-500/15',
        borderClass: 'border-indigo-400/40',
        textClass: 'text-[#8B7CFF]',
      };
    case 'stale':
      return {
        symbol: '○',
        label: 'No recent data',
        shortLabel: 'Stale',
        colorVar: 'var(--color-stale)',
        bgClass: 'bg-slate-500/15',
        borderClass: 'border-slate-400/30 border-dashed',
        textClass: 'text-[#A9B4CC]',
      };
    case 'not_recorded':
    default:
      return {
        symbol: '—',
        label: 'Not recorded',
        shortLabel: 'Not recorded',
        colorVar: 'var(--color-stale)',
        bgClass: 'bg-slate-800/40',
        borderClass: 'border-slate-600/30',
        textClass: 'text-[#7C89A6]',
      };
  }
}

export const StatusChip: React.FC<{
  tier: StatusTier | AlertSeverity;
  compact?: boolean;
  className?: string;
}> = ({ tier, compact = false, className = '' }) => {
  const vis = getStatusVisual(tier);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-xs font-medium tracking-wide ${vis.bgClass} ${vis.borderClass} ${vis.textClass} ${className}`}
      style={{ color: vis.colorVar }}
    >
      <span aria-hidden="true" className="font-mono-tabular text-[11px]">
        {vis.symbol}
      </span>
      <span>{compact ? vis.shortLabel : vis.label}</span>
    </span>
  );
};

export const ProvenanceBadge: React.FC<{
  source: ProvenanceSource | null | undefined;
  className?: string;
}> = ({ source, className = '' }) => {
  if (!source) return null;
  const map: Record<
    ProvenanceSource,
    { label: string; style: string }
  > = {
    user_entered: {
      label: 'USER-ENTERED',
      style: 'border-cyan-400/35 text-cyan-300 bg-cyan-950/35',
    },
    imported: {
      label: 'IMPORTED',
      style: 'border-emerald-400/35 text-emerald-300 bg-emerald-950/35',
    },
    simulated: {
      label: 'SIMULATED',
      style: 'border-amber-400/40 text-amber-300 bg-amber-950/40',
    },
    reference: {
      label: 'REFERENCE',
      style: 'border-purple-400/35 text-purple-300 bg-purple-950/35',
    },
    derived: {
      label: 'DERIVED',
      style: 'border-slate-400/35 text-slate-300 bg-slate-900/50',
    },
  };

  const info = map[source] || map.simulated;
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-mono-tabular uppercase tracking-wider ${info.style} ${className}`}
    >
      {info.label}
    </span>
  );
};

export const PersistenceDots: React.FC<{
  count: number;
  windowSize?: number;
  tier?: StatusTier | AlertSeverity;
}> = ({ count, windowSize = 4, tier = 'watch' }) => {
  const vis = getStatusVisual(tier);
  const total = Math.max(3, windowSize);
  const filled = Math.min(total, Math.max(0, count));

  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs text-[#A9B4CC]"
      title={`Persistence: ${count} of last ${total} mission days`}
    >
      <span className="inline-flex items-center gap-1" aria-hidden="true">
        {Array.from({ length: total }).map((_, idx) => {
          const isFilled = idx < filled;
          return (
            <span
              key={idx}
              className="w-2 h-2 rounded-xs transition-all"
              style={{
                backgroundColor: isFilled ? vis.colorVar : 'rgba(255,255,255,0.12)',
                border: isFilled ? 'none' : '1px solid rgba(255,255,255,0.25)',
              }}
            />
          );
        })}
      </span>
      <span className="font-mono-tabular text-[11px]">
        {count}/{total}d
      </span>
    </span>
  );
};
