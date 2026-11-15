/**
 * AstraPulse — S7 Alert Center & 3-Tier Care Guide (/alerts)
 * Team Zenitsu — NASA Space Apps Challenge 2026
 */

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  HeartPulse,
  MessageSquare,
  Radio,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import React, { useState } from 'react';
import {
  CARE_GUIDE_PROTOCOLS,
  MANDATORY_CARE_DISCLAIMER,
  METRIC_DEFINITIONS,
} from '../analytics/ruleset';
import { AlertItem, MetricCode } from '../analytics/types';
import {
  PersistenceDots,
  ProvenanceBadge,
  StatusChip,
} from '../components/StatusChip';
import { useMission } from '../context/MissionContext';

export const AlertCenterScreen: React.FC = () => {
  const {
    alerts,
    activeCrew,
    reviewAlert,
    snoozeAlert,
    commentOnAlert,
    sendGroundMessage,
    navigate,
  } = useMission();

  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'reviewed'>(
    'all'
  );
  const [reviewReasons, setReviewReasons] = useState<
    Record<
      string,
      'addressed' | 'expected_context' | 'recheck_scheduled' | 'escalated_to_ground'
    >
  >({});
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [actionBanner, setActionBanner] = useState<string | null>(null);

  const visibleAlerts = alerts.filter((a) => {
    if (filterStatus === 'open') return a.status === 'open';
    if (filterStatus === 'reviewed') return a.status !== 'open';
    return true;
  });

  const handleReview = async (alert: AlertItem) => {
    const reason = reviewReasons[alert.id] || 'addressed';
    const note = reviewNotes[alert.id] || '';
    await reviewAlert(alert.id, reason, note);
    setActionBanner(
      `Alert ${alert.id} marked as ${
        reason === 'escalated_to_ground' ? 'escalated' : 'reviewed'
      } (${reason}).`
    );
  };

  const handleSnooze = async (alert: AlertItem, hours: 4 | 12 | 24) => {
    const res = await snoozeAlert(alert.id, hours);
    if (!res.ok) {
      setActionBanner(res.error || 'Snooze limit reached.');
    } else {
      setActionBanner(`Snoozed ${alert.id} for ${hours} hours.`);
    }
  };

  const handleEscalatePacket = async (alert: AlertItem) => {
    await sendGroundMessage({
      subject: `[ALERT ESCALATION] ${alert.title} (${alert.ruleId})`,
      body: `${alert.explanation}\nEvidence Observation IDs: ${alert.evidenceObservationIds.join(', ')}`,
      priority: 'medical_review',
      linkedAlertId: alert.id,
      includedMetrics: alert.metricsInvolved,
    });
    await reviewAlert(
      alert.id,
      'escalated_to_ground',
      'Escalated via Store-and-Forward Ground Link packet'
    );
    setActionBanner(
      `Queued Medical Review packet to Ground Link for ${alert.id}.`
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header & Tier Legend */}
      <div className="glass-panel rounded-2xl p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs font-mono-tabular uppercase tracking-wider text-[#3DE0FF] font-bold">
              EXPLAINABLE ALERT CENTER & 3-TIER CARE GUIDE
            </span>
            <h1 className="text-xl font-display font-bold text-[#F2F6FF]">
              Deterministic Baseline Shift Triage ({activeCrew.name})
            </h1>
          </div>

          <div className="inline-flex rounded-xl bg-white/5 p-1 border border-white/10 text-xs">
            {(
              [
                { id: 'all', label: `All (${alerts.length})` },
                {
                  id: 'open',
                  label: `Open (${alerts.filter((a) => a.status === 'open').length})`,
                },
                {
                  id: 'reviewed',
                  label: `Reviewed/Snoozed (${
                    alerts.filter((a) => a.status !== 'open').length
                  })`,
                },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterStatus(f.id)}
                className={`px-3 py-1 rounded-lg font-medium cursor-pointer ${
                  filterStatus === f.id
                    ? 'bg-[#3DE0FF] text-[#04060C] font-bold'
                    : 'text-[#A9B4CC]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-400/35 text-xs text-amber-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#FFB547] shrink-0" />
          <span>{MANDATORY_CARE_DISCLAIMER}</span>
        </div>
      </div>

      {actionBanner && (
        <div className="p-3 rounded-xl bg-teal-500/15 border border-teal-400/40 text-xs text-[#2DD4BF] flex items-center justify-between">
          <span>{actionBanner}</span>
          <button
            type="button"
            onClick={() => setActionBanner(null)}
            className="text-white underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {visibleAlerts.length === 0 ? (
        <div className="glass-panel rounded-2xl p-8 text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-[#2DD4BF] mx-auto" />
          <div className="text-base font-display font-bold text-[#F2F6FF]">
            ● All Systems Within Personal Baseline Band
          </div>
          <p className="text-xs text-[#A9B4CC] max-w-md mx-auto">
            No active watch or review alerts for {activeCrew.name}. Switch to{' '}
            <code className="text-[#3DE0FF]">ASTRA-002</code>,{' '}
            <code className="text-[#3DE0FF]">ASTRA-003</code>, or{' '}
            <code className="text-[#3DE0FF]">ASTRA-004</code> in the top bar to
            inspect multi-domain, activity, or wellness alert scenarios.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleAlerts.map((alert) => {
            const protocol =
              CARE_GUIDE_PROTOCOLS[alert.protocolId] ||
              CARE_GUIDE_PROTOCOLS['PROTO-COMBINED'];

            return (
              <div
                key={alert.id}
                className="glass-panel rounded-2xl p-5 space-y-4 border border-white/15"
              >
                {/* Top Metadata Strip */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusChip tier={alert.severity} />
                    <PersistenceDots
                      count={alert.persistenceCount}
                      windowSize={4}
                      tier={alert.severity}
                    />
                    <ProvenanceBadge source={alert.source} />
                    <span className="px-2 py-0.5 rounded bg-white/10 font-mono-tabular text-[11px] text-[#3DE0FF]">
                      Rule: {alert.ruleId} (v{alert.rulesetVersion})
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white/5 font-mono-tabular text-[11px] text-[#A9B4CC] uppercase">
                      Status: {alert.status}
                    </span>
                  </div>
                  <span className="text-xs font-mono-tabular text-[#7C89A6]">
                    ID: {alert.id}
                  </span>
                </div>

                {/* Title & Deterministic Explanation */}
                <div>
                  <h2 className="text-lg font-display font-bold text-[#F2F6FF]">
                    {alert.title}
                  </h2>
                  <p className="text-xs text-[#A9B4CC] mt-1 leading-relaxed">
                    {alert.explanation}
                  </p>
                </div>

                {/* Baseline vs Latest Comparison Table */}
                <div className="overflow-x-auto border border-white/10 rounded-xl">
                  <table className="w-full text-left text-xs font-mono-tabular">
                    <thead className="bg-white/5 text-[#A9B4CC]">
                      <tr>
                        <th className="p-2.5">Metric</th>
                        <th className="p-2.5">14-Day Personal Median</th>
                        <th className="p-2.5">Latest Reading</th>
                        <th className="p-2.5">Robust Z-Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {alert.metricsInvolved.map((mCode: MetricCode) => {
                        const def = METRIC_DEFINITIONS[mCode];
                        const latest = alert.latestValues[mCode];
                        const base = alert.baselineMedians[mCode];
                        const z = alert.deviations[mCode];
                        return (
                          <tr key={mCode}>
                            <td className="p-2.5 font-sans font-semibold text-[#F2F6FF]">
                              {def.label}
                            </td>
                            <td className="p-2.5 text-[#2DD4BF]">
                              {base !== null && base !== undefined
                                ? `${base} ${def.unit}`
                                : '—'}
                            </td>
                            <td className="p-2.5 font-bold text-[#F2F6FF]">
                              {latest !== null && latest !== undefined
                                ? `${latest} ${def.unit}`
                                : 'Not recorded'}
                            </td>
                            <td className="p-2.5 text-[#FF5C93]">
                              {z !== null && z !== undefined
                                ? `${z >= 0 ? '+' : ''}${z.toFixed(1)}σ`
                                : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Evidence Observation IDs */}
                <div className="text-[11px] font-mono-tabular text-[#7C89A6]">
                  Contributing Evidence Observation IDs:{' '}
                  <span className="text-[#A9B4CC]">
                    {alert.evidenceObservationIds.join(', ')}
                  </span>
                </div>

                {/* 3-Tier Care Guide */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#04060C]/70 border border-teal-400/30 space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#2DD4BF]">
                      Tier 1 — Right Now & Today (Self-Care)
                    </div>
                    <ul className="space-y-1 text-xs text-[#F2F6FF] list-disc list-inside">
                      {[...protocol.tier1RightNow, ...protocol.tier1Today].map(
                        (s, i) => (
                          <li key={i}>{s}</li>
                        )
                      )}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#04060C]/70 border border-indigo-400/30 space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#8B7CFF]">
                      Tier 2 — {protocol.tier2ChecklistTitle}
                    </div>
                    <ul className="space-y-1 text-xs text-[#A9B4CC] list-disc list-inside">
                      {protocol.tier2Steps.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#04060C]/70 border border-rose-400/30 space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#FF5C93]">
                      Tier 3 — Watch For & Ground Escalation
                    </div>
                    <ul className="space-y-1 text-xs text-[#F2F6FF] list-disc list-inside">
                      {protocol.tier3WatchFor.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                    <p className="text-[11px] text-[#A9B4CC] pt-1">
                      {protocol.tier3EscalateWhen.join(' ')}
                    </p>
                  </div>
                </div>

                {/* Action Bar: Structured Review, Snooze (4h/12h/24h), Re-measure, Escalate */}
                <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={reviewReasons[alert.id] || 'addressed'}
                      onChange={(e) =>
                        setReviewReasons((prev) => ({
                          ...prev,
                          [alert.id]: e.target.value as
                            | 'addressed'
                            | 'expected_context'
                            | 'recheck_scheduled'
                            | 'escalated_to_ground',
                        }))
                      }
                      aria-label="Structured Review Reason"
                      className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/15 text-xs text-white"
                    >
                      <option value="addressed" className="bg-[#0A0F1C]">
                        Reason: Countermeasure addressed
                      </option>
                      <option value="expected_context" className="bg-[#0A0F1C]">
                        Reason: Expected operational context
                      </option>
                      <option
                        value="recheck_scheduled"
                        className="bg-[#0A0F1C]"
                      >
                        Reason: Confirmatory re-check scheduled
                      </option>
                      <option
                        value="escalated_to_ground"
                        className="bg-[#0A0F1C]"
                      >
                        Reason: Escalated to Flight Surgeon
                      </option>
                    </select>

                    <input
                      type="text"
                      placeholder="Optional review note…"
                      value={reviewNotes[alert.id] || ''}
                      onChange={(e) =>
                        setReviewNotes((prev) => ({
                          ...prev,
                          [alert.id]: e.target.value,
                        }))
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/15 text-xs text-white"
                    />

                    <button
                      type="button"
                      onClick={() => handleReview(alert)}
                      className="px-3 py-1.5 rounded-lg bg-[#2DD4BF] text-[#04060C] text-xs font-bold cursor-pointer"
                    >
                      Mark Reviewed
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-[#7C89A6]">
                      Snooze ({alert.snoozeCount}/2):
                    </span>
                    {([4, 12, 24] as const).map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => handleSnooze(alert, h)}
                        className="px-2 py-1 rounded-lg glass-panel hover:bg-white/10 text-xs font-mono-tabular text-[#A9B4CC] cursor-pointer"
                      >
                        {h}h
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => navigate('/measure')}
                      className="px-3 py-1.5 rounded-lg glass-panel text-xs text-[#3DE0FF] flex items-center gap-1 cursor-pointer"
                    >
                      <HeartPulse className="w-3.5 h-3.5" /> Re-Measure
                    </button>

                    <button
                      type="button"
                      onClick={() => handleEscalatePacket(alert)}
                      className="px-3 py-1.5 rounded-lg bg-[#FF5C93] text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Radio className="w-3.5 h-3.5" /> Escalate to Ground
                    </button>
                  </div>
                </div>

                {/* Alert Comments Thread */}
                <div className="pt-2 border-t border-white/10 space-y-2">
                  {alert.comments.map((c) => (
                    <div
                      key={c.id}
                      className="p-2.5 rounded-lg bg-white/5 text-xs flex items-start justify-between"
                    >
                      <div>
                        <span className="font-bold text-[#3DE0FF]">
                          {c.authorName} ({c.authorRole}):
                        </span>{' '}
                        <span className="text-[#F2F6FF]">{c.body}</span>
                      </div>
                      <span className="text-[10px] font-mono-tabular text-[#7C89A6]">
                        {c.createdAt.slice(11, 16)} UTC
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Add crew or specialist note to this alert…"
                      value={commentDrafts[alert.id] || ''}
                      onChange={(e) =>
                        setCommentDrafts((prev) => ({
                          ...prev,
                          [alert.id]: e.target.value,
                        }))
                      }
                      className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const txt = commentDrafts[alert.id] || '';
                        if (txt.trim()) {
                          commentOnAlert(alert.id, txt);
                          setCommentDrafts((prev) => ({
                            ...prev,
                            [alert.id]: '',
                          }));
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg glass-panel text-xs text-[#3DE0FF] cursor-pointer"
                    >
                      Post Note
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
