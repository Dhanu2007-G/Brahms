/**
 * AstraPulse — S3 System Drawer (/system/:id) with 6 Tabs, Trend Chart, Accessible Table & Amendment Flow
 * Team Zenitsu — NASA Space Apps Challenge 2026
 */

import {
  Activity,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Edit3,
  ExternalLink,
  HelpCircle,
  Radio,
  ShieldCheck,
  Table as TableIcon,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import {
  Area,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BODY_REGIONS,
  CARE_GUIDE_PROTOCOLS,
  MANDATORY_CARE_DISCLAIMER,
  METRIC_DEFINITIONS,
  NASA_HAZARDS,
} from '../analytics/ruleset';
import { BodyRegionId, MetricCode } from '../analytics/types';
import { useMission } from '../context/MissionContext';
import { PersistenceDots, ProvenanceBadge, StatusChip } from './StatusChip';

type DrawerTab = 'now' | 'trend' | 'why' | 'measure' | 'do_this' | 'escalate';

export const SystemDrawer: React.FC<{
  regionId: BodyRegionId | null;
  onClose: () => void;
}> = ({ regionId, onClose }) => {
  const {
    evaluations,
    observations,
    bodyRegions,
    selectedMissionDay,
    formatMetricValue,
    amendObservation,
    navigate,
    sendGroundMessage,
  } = useMission();

  const [activeTab, setActiveTab] = useState<DrawerTab>('now');
  const [selectedMetric, setSelectedMetric] = useState<MetricCode | null>(null);
  const [showDataTable, setShowDataTable] = useState<boolean>(false);
  const [amendingObsId, setAmendingObsId] = useState<string | null>(null);
  const [amendValue, setAmendValue] = useState<string>('');
  const [amendReason, setAmendReason] = useState<string>('');
  const [amendError, setAmendError] = useState<string | null>(null);
  const [escalateSent, setEscalateSent] = useState<boolean>(false);

  if (!regionId) return null;

  const regionDef = BODY_REGIONS[regionId];
  const regionStatus = bodyRegions.find((r) => r.id === regionId);
  if (!regionDef || !regionStatus) return null;

  const currentMetric: MetricCode =
    selectedMetric && regionDef.metrics.includes(selectedMetric)
      ? selectedMetric
      : regionDef.primaryMetric;

  const metricDef = METRIC_DEFINITIONS[currentMetric];
  const metricEval = evaluations[currentMetric];
  const protocol =
    CARE_GUIDE_PROTOCOLS[regionDef.checklistId] ||
    CARE_GUIDE_PROTOCOLS['PROTO-COMBINED'];

  // Build 14-day series up to selectedMissionDay for Trend tab
  const metricSeries = observations
    .filter(
      (o) =>
        o.metric === currentMetric &&
        o.missionDay <= selectedMissionDay &&
        o.missionDay >= Math.max(1, selectedMissionDay - 13)
    )
    .sort((a, b) => a.missionDay - b.missionDay)
    .map((o) => ({
      day: `MD-${o.missionDay}`,
      missionDay: o.missionDay,
      value: o.value,
      bandLow: metricEval.baseline.bandLow,
      bandHigh: metricEval.baseline.bandHigh,
      median: metricEval.baseline.median,
      obsId: o.id,
      source: o.source,
    }));

  const handleSaveAmendment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amendingObsId) return;
    setAmendError(null);
    const res = await amendObservation(
      amendingObsId,
      Number(amendValue),
      amendReason
    );
    if (!res.ok) {
      setAmendError(res.error || 'Could not amend observation.');
    } else {
      setAmendingObsId(null);
      setAmendValue('');
      setAmendReason('');
    }
  };

  const handleQuickEscalate = async () => {
    await sendGroundMessage({
      subject: `[${regionDef.shortLabel}] Crew System Review Request (MD-${selectedMissionDay})`,
      body: `Requesting asynchronous Flight Surgeon review for ${regionDef.label}. Primary metric ${metricDef.label}: ${metricEval.latestValue ?? 'Not recorded'} ${metricDef.unit} vs baseline median ${metricEval.baseline.median ?? '—'} ${metricDef.unit} (robust z = ${metricEval.robustZ?.toFixed(1) ?? '—'}, persistence ${metricEval.persistenceCount}/${metricEval.persistenceWindow}d).`,
      priority:
        regionStatus.tier === 'review_required' ? 'medical_review' : 'priority',
      includedMetrics: regionDef.metrics,
    });
    setEscalateSent(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={`${regionDef.label} System Drawer`}
    >
      <div className="w-full max-w-xl h-full bg-[#0A0F1C] border-l border-white/15 flex flex-col shadow-2xl overflow-hidden">
        {/* Drawer Header */}
        <div className="p-4 border-b border-white/10 flex items-start justify-between gap-3 bg-[#04060C]/60">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <StatusChip tier={regionStatus.tier} />
              <PersistenceDots
                count={metricEval.persistenceCount}
                windowSize={metricEval.persistenceWindow}
                tier={regionStatus.tier}
              />
              <ProvenanceBadge source={metricEval.latestSource} />
            </div>
            <h2 className="text-lg font-display font-bold text-[#F2F6FF] mt-2">
              {regionDef.label}
            </h2>
            <p className="text-xs text-[#A9B4CC] mt-0.5">
              {regionDef.functionSummary}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="touch-target p-2 rounded-lg glass-panel hover:bg-white/10 text-[#A9B4CC] hover:text-white cursor-pointer"
            aria-label="Close System Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metric Selector Pills inside this Body Region */}
        <div className="px-4 py-2.5 border-b border-white/10 flex items-center gap-2 overflow-x-auto bg-[#04060C]/30">
          {regionDef.metrics.map((mCode) => {
            const def = METRIC_DEFINITIONS[mCode];
            const ev = evaluations[mCode];
            const active = mCode === currentMetric;
            const fmt = formatMetricValue(mCode, ev?.latestValue);
            return (
              <button
                key={mCode}
                type="button"
                onClick={() => setSelectedMetric(mCode)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
                  active
                    ? 'bg-[#3DE0FF]/15 border-[#3DE0FF] text-[#F2F6FF]'
                    : 'bg-white/5 border-white/10 text-[#A9B4CC] hover:bg-white/10'
                }`}
              >
                <span>{def.shortLabel}</span>
                <span className="font-mono-tabular font-semibold text-[#F2F6FF]">
                  {fmt.formatted === 'Not recorded'
                    ? '—'
                    : `${fmt.formatted} ${fmt.unit}`}
                </span>
              </button>
            );
          })}
        </div>

        {/* 6 Canonical Tabs */}
        <div
          className="grid grid-cols-6 border-b border-white/10 bg-[#04060C]/40 text-xs font-medium"
          role="tablist"
        >
          {(
            [
              { id: 'now', label: 'Now' },
              { id: 'trend', label: 'Trend' },
              { id: 'why', label: 'Why it matters' },
              { id: 'measure', label: 'How to measure' },
              { id: 'do_this', label: 'Do this' },
              { id: 'escalate', label: 'Escalate' },
            ] as { id: DrawerTab; label: string }[]
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={activeTab === t.id}
              onClick={() => setActiveTab(t.id)}
              className={`py-2.5 px-1 text-center border-b-2 transition cursor-pointer truncate ${
                activeTab === t.id
                  ? 'border-[#3DE0FF] text-[#3DE0FF] font-semibold bg-white/5'
                  : 'border-transparent text-[#A9B4CC] hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'now' && (
            <>
              {/* Current vs Personal Baseline Card */}
              <div className="glass-panel rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-[#7C89A6] font-semibold">
                    {metricDef.label}
                  </span>
                  <ProvenanceBadge source={metricEval.latestSource} />
                </div>

                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div className="p-3 rounded-lg bg-[#04060C]/60 border border-white/10">
                    <div className="text-[11px] text-[#7C89A6]">Latest Reading</div>
                    <div className="text-xl font-display font-bold font-mono-tabular text-[#F2F6FF] mt-1">
                      {formatMetricValue(currentMetric, metricEval.latestValue).formatted}{' '}
                      <span className="text-xs font-normal text-[#A9B4CC]">
                        {formatMetricValue(currentMetric, metricEval.latestValue).unit}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#04060C]/60 border border-white/10">
                    <div className="text-[11px] text-[#7C89A6]">
                      14-Day Personal Median
                    </div>
                    <div className="text-xl font-display font-bold font-mono-tabular text-[#2DD4BF] mt-1">
                      {metricEval.baseline.median !== null
                        ? `${formatMetricValue(currentMetric, metricEval.baseline.median).formatted}`
                        : 'Building'}{' '}
                      <span className="text-xs font-normal text-[#A9B4CC]">
                        {formatMetricValue(currentMetric, metricEval.baseline.median).unit}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#04060C]/60 border border-white/10">
                    <div className="text-[11px] text-[#7C89A6]">Robust Z-Score</div>
                    <div className="text-xl font-display font-bold font-mono-tabular text-[#F2F6FF] mt-1">
                      {metricEval.robustZ !== null
                        ? `${metricEval.robustZ >= 0 ? '+' : ''}${metricEval.robustZ.toFixed(1)}σ`
                        : '—'}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-[#A9B4CC] leading-relaxed pt-1">
                  {metricEval.explanation}
                </p>

                {/* Append-Only Amendment Action */}
                {metricEval.latestObservationId && (
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[11px] font-mono-tabular text-[#7C89A6]">
                      Obs ID: {metricEval.latestObservationId}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAmendingObsId(metricEval.latestObservationId);
                        setAmendValue(String(metricEval.latestValue ?? ''));
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-[#3DE0FF] hover:underline cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Amend reading (append-only)
                    </button>
                  </div>
                )}
              </div>

              {/* Amend Form Modal if active */}
              {amendingObsId && (
                <form
                  onSubmit={handleSaveAmendment}
                  className="p-4 rounded-xl border border-[#3DE0FF]/40 bg-[#04060C]/90 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#3DE0FF]">
                      Append-Only Observation Amendment ({amendingObsId})
                    </span>
                    <button
                      type="button"
                      onClick={() => setAmendingObsId(null)}
                      className="text-xs text-[#A9B4CC]"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-[#A9B4CC] mb-1">
                        Corrected Value ({metricDef.unit})
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={amendValue}
                        onChange={(e) => setAmendValue(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/15 text-sm font-mono-tabular text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#A9B4CC] mb-1">
                        Audit Reason (Required)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Cuff repositioned on re-check"
                        value={amendReason}
                        onChange={(e) => setAmendReason(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/15 text-sm text-white"
                      />
                    </div>
                  </div>
                  {amendError && (
                    <p className="text-xs text-rose-400">{amendError}</p>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-[#3DE0FF] text-[#04060C] text-xs font-bold cursor-pointer"
                  >
                    Supersede & Record Amended Observation
                  </button>
                </form>
              )}

              {/* Possible Contributors Chips */}
              <div className="glass-panel rounded-xl p-4 space-y-2">
                <div className="text-xs uppercase tracking-wider text-[#7C89A6] font-semibold">
                  Possible Contributors (Non-Diagnostic)
                </div>
                <div className="flex flex-wrap gap-2">
                  {regionStatus.possibleContributors.map((item, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono-tabular text-[#F2F6FF]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'trend' && (
            <div className="glass-panel rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[#F2F6FF]">
                    14-Day Personal Baseline Band vs Daily Readings
                  </h3>
                  <p className="text-xs text-[#A9B4CC]">
                    Theil-Sen slope:{' '}
                    <span className="font-mono-tabular text-[#F2F6FF]">
                      {metricEval.slopePerDay !== null
                        ? `${metricEval.slopePerDay >= 0 ? '+' : ''}${metricEval.slopePerDay} ${metricDef.unit}/day (${metricEval.slopeDirection})`
                        : 'Insufficient points'}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDataTable((s) => !s)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-[#3DE0FF] hover:bg-white/10 cursor-pointer"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  {showDataTable ? 'Show Chart' : 'Show Data Table'}
                </button>
              </div>

              {!showDataTable ? (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={metricSeries}>
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
                          borderColor: 'rgba(255,255,255,0.15)',
                          borderRadius: '10px',
                          fontSize: '12px',
                        }}
                      />
                      {metricEval.baseline.bandHigh !== null && (
                        <ReferenceLine
                          y={metricEval.baseline.bandHigh}
                          stroke="#2DD4BF"
                          strokeDasharray="3 3"
                          strokeOpacity={0.5}
                        />
                      )}
                      {metricEval.baseline.median !== null && (
                        <ReferenceLine
                          y={metricEval.baseline.median}
                          stroke="#2DD4BF"
                          strokeOpacity={0.85}
                        />
                      )}
                      {metricEval.baseline.bandLow !== null && (
                        <ReferenceLine
                          y={metricEval.baseline.bandLow}
                          stroke="#2DD4BF"
                          strokeDasharray="3 3"
                          strokeOpacity={0.5}
                        />
                      )}
                      <Area
                        type="monotone"
                        dataKey="value"
                        fill="rgba(61, 224, 255, 0.12)"
                        stroke="none"
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#3DE0FF"
                        strokeWidth={2.4}
                        dot={{ r: 3.5, fill: '#3DE0FF' }}
                        connectNulls={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-60 border border-white/10 rounded-lg">
                  <table className="w-full text-left text-xs font-mono-tabular">
                    <thead className="bg-white/5 text-[#A9B4CC]">
                      <tr>
                        <th className="p-2">Mission Day</th>
                        <th className="p-2">Value ({metricDef.unit})</th>
                        <th className="p-2">Baseline Median</th>
                        <th className="p-2">Provenance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {metricSeries.map((row) => (
                        <tr key={row.obsId}>
                          <td className="p-2">{row.day}</td>
                          <td className="p-2 font-bold text-[#F2F6FF]">
                            {row.value ?? 'Not recorded'}
                          </td>
                          <td className="p-2 text-[#2DD4BF]">
                            {row.median ?? '—'}
                          </td>
                          <td className="p-2">{row.source}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'why' && (
            <div className="space-y-3">
              <div className="glass-panel rounded-xl p-4 space-y-2">
                <h3 className="text-sm font-semibold text-[#F2F6FF] flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#3DE0FF]" />
                  Why {metricDef.label} Matters in Spaceflight
                </h3>
                <p className="text-xs text-[#A9B4CC] leading-relaxed">
                  {metricDef.whyItMatters}
                </p>
              </div>

              <div className="glass-panel rounded-xl p-4 space-y-3">
                <div className="text-xs uppercase tracking-wider text-[#7C89A6] font-semibold">
                  Linked NASA Spaceflight Hazards
                </div>
                {regionDef.hazards.map((hzId) => {
                  const hz = NASA_HAZARDS[hzId];
                  return (
                    <div
                      key={hzId}
                      className="p-3 rounded-lg bg-[#04060C]/60 border border-white/10 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#F2F6FF]">
                          {hz.code} — {hz.name}
                        </span>
                        <a
                          href={hz.nasaReferenceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-[#3DE0FF] hover:underline"
                        >
                          NASA HRP <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <p className="text-xs text-[#A9B4CC]">
                        {hz.physiologicalMechanism}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'measure' && (
            <div className="glass-panel rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-[#F2F6FF] flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#2DD4BF]" />
                How to Perform {metricDef.label} Self-Check
              </h3>
              <ol className="space-y-2 text-xs text-[#A9B4CC] list-decimal list-inside">
                {metricDef.howToMeasure.map((step, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {step}
                  </li>
                ))}
              </ol>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/measure');
                  }}
                  className="px-4 py-2 rounded-lg bg-[#3DE0FF] text-[#04060C] text-xs font-bold cursor-pointer"
                >
                  Open Measure Lab for Guided Capture →
                </button>
              </div>
            </div>
          )}

          {activeTab === 'do_this' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-400/30 text-xs text-amber-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#FFB547]" />
                <span>{MANDATORY_CARE_DISCLAIMER}</span>
              </div>

              <div className="glass-panel rounded-xl p-4 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-[#2DD4BF]">
                  Tier 1 — Right Now (Self-Care & Countermeasures)
                </div>
                <ul className="space-y-1.5 text-xs text-[#F2F6FF]">
                  {protocol.tier1RightNow.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2DD4BF] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="glass-panel rounded-xl p-4 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-[#3DE0FF]">
                  Tier 1 — Today & This Week
                </div>
                <ul className="space-y-1.5 text-xs text-[#A9B4CC]">
                  {[...protocol.tier1Today, ...protocol.tier1ThisWeek].map(
                    (item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[#3DE0FF]">•</span>
                        <span>{item}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>

              <div className="glass-panel rounded-xl p-4 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-[#8B7CFF]">
                  Tier 2 — {protocol.tier2ChecklistTitle}
                </div>
                <ul className="space-y-1.5 text-xs text-[#A9B4CC]">
                  {protocol.tier2Steps.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#8B7CFF] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'escalate' && (
            <div className="space-y-3">
              <div className="glass-panel rounded-xl p-4 space-y-2 border-rose-400/30">
                <div className="text-xs font-bold uppercase tracking-wider text-[#FF5C93]">
                  Tier 3 — Watch For & When to Escalate to Ground
                </div>
                <ul className="space-y-1.5 text-xs text-[#F2F6FF]">
                  {protocol.tier3WatchFor.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#FF5C93] font-bold">◆</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-[#A9B4CC] pt-2 border-t border-white/10">
                  {protocol.tier3EscalateWhen.join(' ')}
                </p>
              </div>

              <div className="glass-panel rounded-xl p-4 space-y-3">
                <div className="text-xs font-semibold text-[#F2F6FF]">
                  Store-and-Forward Ground Link Packet
                </div>
                <p className="text-xs text-[#A9B4CC]">
                  Bundles your 14-day baseline medians, latest readings, and
                  evidence observation IDs ({metricEval.evidenceObservationIds.join(', ') || 'none'}) for asynchronous Flight Surgeon review.
                </p>
                {escalateSent ? (
                  <div className="p-3 rounded-lg bg-teal-500/15 border border-teal-400/40 text-xs text-[#2DD4BF]">
                    ✓ Priority Ground Link packet queued to Houston Flight Surgeon Console.
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleQuickEscalate}
                      className="px-4 py-2 rounded-lg bg-[#FF5C93] text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
                    >
                      <Radio className="w-4 h-4" />
                      Queue Escalation Packet to Ground Link
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        navigate('/link');
                      }}
                      className="px-3 py-2 rounded-lg glass-panel text-xs text-[#A9B4CC] hover:text-white cursor-pointer"
                    >
                      Open Ground Link Composer
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
