/**
 * AstraPulse — S11 Quests & Star Constellation (/quests) + S12 Reports, NASA Evidence & Dataset Registry (/reports)
 * Team Zenitsu — NASA Space Apps Challenge 2026
 */

import { jsPDF } from 'jspdf';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Database,
  Download,
  ExternalLink,
  EyeOff,
  FileSpreadsheet,
  FileText,
  Radio,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { computeXpAndLevel } from '../analytics/engine';
import {
  MANDATORY_SIMULATED_DISCLOSURE,
  METRIC_DEFINITIONS,
  NASA_DATASET_REGISTRY,
  NASA_HAZARDS,
  RULESET_VERSION,
} from '../analytics/ruleset';
import { HazardId, MetricCode } from '../analytics/types';
import { useMission } from '../context/MissionContext';

export const QuestsScreen: React.FC = () => {
  const {
    activeCrew,
    quests,
    completeQuest,
    accessibility,
    updateAccessibility,
    navigate,
  } = useMission();

  const xpInfo = computeXpAndLevel(activeCrew.xp, 60);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header & Ethical Gamification Guardrail */}
      <div className="glass-panel rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-xs font-mono-tabular uppercase tracking-wider text-[#2DD4BF] font-bold">
            ETHICAL HABIT & COUNTERMEASURE CONSTELLATION (C-19)
          </span>
          <h1 className="text-xl font-display font-bold text-[#F2F6FF]">
            Mission Quests, Streak Grace Shield & Star Map ({activeCrew.name})
          </h1>
        </div>

        <button
          type="button"
          onClick={() => {
            updateAccessibility({ hideGamification: true });
            navigate('/');
          }}
          className="px-3.5 py-2 rounded-xl glass-panel hover:bg-white/10 text-xs text-[#A9B4CC] flex items-center gap-1.5 cursor-pointer"
        >
          <EyeOff className="w-3.5 h-3.5" />
          <span>Hide Gamification (Opt-Out)</span>
        </button>
      </div>

      {/* Top Stats: Level, Streak + Grace Shield, Daily XP Cap */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl p-4 space-y-2">
          <div className="text-xs text-[#7C89A6]">Crew Readiness Level</div>
          <div className="text-2xl font-display font-bold font-mono-tabular text-[#3DE0FF]">
            Level {xpInfo.level} ({activeCrew.xp} XP)
          </div>
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-[#3DE0FF]"
              style={{ width: `${xpInfo.progressPct}%` }}
            />
          </div>
          <div className="text-[11px] font-mono-tabular text-[#A9B4CC]">
            {xpInfo.currentLevelXp} / {xpInfo.nextLevelXp} XP to Level{' '}
            {xpInfo.level + 1} • Daily Cap: 100 XP
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 space-y-2">
          <div className="text-xs text-[#7C89A6]">
            Pulse Ritual Streak & Grace Shield
          </div>
          <div className="text-2xl font-display font-bold font-mono-tabular text-[#2DD4BF]">
            {activeCrew.streakDays} Mission Days
          </div>
          <div className="text-[11px] text-[#A9B4CC]">
            Grace Days Used This Rolling 7-Day Window:{' '}
            <span className="font-mono-tabular text-white font-bold">
              {activeCrew.graceDaysUsedThisWeek}/1
            </span>
          </div>
          <div className="text-[10px] text-[#2DD4BF]">
            ✓ Ethical Guardrail: Resting or reporting symptoms never breaks your
            streak.
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 space-y-2">
          <div className="text-xs text-[#7C89A6] flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#8B7CFF]" /> Cooperative ARES-01
            Crew Challenge
          </div>
          <div className="text-base font-display font-bold text-[#F2F6FF]">
            92% Collective ARED & Hydration Target
          </div>
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-[#8B7CFF]" style={{ width: '92%' }} />
          </div>
          <div className="text-[11px] text-[#A9B4CC]">
            4/4 crew members active • Non-competitive team support
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive SVG Star Constellation (5 cols) + Quest Cards (7 cols) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
        <div className="md:col-span-5 glass-panel rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-display font-bold text-[#F2F6FF] flex items-center gap-2">
              <Star className="w-4 h-4 text-[#FFB547]" />
              Habit Constellation Map
            </h2>
            <p className="text-xs text-[#A9B4CC] mt-0.5">
              Each completed countermeasure illuminates a node in your mission
              constellation.
            </p>
          </div>

          <svg
            viewBox="0 0 320 200"
            className="w-full h-52 my-auto bg-[#04060C]/80 rounded-xl border border-white/10"
            role="img"
            aria-label="Interactive Habit Star Constellation"
          >
            {/* Constellation connecting lines */}
            {quests.map((q, idx) => {
              const next = quests[idx + 1];
              if (!next) return null;
              return (
                <line
                  key={`${q.id}-${next.id}`}
                  x1={q.constellationX}
                  y1={q.constellationY}
                  x2={next.constellationX}
                  y2={next.constellationY}
                  stroke={
                    q.completedToday && next.completedToday
                      ? '#3DE0FF'
                      : 'rgba(255,255,255,0.18)'
                  }
                  strokeWidth="1.8"
                  strokeDasharray={
                    q.completedToday && next.completedToday ? undefined : '4 4'
                  }
                />
              );
            })}

            {quests.map((q) => (
              <g key={q.id}>
                <circle
                  cx={q.constellationX}
                  cy={q.constellationY}
                  r={q.completedToday ? 9 : 6}
                  fill={q.completedToday ? '#2DD4BF' : '#0A0F1C'}
                  stroke={q.completedToday ? '#3DE0FF' : '#7C89A6'}
                  strokeWidth="2"
                />
                <text
                  x={q.constellationX}
                  y={q.constellationY + 18}
                  textAnchor="middle"
                  className="fill-[#A9B4CC] text-[9px] font-mono-tabular"
                >
                  {q.code.slice(0, 10)}
                </text>
              </g>
            ))}
          </svg>

          <div className="text-[11px] text-[#7C89A6] font-mono-tabular">
            Illuminated Stars: {quests.filter((q) => q.completedToday).length}/
            {quests.length}
          </div>
        </div>

        <div className="md:col-span-7 glass-panel rounded-2xl p-4 space-y-3">
          <h2 className="text-sm font-display font-bold text-[#F2F6FF]">
            Daily & Weekly Countermeasure Quests
          </h2>
          <div className="space-y-2.5">
            {quests.map((q) => (
              <div
                key={q.id}
                className="p-3.5 rounded-xl bg-[#04060C]/70 border border-white/10 flex items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#F2F6FF]">
                      {q.title}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white/10 font-mono-tabular text-[10px] text-[#3DE0FF]">
                      +{q.xpReward} XP • {q.cadence.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-[#A9B4CC]">{q.description}</p>
                </div>

                {q.completedToday ? (
                  <span className="px-3 py-1.5 rounded-lg bg-teal-500/20 border border-teal-400/40 text-xs font-bold text-[#2DD4BF] shrink-0">
                    ✓ Illuminated
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => completeQuest(q.id)}
                    className="px-3 py-1.5 rounded-lg bg-[#3DE0FF] text-[#04060C] text-xs font-bold shrink-0 cursor-pointer"
                  >
                    Complete Quest
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ReportsScreen: React.FC = () => {
  const {
    activeCrew,
    observations,
    evaluations,
    alerts,
    selectedMissionDay,
    sendGroundMessage,
  } = useMission();

  const [includeVitals, setIncludeVitals] = useState<boolean>(true);
  const [includeAlerts, setIncludeAlerts] = useState<boolean>(true);
  const [includePrivateJournal, setIncludePrivateJournal] =
    useState<boolean>(false); // Strictly OFF by default per Directive 9!
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  // Provenance breakdown counts
  const provenanceCounts = useMemo(() => {
    const counts: Record<string, number> = {
      simulated: 0,
      user_entered: 0,
      imported: 0,
      derived: 0,
      reference: 0,
    };
    for (const o of observations) {
      counts[o.source] = (counts[o.source] || 0) + 1;
    }
    return counts;
  }, [observations]);

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(15);
    doc.text(
      `AstraPulse Mission Health Summary — ${activeCrew.name} (${activeCrew.id})`,
      14,
      18
    );
    doc.setFontSize(9);
    doc.text(`Mandatory Disclosure: ${MANDATORY_SIMULATED_DISCLOSURE}`, 14, 25);
    doc.text(
      `Mission: ${activeCrew.missionName} | Day: MD-${selectedMissionDay} | Ruleset: ${RULESET_VERSION} | Team Zenitsu`,
      14,
      31
    );

    let y = 42;
    if (includeVitals) {
      doc.setFontSize(11);
      doc.text('14-Day Personal Baseline vs Latest Telemetry', 14, y);
      y += 7;
      doc.setFontSize(9);
      const keys: MetricCode[] = [
        'heart_rate',
        'systolic_bp',
        'diastolic_bp',
        'sleep_duration_h',
        'blood_glucose',
        'spo2_pct',
        'cabin_co2_ppm',
      ];
      for (const k of keys) {
        const ev = evaluations[k];
        const def = METRIC_DEFINITIONS[k];
        doc.text(
          `${def.label}: Latest ${ev.latestValue ?? 'Not recorded'} ${def.unit} | 14d Median ${ev.baseline.median ?? '—'} ${def.unit} | Tier: ${ev.tier}`,
          14,
          y
        );
        y += 6;
      }
    }

    if (includeAlerts) {
      y += 4;
      doc.setFontSize(11);
      doc.text(`Active Alerts (${alerts.length})`, 14, y);
      y += 7;
      doc.setFontSize(9);
      for (const a of alerts.slice(0, 5)) {
        doc.text(
          `[${a.severity.toUpperCase()}] ${a.ruleId}: ${a.title} (Persistence ${a.persistenceCount}/4d)`,
          14,
          y
        );
        y += 6;
      }
    }

    doc.save(`AstraPulse_${activeCrew.id}_MD${selectedMissionDay}.pdf`);
    setExportStatus(
      `Generated PDF report (AstraPulse_${activeCrew.id}_MD${selectedMissionDay}.pdf).`
    );
  };

  const handleDownloadCsv = () => {
    const header =
      'observation_id,crew_id,mission_day,observed_at,metric,value,unit,glucose_context,provenance\n';
    const rows = observations
      .map(
        (o) =>
          `${o.id},${o.crewId},${o.missionDay},${o.observedAt},${o.metric},${
            o.value ?? ''
          },${o.unit},${o.glucoseContext ?? ''},${o.source}`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AstraPulse_Observations_${activeCrew.id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setExportStatus(
      `Exported ${observations.length} observations to CSV with full provenance tags.`
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Report Builder & Export Card */}
      <div className="glass-panel rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs font-mono-tabular uppercase tracking-wider text-[#3DE0FF] font-bold">
              REPORTS, PROVENANCE & NASA EVIDENCE REGISTRY
            </span>
            <h1 className="text-xl font-display font-bold text-[#F2F6FF]">
              Clinical Handover Export (PDF / CSV) & Evidence Library
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-4 py-2 rounded-xl bg-[#3DE0FF] text-[#04060C] text-xs font-display font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" /> Download PDF Report
            </button>
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="px-4 py-2 rounded-xl bg-[#2DD4BF] text-[#04060C] text-xs font-display font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" /> Export Observations CSV
            </button>
            <button
              type="button"
              onClick={async () => {
                await sendGroundMessage({
                  subject: `MD-${selectedMissionDay} Exported Mission Health Report (${activeCrew.id})`,
                  body: `Queued structured PDF/CSV telemetry summary for ${activeCrew.name}. Private journal entries included: ${includePrivateJournal ? 'Yes (Crew-authorized)' : 'No (Excluded by default)'}.`,
                  priority: 'routine',
                });
                setExportStatus(
                  'Queued Mission Health Report to Store-and-Forward Ground Link.'
                );
              }}
              className="px-4 py-2 rounded-xl glass-panel text-xs font-semibold text-[#F2F6FF] flex items-center gap-1.5 cursor-pointer"
            >
              <Radio className="w-4 h-4 text-[#A3E635]" /> Queue to Ground
            </button>
          </div>
        </div>

        {/* Section Toggles (Private Journal OFF by default) */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-white/10 text-xs">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeVitals}
              onChange={(e) => setIncludeVitals(e.target.checked)}
            />
            <span>Include 14-Day Baselines & Vitals</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeAlerts}
              onChange={(e) => setIncludeAlerts(e.target.checked)}
            />
            <span>Include Alert Audit & Evidence IDs</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-amber-300">
            <input
              type="checkbox"
              checked={includePrivateJournal}
              onChange={(e) => setIncludePrivateJournal(e.target.checked)}
            />
            <span>
              Include Private Journal Reflections (Strictly OFF by default)
            </span>
          </label>
        </div>

        {exportStatus && (
          <div className="p-3 rounded-xl bg-teal-500/15 border border-teal-400/40 text-xs text-[#2DD4BF]">
            {exportStatus}
          </div>
        )}
      </div>

      {/* Data Provenance Breakdown & AI / Architecture Disclosure */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-6 glass-panel rounded-2xl p-5 space-y-3">
          <h2 className="text-base font-display font-bold text-[#F2F6FF]">
            Observation Provenance Breakdown ({observations.length} records)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
            {Object.entries(provenanceCounts).map(([src, cnt]) => (
              <div
                key={src}
                className="p-3 rounded-xl bg-[#04060C]/70 border border-white/10"
              >
                <div className="text-[10px] font-mono-tabular uppercase text-[#7C89A6]">
                  {src}
                </div>
                <div className="text-lg font-display font-bold font-mono-tabular text-[#F2F6FF] mt-0.5">
                  {cnt}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-6 glass-panel rounded-2xl p-5 space-y-2">
          <h2 className="text-base font-display font-bold text-[#F2F6FF] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#2DD4BF]" />
            Deterministic Analytics & AI Disclosure
          </h2>
          <p className="text-xs text-[#A9B4CC] leading-relaxed">
            100% of AstraPulse’s baselines, robust z-scores, Theil-Sen slopes,
            alert triggers, and Care Guide recommendations are computed by the
            deterministic, auditable ruleset (<code className="text-[#3DE0FF]">v1.0.0-demo</code>).
            No generative AI or opaque black-box model is ever used to evaluate
            health status, generate alerts, or suggest countermeasures.
          </p>
        </div>
      </div>

      {/* NASA Dataset Registry with Honest Limitations */}
      <div className="glass-panel rounded-2xl p-5 space-y-3">
        <h2 className="text-base font-display font-bold text-[#F2F6FF] flex items-center gap-2">
          <Database className="w-4 h-4 text-[#3DE0FF]" />
          NASA Open Science & Human Research Program Dataset Registry
        </h2>
        <div className="overflow-x-auto border border-white/10 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 text-[#A9B4CC]">
              <tr>
                <th className="p-3">Dataset / Standard</th>
                <th className="p-3">Access Level</th>
                <th className="p-3">How Used in AstraPulse</th>
                <th className="p-3">What It Cannot Prove (Honest Scope)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {NASA_DATASET_REGISTRY.map((ds) => (
                <tr key={ds.id}>
                  <td className="p-3 font-semibold text-[#F2F6FF]">
                    <div>{ds.name}</div>
                    <a
                      href={ds.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-[#3DE0FF] hover:underline mt-0.5"
                    >
                      Source ({ds.accessedDate}){' '}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="p-3 font-mono-tabular text-[#2DD4BF]">
                    {ds.accessType}
                  </td>
                  <td className="p-3 text-[#A9B4CC]">{ds.usageInAstraPulse}</td>
                  <td className="p-3 text-amber-200/90">
                    {ds.whatItCannotProve}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5 NASA Spaceflight Hazards Evidence Library */}
      <div className="glass-panel rounded-2xl p-5 space-y-3">
        <h2 className="text-base font-display font-bold text-[#F2F6FF] flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#8B7CFF]" />
          NASA Human Research Program — 5 Hazards Evidence Library
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(Object.keys(NASA_HAZARDS) as HazardId[]).map((hId) => {
            const h = NASA_HAZARDS[hId];
            return (
              <div
                key={h.id}
                className="p-4 rounded-xl bg-[#04060C]/70 border border-white/10 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#F2F6FF]">
                    {h.code} — {h.name}
                  </span>
                  <a
                    href={h.nasaReferenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-[#3DE0FF] hover:underline"
                  >
                    NASA HRP <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-xs text-[#A9B4CC]">
                  {h.physiologicalMechanism}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
