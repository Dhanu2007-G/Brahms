/**
 * AstraPulse — S4 Pulse Ritual (/ritual) 6-Step Guided Check-In with 24-Hour Circular Sleep Dial & Mood Orbs
 * Team Zenitsu — NASA Space Apps Challenge 2026
 */

import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Brain,
  CheckCircle2,
  Droplets,
  Dumbbell,
  HeartPulse,
  Moon,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import React, { useState } from 'react';
import { computeDerivedBloodPressure } from '../analytics/engine';
import { BODY_REGIONS, METRIC_DEFINITIONS } from '../analytics/ruleset';
import {
  BodyRegionId,
  GlucoseContext,
  MetricCode,
} from '../analytics/types';
import { useMission } from '../context/MissionContext';

const SYMPTOM_OPTIONS = [
  'None — Feeling steady',
  'Mild morning headache',
  'Unrefreshed waking',
  'Nasal / sinus fullness (fluid shift)',
  'Lower back tightness',
  'Eye strain / mild blur',
  'Post-exercise fatigue',
  'Cognitive fatigue',
];

const MOOD_ORBS = [
  { score: 1, label: 'Depleted', color: '#FF5C93', desc: 'High strain / drained' },
  { score: 2, label: 'Strained', color: '#FFB547', desc: 'stretched thin' },
  { score: 3, label: 'Steady', color: '#3DE0FF', desc: 'Balanced / neutral' },
  { score: 4, label: 'Focused', color: '#2DD4BF', desc: 'Clear & engaged' },
  { score: 5, label: 'Energized', color: '#A3E635', desc: 'Peak readiness' },
];

export const PulseRitualScreen: React.FC = () => {
  const {
    activeCrew,
    selectedMissionDay,
    evaluations,
    submitCheckin,
    navigate,
  } = useMission();

  const [step, setStep] = useState<number>(1); // 1..6

  // Step 1: Body Vitals (nullable if skipped — never coerced to 0!)
  const [sbp, setSbp] = useState<string>(
    String(evaluations.systolic_bp?.latestValue ?? '118')
  );
  const [dbp, setDbp] = useState<string>(
    String(evaluations.diastolic_bp?.latestValue ?? '76')
  );
  const [hr, setHr] = useState<string>(
    String(evaluations.heart_rate?.latestValue ?? '65')
  );
  const [temp, setTemp] = useState<string>(
    String(evaluations.body_temp_c?.latestValue ?? '36.6')
  );
  const [spo2, setSpo2] = useState<string>(
    String(evaluations.spo2_pct?.latestValue ?? '98')
  );
  const [glucose, setGlucose] = useState<string>(
    String(evaluations.blood_glucose?.latestValue ?? '')
  );
  const [glucoseContext, setGlucoseContext] =
    useState<GlucoseContext>('fasting');

  // Step 2: Sleep Dial (Lights out hour 0..23, wake hour 0..23) & Quality 1..5
  const [sleepStartHour, setSleepStartHour] = useState<number>(22.5);
  const [wakeHour, setWakeHour] = useState<number>(6.0);
  const [sleepQuality, setSleepQuality] = useState<number>(4);

  const computedSleepHours = Number(
    ((wakeHour - sleepStartHour + 24) % 24).toFixed(1)
  );

  // Step 3: Mind (Mood Orb 1..5, Stress 1..5, Fatigue 1..5)
  const [moodScore, setMoodScore] = useState<number>(4);
  const [stressScore, setStressScore] = useState<number>(2);
  const [fatigueScore, setFatigueScore] = useState<number>(2);

  // Step 4: Body Feel (Tap regions + Controlled symptom list)
  const [selectedRegions, setSelectedRegions] = useState<BodyRegionId[]>([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');

  // Step 5: Fuel & Move (Hydration mL, Meal %, Aerobic min, Resistive min)
  const [hydrationMl, setHydrationMl] = useState<number>(2500);
  const [mealPct, setMealPct] = useState<number>(95);
  const [exerciseMin, setExerciseMin] = useState<number>(45);
  const [resistiveMin, setResistiveMin] = useState<number>(40);

  // Step 6: Review & Seal state
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSealing, setIsSealing] = useState<boolean>(false);
  const [sealedSuccess, setSealedSuccess] = useState<boolean>(false);

  const parseNullable = (raw: string): number | null => {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
  };

  const derivedBp = computeDerivedBloodPressure(
    parseNullable(sbp),
    parseNullable(dbp)
  );

  const draftMetrics: Partial<Record<MetricCode, number | null>> = {
    systolic_bp: parseNullable(sbp),
    diastolic_bp: parseNullable(dbp),
    mean_arterial_pressure: derivedBp.map,
    pulse_pressure: derivedBp.pulsePressure,
    heart_rate: parseNullable(hr),
    body_temp_c: parseNullable(temp),
    spo2_pct: parseNullable(spo2),
    blood_glucose: parseNullable(glucose),
    sleep_duration_h: computedSleepHours,
    sleep_quality: sleepQuality,
    mood_score: moodScore,
    stress_score: stressScore,
    fatigue_score: fatigueScore,
    hydration_ml: hydrationMl,
    meal_completion_pct: mealPct,
    exercise_minutes: exerciseMin,
    resistive_load_min: resistiveMin,
  };

  const handleSealRitual = async () => {
    setErrorMsg(null);
    setIsSealing(true);
    const res = await submitCheckin({
      metrics: draftMetrics,
      glucoseContext:
        draftMetrics.blood_glucose !== null ? glucoseContext : undefined,
      symptoms: selectedSymptoms,
      symptomRegions: selectedRegions,
      notes,
    });
    setIsSealing(false);
    if (!res.ok) {
      setErrorMsg(res.error || 'Validation failed.');
    } else {
      setSealedSuccess(true);
    }
  };

  // Helper for circular 24-hour Sleep Dial SVG arc
  const polarToCartesian = (cx: number, cy: number, r: number, hour24: number) => {
    const angleDeg = (hour24 / 24) * 360 - 90;
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  const startPt = polarToCartesian(110, 110, 78, sleepStartHour);
  const endPt = polarToCartesian(110, 110, 78, wakeHour);
  const largeArcFlag = computedSleepHours > 12 ? 1 : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header & 6-Step Progress Bar */}
      <div className="glass-panel rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <span className="text-xs font-mono-tabular uppercase tracking-wider text-[#3DE0FF] font-bold">
              DAILY PULSE RITUAL • MD-{selectedMissionDay}
            </span>
            <h1 className="text-xl font-display font-bold text-[#F2F6FF]">
              6-Step Guided Crew Self-Assessment ({activeCrew.name})
            </h1>
          </div>
          <span className="text-xs font-mono-tabular text-[#A9B4CC]">
            Step {step} of 6 • +35 XP on Seal
          </span>
        </div>

        <div className="grid grid-cols-6 gap-1.5">
          {[
            { n: 1, label: '1. Body Vitals' },
            { n: 2, label: '2. Sleep Dial' },
            { n: 3, label: '3. Mind Orbs' },
            { n: 4, label: '4. Body Feel' },
            { n: 5, label: '5. Fuel & Move' },
            { n: 6, label: '6. Review & Seal' },
          ].map((s) => (
            <button
              key={s.n}
              type="button"
              onClick={() => setStep(s.n)}
              className={`py-2 px-2 rounded-lg text-xs font-medium text-center transition cursor-pointer truncate ${
                step === s.n
                  ? 'bg-[#3DE0FF] text-[#04060C] font-bold'
                  : step > s.n
                  ? 'bg-[#2DD4BF]/20 text-[#2DD4BF] border border-[#2DD4BF]/40'
                  : 'bg-white/5 text-[#A9B4CC]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Step 1: Body Vitals */}
      {step === 1 && (
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-display font-bold text-[#F2F6FF] flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-[#3DE0FF]" />
              Step 1: Morning Resting Vitals (Leave blank if not measured — never saved as 0)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-xl bg-[#04060C]/60 border border-white/10 space-y-1.5">
              <label className="block text-xs text-[#A9B4CC]">
                Systolic BP (mmHg) [60–250]
              </label>
              <input
                type="number"
                value={sbp}
                onChange={(e) => setSbp(e.target.value)}
                placeholder="Not recorded"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 font-mono-tabular text-base text-white"
              />
              <span className="text-[11px] font-mono-tabular text-[#7C89A6]">
                14d Baseline: {evaluations.systolic_bp?.baseline.median ?? '—'} mmHg
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#04060C]/60 border border-white/10 space-y-1.5">
              <label className="block text-xs text-[#A9B4CC]">
                Diastolic BP (mmHg) [35–150]
              </label>
              <input
                type="number"
                value={dbp}
                onChange={(e) => setDbp(e.target.value)}
                placeholder="Not recorded"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 font-mono-tabular text-base text-white"
              />
              <span className="text-[11px] font-mono-tabular text-[#2DD4BF]">
                Derived MAP: {derivedBp.map ?? '—'} mmHg • PP:{' '}
                {derivedBp.pulsePressure ?? '—'} mmHg
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#04060C]/60 border border-white/10 space-y-1.5">
              <label className="block text-xs text-[#A9B4CC]">
                Resting Heart Rate (bpm) [30–220]
              </label>
              <input
                type="number"
                value={hr}
                onChange={(e) => setHr(e.target.value)}
                placeholder="Not recorded"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 font-mono-tabular text-base text-white"
              />
              <span className="text-[11px] font-mono-tabular text-[#7C89A6]">
                14d Baseline: {evaluations.heart_rate?.baseline.median ?? '—'} bpm
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#04060C]/60 border border-white/10 space-y-1.5">
              <label className="block text-xs text-[#A9B4CC]">
                Body Temperature (°C) [33.0–42.5]
              </label>
              <input
                type="number"
                step="0.1"
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
                placeholder="Not recorded"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 font-mono-tabular text-base text-white"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-[#04060C]/60 border border-white/10 space-y-1.5">
              <label className="block text-xs text-[#A9B4CC]">
                Blood Oxygen SpO₂ (%) [65–100]
              </label>
              <input
                type="number"
                value={spo2}
                onChange={(e) => setSpo2(e.target.value)}
                placeholder="Not recorded"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 font-mono-tabular text-base text-white"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-[#04060C]/60 border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-[#A9B4CC]">
                  Blood Glucose (mg/dL)
                </label>
                <select
                  value={glucoseContext}
                  onChange={(e) =>
                    setGlucoseContext(e.target.value as GlucoseContext)
                  }
                  className="text-[11px] bg-white/10 rounded px-1.5 py-0.5 text-[#3DE0FF]"
                >
                  <option value="fasting" className="bg-[#0A0F1C]">
                    Fasting
                  </option>
                  <option value="pre_meal" className="bg-[#0A0F1C]">
                    Pre-meal
                  </option>
                  <option value="post_meal" className="bg-[#0A0F1C]">
                    Post-meal
                  </option>
                </select>
              </div>
              <input
                type="number"
                value={glucose}
                onChange={(e) => setGlucose(e.target.value)}
                placeholder="Optional — leave blank if skipped"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 font-mono-tabular text-base text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Interactive 24-Hour Sleep Dial & 5 Sleep Quality Orbs */}
      {step === 2 && (
        <div className="glass-panel rounded-2xl p-5 space-y-5">
          <h2 className="text-base font-display font-bold text-[#F2F6FF] flex items-center gap-2">
            <Moon className="w-5 h-5 text-[#8B7CFF]" />
            Step 2: 24-Hour Circular Sleep Dial & Restoration Quality
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Circular 24h Sleep Dial SVG */}
            <div className="md:col-span-5 flex flex-col items-center">
              <svg
                viewBox="0 0 220 220"
                className="w-52 h-52"
                role="img"
                aria-label={`24-Hour Sleep Dial showing ${computedSleepHours} hours of sleep`}
              >
                <circle
                  cx="110"
                  cy="110"
                  r="78"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="16"
                />
                <path
                  d={`M ${startPt.x} ${startPt.y} A 78 78 0 ${largeArcFlag} 1 ${endPt.x} ${endPt.y}`}
                  fill="none"
                  stroke="#8B7CFF"
                  strokeWidth="16"
                  strokeLinecap="round"
                />
                <circle cx={startPt.x} cy={startPt.y} r="9" fill="#3DE0FF" />
                <circle cx={endPt.x} cy={endPt.y} r="9" fill="#2DD4BF" />
                <text
                  x="110"
                  y="105"
                  textAnchor="middle"
                  className="fill-[#F2F6FF] font-display font-bold text-2xl font-mono-tabular"
                >
                  {computedSleepHours}h
                </text>
                <text
                  x="110"
                  y="126"
                  textAnchor="middle"
                  className="fill-[#A9B4CC] text-[11px]"
                >
                  Consolidated Sleep
                </text>
              </svg>
            </div>

            <div className="md:col-span-7 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#04060C]/60 border border-white/10">
                  <label className="block text-xs text-[#A9B4CC]">
                    Lights Out (UTC Hour: {sleepStartHour.toFixed(1)})
                  </label>
                  <input
                    type="range"
                    min={18}
                    max={26}
                    step={0.5}
                    value={sleepStartHour < 12 ? sleepStartHour + 24 : sleepStartHour}
                    onChange={(e) =>
                      setSleepStartHour(Number(e.target.value) % 24)
                    }
                    className="w-full mt-2 accent-[#3DE0FF]"
                  />
                </div>
                <div className="p-3 rounded-xl bg-[#04060C]/60 border border-white/10">
                  <label className="block text-xs text-[#A9B4CC]">
                    Wake Time (UTC Hour: {wakeHour.toFixed(1)})
                  </label>
                  <input
                    type="range"
                    min={3}
                    max={11}
                    step={0.5}
                    value={wakeHour}
                    onChange={(e) => setWakeHour(Number(e.target.value))}
                    className="w-full mt-2 accent-[#2DD4BF]"
                  />
                </div>
              </div>

              {/* 5 Sleep Quality Orbs */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#F2F6FF]">
                  Subjective Sleep Quality ({sleepQuality}/5)
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { v: 1, label: 'Fragmented' },
                    { v: 2, label: 'Light' },
                    { v: 3, label: 'Fair' },
                    { v: 4, label: 'Restorative' },
                    { v: 5, label: 'Deep' },
                  ].map((orb) => (
                    <button
                      key={orb.v}
                      type="button"
                      onClick={() => setSleepQuality(orb.v)}
                      className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                        sleepQuality === orb.v
                          ? 'bg-[#8B7CFF]/25 border-[#8B7CFF] text-white font-bold'
                          : 'bg-white/5 border-white/10 text-[#A9B4CC]'
                      }`}
                    >
                      <div className="text-base font-mono-tabular">{orb.v}</div>
                      <div className="text-[10px] mt-0.5">{orb.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Mind Orbs & Stress / Fatigue */}
      {step === 3 && (
        <div className="glass-panel rounded-2xl p-5 space-y-5">
          <h2 className="text-base font-display font-bold text-[#F2F6FF] flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#3DE0FF]" />
            Step 3: Behavioral Readiness — Mood Orbs, Perceived Stress & Fatigue
          </h2>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#F2F6FF]">
              Select Your Current Mood Orb ({moodScore}/5)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {MOOD_ORBS.map((orb) => {
                const active = moodScore === orb.score;
                return (
                  <button
                    key={orb.score}
                    type="button"
                    onClick={() => setMoodScore(orb.score)}
                    className={`p-3.5 rounded-2xl border text-center transition cursor-pointer ${
                      active
                        ? 'bg-white/12 border-[#3DE0FF] scale-102 shadow-lg'
                        : 'bg-[#04060C]/60 border-white/10 hover:bg-white/5'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center font-mono-tabular font-bold text-[#04060C]"
                      style={{ backgroundColor: orb.color }}
                    >
                      {orb.score}
                    </div>
                    <div className="text-xs font-bold text-[#F2F6FF]">
                      {orb.label}
                    </div>
                    <div className="text-[10px] text-[#A9B4CC] mt-0.5">
                      {orb.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#04060C]/60 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#A9B4CC]">
                  Perceived Operational Stress (1 = Calm, 5 = Overloaded)
                </span>
                <span className="font-mono-tabular font-bold text-[#F2F6FF]">
                  {stressScore}/5
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={stressScore}
                onChange={(e) => setStressScore(Number(e.target.value))}
                className="w-full accent-[#FFB547]"
              />
            </div>

            <div className="p-4 rounded-xl bg-[#04060C]/60 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#A9B4CC]">
                  Subjective Physical & Mental Fatigue (1 = Fresh, 5 = Exhausted)
                </span>
                <span className="font-mono-tabular font-bold text-[#F2F6FF]">
                  {fatigueScore}/5
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={fatigueScore}
                onChange={(e) => setFatigueScore(Number(e.target.value))}
                className="w-full accent-[#FF5C93]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Body Feel & Controlled Symptom Tags */}
      {step === 4 && (
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <h2 className="text-base font-display font-bold text-[#F2F6FF]">
            Step 4: Body Feel — Tap Any Affected System & Select Observations
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {(Object.keys(BODY_REGIONS) as BodyRegionId[]).map((rId) => {
              const reg = BODY_REGIONS[rId];
              const active = selectedRegions.includes(rId);
              return (
                <button
                  key={rId}
                  type="button"
                  onClick={() =>
                    setSelectedRegions((prev) =>
                      prev.includes(rId)
                        ? prev.filter((x) => x !== rId)
                        : [...prev, rId]
                    )
                  }
                  className={`p-2.5 rounded-xl border text-xs font-medium text-left transition cursor-pointer ${
                    active
                      ? 'bg-[#3DE0FF]/20 border-[#3DE0FF] text-white font-bold'
                      : 'bg-white/5 border-white/10 text-[#A9B4CC]'
                  }`}
                >
                  {reg.shortLabel}
                </button>
              );
            })}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#F2F6FF]">
              Controlled Symptom & Sensation Log
            </label>
            <div className="flex flex-wrap gap-2">
              {SYMPTOM_OPTIONS.map((sym) => {
                const active = selectedSymptoms.includes(sym);
                return (
                  <button
                    key={sym}
                    type="button"
                    onClick={() =>
                      setSelectedSymptoms((prev) =>
                        prev.includes(sym)
                          ? prev.filter((x) => x !== sym)
                          : [...prev, sym]
                      )
                    }
                    className={`px-3 py-1.5 rounded-lg border text-xs transition cursor-pointer ${
                      active
                        ? 'bg-[#2DD4BF]/20 border-[#2DD4BF] text-[#2DD4BF] font-bold'
                        : 'bg-white/5 border-white/10 text-[#A9B4CC]'
                    }`}
                  >
                    {sym}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#A9B4CC] mb-1">
              Optional Operational Context Note
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Adjusted sleeping berth airflow baffle; pre-EVA suit fit check today"
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white"
            />
          </div>
        </div>
      )}

      {/* Step 5: Fuel & Move */}
      {step === 5 && (
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <h2 className="text-base font-display font-bold text-[#F2F6FF] flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-[#2DD4BF]" />
            Step 5: Fuel & Move — Hydration, Rations & Gravity Countermeasures
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#04060C]/60 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#A9B4CC] flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 text-[#3DE0FF]" /> Daily Fluid
                  Intake (mL)
                </span>
                <span className="font-mono-tabular font-bold text-sm text-[#3DE0FF]">
                  {hydrationMl} mL ({Math.round(hydrationMl / 250)} pouches)
                </span>
              </div>
              <input
                type="range"
                min={500}
                max={4000}
                step={125}
                value={hydrationMl}
                onChange={(e) => setHydrationMl(Number(e.target.value))}
                className="w-full accent-[#3DE0FF]"
              />
            </div>

            <div className="p-4 rounded-xl bg-[#04060C]/60 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#A9B4CC]">
                  Planned Ration Completion (%)
                </span>
                <span className="font-mono-tabular font-bold text-sm text-[#2DD4BF]">
                  {mealPct}%
                </span>
              </div>
              <input
                type="range"
                min={25}
                max={110}
                step={5}
                value={mealPct}
                onChange={(e) => setMealPct(Number(e.target.value))}
                className="w-full accent-[#2DD4BF]"
              />
            </div>

            <div className="p-4 rounded-xl bg-[#04060C]/60 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#A9B4CC]">
                  Aerobic Exercise — CEVIS / T2 (min)
                </span>
                <span className="font-mono-tabular font-bold text-sm text-[#F2F6FF]">
                  {exerciseMin} min
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={120}
                step={5}
                value={exerciseMin}
                onChange={(e) => setExerciseMin(Number(e.target.value))}
                className="w-full accent-[#3DE0FF]"
              />
            </div>

            <div className="p-4 rounded-xl bg-[#04060C]/60 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#A9B4CC]">
                  ARED Resistive Bone/Muscle Load (min)
                </span>
                <span className="font-mono-tabular font-bold text-sm text-[#8B7CFF]">
                  {resistiveMin} min
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={90}
                step={5}
                value={resistiveMin}
                onChange={(e) => setResistiveMin(Number(e.target.value))}
                className="w-full accent-[#8B7CFF]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 6: Review & Seal (Displays "Not recorded" for null fields) */}
      {step === 6 && (
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-display font-bold text-[#F2F6FF] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#2DD4BF]" />
              Step 6: Review & Seal Check-In (Provenance: USER-ENTERED)
            </h2>
            <span className="text-xs text-[#A9B4CC]">
              Skipped fields are preserved as <code className="text-[#3DE0FF]">Not recorded</code> (never 0)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            {(Object.keys(draftMetrics) as MetricCode[]).map((mCode) => {
              const def = METRIC_DEFINITIONS[mCode];
              const val = draftMetrics[mCode];
              return (
                <div
                  key={mCode}
                  className="p-3 rounded-xl bg-[#04060C]/70 border border-white/10"
                >
                  <div className="text-[11px] text-[#7C89A6]">
                    {def.shortLabel}
                  </div>
                  <div className="font-mono-tabular font-bold text-sm text-[#F2F6FF] mt-0.5">
                    {val !== null && val !== undefined
                      ? `${val} ${def.unit}`
                      : 'Not recorded'}
                  </div>
                </div>
              );
            })}
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-400/40 text-xs text-rose-200">
              {errorMsg}
            </div>
          )}

          {sealedSuccess ? (
            <div className="p-4 rounded-xl bg-teal-500/15 border border-teal-400/40 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-[#2DD4BF] font-semibold">
                <CheckCircle2 className="w-5 h-5" />
                <span>
                  Pulse Ritual Sealed! +35 XP awarded and 14-day personal baselines re-evaluated.
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-4 py-2 rounded-lg bg-[#2DD4BF] text-[#04060C] text-xs font-bold cursor-pointer"
              >
                Return to Crew Core →
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={isSealing}
              onClick={handleSealRitual}
              className="w-full py-3.5 rounded-xl bg-[#3DE0FF] text-[#04060C] font-display font-bold text-sm flex items-center justify-center gap-2 hover:brightness-110 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {isSealing
                  ? 'Sealing & Running Deterministic Analytics…'
                  : 'Seal Pulse Ritual & Update Personal Twin (+35 XP)'}
              </span>
            </button>
          )}
        </div>
      )}

      {/* Step Footer Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => (step > 1 ? setStep(step - 1) : navigate('/'))}
          className="px-4 py-2 rounded-xl glass-panel text-xs font-semibold text-[#A9B4CC] hover:text-white flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{step > 1 ? 'Previous Step' : 'Back to Crew Core'}</span>
        </button>

        {step < 6 && (
          <button
            type="button"
            onClick={() => setStep(step + 1)}
            className="px-5 py-2 rounded-xl bg-[#3DE0FF] text-[#04060C] text-xs font-display font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <span>Next Step</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
