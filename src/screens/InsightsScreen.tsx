/**
 * AstraPulse — S6 Insights & Time Conductor (/insights): Overlay Chart, Z-Score Toggle, Sleep Debt, Spearman Matrix & Radiation Projection
 * Team Zenitsu — NASA Space Apps Challenge 2026
 */

import {
  AlertTriangle,
  BarChart3,
  LineChart as LineChartIcon,
  Moon,
  ShieldAlert,
  Table as TableIcon,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  computeBaseline,
  computeRadiationProjection,
  computeRobustZ,
  computeSleepDebt,
  computeSpearmanCorrelation,
} from '../analytics/engine';
import { METRIC_DEFINITIONS } from '../analytics/ruleset';
import { MetricCode } from '../analytics/types';
import { StatusChip } from '../components/StatusChip';
import { useMission } from '../context/MissionContext';

const OVERLAY_COLORS = ['#3DE0FF', '#FF5C93', '#2DD4BF', '#FFB547', '#8B7CFF'];

const CORRELATION_METRICS: MetricCode[] = [
  'sleep_duration_h',
  'heart_rate',
  'systolic_bp',
  'stress_score',
  'reaction_time_ms',
  'cabin_co2_ppm',
];

export const InsightsScreen: React.FC = () => {
  const {
    activeCrew,
    observations,
    evaluations,
    selectedMissionDay,
    formatMetricValue,
  } = useMission();

  const [selectedMetrics, setSelectedMetrics] = useState<MetricCode[]>([
    'heart_rate',
    'sleep_duration_h',
    'systolic_bp',
    'stress_score',
  ]);
  const [normalizeZScore, setNormalizeZScore] = useState<boolean>(true);
  const [showOverlayTable, setShowOverlayTable] = useState<boolean>(false);

  const toggleMetric = (m: MetricCode) => {
    setSelectedMetrics((prev) => {
      if (prev.includes(m)) {
        return prev.length > 1 ? prev.filter((x) => x !== m) : prev;
      }
      if (prev.length >= 5) {
        return [...prev.slice(1), m];
      }
      return [...prev, m];
    });
  };

  // Build 24-day overlay dataset up to selectedMissionDay
  const overlayData = useMemo(() => {
    const baselines: Partial<Record<MetricCode, ReturnType<typeof computeBaseline>>> = {};
    for (const m of selectedMetrics) {
      baselines[m] = evaluations[m]?.baseline;
    }

    const rows: Record<string, number | string | null>[] = [];
    for (let d = 1; d <= selectedMissionDay; d++) {
      const row: Record<string, number | string | null> = {
        day: `MD-${d}`,
        missionDay: d,
      };
      for (const m of selectedMetrics) {
        const obs = observations.find(
          (o) => o.metric === m && o.missionDay === d
        );
        if (!obs || obs.value === null) {
          row[m] = null;
        } else if (normalizeZScore && baselines[m]) {
          row[m] = computeRobustZ(obs.value, baselines[m]!);
        } else {
          row[m] = obs.value;
        }
      }
      rows.push(row);
    }
    return rows;
  }, [observations, selectedMetrics, selectedMissionDay, normalizeZScore, evaluations]);

  // C-09: 7-Day Sleep Debt
  const sleepDebtInfo = useMemo(() => {
    const trailingSleep: (number | null)[] = [];
    for (
      let d = Math.max(1, selectedMissionDay - 6);
      d <= selectedMissionDay;
      d++
    ) {
      const obs = observations.find(
        (o) => o.metric === 'sleep_duration_h' && o.missionDay === d
      );
      trailingSleep.push(obs ? obs.value : null);
    }
    return computeSleepDebt(trailingSleep, 8.0);
  }, [observations, selectedMissionDay]);

  // C-15: Radiation Dose Projection
  const radiationInfo = useMemo(() => {
    const dailyRad = observations
      .filter(
        (o) =>
          o.metric === 'radiation_dose_mgy' &&
          o.missionDay <= selectedMissionDay
      )
      .sort((a, b) => a.missionDay - b.missionDay)
      .map((o) => o.value);
    return computeRadiationProjection(dailyRad, activeCrew.totalMissionDays);
  }, [observations, selectedMissionDay, activeCrew.totalMissionDays]);

  // C-18: Spearman Rank Correlation Matrix
  const correlationMatrix = useMemo(() => {
    const byDayMetric = new Map<string, number | null>();
    for (const o of observations) {
      if (o.missionDay <= selectedMissionDay) {
        byDayMetric.set(`${o.missionDay}:${o.metric}`, o.value);
      }
    }

    return CORRELATION_METRICS.map((mRow) => ({
      metric: mRow,
      cells: CORRELATION_METRICS.map((mCol) => {
        if (mRow === mCol) return { col: mCol, rho: 1, n: selectedMissionDay };
        const pairs: { x: number | null | undefined; y: number | null | undefined }[] = [];
        for (let d = 1; d <= selectedMissionDay; d++) {
          pairs.push({
            x: byDayMetric.get(`${d}:${mRow}`),
            y: byDayMetric.get(`${d}:${mCol}`),
          });
        }
        const res = computeSpearmanCorrelation(pairs);
        return { col: mCol, rho: res.rho, n: res.sampleSize };
      }),
    }));
  }, [observations, selectedMissionDay]);

  return (
    <div className="space-y-5">
      {/* Multi-Metric Overlay Chart Card */}
      <div className="glass-panel rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs font-mono-tabular uppercase tracking-wider text-[#3DE0FF] font-bold">
              MULTI-METRIC TIME CONDUCTOR • MD-1 TO MD-{selectedMissionDay}
            </span>
            <h1 className="text-xl font-display font-bold text-[#F2F6FF]">
              Cross-System Trend Overlay & Robust Z-Score Comparison
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setNormalizeZScore((z) => !z)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                normalizeZScore
                  ? 'bg-[#3DE0FF]/20 border-[#3DE0FF] text-[#3DE0FF]'
                  : 'bg-white/5 border-white/10 text-[#A9B4CC]'
              }`}
            >
              {normalizeZScore
                ? 'Mode: Robust Z-Score (σ from Personal Median)'
                : 'Mode: Raw Physical Units'}
            </button>

            <button
              type="button"
              onClick={() => setShowOverlayTable((t) => !t)}
              className="px-3 py-1.5 rounded-xl glass-panel text-xs text-[#2DD4BF] flex items-center gap-1.5 cursor-pointer"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>{showOverlayTable ? 'Show Chart' : 'Show Data Table'}</span>
            </button>
          </div>
        </div>

        {/* Select up to 5 Metrics */}
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(METRIC_DEFINITIONS) as MetricCode[]).map((mCode) => {
            const def = METRIC_DEFINITIONS[mCode];
            const idx = selectedMetrics.indexOf(mCode);
            const active = idx !== -1;
            const color = active ? OVERLAY_COLORS[idx] : undefined;

            return (
              <button
                key={mCode}
                type="button"
                onClick={() => toggleMetric(mCode)}
                style={{
                  borderColor: active ? color : undefined,
                  color: active ? color : undefined,
                }}
                className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition cursor-pointer ${
                  active
                    ? 'bg-white/10 font-bold'
                    : 'bg-white/5 border-white/10 text-[#A9B4CC] hover:text-white'
                }`}
              >
                {def.shortLabel}
              </button>
            );
          })}
        </div>

        {!showOverlayTable ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={overlayData}>
                <CartesianGrid
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="day"
                  stroke="#7C89A6"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="#7C89A6"
                  fontSize={11}
                  tickLine={false}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0A0F1C',
                    borderColor: 'rgba(255,255,255,0.18)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                {normalizeZScore && (
                  <>
                    <ReferenceLine
                      y={2.3}
                      stroke="#FFB547"
                      strokeDasharray="4 4"
                      label={{
                        value: '+2.3σ Watch',
                        fill: '#FFB547',
                        fontSize: 10,
                      }}
                    />
                    <ReferenceLine
                      y={0}
                      stroke="#2DD4BF"
                      strokeOpacity={0.6}
                    />
                    <ReferenceLine
                      y={-2.3}
                      stroke="#FFB547"
                      strokeDasharray="4 4"
                    />
                  </>
                )}
                {selectedMetrics.map((mCode, idx) => (
                  <Line
                    key={mCode}
                    type="monotone"
                    dataKey={mCode}
                    name={METRIC_DEFINITIONS[mCode].shortLabel}
                    stroke={OVERLAY_COLORS[idx % OVERLAY_COLORS.length]}
                    strokeWidth={2.3}
                    dot={{ r: 2.5 }}
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-72 border border-white/10 rounded-xl">
            <table className="w-full text-left text-xs font-mono-tabular">
              <thead className="bg-white/5 text-[#A9B4CC]">
                <tr>
                  <th className="p-2">Mission Day</th>
                  {selectedMetrics.map((m) => (
                    <th key={m} className="p-2">
                      {METRIC_DEFINITIONS[m].shortLabel}{' '}
                      {normalizeZScore ? '(σ)' : `(${METRIC_DEFINITIONS[m].unit})`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {overlayData.map((r) => (
                  <tr key={String(r.day)}>
                    <td className="p-2 font-bold text-[#3DE0FF]">{r.day}</td>
                    {selectedMetrics.map((m) => (
                      <td key={m} className="p-2 text-[#F2F6FF]">
                        {r[m] !== null && r[m] !== undefined
                          ? Number(r[m]).toFixed(normalizeZScore ? 2 : 1)
                          : 'Not recorded'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Row 2: 7-Day Sleep Debt (C-09) + Radiation Dose Projection (C-15) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-display font-bold text-[#F2F6FF] flex items-center gap-2">
              <Moon className="w-5 h-5 text-[#8B7CFF]" />
              7-Day Cumulative Sleep Debt (C-09)
            </h2>
            <StatusChip tier={evaluations.sleep_duration_h.tier} />
          </div>
          <p className="text-xs text-[#A9B4CC]">
            Calculated against an 8.0-hour daily mission sleep target. Missing
            days are never coerced to 0 hours.
          </p>
          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-[#04060C]/60 border border-white/10">
              <div className="text-[11px] text-[#7C89A6]">7-Day Sleep Debt</div>
              <div className="text-xl font-display font-bold font-mono-tabular text-[#FF5C93] mt-1">
                {sleepDebtInfo.debtHours} h
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#04060C]/60 border border-white/10">
              <div className="text-[11px] text-[#7C89A6]">7-Day Average</div>
              <div className="text-xl font-display font-bold font-mono-tabular text-[#F2F6FF] mt-1">
                {sleepDebtInfo.averageHours ?? '—'} h
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#04060C]/60 border border-white/10">
              <div className="text-[11px] text-[#7C89A6]">Days Logged</div>
              <div className="text-xl font-display font-bold font-mono-tabular text-[#2DD4BF] mt-1">
                {sleepDebtInfo.recordedDays}/7 d
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-display font-bold text-[#F2F6FF] flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#FFB547]" />
              Mission Radiation Dose Projection (C-15)
            </h2>
            <span className="text-[11px] font-mono-tabular px-2 py-0.5 rounded bg-white/10 text-[#3DE0FF]">
              Absorbed Dose (mGy)
            </span>
          </div>
          <p className="text-xs text-[#A9B4CC]">
            Tracks absorbed ionizing dose (mGy). Absorbed dose (Gy) is never
            conflated with biological dose equivalent (Sv).
          </p>
          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-[#04060C]/60 border border-white/10">
              <div className="text-[11px] text-[#7C89A6]">
                Cumulative (MD-{selectedMissionDay})
              </div>
              <div className="text-xl font-display font-bold font-mono-tabular text-[#F2F6FF] mt-1">
                {radiationInfo.cumulativeMgy} mGy
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#04060C]/60 border border-white/10">
              <div className="text-[11px] text-[#7C89A6]">7-Day Rate</div>
              <div className="text-xl font-display font-bold font-mono-tabular text-[#3DE0FF] mt-1">
                {radiationInfo.rolling7DayRateMgy} mGy/d
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#04060C]/60 border border-white/10">
              <div className="text-[11px] text-[#7C89A6]">
                180-Day Projection
              </div>
              <div className="text-xl font-display font-bold font-mono-tabular text-[#FFB547] mt-1">
                {radiationInfo.projectedTotalMgy} mGy
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Spearman Rank Correlation Matrix (C-18) */}
      <div className="glass-panel rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-display font-bold text-[#F2F6FF] flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#2DD4BF]" />
              Non-Parametric Spearman Rank Correlation Matrix (ρ, C-18)
            </h2>
            <p className="text-xs text-[#A9B4CC]">
              Computed across paired non-null mission days (MD-1 to MD-
              {selectedMissionDay}) using tied-rank averaging.
            </p>
          </div>
          <div className="px-3 py-1 rounded-lg bg-amber-500/15 border border-amber-400/40 text-xs text-amber-200 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-[#FFB547]" />
            <span>Correlation ≠ causation — observational crew telemetry only</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono-tabular border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[#A9B4CC]">
                <th className="p-2 text-left">Metric</th>
                {CORRELATION_METRICS.map((m) => (
                  <th key={m} className="p-2 text-center">
                    {METRIC_DEFINITIONS[m].shortLabel}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {correlationMatrix.map((row) => (
                <tr key={row.metric}>
                  <td className="p-2 font-sans font-semibold text-[#F2F6FF]">
                    {METRIC_DEFINITIONS[row.metric].shortLabel}
                  </td>
                  {row.cells.map((cell) => {
                    const rho = cell.rho;
                    const abs = rho !== null ? Math.abs(rho) : 0;
                    const bg =
                      row.metric === cell.col
                        ? 'rgba(255,255,255,0.06)'
                        : rho !== null && rho > 0.4
                        ? `rgba(255, 92, 147, ${abs * 0.35})`
                        : rho !== null && rho < -0.4
                        ? `rgba(61, 224, 255, ${abs * 0.35})`
                        : 'transparent';

                    return (
                      <td
                        key={cell.col}
                        className="p-2 text-center text-[#F2F6FF]"
                        style={{ backgroundColor: bg }}
                        title={`n = ${cell.n} paired days`}
                      >
                        {rho !== null ? rho.toFixed(2) : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
