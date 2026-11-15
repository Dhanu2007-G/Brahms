/**
 * AstraPulse — S10 Habitat & Radiation (/habitat): Cabin CO₂ Symptom Lens, Acoustic dBA & Radiation Dosimetry
 * Team Zenitsu — NASA Space Apps Challenge 2026
 */

import {
  AlertTriangle,
  Database,
  Layers,
  ShieldAlert,
  Volume2,
  Wind,
} from 'lucide-react';
import React, { useState } from 'react';
import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { computeRadiationProjection } from '../analytics/engine';
import { ENVIRONMENT_MODES } from '../analytics/ruleset';
import { StatusChip } from '../components/StatusChip';
import { useMission } from '../context/MissionContext';

export const HabitatScreen: React.FC = () => {
  const {
    observations,
    evaluations,
    environmentMode,
    selectedMissionDay,
    activeCrew,
  } = useMission();

  // Data layer switch: Simulated ARES-01 Transit vs Real ISS RadLab Reference Context
  const [radLayer, setRadLayer] = useState<'simulated' | 'iss_reference'>(
    'simulated'
  );

  const envProfile = ENVIRONMENT_MODES[environmentMode];
  const co2Eval = evaluations.cabin_co2_ppm;
  const noiseEval = evaluations.cabin_noise_dba;
  const radEval = evaluations.radiation_dose_mgy;

  const co2Series = observations
    .filter(
      (o) =>
        o.metric === 'cabin_co2_ppm' && o.missionDay <= selectedMissionDay
    )
    .sort((a, b) => a.missionDay - b.missionDay)
    .map((o) => ({
      day: `MD-${o.missionDay}`,
      co2: o.value,
      noise:
        observations.find(
          (n) =>
            n.metric === 'cabin_noise_dba' && n.missionDay === o.missionDay
        )?.value ?? 54,
    }));

  const radProj = computeRadiationProjection(
    observations
      .filter(
        (o) =>
          o.metric === 'radiation_dose_mgy' &&
          o.missionDay <= selectedMissionDay
      )
      .map((o) => o.value),
    activeCrew.totalMissionDays
  );

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header with Mandatory "Environment — Not a Personal Reading" Badge */}
      <div className="glass-panel rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/50 text-[#3DE0FF] font-mono-tabular font-bold text-[10px] uppercase tracking-wider">
              ENVIRONMENT — NOT A PERSONAL READING
            </span>
            <span className="text-xs font-mono-tabular text-[#A9B4CC]">
              {envProfile.name} ({envProfile.gravityLabel})
            </span>
          </div>
          <h1 className="text-xl font-display font-bold text-[#F2F6FF] mt-1.5">
            Habitat Atmosphere (CO₂), Acoustic Load & Radiation Dosimetry
          </h1>
        </div>
      </div>

      {/* Top 3 Habitat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Cabin CO2 Card */}
        <div className="glass-panel rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#A9B4CC] flex items-center gap-1.5">
              <Wind className="w-4 h-4 text-[#3DE0FF]" /> Cabin CO₂ Concentration
            </span>
            <StatusChip tier={co2Eval.tier} compact />
          </div>
          <div className="text-2xl font-display font-bold font-mono-tabular text-[#F2F6FF]">
            {co2Eval.latestValue ?? '—'} ppm
          </div>
          <div className="text-[11px] text-[#7C89A6]">
            14d Baseline: {co2Eval.baseline.median ?? '—'} ppm • Watch &ge; 3,500
            ppm
          </div>
          <div className="pt-1 text-[10px] font-mono-tabular text-[#3DE0FF]">
            Environment — not a personal reading
          </div>
        </div>

        {/* Habitat Noise Card */}
        <div className="glass-panel rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#A9B4CC] flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-[#FFB547]" /> Habitat Acoustic
              Level
            </span>
            <StatusChip tier={noiseEval.tier} compact />
          </div>
          <div className="text-2xl font-display font-bold font-mono-tabular text-[#F2F6FF]">
            {noiseEval.latestValue ?? '—'} dBA
          </div>
          <div className="text-[11px] text-[#7C89A6]">
            14d Baseline: {noiseEval.baseline.median ?? '—'} dBA • Sleep Target
            &lt; 58 dBA
          </div>
          <div className="pt-1 text-[10px] font-mono-tabular text-[#3DE0FF]">
            Environment — not a personal reading
          </div>
        </div>

        {/* Daily Absorbed Radiation Dose Card */}
        <div className="glass-panel rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#A9B4CC] flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-[#8B7CFF]" /> Absorbed
              Radiation Dose
            </span>
            <StatusChip tier={radEval.tier} compact />
          </div>
          <div className="text-2xl font-display font-bold font-mono-tabular text-[#F2F6FF]">
            {radEval.latestValue ?? '—'} mGy/d
          </div>
          <div className="text-[11px] text-[#7C89A6]">
            Cumulative: {radProj.cumulativeMgy} mGy • 180d Proj:{' '}
            {radProj.projectedTotalMgy} mGy
          </div>
          <div className="pt-1 text-[10px] font-mono-tabular text-[#3DE0FF]">
            Environment — not a personal reading
          </div>
        </div>
      </div>

      {/* Cabin CO2 Multi-Day Chart + "Impact on You" Physiological Lens */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-7 glass-panel rounded-2xl p-5 space-y-3">
          <h2 className="text-base font-display font-bold text-[#F2F6FF]">
            24-Day Cabin CO₂ (ppm) vs NASA-STD-3001 Operational Watch Line
          </h2>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={co2Series}>
                <XAxis
                  dataKey="day"
                  stroke="#7C89A6"
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis
                  stroke="#7C89A6"
                  fontSize={10}
                  tickLine={false}
                  domain={[1800, 4500]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0A0F1C',
                    borderColor: 'rgba(255,255,255,0.15)',
                    fontSize: '12px',
                  }}
                />
                <ReferenceLine
                  y={3500}
                  stroke="#FFB547"
                  strokeDasharray="4 4"
                  label={{
                    value: '3,500 ppm Watch',
                    fill: '#FFB547',
                    fontSize: 10,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="co2"
                  stroke="#3DE0FF"
                  fill="rgba(61,224,255,0.16)"
                  strokeWidth={2.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="md:col-span-5 glass-panel rounded-2xl p-5 space-y-3">
          <h2 className="text-base font-display font-bold text-[#F2F6FF]">
            “Impact on You” — Microgravity CO₂ Pocket Lens
          </h2>
          <p className="text-xs text-[#A9B4CC] leading-relaxed">
            Without buoyancy-driven natural convection in microgravity, exhaled
            CO₂ forms localized pockets around sleeping crew. Concentrations
            above 3,500 ppm cause cerebral vasodilation, increasing morning
            headache incidence, sleep fragmentation, and slower PVT reaction
            times.
          </p>
          <div className="p-3 rounded-xl bg-[#04060C]/70 border border-white/10 space-y-1.5 text-xs">
            <div className="font-bold text-[#2DD4BF]">
              Active Crew Correlation Check:
            </div>
            <div className="text-[#F2F6FF]">
              • Latest Cabin CO₂: <span className="font-mono-tabular">{co2Eval.latestValue} ppm</span>
            </div>
            <div className="text-[#F2F6FF]">
              • Latest PVT Reaction Time:{' '}
              <span className="font-mono-tabular">
                {evaluations.reaction_time_ms.latestValue} ms
              </span>
            </div>
            <div className="text-[#F2F6FF]">
              • Latest Sleep Duration:{' '}
              <span className="font-mono-tabular">
                {evaluations.sleep_duration_h.latestValue} h
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Radiation Dosimetry Discipline & NASA OSDR / ISS RadLab Reference Layer Switch */}
      <div className="glass-panel rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-display font-bold text-[#F2F6FF] flex items-center gap-2">
              <Database className="w-4 h-4 text-[#8B7CFF]" />
              Radiation Dosimetry Layer & Unit Discipline (Gy vs Sv)
            </h2>
            <p className="text-xs text-[#A9B4CC]">
              Absorbed dose (Gray, Gy / mGy) measures physical energy deposited
              per kg of matter. Dose equivalent (Sievert, Sv / mSv) applies
              radiation-quality weighting factors ($Q$). AstraPulse never
              conflates or adds Gy and Sv directly.
            </p>
          </div>

          <div className="inline-flex rounded-xl bg-white/5 p-1 border border-white/15 text-xs">
            <button
              type="button"
              onClick={() => setRadLayer('simulated')}
              className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                radLayer === 'simulated'
                  ? 'bg-[#3DE0FF] text-[#04060C]'
                  : 'text-[#A9B4CC]'
              }`}
            >
              Simulated Transit Stream (SIMULATED)
            </button>
            <button
              type="button"
              onClick={() => setRadLayer('iss_reference')}
              className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                radLayer === 'iss_reference'
                  ? 'bg-[#8B7CFF] text-white'
                  : 'text-[#A9B4CC]'
              }`}
            >
              NASA OSDR / ISS RadLab Context (REFERENCE)
            </button>
          </div>
        </div>

        {radLayer === 'simulated' ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-[#04060C]/70 border border-white/10">
              <div className="text-[#7C89A6]">
                Simulated ARES-01 Absorbed Rate
              </div>
              <div className="text-lg font-mono-tabular font-bold text-[#F2F6FF] mt-1">
                {radProj.rolling7DayRateMgy} mGy / day
              </div>
              <div className="text-[11px] text-amber-300 mt-1">
                Provenance: SIMULATED / IMPORTED
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#04060C]/70 border border-white/10">
              <div className="text-[#7C89A6]">
                Cumulative Absorbed Dose (24d)
              </div>
              <div className="text-lg font-mono-tabular font-bold text-[#3DE0FF] mt-1">
                {radProj.cumulativeMgy} mGy
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#04060C]/70 border border-white/10">
              <div className="text-[#7C89A6]">
                180-Day Projected Absorbed Dose
              </div>
              <div className="text-lg font-mono-tabular font-bold text-[#FFB547] mt-1">
                {radProj.projectedTotalMgy} mGy
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-[#04060C]/70 border border-purple-400/35">
              <div className="text-[#A9B4CC]">
                ISS LEO Reference Absorbed Dose (RadLab)
              </div>
              <div className="text-lg font-mono-tabular font-bold text-[#8B7CFF] mt-1">
                0.22 – 0.32 mGy / day
              </div>
              <div className="text-[11px] text-purple-300 mt-1">
                Provenance: REFERENCE (NASA OSDR / RadLab)
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#04060C]/70 border border-purple-400/35">
              <div className="text-[#A9B4CC]">
                Deep-Space Transit Reference (MSL RAD)
              </div>
              <div className="text-lg font-mono-tabular font-bold text-[#3DE0FF] mt-1">
                ~0.46 mGy / day (Absorbed)
              </div>
              <div className="text-[11px] text-[#A9B4CC] mt-1">
                ~1.84 mSv / day (Dose Equivalent, Q ≈ 3.8)
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#04060C]/70 border border-purple-400/35">
              <div className="text-[#A9B4CC]">NASA Career Limit Context</div>
              <div className="text-lg font-mono-tabular font-bold text-[#2DD4BF] mt-1">
                600 mSv (Effective Dose)
              </div>
              <div className="text-[11px] text-[#A9B4CC] mt-1">
                NASA-STD-3001 Vol. 1
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
