/**
 * AstraPulse — S1 Mission Entry (/enter) & S2 Crew Core (/) Signature Home Screen
 * Team Zenitsu — NASA Space Apps Challenge 2026
 */

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  HeartPulse,
  LineChart,
  Radio,
  Rocket,
  ShieldAlert,
  Sparkles,
  UserCheck,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { computeLightTimeDelaySec } from '../analytics/engine';
import {
  ENVIRONMENT_MODES,
  MANDATORY_SIMULATED_DISCLOSURE,
  METRIC_DEFINITIONS,
} from '../analytics/ruleset';
import {
  EnvironmentMode,
  HazardNodeStatus,
  MetricCode,
} from '../analytics/types';
import { BodyTwin } from '../components/BodyTwin';
import {
  PersistenceDots,
  ProvenanceBadge,
  StatusChip,
} from '../components/StatusChip';
import { useMission } from '../context/MissionContext';

export const MissionEntryScreen: React.FC = () => {
  const {
    crewList,
    activeCrew,
    selectCrew,
    environmentMode,
    setEnvironmentMode,
    selectedMissionDay,
    setSelectedMissionDay,
    activeRole,
    setActiveRole,
    navigate,
    firebaseUser,
    signInWithGoogle,
    signOutUser,
  } = useMission();

  return (
    <div className="max-w-5xl mx-auto py-4 space-y-6">
      {/* Hero Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-[#3DE0FF]/30 relative overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#3DE0FF]/15 border border-[#3DE0FF]/40 text-xs font-mono-tabular text-[#3DE0FF]">
              <Rocket className="w-3.5 h-3.5" />
              <span>NASA SPACE APPS CHALLENGE 2026 • TEAM ZENITSU</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#F2F6FF]">
              AstraPulse — Astronaut Health Intelligence & Mission Decision Support
            </h1>
            <p className="text-sm text-[#A9B4CC] leading-relaxed">
              Offline-first, deterministic personal-baseline health monitoring
              engineered for long-duration spaceflight across the 5 NASA
              human-spaceflight hazards.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-5 py-2.5 rounded-xl bg-[#3DE0FF] text-[#04060C] font-display font-bold text-sm flex items-center gap-2 shadow-lg hover:brightness-110 transition cursor-pointer"
            >
              <span>Launch Crew Core</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            {firebaseUser ? (
              <div className="flex items-center gap-2 text-xs text-[#A9B4CC]">
                <span>Signed in: {firebaseUser.displayName || firebaseUser.email}</span>
                <button
                  type="button"
                  onClick={signOutUser}
                  className="text-[#3DE0FF] hover:underline cursor-pointer"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={signInWithGoogle}
                className="text-xs text-[#3DE0FF] hover:underline cursor-pointer"
              >
                Optional: Sign in with Google for Cloud Mirror
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-400/35 text-xs text-amber-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#FFB547] shrink-0" />
          <span>{MANDATORY_SIMULATED_DISCLOSURE}</span>
        </div>
      </div>

      {/* Step 1: Select Deterministic Crew Persona (ASTRA-001 .. ASTRA-004) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-display font-bold text-[#F2F6FF]">
            1. Select Deterministic 24-Day Crew Scenario
          </h2>
          <span className="text-xs text-[#A9B4CC] font-mono-tabular">
            Ruleset v1.0.0-demo
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {crewList.map((c) => {
            const isSelected = c.id === activeCrew.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => selectCrew(c.id)}
                className={`text-left p-4 rounded-2xl border transition cursor-pointer ${
                  isSelected
                    ? 'bg-[#3DE0FF]/12 border-[#3DE0FF] shadow-lg'
                    : 'glass-panel hover:bg-white/8'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: c.avatarColor }}
                    />
                    <span className="font-mono-tabular text-xs font-bold text-[#3DE0FF]">
                      {c.id} ({c.callsign})
                    </span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-white/10 text-[#F2F6FF]">
                    {c.role}
                  </span>
                </div>

                <div className="text-base font-display font-bold text-[#F2F6FF] mt-1.5">
                  {c.name} — {c.scenarioTitle}
                </div>
                <p className="text-xs text-[#A9B4CC] mt-1 leading-relaxed">
                  {c.scenarioDescription}
                </p>
                <div className="mt-2.5 pt-2 border-t border-white/10 text-[11px] font-mono-tabular text-[#2DD4BF]">
                  Expected: {c.expectedOutcomeSummary}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Select Spaceflight Environment Mode (5 Modes) */}
      <div className="space-y-3">
        <h2 className="text-base font-display font-bold text-[#F2F6FF]">
          2. Select Mission Environment Mode
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {(Object.keys(ENVIRONMENT_MODES) as EnvironmentMode[]).map((mode) => {
            const env = ENVIRONMENT_MODES[mode];
            const active = environmentMode === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setEnvironmentMode(mode)}
                className={`text-left p-3.5 rounded-xl border transition cursor-pointer ${
                  active
                    ? 'bg-[#8B7CFF]/15 border-[#8B7CFF] text-white'
                    : 'glass-panel hover:bg-white/8 text-[#A9B4CC]'
                }`}
              >
                <div className="text-xs font-bold text-[#F2F6FF]">
                  {env.shortName}
                </div>
                <div className="text-[11px] font-mono-tabular text-[#3DE0FF] mt-0.5">
                  {env.gravityLabel}
                </div>
                <p className="text-[11px] text-[#A9B4CC] mt-1.5 line-clamp-3">
                  {env.operationalFocus}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 3: Role & Mission Day */}
      <div className="glass-panel rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <div className="text-xs font-semibold text-[#F2F6FF]">
              Active Console Role
            </div>
            <div className="inline-flex rounded-lg bg-white/5 p-1 border border-white/10 mt-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveRole('astronaut')}
                className={`px-3 py-1 rounded-md cursor-pointer ${
                  activeRole === 'astronaut'
                    ? 'bg-[#3DE0FF] text-[#04060C] font-bold'
                    : 'text-[#A9B4CC]'
                }`}
              >
                Astronaut (Crew Core)
              </button>
              <button
                type="button"
                onClick={() => setActiveRole('specialist')}
                className={`px-3 py-1 rounded-md cursor-pointer ${
                  activeRole === 'specialist'
                    ? 'bg-[#8B7CFF] text-white font-bold'
                    : 'text-[#A9B4CC]'
                }`}
              >
                Ground Flight Surgeon
              </button>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-[#F2F6FF]">
              Evaluation Mission Day (MD-{selectedMissionDay})
            </div>
            <input
              type="range"
              min={1}
              max={24}
              value={selectedMissionDay}
              onChange={(e) => setSelectedMissionDay(Number(e.target.value))}
              className="w-48 mt-2 accent-[#3DE0FF]"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            navigate(activeRole === 'specialist' ? '/ground' : '/')
          }
          className="px-6 py-3 rounded-xl bg-[#2DD4BF] text-[#04060C] font-display font-bold text-sm flex items-center gap-2 cursor-pointer"
        >
          <span>
            Enter {activeRole === 'specialist' ? 'Ground Console' : 'Crew Core'}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const CrewCoreScreen: React.FC = () => {
  const {
    activeCrew,
    environmentMode,
    selectedMissionDay,
    compareBaselineMode,
    evaluations,
    alerts,
    vitalityRings,
    bodyRegions,
    hazardNodes,
    selectedBodyRegion,
    setSelectedBodyRegion,
    bodyTwinSide,
    setBodyTwinSide,
    isScanning,
    triggerBodyScan,
    navigate,
    formatMetricValue,
    messages,
  } = useMission();

  const [selectedHazardDrawer, setSelectedHazardDrawer] =
    useState<HazardNodeStatus | null>(null);

  const envProfile = ENVIRONMENT_MODES[environmentMode];
  const oneWayDelaySec = computeLightTimeDelaySec(envProfile.typicalDistanceKm);
  const openAlerts = alerts.filter((a) => a.status === 'open');

  // Key 6 Vitals + Wellness Snapshot Cards for rapid inspection
  const spotlightMetrics: MetricCode[] = [
    'heart_rate',
    'systolic_bp',
    'sleep_duration_h',
    'blood_glucose',
    'spo2_pct',
    'cabin_co2_ppm',
  ];

  return (
    <div className="space-y-4">
      {/* Now / Next Mission Routine & Scheduled Measurement Prompt Strip */}
      <div className="glass-panel rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 border-l-4 border-l-[#3DE0FF]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#3DE0FF]/15 text-[#3DE0FF]">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono-tabular uppercase tracking-wider text-[#3DE0FF] font-bold">
                NOW • MD-{selectedMissionDay} ROUTINE
              </span>
              <span className="text-xs text-[#A9B4CC]">
                {activeCrew.name} ({activeCrew.id}) • {envProfile.name}
              </span>
            </div>
            <div className="text-sm font-display font-semibold text-[#F2F6FF] mt-0.5">
              {openAlerts.length > 0
                ? `${openAlerts.length} active baseline shift${
                    openAlerts.length > 1 ? 's' : ''
                  } detected — review guided countermeasures or repeat confirmatory measurement.`
                : 'All tracked physiological systems are within your 14-day personal baseline band.'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/ritual')}
            className="touch-target px-3.5 py-2 rounded-xl bg-[#3DE0FF] text-[#04060C] text-xs font-display font-bold flex items-center gap-1.5 hover:brightness-110 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Start Pulse Ritual [R]</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/measure')}
            className="touch-target px-3.5 py-2 rounded-xl glass-panel hover:bg-white/10 text-xs font-semibold text-[#F2F6FF] flex items-center gap-1.5 cursor-pointer"
          >
            <HeartPulse className="w-4 h-4 text-[#2DD4BF]" />
            <span>Measure Lab</span>
          </button>
        </div>
      </div>

      {/* Main 12-Column Crew Core Stage: Center Body Twin (7 cols) + Right Context Stack (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Center Stage: Interactive Body Twin + 5 Orbiting Hazard Nodes + 3 Concentric Vitality Rings */}
        <div className="lg:col-span-7 glass-panel rounded-2xl p-4 flex flex-col justify-between min-h-[590px]">
          <BodyTwin
            bodyRegions={bodyRegions}
            hazardNodes={hazardNodes}
            vitalityRings={vitalityRings}
            selectedRegion={selectedBodyRegion}
            onSelectRegion={(id) => setSelectedBodyRegion(id)}
            side={bodyTwinSide}
            onToggleSide={() =>
              setBodyTwinSide((s) => (s === 'front' ? 'back' : 'front'))
            }
            isScanning={isScanning}
            onTriggerScan={triggerBodyScan}
            onSelectHazard={(hz) => setSelectedHazardDrawer(hz)}
          />
        </div>

        {/* Right Context Stack: Active Alerts + Key Personal Baseline Telemetry + Ground Link Mini-Panel */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Active Alerts Stack */}
          <div className="glass-panel rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#FF5C93]" />
                <h2 className="text-sm font-display font-bold text-[#F2F6FF]">
                  Active Attention & Baseline Shifts ({openAlerts.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/alerts')}
                className="text-xs text-[#3DE0FF] hover:underline cursor-pointer font-medium"
              >
                Open Alert Center →
              </button>
            </div>

            {openAlerts.length === 0 ? (
              <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-400/30 flex items-center gap-3 text-xs text-[#2DD4BF]">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <div>
                  <div className="font-bold">
                    ● Nominal — No Active Watch or Review Alerts
                  </div>
                  <div className="text-[#A9B4CC] mt-0.5">
                    All 20 tracked metrics for {activeCrew.name} are inside the
                    14-day personal baseline band.
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {openAlerts.slice(0, 3).map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3.5 rounded-xl bg-[#04060C]/75 border border-white/15 hover:border-[#3DE0FF]/50 transition space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <StatusChip tier={alert.severity} />
                      <div className="flex items-center gap-2">
                        <PersistenceDots
                          count={alert.persistenceCount}
                          windowSize={4}
                          tier={alert.severity}
                        />
                        <ProvenanceBadge source={alert.source} />
                      </div>
                    </div>

                    <div className="text-sm font-display font-bold text-[#F2F6FF]">
                      {alert.title}
                    </div>
                    <p className="text-xs text-[#A9B4CC] line-clamp-2 leading-relaxed">
                      {alert.summary}
                    </p>

                    <div className="pt-1 flex items-center justify-between text-[11px]">
                      <span className="font-mono-tabular text-[#7C89A6]">
                        Rule: {alert.ruleId} ({alert.rulesetVersion})
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedBodyRegion(alert.bodyRegion)}
                          className="text-[#3DE0FF] hover:underline cursor-pointer font-medium"
                        >
                          Inspect System
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate('/alerts')}
                          className="text-[#2DD4BF] hover:underline cursor-pointer font-semibold"
                        >
                          Care Guide →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 6-Card Personal Baseline Snapshot Grid */}
          <div className="glass-panel rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-display font-bold text-[#F2F6FF]">
                {compareBaselineMode
                  ? 'Current vs 14-Day Personal Median'
                  : 'Key Vitals & Habitat Snapshot'}
              </h2>
              <button
                type="button"
                onClick={() => navigate('/insights')}
                className="text-xs text-[#3DE0FF] hover:underline cursor-pointer flex items-center gap-1"
              >
                <LineChart className="w-3.5 h-3.5" /> Full Trends
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {spotlightMetrics.map((mCode) => {
                const def = METRIC_DEFINITIONS[mCode];
                const ev = evaluations[mCode];
                const fmtVal = formatMetricValue(mCode, ev?.latestValue);
                const fmtBase = formatMetricValue(
                  mCode,
                  ev?.baseline.median
                );

                return (
                  <button
                    key={mCode}
                    type="button"
                    onClick={() => setSelectedBodyRegion(def.bodyRegion)}
                    className="text-left p-3 rounded-xl bg-[#04060C]/70 border border-white/10 hover:border-[#3DE0FF]/40 transition cursor-pointer flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] text-[#A9B4CC] font-medium truncate">
                        {def.shortLabel}
                      </span>
                      <StatusChip tier={ev.tier} compact />
                    </div>

                    <div className="mt-2">
                      <span className="text-lg font-display font-bold font-mono-tabular text-[#F2F6FF]">
                        {fmtVal.formatted}
                      </span>{' '}
                      <span className="text-[11px] font-mono-tabular text-[#7C89A6]">
                        {fmtVal.formatted !== 'Not recorded' ? fmtVal.unit : ''}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[10px] font-mono-tabular text-[#7C89A6]">
                      <span>
                        Base: {fmtBase.formatted}{' '}
                        {fmtBase.formatted !== 'Not recorded' ? fmtBase.unit : ''}
                      </span>
                      {ev.robustZ !== null && (
                        <span
                          className={
                            Math.abs(ev.robustZ) >= 2
                              ? 'text-[#FF5C93] font-bold'
                              : 'text-[#2DD4BF]'
                          }
                        >
                          {ev.robustZ >= 0 ? '+' : ''}
                          {ev.robustZ.toFixed(1)}σ
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ground Link Mini-Panel (Asynchronous Store-and-Forward Status) */}
          <div className="glass-panel rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#A3E635]" />
                <h2 className="text-sm font-display font-bold text-[#F2F6FF]">
                  Ground Link Telemetry (Store & Forward)
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/link')}
                className="text-xs text-[#3DE0FF] hover:underline cursor-pointer"
              >
                Open Link [L] →
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#04060C]/70 border border-white/10 flex items-center justify-between text-xs">
              <div>
                <div className="text-[#A9B4CC]">
                  Distance:{' '}
                  <span className="font-mono-tabular text-[#F2F6FF]">
                    {envProfile.typicalDistanceKm.toLocaleString()} km
                  </span>
                </div>
                <div className="text-[11px] text-[#7C89A6] mt-0.5">
                  One-Way Light-Time:{' '}
                  <span className="font-mono-tabular text-[#A3E635]">
                    {oneWayDelaySec}s
                  </span>{' '}
                  • Packets logged: {messages.length}
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/link')}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-[#F2F6FF] cursor-pointer"
              >
                Compose Packet
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hazard Detail Drawer when an Orbiting Hazard Node is clicked */}
      {selectedHazardDrawer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`NASA Hazard Detail: ${selectedHazardDrawer.name}`}
        >
          <div className="w-full max-w-lg rounded-2xl bg-[#0A0F1C] border border-white/20 p-5 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <StatusChip tier={selectedHazardDrawer.tier} />
                <h3 className="text-lg font-display font-bold text-[#F2F6FF] mt-2">
                  NASA Spaceflight Hazard: {selectedHazardDrawer.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHazardDrawer(null)}
                className="p-1.5 rounded-lg glass-panel text-[#A9B4CC] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#A9B4CC] leading-relaxed">
              {selectedHazardDrawer.summary}
            </p>

            <div className="space-y-1.5">
              <div className="text-xs font-bold uppercase tracking-wider text-[#2DD4BF]">
                Recommended Crew Countermeasures
              </div>
              <ul className="space-y-1 text-xs text-[#F2F6FF] list-disc list-inside">
                {selectedHazardDrawer.countermeasures.map((cm, i) => (
                  <li key={i}>{cm}</li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
              <a
                href={selectedHazardDrawer.nasaReferenceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[#3DE0FF] hover:underline"
              >
                {selectedHazardDrawer.nasaReferenceTitle}{' '}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => setSelectedHazardDrawer(null)}
                className="px-3 py-1.5 rounded-lg bg-[#3DE0FF] text-[#04060C] font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
