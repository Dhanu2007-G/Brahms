/**
 * AstraPulse — Interactive SVG Body Twin + 5-Node Orbiting Hazard Ring + Concentric Vitality Rings
 * Team Zenitsu — NASA Space Apps Challenge 2026
 */

import { FlipHorizontal, Radar } from 'lucide-react';
import React, { useState } from 'react';
import {
  BodyRegionId,
  BodyRegionStatus,
  HazardId,
  HazardNodeStatus,
  VitalityRingScore,
} from '../analytics/types';
import { getStatusVisual } from './StatusChip';

interface BodyTwinProps {
  bodyRegions: BodyRegionStatus[];
  hazardNodes: HazardNodeStatus[];
  vitalityRings: VitalityRingScore[];
  selectedRegion: BodyRegionId | null;
  onSelectRegion: (id: BodyRegionId) => void;
  side: 'front' | 'back';
  onToggleSide: () => void;
  isScanning: boolean;
  onTriggerScan: () => void;
  readOnly?: boolean;
  onSelectHazard?: (hazard: HazardNodeStatus) => void;
}

export const BodyTwin: React.FC<BodyTwinProps> = ({
  bodyRegions,
  hazardNodes,
  vitalityRings,
  selectedRegion,
  onSelectRegion,
  side,
  onToggleSide,
  isScanning,
  onTriggerScan,
  onSelectHazard,
}) => {
  const [hoveredHazard, setHoveredHazard] = useState<HazardId | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<BodyRegionId | null>(null);
  const [selectedRingId, setSelectedRingId] = useState<
    'recovery' | 'strain' | 'mind' | null
  >(null);

  // Convert BodyTwin internal (0..200, 0..420) coordinates to stage SVG (0..520, 0..480)
  const toStageX = (x: number) => 160 + x; // center 100 -> 260
  const toStageY = (y: number) => 42 + y; // 42..462

  // Convert Hazard angleDeg to orbiting coordinates around center (260, 245)
  const getHazardCoords = (angleDeg: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: 260 + Math.cos(rad) * 208,
      y: 245 + Math.sin(rad) * 190,
    };
  };

  const activeHazardObj = hazardNodes.find((h) => h.id === hoveredHazard);

  // Filter hotspots to active side (unless highlighted by hovered hazard)
  const visibleRegions = bodyRegions.filter(
    (r) =>
      r.side === side ||
      r.side === 'both' ||
      selectedRegion === r.id ||
      activeHazardObj?.affectedRegions.includes(r.id)
  );

  return (
    <div className="relative flex flex-col items-center justify-between w-full h-full select-none">
      {/* Top Controls Bar inside Center Stage */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 px-1 z-10">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleSide}
            className="touch-target inline-flex items-center gap-2 px-3 py-1.5 rounded-lg glass-panel hover:bg-white/10 text-xs font-medium text-[#F2F6FF] transition cursor-pointer"
            title="Flip Body Twin (Shortcut: F)"
          >
            <FlipHorizontal className="w-4 h-4 text-[#3DE0FF]" />
            <span>
              View: {side === 'front' ? 'Anterior (Front)' : 'Posterior (Back)'}
            </span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono-tabular bg-white/10 rounded">
              F
            </kbd>
          </button>

          <button
            type="button"
            onClick={onTriggerScan}
            className="touch-target inline-flex items-center gap-2 px-3 py-1.5 rounded-lg glass-panel hover:bg-white/10 text-xs font-medium text-[#F2F6FF] transition cursor-pointer"
            title="Run 2-second System Scan (Shortcut: S)"
          >
            <Radar className="w-4 h-4 text-[#8B7CFF]" />
            <span>{isScanning ? 'Scanning Systems…' : 'Scan Twin'}</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono-tabular bg-white/10 rounded">
              S
            </kbd>
          </button>
        </div>

        {/* Status Legend (Shape + Label, never colour alone) */}
        <div className="flex items-center gap-3 text-[11px] text-[#A9B4CC] bg-[#0A0F1C]/80 border border-white/10 px-3 py-1.5 rounded-lg">
          <span className="inline-flex items-center gap-1">
            <span className="text-[#2DD4BF] font-mono-tabular">●</span> Nominal
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="text-[#FFB547] font-mono-tabular">▲</span> Watch
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="text-[#FF5C93] font-mono-tabular">◆</span> Review
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="text-[#8B7CFF] font-mono-tabular">■</span> Noted
          </span>
        </div>
      </div>

      {/* Main Interactive SVG Stage + Accessible Hotspot Overlay */}
      <div className="relative w-full max-w-[520px] aspect-[520/470] flex items-center justify-center my-auto">
        <svg
          viewBox="0 0 520 470"
          className="w-full h-full overflow-visible"
          role="img"
          aria-label={`Interactive Astronaut Body Twin (${side} view) surrounded by the 5 NASA Spaceflight Hazards`}
        >
          <defs>
            <radialGradient id="twinGlow" cx="50%" cy="48%" r="50%">
              <stop offset="0%" stopColor="#3DE0FF" stopOpacity="0.16" />
              <stop offset="55%" stopColor="#8B7CFF" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#04060C" stopOpacity="0" />
            </radialGradient>
            <linearGradient
              id="bodyStrokeGrad"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#3DE0FF" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#8B7CFF" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0.75" />
            </linearGradient>
            <linearGradient
              id="scanGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#3DE0FF" stopOpacity="0" />
              <stop offset="50%" stopColor="#3DE0FF" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#3DE0FF" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Subtle radial aura */}
          <circle cx="260" cy="240" r="215" fill="url(#twinGlow)" />

          {/* Outer Hazard Orbit Track */}
          <ellipse
            cx="260"
            cy="245"
            rx="208"
            ry="190"
            fill="none"
            stroke="rgba(255,255,255,0.09)"
            strokeWidth="1.2"
            strokeDasharray="6 8"
          />
          <circle
            cx="260"
            cy="245"
            r="146"
            fill="none"
            stroke="rgba(61, 224, 255, 0.09)"
            strokeWidth="1"
          />

          {/* Animated Bézier Arcs from Hovered Hazard to Affected Body Regions */}
          {activeHazardObj &&
            activeHazardObj.affectedRegions.map((regId) => {
              const region = bodyRegions.find((r) => r.id === regId);
              if (!region) return null;
              const start = getHazardCoords(activeHazardObj.angleDeg);
              const endX = toStageX(region.x);
              const endY = toStageY(region.y);
              const ctrlX = (start.x + endX) / 2;
              const ctrlY = Math.min(start.y, endY) - 28;
              const vis = getStatusVisual(region.tier);

              return (
                <path
                  key={`${activeHazardObj.id}-${regId}`}
                  d={`M ${start.x} ${start.y} Q ${ctrlX} ${ctrlY} ${endX} ${endY}`}
                  fill="none"
                  stroke={vis.colorVar}
                  strokeWidth="2.2"
                  strokeDasharray="6 4"
                  opacity="0.9"
                />
              );
            })}

          {/* Human Anatomical Silhouette Centered at X=260 (160 + 100) */}
          <g transform="translate(160, 42)">
            <g className="animate-idle-breath">
              {/* Helmet / Cranial Halo */}
              <circle
                cx="100"
                cy="44"
                r="30"
                fill="rgba(61,224,255,0.04)"
                stroke="rgba(61,224,255,0.28)"
                strokeWidth="1.2"
                strokeDasharray="4 4"
              />
              {/* Head */}
              <path
                d="M100 18 C85 18 76 30 76 45 C76 59 85 70 100 70 C115 70 124 59 124 45 C124 30 115 18 100 18 Z"
                fill="rgba(15, 23, 42, 0.82)"
                stroke="url(#bodyStrokeGrad)"
                strokeWidth="2"
              />
              {/* Neck & Torso + Arms + Legs */}
              <path
                d="M89 70 L88 84 L54 96 C44 100 38 110 36 124 L28 206 C27 214 33 220 40 220 C46 220 50 215 52 206 L60 134 L66 134 L64 218 L58 352 C57 364 64 372 73 372 C82 372 87 365 89 352 L96 244 L104 244 L111 352 C113 365 118 372 127 372 C136 372 143 364 142 352 L136 218 L134 134 L140 134 L148 206 C150 215 154 220 160 220 C167 220 173 214 172 206 L164 124 C162 110 156 100 146 96 L112 84 L111 70 Z"
                fill="rgba(15, 23, 42, 0.82)"
                stroke="url(#bodyStrokeGrad)"
                strokeWidth="2"
                strokeLinejoin="round"
              />

              {/* Internal Anatomical Guides (Front vs Back) */}
              {side === 'front' ? (
                <g opacity="0.55" stroke="#3DE0FF" strokeWidth="1.2" fill="none">
                  <path d="M76 108 C76 96 94 96 96 112 L96 146 C82 146 74 134 76 108 Z" />
                  <path d="M124 108 C124 96 106 96 104 112 L104 146 C118 146 126 134 124 108 Z" />
                  <path
                    d="M84 132 L96 132 L101 120 L107 144 L113 127 L118 132 L128 132"
                    stroke="#FF5C93"
                    strokeWidth="1.7"
                  />
                  <line
                    x1="100"
                    y1="152"
                    x2="100"
                    y2="215"
                    strokeDasharray="3 4"
                  />
                  <path d="M78 175 Q100 183 122 175" />
                  <path d="M80 202 Q100 210 120 202" />
                </g>
              ) : (
                <g opacity="0.6" stroke="#8B7CFF" strokeWidth="1.4" fill="none">
                  <line
                    x1="100"
                    y1="74"
                    x2="100"
                    y2="232"
                    strokeWidth="2.5"
                    strokeDasharray="5 4"
                  />
                  <path d="M74 104 L92 114 L88 142 Z" />
                  <path d="M126 104 L108 114 L112 142 Z" />
                  <path d="M74 216 Q100 232 126 216" strokeWidth="2" />
                </g>
              )}
            </g>

            {/* Scan sweep line when isScanning is true */}
            {isScanning && (
              <rect
                x="15"
                y="10"
                width="170"
                height="4"
                fill="url(#scanGradient)"
                style={{ animation: 'scan-line 1.6s ease-in-out' }}
              />
            )}
          </g>
        </svg>

        {/* 5 Orbiting NASA Hazard Nodes (Accessible Buttons) */}
        {hazardNodes.map((hz) => {
          const coords = getHazardCoords(hz.angleDeg);
          const vis = getStatusVisual(hz.tier);
          const leftPct = (coords.x / 520) * 100;
          const topPct = (coords.y / 470) * 100;
          const isHovered = hoveredHazard === hz.id;

          return (
            <button
              key={hz.id}
              type="button"
              onMouseEnter={() => setHoveredHazard(hz.id)}
              onMouseLeave={() => setHoveredHazard(null)}
              onFocus={() => setHoveredHazard(hz.id)}
              onBlur={() => setHoveredHazard(null)}
              onClick={() => onSelectHazard?.(hz)}
              style={{
                left: `${leftPct}%`,
                top: `${topPct}%`,
                borderColor: isHovered ? vis.colorVar : undefined,
              }}
              className="touch-target -translate-x-1/2 -translate-y-1/2 absolute z-20 px-2.5 py-1.5 rounded-xl glass-panel-strong hover:scale-105 transition flex items-center gap-1.5 shadow-lg cursor-pointer"
              aria-label={`NASA Hazard: ${hz.name} — Status: ${vis.label}`}
            >
              <span
                className="font-mono-tabular text-xs font-bold"
                style={{ color: vis.colorVar }}
                aria-hidden="true"
              >
                {vis.symbol}
              </span>
              <span className="text-[11px] font-semibold text-[#F2F6FF] whitespace-nowrap">
                {hz.shortName}
              </span>
              {hz.activeAlertCount > 0 && (
                <span
                  className="px-1.5 py-0.2 rounded text-[10px] font-mono-tabular font-bold bg-white/10"
                  style={{ color: vis.colorVar }}
                >
                  {hz.activeAlertCount}
                </span>
              )}
            </button>
          );
        })}

        {/* Active Side Body System Hotspot Buttons */}
        {visibleRegions.map((reg) => {
          const stageX = toStageX(reg.x);
          const stageY = toStageY(reg.y);
          const leftPct = (stageX / 520) * 100;
          const topPct = (stageY / 470) * 100;
          const vis = getStatusVisual(reg.tier);
          const isSelected = selectedRegion === reg.id;
          const isHovered = hoveredRegion === reg.id;
          const placeLeft = reg.x < 95;

          return (
            <button
              key={reg.id}
              type="button"
              onMouseEnter={() => setHoveredRegion(reg.id)}
              onMouseLeave={() => setHoveredRegion(null)}
              onFocus={() => setHoveredRegion(reg.id)}
              onBlur={() => setHoveredRegion(null)}
              onClick={() => onSelectRegion(reg.id)}
              style={{
                left: `${leftPct}%`,
                top: `${topPct}%`,
              }}
              aria-label={`${reg.label}: ${vis.label}. Click to inspect system drawer.`}
              className="touch-target -translate-x-1/2 -translate-y-1/2 absolute z-20 group flex items-center justify-center rounded-full transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#3DE0FF]"
            >
              {/* Outer pulse halo for watch/review */}
              {(reg.tier === 'review_required' || reg.tier === 'watch') && (
                <span
                  className="absolute w-7 h-7 rounded-full animate-heartbeat opacity-35"
                  style={{ backgroundColor: vis.colorVar }}
                />
              )}

              {/* Hotspot Node */}
              <span
                className={`relative flex items-center justify-center w-6 h-6 rounded-full border-2 shadow-md transition-transform group-hover:scale-125 ${
                  isSelected ? 'scale-125 ring-2 ring-[#3DE0FF]' : ''
                }`}
                style={{
                  backgroundColor: '#0A0F1C',
                  borderColor: vis.colorVar,
                  color: vis.colorVar,
                }}
              >
                <span className="font-mono-tabular text-[11px] leading-none font-bold">
                  {vis.symbol}
                </span>
              </span>

              {/* Floating Label Pill on Hover / Focus / Selected */}
              <span
                className={`pointer-events-none absolute ${
                  placeLeft ? 'right-8' : 'left-8'
                } px-2 py-0.5 rounded-md bg-[#04060C]/95 border border-white/20 text-[11px] font-medium whitespace-nowrap shadow-xl transition-opacity z-30 ${
                  isSelected || isHovered ? 'opacity-100' : 'opacity-0'
                }`}
                style={{ color: vis.colorVar }}
              >
                {reg.shortLabel}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom 3 Concentric Vitality Rings & Active Breakdown Strip */}
      <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-3 items-center glass-panel rounded-2xl p-3 z-10">
        <div className="md:col-span-4 flex items-center gap-3">
          <svg
            viewBox="0 0 120 120"
            className="w-20 h-20 shrink-0"
            role="img"
            aria-label="Concentric Vitality Rings: Recovery, Body Load, and Mind"
          >
            {vitalityRings.map((ring, idx) => {
              const radii = [48, 36, 24];
              const r = radii[idx] || 24;
              const circum = 2 * Math.PI * r;
              const pct = (ring.score ?? 0) / 100;
              const dashOffset = circum * (1 - pct);
              const vis = getStatusVisual(ring.tier);
              const strokeW = 3.5 + ring.confidence * 3.5;

              return (
                <g key={ring.id} transform="rotate(-90 60 60)">
                  <circle
                    cx="60"
                    cy="60"
                    r={r}
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth={strokeW}
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r={r}
                    fill="none"
                    stroke={vis.colorVar}
                    strokeWidth={strokeW}
                    strokeLinecap="round"
                    strokeDasharray={circum}
                    strokeDashoffset={dashOffset}
                  />
                </g>
              );
            })}
            <text
              x="60"
              y="64"
              textAnchor="middle"
              className="fill-[#F2F6FF] font-mono-tabular text-[13px] font-bold"
            >
              {vitalityRings[0]?.score ?? '—'}
            </text>
          </svg>

          <div>
            <div className="text-xs uppercase tracking-wider text-[#7C89A6] font-semibold">
              Vitality Rings
            </div>
            <div className="text-sm font-display font-semibold text-[#F2F6FF]">
              Personal Baseline Fit
            </div>
            <div className="text-[11px] text-[#A9B4CC] mt-0.5">
              Click any ring to inspect signal confidence
            </div>
          </div>
        </div>

        {/* 3 Clickable Ring Cards */}
        <div className="md:col-span-8 grid grid-cols-3 gap-2">
          {vitalityRings.map((ring) => {
            const vis = getStatusVisual(ring.tier);
            const isSelected = selectedRingId === ring.id;
            return (
              <button
                key={ring.id}
                type="button"
                onClick={() =>
                  setSelectedRingId(isSelected ? null : ring.id)
                }
                className={`text-left p-2.5 rounded-xl border transition cursor-pointer ${
                  isSelected
                    ? 'bg-white/10 border-[#3DE0FF]'
                    : 'bg-[#0A0F1C]/70 border-white/10 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-medium text-[#A9B4CC]">
                    {ring.label}
                  </span>
                  <span
                    className="font-mono-tabular text-xs font-bold"
                    style={{ color: vis.colorVar }}
                  >
                    {vis.symbol}
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-xl font-display font-bold font-mono-tabular text-[#F2F6FF]">
                    {ring.score !== null ? `${ring.score}` : '—'}
                  </span>
                  <span className="text-[10px] font-mono-tabular text-[#7C89A6]">
                    {Math.round(ring.confidence * 100)}% conf
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {selectedRingId && (
          <div className="md:col-span-12 pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-[#A9B4CC]">
              {vitalityRings.find((r) => r.id === selectedRingId)?.summary}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {vitalityRings
                .find((r) => r.id === selectedRingId)
                ?.contributors.map((c) => (
                  <span
                    key={c.metric}
                    className={`px-2 py-0.5 rounded border font-mono-tabular text-[11px] ${
                      c.impact === 'adverse'
                        ? 'border-rose-400/40 bg-rose-500/10 text-rose-300'
                        : c.impact === 'missing'
                        ? 'border-slate-600 text-slate-400'
                        : 'border-teal-400/30 bg-teal-500/10 text-teal-300'
                    }`}
                  >
                    {c.label}:{' '}
                    {c.value !== null ? `${c.value} ${c.unit}` : 'Not recorded'}
                  </span>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
