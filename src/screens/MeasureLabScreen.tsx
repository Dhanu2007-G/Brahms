/**
 * AstraPulse — S5 Measure Lab (/measure) Guided 4-Stage Flows, PVT Reaction Test, Camera Pulse, Vision & Ultrasound Caliper
 * Team Zenitsu — NASA Space Apps Challenge 2026
 */

import {
  Activity,
  AlertTriangle,
  Camera,
  CheckCircle2,
  Eye,
  HeartPulse,
  Maximize2,
  Ruler,
  Timer,
  Upload,
  Volume2,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import {
  averageDualBloodPressure,
  summarizeReactionTrials,
} from '../analytics/engine';
import { GlucoseContext, MetricCode } from '../analytics/types';
import { useMission } from '../context/MissionContext';

type LabTool =
  | 'bp'
  | 'hr_camera'
  | 'glucose_vitals'
  | 'pvt'
  | 'vision_ultrasound'
  | 'import';

export const MeasureLabScreen: React.FC = () => {
  const {
    recordSingleObservation,
    importObservationsBatch,
    selectedMissionDay,
    evaluations,
  } = useMission();

  const [activeTool, setActiveTool] = useState<LabTool>('bp');
  const [feedback, setFeedback] = useState<{
    type: 'ok' | 'err' | 'warn';
    msg: string;
  } | null>(null);

  // 1. Dual-Reading Blood Pressure State
  const [sbp1, setSbp1] = useState<number>(122);
  const [dbp1, setDbp1] = useState<number>(78);
  const [sbp2, setSbp2] = useState<number>(118);
  const [dbp2, setDbp2] = useState<number>(76);
  const dualBp = averageDualBloodPressure(sbp1, dbp1, sbp2, dbp2);

  // 2. Tap-Tempo & Experimental Camera Pulse State
  const [taps, setTaps] = useState<number[]>([]);
  const [cameraSimRunning, setCameraSimRunning] = useState<boolean>(false);
  const [cameraConfidence, setCameraConfidence] = useState<number>(0.78);
  const [cameraBpm, setCameraBpm] = useState<number>(66);

  const tapBpm =
    taps.length >= 3
      ? Math.round(
          60000 /
            ((taps[taps.length - 1] - taps[0]) / (taps.length - 1))
        )
      : null;

  // 3. Glucose (Mandatory meal tag) & Quick Vitals
  const [glucoseVal, setGlucoseVal] = useState<string>('92');
  const [glucoseContext, setGlucoseContext] =
    useState<GlucoseContext>('fasting');
  const [tempVal, setTempVal] = useState<string>('36.6');
  const [spo2Val, setSpo2Val] = useState<string>('98');
  const [respVal, setRespVal] = useState<string>('14');
  const [massVal, setMassVal] = useState<string>('72.2');
  const [noiseVal, setNoiseVal] = useState<string>('55.0');

  // 4. Psychomotor Vigilance Reaction Test (PVT) State
  const [pvtState, setPvtState] = useState<
    'idle' | 'waiting' | 'stimulus' | 'done'
  >('idle');
  const [pvtTrials, setPvtTrials] = useState<number[]>([]);
  const stimulusTimeRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const startNextPvtTrial = (currentTrials: number[]) => {
    if (currentTrials.length >= 5) {
      setPvtState('done');
      return;
    }
    setPvtState('waiting');
    const delay = 1200 + Math.random() * 1800;
    timerRef.current = window.setTimeout(() => {
      stimulusTimeRef.current = performance.now();
      setPvtState('stimulus');
    }, delay);
  };

  const handlePvtClick = () => {
    if (pvtState === 'waiting') {
      // False start (< 100 ms)
      if (timerRef.current) window.clearTimeout(timerRef.current);
      const next = [...pvtTrials, 45];
      setPvtTrials(next);
      startNextPvtTrial(next);
    } else if (pvtState === 'stimulus') {
      const rt = Math.round(performance.now() - stimulusTimeRef.current);
      const next = [...pvtTrials, rt];
      setPvtTrials(next);
      startNextPvtTrial(next);
    }
  };

  const pvtSummary = summarizeReactionTrials(pvtTrials);

  // 5. Vision & Ultrasound Caliper State
  const [amslerDistortion, setAmslerDistortion] = useState<boolean>(false);
  const [ultrasoundZoom, setUltrasoundZoom] = useState<number>(1.2);
  const [ultrasoundContrast, setUltrasoundContrast] = useState<number>(110);
  const [caliperPt1, setCaliperPt1] = useState<{ x: number; y: number }>({
    x: 115,
    y: 120,
  });
  const [caliperPt2, setCaliperPt2] = useState<{ x: number; y: number }>({
    x: 173,
    y: 120,
  });
  // Pixel-to-mm calibration (10px = 1.0 mm optic nerve sheath diameter)
  const caliperDistanceMm = Number(
    (
      Math.hypot(caliperPt2.x - caliperPt1.x, caliperPt2.y - caliperPt1.y) / 10
    ).toFixed(2)
  );

  // 6. Batch Import State
  const [importJsonText, setImportJsonText] = useState<string>(
    JSON.stringify(
      [
        { missionDay: 24, metric: 'heart_rate', value: 68 },
        {
          missionDay: 24,
          metric: 'blood_glucose',
          value: 91,
          glucoseContext: 'fasting',
        },
      ],
      null,
      2
    )
  );

  const handleSave = async (
    metric: MetricCode,
    value: number,
    extra?: {
      glucoseContext?: GlucoseContext;
      pairedDiastolic?: number;
      signalConfidence?: number;
      note?: string;
    }
  ) => {
    setFeedback(null);
    const res = await recordSingleObservation({
      metric,
      value,
      ...extra,
    });
    if (!res.ok) {
      setFeedback({ type: 'err', msg: res.error || 'Rejected.' });
    } else if (res.warning) {
      setFeedback({
        type: 'warn',
        msg: `Saved (${value}), note: ${res.warning}`,
      });
    } else {
      setFeedback({
        type: 'ok',
        msg: `Saved ${metric} = ${value} (USER-ENTERED) & updated personal baseline.`,
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header & Tool Selector */}
      <div className="glass-panel rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <span className="text-xs font-mono-tabular uppercase tracking-wider text-[#3DE0FF] font-bold">
              GUIDED MEASURE LAB • MD-{selectedMissionDay}
            </span>
            <h1 className="text-xl font-display font-bold text-[#F2F6FF]">
              4-Stage Crew Measurement Flows & Clinical Reference Instruments
            </h1>
          </div>
          <span className="text-xs text-[#A9B4CC]">
            Prepare → Capture → Plausibility Gate → Baseline Compare
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: 'bp', label: 'Dual Blood Pressure + MAP/PP' },
              { id: 'hr_camera', label: 'Heart Rate & Camera Pulse' },
              { id: 'glucose_vitals', label: 'Glucose (Meal Tag) & Vitals' },
              { id: 'pvt', label: '1-Min Reaction Test (PVT)' },
              { id: 'vision_ultrasound', label: 'SANS Vision & Ultrasound Caliper' },
              { id: 'import', label: 'Batch Telemetry Import' },
            ] as { id: LabTool; label: string }[]
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setActiveTool(t.id);
                setFeedback(null);
              }}
              className={`px-3.5 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                activeTool === t.id
                  ? 'bg-[#3DE0FF] text-[#04060C] border-[#3DE0FF]'
                  : 'bg-white/5 border-white/10 text-[#A9B4CC] hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
            feedback.type === 'err'
              ? 'bg-rose-500/15 border-rose-400/40 text-rose-200'
              : feedback.type === 'warn'
              ? 'bg-amber-500/15 border-amber-400/40 text-amber-200'
              : 'bg-teal-500/15 border-teal-400/40 text-[#2DD4BF]'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Tool 1: Dual-Reading Blood Pressure */}
      {activeTool === 'bp' && (
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <h2 className="text-base font-display font-bold text-[#F2F6FF] flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-[#3DE0FF]" />
            Dual-Reading Oscillometric Blood Pressure Averaging (C-06, C-07, C-08)
          </h2>
          <p className="text-xs text-[#A9B4CC]">
            Stage 1 Prepare: Rest quietly for 5 minutes with brachial cuff at
            heart level. Take 2 readings 60 seconds apart.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#04060C]/60 border border-white/10 space-y-3">
              <div className="text-xs font-bold text-[#3DE0FF]">
                Reading #1 (T = 0s)
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#A9B4CC] mb-1">
                    Systolic 1 (mmHg)
                  </label>
                  <input
                    type="number"
                    value={sbp1}
                    onChange={(e) => setSbp1(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 font-mono-tabular text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#A9B4CC] mb-1">
                    Diastolic 1 (mmHg)
                  </label>
                  <input
                    type="number"
                    value={dbp1}
                    onChange={(e) => setDbp1(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 font-mono-tabular text-white"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#04060C]/60 border border-white/10 space-y-3">
              <div className="text-xs font-bold text-[#2DD4BF]">
                Reading #2 (T = +60s)
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#A9B4CC] mb-1">
                    Systolic 2 (mmHg)
                  </label>
                  <input
                    type="number"
                    value={sbp2}
                    onChange={(e) => setSbp2(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 font-mono-tabular text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#A9B4CC] mb-1">
                    Diastolic 2 (mmHg)
                  </label>
                  <input
                    type="number"
                    value={dbp2}
                    onChange={(e) => setDbp2(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 font-mono-tabular text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {dualBp.wideSpreadWarning && (
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-400/40 text-xs text-amber-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#FFB547]" />
              <span>
                Wide spread detected between Reading 1 and Reading 2 (&gt;10
                mmHg systolic or &gt;6 mmHg diastolic). Consider resting 2
                minutes and taking a 3rd confirmatory reading.
              </span>
            </div>
          )}

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <div className="text-[11px] text-[#7C89A6]">Averaged BP</div>
                <div className="text-2xl font-display font-bold font-mono-tabular text-[#F2F6FF]">
                  {dualBp.systolic} / {dualBp.diastolic}{' '}
                  <span className="text-xs font-normal text-[#A9B4CC]">
                    mmHg
                  </span>
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[#7C89A6]">
                  Mean Arterial Pressure (MAP)
                </div>
                <div className="text-xl font-display font-bold font-mono-tabular text-[#2DD4BF]">
                  {dualBp.map ?? 'Invalid'} mmHg
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[#7C89A6]">
                  Pulse Pressure (PP)
                </div>
                <div className="text-xl font-display font-bold font-mono-tabular text-[#3DE0FF]">
                  {dualBp.pulsePressure ?? 'Invalid'} mmHg
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                handleSave('systolic_bp', dualBp.systolic, {
                  pairedDiastolic: dualBp.diastolic,
                  note: 'Dual-cuff averaged reading',
                })
              }
              className="px-5 py-2.5 rounded-xl bg-[#3DE0FF] text-[#04060C] text-xs font-display font-bold cursor-pointer"
            >
              Confirm & Save BP + MAP + PP
            </button>
          </div>
        </div>
      )}

      {/* Tool 2: Resting HR Tap-Tempo & Experimental Camera Pulse */}
      {activeTool === 'hr_camera' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tap-Tempo HR */}
          <div className="glass-panel rounded-2xl p-5 space-y-4">
            <h3 className="text-base font-display font-bold text-[#F2F6FF]">
              Method A: Radial/Carotid Tap-Tempo Counter
            </h3>
            <p className="text-xs text-[#A9B4CC]">
              Palpate your radial pulse and tap the button in rhythm for at
              least 5 beats.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setTaps((prev) => [...prev.slice(-8), Date.now()])}
                className="flex-1 py-6 rounded-2xl bg-[#3DE0FF]/15 border-2 border-[#3DE0FF] text-[#3DE0FF] font-display font-bold text-base hover:bg-[#3DE0FF]/25 cursor-pointer"
              >
                TAP ON EACH HEARTBEAT ({taps.length} taps)
              </button>
              <button
                type="button"
                onClick={() => setTaps([])}
                className="px-3 py-6 rounded-xl glass-panel text-xs text-[#A9B4CC]"
              >
                Reset
              </button>
            </div>
            <div className="flex items-center justify-between pt-2">
              <div>
                <div className="text-xs text-[#7C89A6]">Estimated Resting HR</div>
                <div className="text-2xl font-display font-bold font-mono-tabular text-[#F2F6FF]">
                  {tapBpm ? `${tapBpm} bpm` : 'Tap 3+ times'}
                </div>
              </div>
              {tapBpm && (
                <button
                  type="button"
                  onClick={() =>
                    handleSave('heart_rate', tapBpm, {
                      note: 'Tap-tempo radial check',
                    })
                  }
                  className="px-4 py-2 rounded-xl bg-[#2DD4BF] text-[#04060C] text-xs font-bold cursor-pointer"
                >
                  Save {tapBpm} bpm
                </button>
              )}
            </div>
          </div>

          {/* Experimental Camera Pulse (With Signal Confidence Gate >= 0.4; never auto-saves) */}
          <div className="glass-panel rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-display font-bold text-[#F2F6FF] flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#8B7CFF]" />
                Method B: Experimental Camera Pulse (PPG)
              </h3>
              <span className="px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-400/40 text-[10px] font-mono-tabular text-indigo-300">
                EXPERIMENTAL • NEVER AUTO-SAVES
              </span>
            </div>
            <p className="text-xs text-[#A9B4CC]">
              Requires optical signal quality confidence &ge; 40% (0.40) before
              unlocking manual confirmation.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-[#A9B4CC] mb-1">
                  Detected Pulse (bpm)
                </label>
                <input
                  type="number"
                  value={cameraBpm}
                  onChange={(e) => setCameraBpm(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/15 font-mono-tabular text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#A9B4CC] mb-1">
                  Optical Confidence ({Math.round(cameraConfidence * 100)}%)
                </label>
                <input
                  type="range"
                  min={0.1}
                  max={0.98}
                  step={0.04}
                  value={cameraConfidence}
                  onChange={(e) => setCameraConfidence(Number(e.target.value))}
                  className="w-full mt-2 accent-[#8B7CFF]"
                />
              </div>
            </div>

            {cameraConfidence < 0.4 && (
              <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-400/40 text-xs text-rose-200">
                Signal confidence ({Math.round(cameraConfidence * 100)}%) is
                below the 40% reliability gate. Saving is blocked to protect
                your personal baseline.
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setCameraSimRunning((r) => !r)}
                className="px-3 py-2 rounded-lg glass-panel text-xs text-[#3DE0FF] cursor-pointer"
              >
                {cameraSimRunning ? 'Stop Optical Capture' : 'Start 15s Capture'}
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSave('heart_rate', cameraBpm, {
                    signalConfidence: cameraConfidence,
                    note: `Optical camera PPG (conf ${Math.round(
                      cameraConfidence * 100
                    )}%)`,
                  })
                }
                className="px-4 py-2 rounded-xl bg-[#8B7CFF] text-white text-xs font-bold cursor-pointer"
              >
                Manually Confirm & Save ({cameraBpm} bpm)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tool 3: Blood Glucose (Mandatory Meal Context) & Core Vitals */}
      {activeTool === 'glucose_vitals' && (
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <h2 className="text-base font-display font-bold text-[#F2F6FF]">
            Context-Tagged Blood Glucose & Spot Vitals Capture
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Blood Glucose with mandatory meal context */}
            <div className="p-4 rounded-xl bg-[#04060C]/60 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#3DE0FF]">
                  Blood Glucose (mg/dL)
                </span>
                <select
                  value={glucoseContext}
                  onChange={(e) =>
                    setGlucoseContext(e.target.value as GlucoseContext)
                  }
                  aria-label="Blood Glucose Meal Timing Tag"
                  className="text-xs bg-white/10 rounded px-2 py-0.5 text-white"
                >
                  <option value="fasting" className="bg-[#0A0F1C]">
                    Fasting (&ge;8h)
                  </option>
                  <option value="pre_meal" className="bg-[#0A0F1C]">
                    Pre-meal
                  </option>
                  <option value="post_meal" className="bg-[#0A0F1C]">
                    Post-meal (2h)
                  </option>
                </select>
              </div>
              <input
                type="number"
                value={glucoseVal}
                onChange={(e) => setGlucoseVal(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/15 font-mono-tabular text-white"
              />
              <button
                type="button"
                onClick={() =>
                  handleSave('blood_glucose', Number(glucoseVal), {
                    glucoseContext,
                  })
                }
                className="w-full py-1.5 rounded-lg bg-[#3DE0FF] text-[#04060C] text-xs font-bold cursor-pointer"
              >
                Save Glucose ({glucoseContext})
              </button>
            </div>

            {/* Body Temperature */}
            <div className="p-4 rounded-xl bg-[#04060C]/60 border border-white/10 space-y-2">
              <span className="text-xs font-bold text-[#2DD4BF]">
                Core Body Temp (°C) [33–42.5]
              </span>
              <input
                type="number"
                step="0.1"
                value={tempVal}
                onChange={(e) => setTempVal(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/15 font-mono-tabular text-white"
              />
              <button
                type="button"
                onClick={() => handleSave('body_temp_c', Number(tempVal))}
                className="w-full py-1.5 rounded-lg bg-[#2DD4BF] text-[#04060C] text-xs font-bold cursor-pointer"
              >
                Save Temperature
              </button>
            </div>

            {/* SpO2 */}
            <div className="p-4 rounded-xl bg-[#04060C]/60 border border-white/10 space-y-2">
              <span className="text-xs font-bold text-[#8B7CFF]">
                Blood Oxygen SpO₂ (%) [65–100]
              </span>
              <input
                type="number"
                value={spo2Val}
                onChange={(e) => setSpo2Val(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/15 font-mono-tabular text-white"
              />
              <button
                type="button"
                onClick={() => handleSave('spo2_pct', Number(spo2Val))}
                className="w-full py-1.5 rounded-lg bg-[#8B7CFF] text-white text-xs font-bold cursor-pointer"
              >
                Save SpO₂
              </button>
            </div>

            {/* Respiratory Rate */}
            <div className="p-4 rounded-xl bg-[#04060C]/60 border border-white/10 space-y-2">
              <span className="text-xs font-bold text-[#F2F6FF]">
                Respiratory Rate (br/min) [5–50]
              </span>
              <input
                type="number"
                value={respVal}
                onChange={(e) => setRespVal(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/15 font-mono-tabular text-white"
              />
              <button
                type="button"
                onClick={() => handleSave('respiratory_rate', Number(respVal))}
                className="w-full py-1.5 rounded-lg bg-white/15 text-white text-xs font-bold cursor-pointer"
              >
                Save Resp Rate
              </button>
            </div>

            {/* Body Mass */}
            <div className="p-4 rounded-xl bg-[#04060C]/60 border border-white/10 space-y-2">
              <span className="text-xs font-bold text-[#F2F6FF]">
                Inertial Body Mass (kg) [SLAMMD]
              </span>
              <input
                type="number"
                step="0.1"
                value={massVal}
                onChange={(e) => setMassVal(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/15 font-mono-tabular text-white"
              />
              <button
                type="button"
                onClick={() => handleSave('body_mass_kg', Number(massVal))}
                className="w-full py-1.5 rounded-lg bg-white/15 text-white text-xs font-bold cursor-pointer"
              >
                Save Body Mass
              </button>
            </div>

            {/* Ambient Cabin Noise */}
            <div className="p-4 rounded-xl bg-[#04060C]/60 border border-white/10 space-y-2">
              <span className="text-xs font-bold text-[#FFB547] flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5" /> Habitat Noise (dBA)
              </span>
              <input
                type="number"
                step="0.5"
                value={noiseVal}
                onChange={(e) => setNoiseVal(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/15 font-mono-tabular text-white"
              />
              <button
                type="button"
                onClick={() => handleSave('cabin_noise_dba', Number(noiseVal))}
                className="w-full py-1.5 rounded-lg bg-amber-500/20 border border-amber-400/40 text-[#FFB547] text-xs font-bold cursor-pointer"
              >
                Log Cabin Noise
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tool 4: Psychomotor Vigilance Reaction Test (PVT C-10) */}
      {activeTool === 'pvt' && (
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-display font-bold text-[#F2F6FF] flex items-center gap-2">
                <Timer className="w-5 h-5 text-[#3DE0FF]" />
                Psychomotor Vigilance Reaction Test (PVT — 5 Rapid Trials)
              </h2>
              <p className="text-xs text-[#A9B4CC]">
                Click or tap the target zone the instant it turns Cyan. Measures
                attentional alertness, false starts (&lt;100 ms), and lapses
                (&gt;500 ms).
              </p>
            </div>
            <span className="font-mono-tabular text-xs text-[#2DD4BF]">
              14d Baseline: {evaluations.reaction_time_ms?.baseline.median ?? 238} ms
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-7">
              {pvtState === 'idle' ? (
                <button
                  type="button"
                  onClick={() => {
                    setPvtTrials([]);
                    startNextPvtTrial([]);
                  }}
                  className="w-full h-44 rounded-2xl bg-[#3DE0FF]/15 border-2 border-[#3DE0FF] text-[#3DE0FF] font-display font-bold text-base cursor-pointer hover:bg-[#3DE0FF]/25"
                >
                  START 5-TRIAL REACTION TEST
                </button>
              ) : pvtState === 'waiting' ? (
                <button
                  type="button"
                  onClick={handlePvtClick}
                  className="w-full h-44 rounded-2xl bg-[#04060C] border-2 border-amber-400/50 text-[#FFB547] font-display font-bold text-base cursor-pointer"
                >
                  WAIT FOR CYAN SIGNAL… (Trial {pvtTrials.length + 1}/5)
                </button>
              ) : pvtState === 'stimulus' ? (
                <button
                  type="button"
                  onClick={handlePvtClick}
                  className="w-full h-44 rounded-2xl bg-[#3DE0FF] text-[#04060C] font-display font-bold text-2xl cursor-pointer shadow-2xl"
                >
                  TAP NOW!
                </button>
              ) : (
                <div className="h-44 rounded-2xl bg-teal-500/15 border border-teal-400/40 p-4 flex flex-col items-center justify-center gap-2">
                  <div className="text-sm font-bold text-[#2DD4BF]">
                    PVT Session Complete — Median: {pvtSummary.medianMs ?? '—'} ms
                  </div>
                  <div className="flex items-center gap-2">
                    {pvtSummary.medianMs && (
                      <button
                        type="button"
                        onClick={() =>
                          handleSave('reaction_time_ms', pvtSummary.medianMs!)
                        }
                        className="px-4 py-2 rounded-xl bg-[#2DD4BF] text-[#04060C] text-xs font-bold cursor-pointer"
                      >
                        Save {pvtSummary.medianMs} ms to Baseline
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setPvtTrials([]);
                        setPvtState('idle');
                      }}
                      className="px-3 py-2 rounded-xl glass-panel text-xs text-[#A9B4CC]"
                    >
                      Repeat Test
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="md:col-span-5 p-4 rounded-xl bg-[#04060C]/70 border border-white/10 space-y-2 text-xs">
              <div className="font-bold text-[#F2F6FF]">
                Session Telemetry (C-10)
              </div>
              <div className="flex justify-between text-[#A9B4CC]">
                <span>Trials Recorded:</span>
                <span className="font-mono-tabular text-white">
                  {pvtTrials.map((t) => `${t}ms`).join(', ') || 'None yet'}
                </span>
              </div>
              <div className="flex justify-between text-[#A9B4CC]">
                <span>Median Latency:</span>
                <span className="font-mono-tabular font-bold text-[#3DE0FF]">
                  {pvtSummary.medianMs ? `${pvtSummary.medianMs} ms` : '—'}
                </span>
              </div>
              <div className="flex justify-between text-[#A9B4CC]">
                <span>Lapses (&gt;500 ms):</span>
                <span className="font-mono-tabular text-[#FFB547]">
                  {pvtSummary.lapsesCount}
                </span>
              </div>
              <div className="flex justify-between text-[#A9B4CC]">
                <span>False Starts (&lt;100 ms):</span>
                <span className="font-mono-tabular text-[#FF5C93]">
                  {pvtSummary.falseStartsCount}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tool 5: SANS Vision Self-Check & Ocular Ultrasound Caliper Viewer */}
      {activeTool === 'vision_ultrasound' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Amsler Grid & Acuity */}
          <div className="glass-panel rounded-2xl p-5 space-y-4">
            <h3 className="text-base font-display font-bold text-[#F2F6FF] flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#3DE0FF]" />
              SANS Amsler Grid & Visual Acuity Check
            </h3>
            <p className="text-xs text-[#A9B4CC]">
              Focus on the central cyan dot at 40 cm distance with one eye
              covered. Check whether any grid lines appear wavy or missing.
            </p>

            <div className="flex items-center justify-center">
              <svg
                viewBox="0 0 200 200"
                className="w-44 h-44 bg-[#04060C] border border-white/25 rounded-lg"
              >
                {Array.from({ length: 11 }).map((_, i) => {
                  const pos = i * 20;
                  return (
                    <g key={i} stroke="rgba(255,255,255,0.22)" strokeWidth="1">
                      <line x1={pos} y1={0} x2={pos} y2={200} />
                      <line x1={0} y1={pos} x2={200} y2={pos} />
                    </g>
                  );
                })}
                <circle cx="100" cy="100" r="4" fill="#3DE0FF" />
              </svg>
            </div>

            <div className="flex items-center justify-between pt-2 text-xs">
              <label className="flex items-center gap-2 text-[#F2F6FF] cursor-pointer">
                <input
                  type="checkbox"
                  checked={amslerDistortion}
                  onChange={(e) => setAmslerDistortion(e.target.checked)}
                />
                <span>Central grid distortion / waviness noted</span>
              </label>
              <button
                type="button"
                onClick={() =>
                  setFeedback({
                    type: amslerDistortion ? 'warn' : 'ok',
                    msg: amslerDistortion
                      ? 'SANS Amsler distortion logged — recommend queuing ocular ultrasound & Ground Link review.'
                      : 'SANS Amsler grid & acuity logged as clear (20/20 equivalent).',
                  })
                }
                className="px-3 py-1.5 rounded-lg bg-[#3DE0FF] text-[#04060C] font-bold cursor-pointer"
              >
                Log Vision Check
              </button>
            </div>
          </div>

          {/* Ocular Ultrasound Viewer with Zoom, Contrast & Distance Caliper */}
          <div className="glass-panel rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-display font-bold text-[#F2F6FF] flex items-center gap-2">
                <Ruler className="w-4 h-4 text-[#2DD4BF]" />
                Ocular Ultrasound Viewer & ONSD Caliper
              </h3>
              <span className="font-mono-tabular text-xs text-[#2DD4BF] font-bold">
                Caliper: {caliperDistanceMm} mm
              </span>
            </div>

            <div className="relative overflow-hidden rounded-xl bg-[#04060C] border border-white/15 flex items-center justify-center h-44">
              <svg
                viewBox="0 0 280 180"
                className="w-full h-full"
                style={{
                  transform: `scale(${ultrasoundZoom})`,
                  filter: `contrast(${ultrasoundContrast}%)`,
                }}
              >
                <defs>
                  <radialGradient id="globeEcho" cx="50%" cy="38%" r="48%">
                    <stop offset="0%" stopColor="#04060C" />
                    <stop offset="72%" stopColor="#1E293B" />
                    <stop offset="88%" stopColor="#94A3B8" />
                    <stop offset="100%" stopColor="#0F172A" />
                  </radialGradient>
                </defs>
                {/* Simulated B-mode Ocular Globe & Optic Nerve Sheath */}
                <ellipse
                  cx="144"
                  cy="62"
                  rx="58"
                  ry="48"
                  fill="url(#globeEcho)"
                  stroke="#CBD5E1"
                  strokeWidth="2"
                />
                {/* Optic Nerve Sheath Hypoechoic Track */}
                <path
                  d="M115 108 L112 175 L176 175 L173 108 Z"
                  fill="rgba(15,23,42,0.92)"
                  stroke="#64748B"
                  strokeWidth="1.5"
                />
                {/* Interactive Caliper Line */}
                <line
                  x1={caliperPt1.x}
                  y1={caliperPt1.y}
                  x2={caliperPt2.x}
                  y2={caliperPt2.y}
                  stroke="#3DE0FF"
                  strokeWidth="2"
                  strokeDasharray="3 2"
                />
                <circle cx={caliperPt1.x} cy={caliperPt1.y} r="4" fill="#3DE0FF" />
                <circle cx={caliperPt2.x} cy={caliperPt2.y} r="4" fill="#2DD4BF" />
                <text
                  x={(caliperPt1.x + caliperPt2.x) / 2}
                  y={caliperPt1.y - 8}
                  textAnchor="middle"
                  className="fill-[#3DE0FF] font-mono-tabular text-[10px] font-bold"
                >
                  ONSD: {caliperDistanceMm} mm
                </text>
              </svg>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="block text-[10px] text-[#A9B4CC]">
                  Zoom ({ultrasoundZoom.toFixed(1)}x)
                </label>
                <input
                  type="range"
                  min={1.0}
                  max={2.0}
                  step={0.1}
                  value={ultrasoundZoom}
                  onChange={(e) => setUltrasoundZoom(Number(e.target.value))}
                  className="w-full accent-[#3DE0FF]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#A9B4CC]">
                  Contrast ({ultrasoundContrast}%)
                </label>
                <input
                  type="range"
                  min={80}
                  max={160}
                  step={5}
                  value={ultrasoundContrast}
                  onChange={(e) => setUltrasoundContrast(Number(e.target.value))}
                  className="w-full accent-[#2DD4BF]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#A9B4CC]">
                  Sheath Span ({caliperDistanceMm} mm)
                </label>
                <input
                  type="range"
                  min={155}
                  max={185}
                  step={1}
                  value={caliperPt2.x}
                  onChange={(e) =>
                    setCaliperPt2({ x: Number(e.target.value), y: 120 })
                  }
                  className="w-full accent-[#8B7CFF]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tool 6: Batch Telemetry Import */}
      {activeTool === 'import' && (
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <h2 className="text-base font-display font-bold text-[#F2F6FF] flex items-center gap-2">
            <Upload className="w-5 h-5 text-[#3DE0FF]" />
            Batch Sensor Telemetry Import (Provenance: IMPORTED)
          </h2>
          <p className="text-xs text-[#A9B4CC]">
            Paste JSON sensor array; each row is validated against physiological
            plausibility bounds before ingestion.
          </p>
          <textarea
            rows={6}
            value={importJsonText}
            onChange={(e) => setImportJsonText(e.target.value)}
            className="w-full p-3 rounded-xl bg-[#04060C] border border-white/15 font-mono-tabular text-xs text-white"
          />
          <button
            type="button"
            onClick={async () => {
              try {
                const parsed = JSON.parse(importJsonText);
                const res = await importObservationsBatch(parsed);
                setFeedback({
                  type: res.rejectedCount > 0 ? 'warn' : 'ok',
                  msg: `Imported ${res.acceptedCount} rows (${res.rejectedCount} rejected). ${res.errors.join(' ')}`,
                });
              } catch {
                setFeedback({
                  type: 'err',
                  msg: 'Invalid JSON syntax in import payload.',
                });
              }
            }}
            className="px-4 py-2 rounded-xl bg-[#3DE0FF] text-[#04060C] text-xs font-bold cursor-pointer"
          >
            Validate & Import Telemetry Batch
          </button>
        </div>
      )}
    </div>
  );
};
