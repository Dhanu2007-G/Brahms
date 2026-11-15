/**
 * AstraPulse — S9 Ground Link (/link): Light-Time Signal Pulse, Store-and-Forward Packet Composer & Blackout Planner
 * Team Zenitsu — NASA Space Apps Challenge 2026
 */

import {
  CheckCircle2,
  Clock,
  Globe,
  Radio,
  Rocket,
  Send,
  ShieldAlert,
  WifiOff,
} from 'lucide-react';
import React, { useState } from 'react';
import { computePacketTransferSec } from '../analytics/engine';
import { ENVIRONMENT_MODES } from '../analytics/ruleset';
import { GroundMessage, MetricCode } from '../analytics/types';
import { useMission } from '../context/MissionContext';

export const GroundLinkScreen: React.FC = () => {
  const {
    activeCrew,
    environmentMode,
    messages,
    sendGroundMessage,
    solarBlackoutMode,
    setSolarBlackoutMode,
    offlineSimMode,
    flushOfflineQueue,
    syncQueue,
  } = useMission();

  const envProfile = ENVIRONMENT_MODES[environmentMode];
  const [subject, setSubject] = useState<string>(
    `MD-24 Crew Telemetry & Baseline Summary (${activeCrew.id})`
  );
  const [body, setBody] = useState<string>(
    'Transmitting 14-day personal baseline band summary, latest vitals, and countermeasure adherence log for asynchronous Flight Surgeon review.'
  );
  const [priority, setPriority] =
    useState<GroundMessage['priority']>('routine');
  const [payloadSizeKb, setPayloadSizeKb] = useState<number>(64);
  const [uplinkKbps, setUplinkKbps] = useState<number>(64);

  const transferCalc = computePacketTransferSec(
    envProfile.typicalDistanceKm,
    payloadSizeKb,
    uplinkKbps
  );

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    await sendGroundMessage({
      subject,
      body,
      priority,
      attachmentSizeKb: payloadSizeKb,
      includedMetrics: [
        'heart_rate',
        'systolic_bp',
        'sleep_duration_h',
        'cabin_co2_ppm',
      ] as MetricCode[],
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Animated Earth <-> Spacecraft Signal Propagation Banner (C-16, C-17) */}
      <div className="glass-panel rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs font-mono-tabular uppercase tracking-wider text-[#A3E635] font-bold">
              DEEP SPACE NETWORK • STORE-AND-FORWARD GROUND LINK
            </span>
            <h1 className="text-xl font-display font-bold text-[#F2F6FF]">
              Asynchronous Flight Surgeon Telemetry Link ({envProfile.name})
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setSolarBlackoutMode(!solarBlackoutMode)}
            className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition ${
              solarBlackoutMode
                ? 'bg-amber-500/20 border-amber-400 text-[#FFB547]'
                : 'bg-white/5 border-white/15 text-[#A9B4CC] hover:text-white'
            }`}
          >
            <WifiOff className="w-4 h-4" />
            <span>
              {solarBlackoutMode
                ? 'Solar Conjunction Blackout: ACTIVE'
                : 'Simulate Solar Conjunction Blackout'}
            </span>
          </button>
        </div>

        {/* SVG Signal Propagation Visualizer */}
        <div className="p-4 rounded-xl bg-[#04060C]/80 border border-white/10">
          <svg
            viewBox="0 0 680 95"
            className="w-full h-24"
            role="img"
            aria-label={`Signal propagation across ${envProfile.typicalDistanceKm.toLocaleString()} km with ${transferCalc.propagationSec} seconds one-way light-time delay`}
          >
            {/* Earth Node */}
            <circle
              cx="60"
              cy="48"
              r="24"
              fill="rgba(61,224,255,0.15)"
              stroke="#3DE0FF"
              strokeWidth="2"
            />
            <text
              x="60"
              y="52"
              textAnchor="middle"
              className="fill-[#F2F6FF] text-[10px] font-bold"
            >
              EARTH
            </text>

            {/* Signal Path */}
            <line
              x1="92"
              y1="48"
              x2="588"
              y2="48"
              stroke={solarBlackoutMode ? '#FF5C93' : '#A3E635'}
              strokeWidth="2.5"
              strokeDasharray="10 8"
              style={
                !solarBlackoutMode
                  ? { animation: 'signal-pulse 4s linear infinite' }
                  : undefined
              }
            />

            {solarBlackoutMode && (
              <g>
                <circle
                  cx="340"
                  cy="48"
                  r="18"
                  fill="rgba(255,181,71,0.25)"
                  stroke="#FFB547"
                  strokeWidth="2"
                />
                <text
                  x="340"
                  y="52"
                  textAnchor="middle"
                  className="fill-[#FFB547] text-[9px] font-bold"
                >
                  SUN
                </text>
              </g>
            )}

            {/* Spacecraft / Habitat Node */}
            <circle
              cx="620"
              cy="48"
              r="24"
              fill="rgba(139,124,255,0.18)"
              stroke="#8B7CFF"
              strokeWidth="2"
            />
            <text
              x="620"
              y="52"
              textAnchor="middle"
              className="fill-[#F2F6FF] text-[10px] font-bold"
            >
              ARES-01
            </text>

            <text
              x="340"
              y="22"
              textAnchor="middle"
              className="fill-[#A9B4CC] font-mono-tabular text-[11px]"
            >
              Distance: {envProfile.typicalDistanceKm.toLocaleString()} km •
              One-Way Light-Time: {transferCalc.propagationSec}s • Round-Trip:{' '}
              {transferCalc.roundTripMin} min
            </text>
          </svg>
        </div>
      </div>

      {/* Main Grid: Composer + Transfer Calculator (5 cols) | Packet Queue & History (7 cols) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <form
          onSubmit={handleSend}
          className="md:col-span-5 glass-panel rounded-2xl p-5 space-y-3"
        >
          <h2 className="text-base font-display font-bold text-[#F2F6FF] flex items-center gap-2">
            <Send className="w-4 h-4 text-[#3DE0FF]" />
            Compose Store-and-Forward Packet
          </h2>

          <div>
            <label className="block text-xs text-[#A9B4CC] mb-1">
              Quick Templates
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                {
                  label: 'Daily Summary',
                  subj: `MD-24 Daily Baseline Summary (${activeCrew.id})`,
                  txt: 'Routine daily telemetry packet: 14-day rolling baseline medians, sleep hours, and countermeasure completion attached.',
                },
                {
                  label: 'R-COMBINED Escalation',
                  subj: `[MEDICAL REVIEW] Multi-Domain R-COMBINED Shift (${activeCrew.id})`,
                  txt: 'Requesting asynchronous Flight Surgeon review of 4-day sleep curtailment + elevated resting HR + sleeping-berth CO₂ shift.',
                },
              ].map((tpl) => (
                <button
                  key={tpl.label}
                  type="button"
                  onClick={() => {
                    setSubject(tpl.subj);
                    setBody(tpl.txt);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-[#3DE0FF] hover:bg-white/10 cursor-pointer"
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#A9B4CC] mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value as GroundMessage['priority'])
              }
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white"
            >
              <option value="routine" className="bg-[#0A0F1C]">
                Routine Telemetry
              </option>
              <option value="priority" className="bg-[#0A0F1C]">
                Priority Crew Consultation
              </option>
              <option value="medical_review" className="bg-[#0A0F1C]">
                Medical Review Escalation
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-[#A9B4CC] mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs text-[#A9B4CC] mb-1">
              Packet Body & Evidence Context
            </label>
            <textarea
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full p-3 rounded-xl bg-white/5 border border-white/15 text-xs text-white"
            />
          </div>

          {/* Transfer Time Calculator (C-17) */}
          <div className="p-3 rounded-xl bg-[#04060C]/70 border border-white/10 space-y-2 text-xs">
            <div className="flex items-center justify-between text-[#A9B4CC]">
              <span>Bundle Size ({payloadSizeKb} KB)</span>
              <span>Uplink ({uplinkKbps} kbps)</span>
            </div>
            <input
              type="range"
              min={16}
              max={512}
              step={16}
              value={payloadSizeKb}
              onChange={(e) => setPayloadSizeKb(Number(e.target.value))}
              className="w-full accent-[#A3E635]"
            />
            <div className="flex justify-between font-mono-tabular text-[11px] text-[#2DD4BF]">
              <span>Tx Serialize: {transferCalc.transmissionSec}s</span>
              <span>Total One-Way: {transferCalc.totalOneWaySec}s</span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-[#3DE0FF] text-[#04060C] text-xs font-display font-bold cursor-pointer"
          >
            {solarBlackoutMode || offlineSimMode
              ? 'Queue Packet to Store-and-Forward Buffer'
              : 'Transmit Packet to Ground Control'}
          </button>
        </form>

        {/* Packet Log & State Machine */}
        <div className="md:col-span-7 glass-panel rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-display font-bold text-[#F2F6FF]">
              Store-and-Forward Packet Log ({messages.length})
            </h2>
            {syncQueue.length > 0 && (
              <button
                type="button"
                onClick={flushOfflineQueue}
                className="px-3 py-1 rounded-lg bg-[#2DD4BF] text-[#04060C] text-xs font-bold cursor-pointer"
              >
                Flush Queued Packets ({syncQueue.length})
              </button>
            )}
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {messages.map((m) => (
              <div
                key={m.id}
                className="p-4 rounded-xl bg-[#04060C]/75 border border-white/15 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono-tabular uppercase font-bold ${
                        m.state === 'reply_received' || m.state === 'delivered'
                          ? 'bg-teal-500/20 text-[#2DD4BF] border border-teal-400/40'
                          : m.state === 'queued'
                          ? 'bg-amber-500/20 text-[#FFB547] border border-amber-400/40'
                          : 'bg-cyan-500/20 text-[#3DE0FF] border border-cyan-400/40'
                      }`}
                    >
                      {m.state.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-mono-tabular text-[#7C89A6]">
                      OWLT: {m.oneWayDelaySec}s • {m.attachmentSizeKb ?? 48} KB
                    </span>
                  </div>
                  <span className="text-[11px] font-mono-tabular text-[#A9B4CC]">
                    {m.id}
                  </span>
                </div>

                <div className="text-sm font-display font-bold text-[#F2F6FF]">
                  {m.subject}
                </div>
                <p className="text-xs text-[#A9B4CC] leading-relaxed">
                  {m.body}
                </p>

                {m.replyBody && (
                  <div className="mt-2 p-3 rounded-lg bg-indigo-950/60 border border-indigo-400/35 text-xs text-indigo-100 space-y-1">
                    <div className="font-bold text-[#8B7CFF]">
                      Asynchronous Reply Received ({m.replyReceivedAt?.slice(11, 19)} UTC):
                    </div>
                    <p>{m.replyBody}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
