/**
 * AstraPulse — S13 Ground Console (/ground) Specialist View & S14 Settings, Units, Accessibility & Demo Admin (/settings)
 * Team Zenitsu — NASA Space Apps Challenge 2026
 */

import {
  Activity,
  CheckCircle2,
  Eye,
  FileCode,
  Lock,
  Radio,
  RefreshCw,
  Settings,
  Shield,
  ShieldAlert,
  Sliders,
  Trash2,
  UserCheck,
} from 'lucide-react';
import React, { useState } from 'react';
import { evaluateCrewHealthState } from '../analytics/engine';
import { RULESET_VERSION, RULESET_YAML } from '../analytics/ruleset';
import { BodyTwin } from '../components/BodyTwin';
import {
  PersistenceDots,
  ProvenanceBadge,
  StatusChip,
} from '../components/StatusChip';
import { useMission } from '../context/MissionContext';

export const GroundConsoleScreen: React.FC = () => {
  const {
    crewList,
    activeCrew,
    selectCrew,
    allObservations,
    allCrewAlerts,
    selectedMissionDay,
    vitalityRings,
    bodyRegions,
    hazardNodes,
    selectedBodyRegion,
    setSelectedBodyRegion,
    bodyTwinSide,
    setBodyTwinSide,
    isScanning,
    triggerBodyScan,
    grants,
    journals,
    verifySpecialistJournalAccess,
    sendGroundMessage,
    activeRole,
    setActiveRole,
  } = useMission();

  const [rbacBanner, setRbacBanner] = useState<string | null>(null);
  const [promptSent, setPromptSent] = useState<boolean>(false);

  const activeGrants = grants.filter((g) => g.active && !g.revokedAt);

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Specialist Role Banner & Consent Scope Header */}
      <div className="glass-panel rounded-2xl p-5 border border-[#8B7CFF]/40 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-[#8B7CFF]/20 border border-[#8B7CFF]/50 text-[#8B7CFF] font-mono-tabular font-bold text-[10px] uppercase tracking-wider">
              FLIGHT SURGEON GROUND CONSOLE • HOUSTON MCC
            </span>
            <span className="text-xs font-mono-tabular text-[#A9B4CC]">
              Active Consent Grants for {activeCrew.id}: {activeGrants.length}
            </span>
          </div>
          <h1 className="text-xl font-display font-bold text-[#F2F6FF] mt-1">
            Multi-Crew Telemetry Triage & Consent-Scoped Read-Only Twin
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {activeRole !== 'specialist' && (
            <button
              type="button"
              onClick={() => setActiveRole('specialist')}
              className="px-3.5 py-2 rounded-xl bg-[#8B7CFF] text-white text-xs font-bold cursor-pointer"
            >
              Activate Specialist Role Mode
            </button>
          )}
          <button
            type="button"
            onClick={async () => {
              await sendGroundMessage({
                subject: `[FLIGHT SURGEON REQUEST] Confirmatory Dual-BP & Morning HR Check`,
                body: `Ground Flight Surgeon requesting a confirmatory rested dual-cuff Blood Pressure and Resting HR check on your next scheduled routine block.`,
                priority: 'priority',
              });
              setPromptSent(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-[#3DE0FF] text-[#04060C] text-xs font-display font-bold cursor-pointer"
          >
            {promptSent
              ? '✓ Measurement Request Queued'
              : 'Request Crew Confirmatory Measurement'}
          </button>
        </div>
      </div>

      {/* 4-Crew Mission Roster Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {crewList.map((c) => {
          const cObs = allObservations.filter(
            (o) => o.crewId === c.id && !o.supersededById
          );
          const cExisting = allCrewAlerts.filter((a) => a.crewId === c.id);
          const cState = evaluateCrewHealthState(
            c.id,
            cObs,
            selectedMissionDay,
            cExisting
          );
          const isSelected = c.id === activeCrew.id;
          const openCount = cState.alerts.filter(
            (a) => a.status === 'open'
          ).length;

          return (
            <button
              key={c.id}
              type="button"
              onClick={() => selectCrew(c.id)}
              className={`text-left p-4 rounded-2xl border transition cursor-pointer ${
                isSelected
                  ? 'bg-[#8B7CFF]/15 border-[#8B7CFF] shadow-lg'
                  : 'glass-panel hover:bg-white/8'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono-tabular text-xs font-bold text-[#3DE0FF]">
                  {c.id} ({c.callsign})
                </span>
                <StatusChip tier={cState.overallTier} compact />
              </div>
              <div className="text-sm font-display font-bold text-[#F2F6FF] mt-1">
                {c.name}
              </div>
              <div className="text-[11px] text-[#A9B4CC] mt-0.5">
                {c.scenarioTitle}
              </div>
              <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono-tabular">
                <span className="text-[#7C89A6]">
                  Open Alerts: {openCount}
                </span>
                <span className="text-[#2DD4BF]">
                  Rec: {cState.vitalityRings[0]?.score ?? '—'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Split: Read-Only Consent-Scoped Body Twin (7 cols) + Specialist Alert & Privacy Gate Verification (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 glass-panel rounded-2xl p-4 space-y-3">
          <div className="p-2.5 rounded-xl bg-indigo-950/60 border border-indigo-400/35 flex items-center justify-between text-xs">
            <span className="text-indigo-200 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-[#8B7CFF]" />
              Read-Only Specialist Twin ({activeCrew.name})
            </span>
            <span className="font-mono-tabular text-[11px] text-[#2DD4BF]">
              Scope:{' '}
              {activeGrants.map((g) => g.scope).join(', ') ||
                'summary_and_alerts'}
            </span>
          </div>

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
            readOnly
          />
        </div>

        <div className="lg:col-span-5 space-y-4">
          {/* Privacy Isolation Proof Box (Directive 9) */}
          <div className="glass-panel rounded-2xl p-4 space-y-3 border border-teal-400/30">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-display font-bold text-[#F2F6FF] flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#2DD4BF]" />
                Crew Privacy & Journal Access Gate
              </h2>
              <span className="text-[10px] font-mono-tabular px-2 py-0.5 rounded bg-teal-500/20 text-[#2DD4BF]">
                RBAC ENFORCED
              </span>
            </div>

            <p className="text-xs text-[#A9B4CC]">
              Flight Surgeons can view only journal entries with an active,
              unexpired crew grant. Unshared private reflections return{' '}
              <code className="text-rose-300">403 Forbidden</code>.
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={async () => {
                  const res = await verifySpecialistJournalAccess(
                    'JRN-ASTRA-002-01'
                  );
                  setRbacBanner(
                    `Test Private Entry (JRN-ASTRA-002-01) → HTTP ${res.status}: ${res.message}`
                  );
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-400/40 text-xs font-semibold text-rose-200 cursor-pointer"
              >
                Test Blocked Private Entry (JRN-ASTRA-002-01)
              </button>
              <button
                type="button"
                onClick={async () => {
                  const res = await verifySpecialistJournalAccess(
                    'JRN-ASTRA-002-02'
                  );
                  setRbacBanner(
                    `Test Shared Entry (JRN-ASTRA-002-02) → HTTP ${res.status}: ${res.message}`
                  );
                }}
                className="px-3 py-1.5 rounded-lg bg-teal-500/20 border border-teal-400/40 text-xs font-semibold text-[#2DD4BF] cursor-pointer"
              >
                Test Shared Entry (JRN-ASTRA-002-02)
              </button>
            </div>

            {rbacBanner && (
              <div className="p-2.5 rounded-lg bg-[#04060C] border border-white/15 text-xs font-mono-tabular text-[#3DE0FF]">
                {rbacBanner}
              </div>
            )}

            <div className="pt-2 border-t border-white/10 space-y-2">
              <div className="text-xs font-semibold text-[#F2F6FF]">
                Shared Journal Entries Visible to Specialist ({journals.length}):
              </div>
              {journals.length === 0 ? (
                <div className="text-xs text-[#7C89A6]">
                  No shared journal entries for {activeCrew.id}.
                </div>
              ) : (
                journals.map((j) => (
                  <div
                    key={j.id}
                    className="p-2.5 rounded-lg bg-[#04060C]/70 border border-white/10 text-xs"
                  >
                    <div className="font-bold text-[#3DE0FF]">
                      {j.title} ({j.id})
                    </div>
                    <p className="text-[#A9B4CC] mt-0.5">{j.body}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Consent Grants List */}
          <div className="glass-panel rounded-2xl p-4 space-y-2">
            <h2 className="text-sm font-display font-bold text-[#F2F6FF]">
              Active Telemetry Consent Grants ({activeGrants.length})
            </h2>
            <div className="space-y-2">
              {activeGrants.map((g) => (
                <div
                  key={g.id}
                  className="p-2.5 rounded-xl bg-[#04060C]/70 border border-white/10 text-xs flex items-center justify-between"
                >
                  <div>
                    <div className="font-mono-tabular font-bold text-[#2DD4BF]">
                      {g.scope}
                    </div>
                    <div className="text-[11px] text-[#A9B4CC]">{g.note}</div>
                  </div>
                  <span className="text-[10px] font-mono-tabular text-[#7C89A6]">
                    Exp: {g.expiresAt.slice(0, 10)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SettingsScreen: React.FC = () => {
  const {
    accessibility,
    updateAccessibility,
    grants,
    createAccessGrant,
    revokeAccessGrant,
    syncQueue,
    flushOfflineQueue,
    resetDemoSeed,
    auditLog,
    offlineSimMode,
    setOfflineSimMode,
    solarBlackoutMode,
    setSolarBlackoutMode,
  } = useMission();

  const [showRulesetYaml, setShowRulesetYaml] = useState<boolean>(false);
  const [seedResetBanner, setSeedResetBanner] = useState<string | null>(null);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="glass-panel rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-xs font-mono-tabular uppercase tracking-wider text-[#3DE0FF] font-bold">
            SETTINGS, ACCESSIBILITY, UNITS, PRIVACY GRANTS & DEMO ADMIN
          </span>
          <h1 className="text-xl font-display font-bold text-[#F2F6FF]">
            Mission Control Configuration & Audit Trail
          </h1>
        </div>

        <button
          type="button"
          onClick={async () => {
            await resetDemoSeed();
            setSeedResetBanner(
              'Restored clean 24-day ARES-01 deterministic seed across ASTRA-001..004.'
            );
          }}
          className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-400/50 text-[#FFB547] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Reset 24-Day Demo Seed</span>
        </button>
      </div>

      {seedResetBanner && (
        <div className="p-3 rounded-xl bg-teal-500/15 border border-teal-400/40 text-xs text-[#2DD4BF]">
          {seedResetBanner}
        </div>
      )}

      {/* Row 1: Accessibility Toggles + Physical Unit Converters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel rounded-2xl p-5 space-y-3">
          <h2 className="text-base font-display font-bold text-[#F2F6FF] flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#3DE0FF]" />
            Spaceflight Accessibility & Sensory Controls
          </h2>

          <div className="space-y-2.5 text-xs">
            {[
              {
                key: 'reduceMotion' as const,
                label: 'Reduce Motion (Disables pulse/orbit animations)',
              },
              {
                key: 'highContrast' as const,
                label: 'High-Contrast Telemetry Mode (WCAG AAA contrast)',
              },
              {
                key: 'colourBlindSafe' as const,
                label: 'Colour-Blind Safe Palette (Okabe-Ito high distinction)',
              },
              {
                key: 'gloveMode' as const,
                label: 'EVA Glove Mode (Enforces 56px minimum touch targets)',
              },
              {
                key: 'calmMode' as const,
                label: 'Sensory Calm Mode (Softens vivid neon accents)',
              },
              {
                key: 'hideGamification' as const,
                label: 'Hide Gamification (Opt out of XP, levels & quests)',
              },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#04060C]/60 border border-white/10 cursor-pointer"
              >
                <span className="text-[#F2F6FF]">{item.label}</span>
                <input
                  type="checkbox"
                  checked={accessibility[item.key]}
                  onChange={(e) =>
                    updateAccessibility({ [item.key]: e.target.checked })
                  }
                />
              </label>
            ))}

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#04060C]/60 border border-white/10">
              <span className="text-[#F2F6FF]">Interface Text Scaling</span>
              <div className="inline-flex rounded-lg bg-white/10 p-0.5">
                {(['100', '115', '150'] as const).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => updateAccessibility({ textScale: sz })}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono-tabular cursor-pointer ${
                      accessibility.textScale === sz
                        ? 'bg-[#3DE0FF] text-[#04060C] font-bold'
                        : 'text-[#A9B4CC]'
                    }`}
                  >
                    {sz}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Unit Conversions + Simulation Toggles */}
        <div className="space-y-4">
          <div className="glass-panel rounded-2xl p-5 space-y-3">
            <h2 className="text-base font-display font-bold text-[#F2F6FF]">
              Display Unit Conversions (Canonical Storage Preserved)
            </h2>
            <div className="space-y-2 text-xs">
              {[
                {
                  key: 'bpKpa' as const,
                  label: 'Blood Pressure: Convert mmHg → kPa',
                },
                {
                  key: 'tempFahrenheit' as const,
                  label: 'Body Temperature: Convert °C → °F',
                },
                {
                  key: 'glucoseMmol' as const,
                  label: 'Blood Glucose: Convert mg/dL → mmol/L',
                },
                {
                  key: 'massLb' as const,
                  label: 'Body Mass: Convert kg → lb',
                },
              ].map((u) => (
                <label
                  key={u.key}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#04060C]/60 border border-white/10 cursor-pointer"
                >
                  <span className="text-[#F2F6FF]">{u.label}</span>
                  <input
                    type="checkbox"
                    checked={accessibility.useAltUnits[u.key]}
                    onChange={(e) =>
                      updateAccessibility({
                        useAltUnits: {
                          ...accessibility.useAltUnits,
                          [u.key]: e.target.checked,
                        },
                      })
                    }
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-5 space-y-3">
            <h2 className="text-base font-display font-bold text-[#F2F6FF]">
              Offline & Solar Blackout Simulators
            </h2>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setOfflineSimMode(!offlineSimMode)}
                className={`p-3 rounded-xl border font-bold cursor-pointer ${
                  offlineSimMode
                    ? 'bg-amber-500/20 border-amber-400 text-[#FFB547]'
                    : 'bg-white/5 border-white/10 text-[#A9B4CC]'
                }`}
              >
                Offline IndexedDB Mode: {offlineSimMode ? 'ON' : 'OFF'}
              </button>
              <button
                type="button"
                onClick={() => setSolarBlackoutMode(!solarBlackoutMode)}
                className={`p-3 rounded-xl border font-bold cursor-pointer ${
                  solarBlackoutMode
                    ? 'bg-rose-500/20 border-rose-400 text-[#FF5C93]'
                    : 'bg-white/5 border-white/10 text-[#A9B4CC]'
                }`}
              >
                Solar Conjunction Blackout: {solarBlackoutMode ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="flex items-center justify-between text-xs text-[#A9B4CC] pt-1">
              <span>Offline Sync Queue: {syncQueue.length} items</span>
              <button
                type="button"
                onClick={flushOfflineQueue}
                className="px-3 py-1 rounded bg-[#2DD4BF] text-[#04060C] font-bold cursor-pointer"
              >
                Flush Queue Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Privacy Consent Grants Manager */}
      <div className="glass-panel rounded-2xl p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-display font-bold text-[#F2F6FF] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#2DD4BF]" />
              Crew-Controlled Specialist Consent Grants
            </h2>
            <p className="text-xs text-[#A9B4CC]">
              Time-bounded grants control what Ground Specialists can inspect.
              Revoking a grant takes effect immediately.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              createAccessGrant(
                'all_vitals',
                14,
                'Crew-issued 14-day vitals telemetry grant'
              )
            }
            className="px-3.5 py-1.5 rounded-xl bg-[#3DE0FF] text-[#04060C] text-xs font-bold cursor-pointer"
          >
            + Grant 14-Day Vitals Access
          </button>
        </div>

        <div className="space-y-2">
          {grants.map((g) => (
            <div
              key={g.id}
              className="p-3 rounded-xl bg-[#04060C]/70 border border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs"
            >
              <div>
                <span className="font-mono-tabular font-bold text-[#3DE0FF]">
                  {g.id}
                </span>{' '}
                • Scope: <span className="font-bold text-white">{g.scope}</span>{' '}
                • {g.note}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono-tabular text-[#7C89A6]">
                  {g.active ? `Expires ${g.expiresAt.slice(0, 10)}` : 'REVOKED'}
                </span>
                {g.active && (
                  <button
                    type="button"
                    onClick={() => revokeAccessGrant(g.id)}
                    className="px-2.5 py-1 rounded bg-rose-500/20 border border-rose-400/40 text-[#FF5C93] font-semibold cursor-pointer"
                  >
                    Revoke Immediately
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 3: Demo Admin Ruleset v1.0.0-demo YAML Viewer & Immutable Audit Log */}
      <div className="glass-panel rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-display font-bold text-[#F2F6FF] flex items-center gap-2">
            <FileCode className="w-4 h-4 text-[#8B7CFF]" />
            Deterministic Ruleset ({RULESET_VERSION}) & Immutable Audit Log (
            {auditLog.length})
          </h2>
          <button
            type="button"
            onClick={() => setShowRulesetYaml((s) => !s)}
            className="px-3 py-1 rounded-lg glass-panel text-xs text-[#3DE0FF] cursor-pointer"
          >
            {showRulesetYaml ? 'Hide YAML Ruleset' : 'Inspect ruleset_v1_0_0_demo.yaml'}
          </button>
        </div>

        {showRulesetYaml && (
          <pre className="p-4 rounded-xl bg-[#04060C] border border-white/15 font-mono-tabular text-xs text-[#2DD4BF] overflow-x-auto max-h-64">
            {RULESET_YAML.trim()}
          </pre>
        )}

        <div className="overflow-x-auto max-h-64 border border-white/10 rounded-xl">
          <table className="w-full text-left text-xs font-mono-tabular">
            <thead className="bg-white/5 text-[#A9B4CC]">
              <tr>
                <th className="p-2.5">Timestamp (UTC)</th>
                <th className="p-2.5">Actor</th>
                <th className="p-2.5">Action</th>
                <th className="p-2.5">Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {auditLog.slice(0, 25).map((entry) => (
                <tr key={entry.id}>
                  <td className="p-2.5 text-[#7C89A6]">
                    {entry.timestamp.slice(0, 19).replace('T', ' ')}
                  </td>
                  <td className="p-2.5 text-[#3DE0FF]">
                    {entry.actorRole}:{entry.actorId}
                  </td>
                  <td className="p-2.5 font-bold text-[#F2F6FF]">
                    {entry.action}
                  </td>
                  <td className="p-2.5 font-sans text-[#A9B4CC]">
                    {entry.summary}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
