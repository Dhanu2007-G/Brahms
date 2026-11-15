/**
 * AstraPulse — Pure Deterministic Analytics & Decision-Support Engine (C-01 .. C-31)
 * Team Zenitsu — NASA Space Apps Challenge 2026
 *
 * Prime Directives Enforced:
 * 1. Missing values (`null` / `undefined`) are NEVER coerced to `0` or `"normal"`.
 * 2. Every output carries provenance, rule ID, ruleset version, baseline median, latest value,
 *    persistence count, and contributing observation IDs.
 * 3. No clinical diagnoses or medication names/doses are ever generated.
 */

import {
  BODY_REGIONS,
  METRIC_DEFINITIONS,
  NASA_HAZARDS,
  RULESET_CONFIG,
  RULESET_VERSION,
} from './ruleset';
import {
  AlertItem,
  AlertSeverity,
  BaselineStats,
  BodyRegionId,
  BodyRegionStatus,
  HazardId,
  HazardNodeStatus,
  MetricCode,
  MetricDirection,
  MetricEvaluation,
  Observation,
  ProvenanceSource,
  StatusTier,
  VitalityRingScore,
} from './types';

/**
 * Pure statistical median of a numeric array. Returns null on empty input.
 */
export function median(values: number[]): number | null {
  const valid = values.filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (valid.length === 0) return null;
  const sorted = [...valid].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[mid];
  }
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Median Absolute Deviation (MAD): median(|x - median(X)|)
 */
export function computeMAD(values: number[], med?: number | null): number | null {
  const valid = values.filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (valid.length === 0) return null;
  const m = med !== undefined && med !== null ? med : median(valid);
  if (m === null) return null;
  const absDevs = valid.map((v) => Math.abs(v - m));
  return median(absDevs);
}

/**
 * Interquartile Range (IQR = Q3 - Q1) using linear interpolation (R-7 / Excel / NumPy default)
 * or standard half-sample median so small arrays behave predictably.
 */
export function quantile(sorted: number[], p: number): number {
  if (sorted.length === 0) return NaN;
  if (sorted.length === 1) return sorted[0];
  const pos = (sorted.length - 1) * p;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

export function computeIQR(values: number[]): number | null {
  const valid = values.filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (valid.length < 2) return null;
  const sorted = [...valid].sort((a, b) => a - b);
  const q1 = quantile(sorted, 0.25);
  const q3 = quantile(sorted, 0.75);
  return Math.max(0, q3 - q1);
}

/**
 * C-01: Compute Personal Rolling Baseline from up to `windowDays` (14) samples.
 * Requires >= 5 valid samples for 'ready', 3..4 for 'building', <3 for 'insufficient'.
 */
export function computeBaseline(
  metric: MetricCode,
  values: (number | null | undefined)[],
  windowDays = RULESET_CONFIG.baseline.window_days
): BaselineStats {
  const def = METRIC_DEFINITIONS[metric];
  const valid = values
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
    .slice(-windowDays);

  const sampleCount = valid.length;
  if (sampleCount < RULESET_CONFIG.baseline.building_min_samples) {
    return {
      metric,
      median: sampleCount > 0 ? median(valid) : null,
      mad: null,
      iqr: null,
      effectiveSpread: null,
      sampleCount,
      windowDays,
      status: 'insufficient',
      bandLow: null,
      bandHigh: null,
    };
  }

  const med = median(valid)!;
  const mad = computeMAD(valid, med) ?? 0;
  const iqr = computeIQR(valid) ?? 0;
  const scaledMad = RULESET_CONFIG.baseline.mad_scale_factor * mad;
  const scaledIqr = RULESET_CONFIG.baseline.iqr_scale_factor * iqr;
  const effectiveSpread = Math.max(scaledMad, scaledIqr, def.floorBandwidth);

  const status =
    sampleCount >= RULESET_CONFIG.baseline.min_samples ? 'ready' : 'building';

  // Personal nominal band is median ± 1.8 * effectiveSpread (clipped to direction)
  const bandRadius = 1.8 * effectiveSpread;
  const bandLow =
    def.direction === 'high_bad'
      ? Math.max(def.minPlausible, med - bandRadius)
      : Math.max(def.minPlausible, Number((med - bandRadius).toFixed(def.decimals)));
  const bandHigh =
    def.direction === 'low_bad'
      ? Math.min(def.maxPlausible, med + bandRadius)
      : Math.min(def.maxPlausible, Number((med + bandRadius).toFixed(def.decimals)));

  return {
    metric,
    median: Number(med.toFixed(def.decimals + 1)),
    mad: Number(mad.toFixed(def.decimals + 2)),
    iqr: Number(iqr.toFixed(def.decimals + 2)),
    effectiveSpread: Number(effectiveSpread.toFixed(4)),
    sampleCount,
    windowDays,
    status,
    bandLow: Number(bandLow.toFixed(def.decimals)),
    bandHigh: Number(bandHigh.toFixed(def.decimals)),
  };
}

/**
 * C-02: Signed Robust Z-Score
 */
export function computeRobustZ(
  value: number | null | undefined,
  baseline: BaselineStats
): number | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  if (
    baseline.median === null ||
    baseline.effectiveSpread === null ||
    baseline.effectiveSpread <= 0
  ) {
    return null;
  }
  return Number(((value - baseline.median) / baseline.effectiveSpread).toFixed(4));
}

/**
 * C-03: Directional Adverse Deviation Z-Score (>= 0)
 * Respects whether high values, low values, or both directions are adverse.
 */
export function computeAdverseZ(
  robustZ: number | null,
  direction: MetricDirection
): number | null {
  if (robustZ === null || !Number.isFinite(robustZ)) return null;
  if (direction === 'two_sided') return Number(Math.abs(robustZ).toFixed(4));
  if (direction === 'high_bad') return Number(Math.max(0, robustZ).toFixed(4));
  if (direction === 'low_bad') return Number(Math.max(0, -robustZ).toFixed(4));
  return Math.abs(robustZ);
}

/**
 * C-04: Rolling Median over trailing k valid samples
 */
export function computeRollingMedian(
  values: (number | null | undefined)[],
  k: number
): number | null {
  const valid = values.filter(
    (v): v is number => typeof v === 'number' && Number.isFinite(v)
  );
  if (valid.length === 0) return null;
  return median(valid.slice(-k));
}

/**
 * C-05: Non-parametric Theil-Sen Slope Estimator over (missionDay, value) pairs.
 * Requires >= 3 valid points.
 */
export function computeTheilSenSlope(
  points: { day: number; value: number | null | undefined }[]
): { slope: number | null; direction: 'rising' | 'falling' | 'flat' | 'insufficient' } {
  const valid = points
    .filter(
      (p): p is { day: number; value: number } =>
        typeof p.value === 'number' &&
        Number.isFinite(p.value) &&
        typeof p.day === 'number'
    )
    .sort((a, b) => a.day - b.day);

  if (valid.length < 3) {
    return { slope: null, direction: 'insufficient' };
  }

  const slopes: number[] = [];
  for (let i = 0; i < valid.length; i++) {
    for (let j = i + 1; j < valid.length; j++) {
      const dt = valid[j].day - valid[i].day;
      if (dt > 0) {
        slopes.push((valid[j].value - valid[i].value) / dt);
      }
    }
  }

  const medSlope = median(slopes);
  if (medSlope === null) {
    return { slope: null, direction: 'insufficient' };
  }

  const rounded = Number(medSlope.toFixed(4));
  if (Math.abs(rounded) < 0.02) {
    return { slope: rounded, direction: 'flat' };
  }
  return {
    slope: rounded,
    direction: rounded > 0 ? 'rising' : 'falling',
  };
}

/**
 * C-06 & C-07: Derived Hemodynamics — Mean Arterial Pressure (MAP) & Pulse Pressure (PP)
 */
export function computeDerivedBloodPressure(
  systolic: number | null | undefined,
  diastolic: number | null | undefined
): { map: number | null; pulsePressure: number | null; validOrder: boolean } {
  if (
    systolic === null ||
    systolic === undefined ||
    diastolic === null ||
    diastolic === undefined ||
    !Number.isFinite(systolic) ||
    !Number.isFinite(diastolic)
  ) {
    return { map: null, pulsePressure: null, validOrder: true };
  }
  if (systolic <= diastolic) {
    return { map: null, pulsePressure: null, validOrder: false };
  }
  const pp = Number((systolic - diastolic).toFixed(0));
  const map = Number((diastolic + (systolic - diastolic) / 3).toFixed(1));
  return { map, pulsePressure: pp, validOrder: true };
}

/**
 * C-08: Dual Blood Pressure Reading Average & Spread Check
 */
export function averageDualBloodPressure(
  sbp1: number,
  dbp1: number,
  sbp2: number,
  dbp2: number
): {
  systolic: number;
  diastolic: number;
  map: number | null;
  pulsePressure: number | null;
  wideSpreadWarning: boolean;
} {
  const systolic = Math.round((sbp1 + sbp2) / 2);
  const diastolic = Math.round((dbp1 + dbp2) / 2);
  const wideSpreadWarning = Math.abs(sbp1 - sbp2) > 10 || Math.abs(dbp1 - dbp2) > 6;
  const derived = computeDerivedBloodPressure(systolic, diastolic);
  return {
    systolic,
    diastolic,
    map: derived.map,
    pulsePressure: derived.pulsePressure,
    wideSpreadWarning,
  };
}

/**
 * C-09: 7-Day Cumulative Sleep Debt (never imputes null as 0)
 */
export function computeSleepDebt(
  sleepHoursLast7Days: (number | null | undefined)[],
  targetHours = 8.0
): { debtHours: number; recordedDays: number; averageHours: number | null } {
  const valid = sleepHoursLast7Days
    .slice(-7)
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));

  if (valid.length === 0) {
    return { debtHours: 0, recordedDays: 0, averageHours: null };
  }

  const debt = valid.reduce((sum, h) => sum + Math.max(0, targetHours - h), 0);
  const avg = valid.reduce((sum, h) => sum + h, 0) / valid.length;
  return {
    debtHours: Number(debt.toFixed(1)),
    recordedDays: valid.length,
    averageHours: Number(avg.toFixed(1)),
  };
}

/**
 * C-10: Psychomotor Vigilance Reaction Test (PVT) Summary
 */
export function summarizeReactionTrials(trialsMs: number[]): {
  medianMs: number | null;
  fastestMs: number | null;
  slowestMs: number | null;
  lapsesCount: number; // > 500 ms
  falseStartsCount: number; // < 100 ms
  validTrialsCount: number;
} {
  const falseStartsCount = trialsMs.filter((t) => t < 100).length;
  const valid = trialsMs.filter((t) => t >= 100 && t <= 2000);
  if (valid.length === 0) {
    return {
      medianMs: null,
      fastestMs: null,
      slowestMs: null,
      lapsesCount: 0,
      falseStartsCount,
      validTrialsCount: 0,
    };
  }
  const med = median(valid);
  return {
    medianMs: med !== null ? Math.round(med) : null,
    fastestMs: Math.round(Math.min(...valid)),
    slowestMs: Math.round(Math.max(...valid)),
    lapsesCount: valid.filter((t) => t > 500).length,
    falseStartsCount,
    validTrialsCount: valid.length,
  };
}

/**
 * C-15: Radiation Dose Projection (Absorbed Dose in mGy; never conflated with Sv)
 */
export function computeRadiationProjection(
  dailyDosesMgy: (number | null | undefined)[],
  totalMissionDays = 180
): {
  cumulativeMgy: number;
  rolling7DayRateMgy: number;
  projectedTotalMgy: number;
  recordedDays: number;
} {
  const valid = dailyDosesMgy.filter(
    (v): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0
  );
  if (valid.length === 0) {
    return {
      cumulativeMgy: 0,
      rolling7DayRateMgy: 0,
      projectedTotalMgy: 0,
      recordedDays: 0,
    };
  }
  const cumulative = valid.reduce((a, b) => a + b, 0);
  const trailing7 = valid.slice(-7);
  const rate = trailing7.reduce((a, b) => a + b, 0) / trailing7.length;
  const remainingDays = Math.max(0, totalMissionDays - valid.length);
  const projected = cumulative + remainingDays * rate;
  return {
    cumulativeMgy: Number(cumulative.toFixed(2)),
    rolling7DayRateMgy: Number(rate.toFixed(2)),
    projectedTotalMgy: Number(projected.toFixed(1)),
    recordedDays: valid.length,
  };
}

/**
 * C-16 & C-17: One-Way Light-Time Delay & Store-and-Forward Transfer Time
 */
export function computeLightTimeDelaySec(distanceKm: number): number {
  const SPEED_OF_LIGHT_KM_S = 299_792.458;
  return Number(Math.max(0.5, distanceKm / SPEED_OF_LIGHT_KM_S).toFixed(1));
}

export function computePacketTransferSec(
  distanceKm: number,
  payloadSizeKb = 48,
  uplinkKbps = 64
): {
  propagationSec: number;
  transmissionSec: number;
  totalOneWaySec: number;
  roundTripMin: number;
} {
  const propagationSec = computeLightTimeDelaySec(distanceKm);
  const transmissionSec = Number(((payloadSizeKb * 8) / Math.max(8, uplinkKbps)).toFixed(1));
  const totalOneWaySec = Number((propagationSec + transmissionSec).toFixed(1));
  const roundTripMin = Number(((totalOneWaySec * 2) / 60).toFixed(1));
  return {
    propagationSec,
    transmissionSec,
    totalOneWaySec,
    roundTripMin,
  };
}

/**
 * C-18: Spearman Rank Correlation with Tied-Rank Averaging
 * Operates only on days where BOTH metrics have valid non-null values (requires n >= 5).
 */
export function computeSpearmanCorrelation(
  pairs: { x: number | null | undefined; y: number | null | undefined }[]
): { rho: number | null; sampleSize: number } {
  const valid = pairs.filter(
    (p): p is { x: number; y: number } =>
      typeof p.x === 'number' &&
      Number.isFinite(p.x) &&
      typeof p.y === 'number' &&
      Number.isFinite(p.y)
  );
  const n = valid.length;
  if (n < 5) {
    return { rho: null, sampleSize: n };
  }

  const assignRanks = (arr: number[]): number[] => {
    const indexed = arr.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
    const ranks = new Array<number>(arr.length);
    let i = 0;
    while (i < indexed.length) {
      let j = i;
      while (j + 1 < indexed.length && indexed[j + 1].v === indexed[i].v) {
        j++;
      }
      const avgRank = (i + j) / 2 + 1;
      for (let k = i; k <= j; k++) {
        ranks[indexed[k].i] = avgRank;
      }
      i = j + 1;
    }
    return ranks;
  };

  const rx = assignRanks(valid.map((p) => p.x));
  const ry = assignRanks(valid.map((p) => p.y));

  const meanX = rx.reduce((a, b) => a + b, 0) / n;
  const meanY = ry.reduce((a, b) => a + b, 0) / n;

  let cov = 0;
  let varX = 0;
  let varY = 0;
  for (let i = 0; i < n; i++) {
    const dx = rx[i] - meanX;
    const dy = ry[i] - meanY;
    cov += dx * dy;
    varX += dx * dx;
    varY += dy * dy;
  }

  if (varX === 0 || varY === 0) {
    return { rho: 0, sampleSize: n };
  }

  const rho = cov / Math.sqrt(varX * varY);
  return {
    rho: Number(Math.max(-1, Math.min(1, rho)).toFixed(3)),
    sampleSize: n,
  };
}

/**
 * C-19: XP, Level, and Streak with 1 Grace Day per Rolling 7-Day Window
 */
export function computeXpAndLevel(totalXp: number, todayEarnedXp = 0): {
  cappedTodayXp: number;
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPct: number;
} {
  const cappedTodayXp = Math.min(100, Math.max(0, todayEarnedXp));
  const safeXp = Math.max(0, totalXp);
  const level = Math.floor(Math.sqrt(safeXp / 100)) + 1;
  const levelStartXp = Math.pow(level - 1, 2) * 100;
  const nextLevelXp = Math.pow(level, 2) * 100;
  const span = Math.max(1, nextLevelXp - levelStartXp);
  const progressPct = Math.min(
    100,
    Math.round(((safeXp - levelStartXp) / span) * 100)
  );
  return {
    cappedTodayXp,
    level,
    currentLevelXp: safeXp - levelStartXp,
    nextLevelXp: span,
    progressPct,
  };
}

/**
 * Validate plausibility of an input reading against canonical metric bounds.
 */
export function validateObservationPlausibility(
  metric: MetricCode,
  value: number | null | undefined,
  extra?: {
    glucoseContext?: string;
    pairedDiastolic?: number | null;
    signalConfidence?: number;
  }
): {
  valid: boolean;
  hardError?: string;
  softWarning?: string;
} {
  if (value === null || value === undefined) {
    return { valid: true };
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return { valid: false, hardError: 'Value must be a finite number or null.' };
  }

  const def = METRIC_DEFINITIONS[metric];
  if (!def) {
    return { valid: false, hardError: `Unknown metric code: ${metric}` };
  }

  if (value < def.minPlausible || value > def.maxPlausible) {
    return {
      valid: false,
      hardError: `${def.label} (${value} ${def.unit}) is outside physiological plausibility bounds (${def.minPlausible}–${def.maxPlausible} ${def.unit}).`,
    };
  }

  if (metric === 'systolic_bp' && typeof extra?.pairedDiastolic === 'number') {
    if (value <= extra.pairedDiastolic) {
      return {
        valid: false,
        hardError: `Systolic BP (${value} mmHg) must be strictly greater than Diastolic BP (${extra.pairedDiastolic} mmHg).`,
      };
    }
  }

  if (metric === 'blood_glucose' && !extra?.glucoseContext) {
    return {
      valid: false,
      hardError:
        'Blood glucose requires a meal-timing context tag (fasting, pre_meal, or post_meal).',
    };
  }

  if (
    typeof extra?.signalConfidence === 'number' &&
    extra.signalConfidence < 0.4
  ) {
    return {
      valid: false,
      hardError: `Optical signal confidence (${Math.round(
        extra.signalConfidence * 100
      )}%) is below the 40% reliability gate.`,
    };
  }

  if (value < def.softLow || value > def.softHigh) {
    return {
      valid: true,
      softWarning: `${def.label} (${value} ${def.unit}) is outside typical reference range (${def.softLow}–${def.softHigh} ${def.unit}). Please confirm before saving.`,
    };
  }

  return { valid: true };
}

/**
 * Evaluate a single metric time-series up to `asOfMissionDay`
 */
export function evaluateMetricSeries(
  metric: MetricCode,
  observations: Observation[],
  asOfMissionDay: number
): MetricEvaluation {
  const def = METRIC_DEFINITIONS[metric];
  const filtered = observations
    .filter(
      (o) =>
        o.metric === metric &&
        o.missionDay <= asOfMissionDay &&
        !o.supersededById &&
        o.value !== null &&
        o.value !== undefined
    )
    .sort((a, b) => a.missionDay - b.missionDay || a.observedAt.localeCompare(b.observedAt));

  // Collapse to latest reading per missionDay for daily baseline / persistence computation
  const byDayMap = new Map<number, Observation>();
  for (const obs of filtered) {
    byDayMap.set(obs.missionDay, obs);
  }
  const dailyObs = Array.from(byDayMap.values()).sort(
    (a, b) => a.missionDay - b.missionDay
  );

  const latestObs = dailyObs.length > 0 ? dailyObs[dailyObs.length - 1] : null;

  // Baseline window uses up to 14 prior days before the latest 4-day evaluation tail
  // so sustained shifts over the last 3–4 days are compared against the clean prior baseline!
  const priorPool =
    dailyObs.length > 6
      ? dailyObs.slice(0, Math.min(14, dailyObs.length - 4))
      : dailyObs.slice(0, Math.max(1, dailyObs.length - 1));

  const baselineValues =
    priorPool.length >= 3
      ? priorPool.map((o) => o.value)
      : dailyObs.map((o) => o.value);

  const baseline = computeBaseline(metric, baselineValues);

  if (!latestObs || latestObs.value === null) {
    return {
      metric,
      latestValue: null,
      latestObservedAt: null,
      latestObservationId: null,
      latestSource: null,
      baseline,
      robustZ: null,
      adverseZ: null,
      deltaFromBaseline: null,
      rollingMedian3: null,
      rollingMedian7: null,
      slopePerDay: null,
      slopeDirection: 'insufficient',
      persistenceCount: 0,
      persistenceWindow: 4,
      tier: 'not_recorded',
      ruleTriggered: null,
      explanation: `${def.label} is not recorded yet for this mission window.`,
      evidenceObservationIds: [],
    };
  }

  const daysSinceLatest = asOfMissionDay - latestObs.missionDay;
  const robustZ = computeRobustZ(latestObs.value, baseline);
  const adverseZ = computeAdverseZ(robustZ, def.direction);
  const deltaFromBaseline =
    baseline.median !== null
      ? Number((latestObs.value - baseline.median).toFixed(def.decimals + 1))
      : null;

  const recentValues = dailyObs.map((o) => o.value);
  const rollingMedian3 = computeRollingMedian(recentValues, 3);
  const rollingMedian7 = computeRollingMedian(recentValues, 7);
  const slopeInfo = computeTheilSenSlope(
    dailyObs.slice(-7).map((o) => ({ day: o.missionDay, value: o.value }))
  );

  // Compute persistence over the trailing 4 daily observations
  const tailWindow = dailyObs.slice(-4);
  const matchingTail = tailWindow.filter((o) => {
    const z = computeRobustZ(o.value, baseline);
    const adv = computeAdverseZ(z, def.direction);
    return adv !== null && adv >= 1.5;
  });
  const persistenceCount = matchingTail.length;

  let tier: StatusTier = 'nominal';
  let ruleTriggered: string | null = null;

  if (daysSinceLatest > 2) {
    tier = 'stale';
    ruleTriggered = 'R-DATA-GAP';
  } else if (metric === 'sleep_duration_h' && latestObs.value < 4.5) {
    tier = 'watch';
    ruleTriggered = 'R-SLEEP-CRITICAL';
  } else if (metric === 'cabin_co2_ppm' && latestObs.value >= 5000) {
    tier = 'review_required';
    ruleTriggered = 'R-HABITAT-CO2';
  } else if (metric === 'cabin_co2_ppm' && latestObs.value >= 3500) {
    tier = 'watch';
    ruleTriggered = 'R-HABITAT-CO2';
  } else if (
    adverseZ !== null &&
    adverseZ >= RULESET_CONFIG.single_reading_thresholds.review_required_z
  ) {
    tier = 'review_required';
    ruleTriggered = 'R-SINGLE-REVIEW';
  } else if (persistenceCount >= 4 && adverseZ !== null && adverseZ >= 2.2) {
    tier = 'review_required';
    ruleTriggered = 'R-PERSIST-REVIEW';
  } else if (persistenceCount >= 3 && adverseZ !== null && adverseZ >= 1.5) {
    tier = 'watch';
    ruleTriggered =
      metric === 'exercise_minutes' ||
      metric === 'resistive_load_min' ||
      metric === 'hydration_ml'
        ? 'R-ACTIVITY-DROP'
        : metric === 'mood_score' ||
          metric === 'stress_score' ||
          metric === 'fatigue_score' ||
          metric === 'sleep_quality'
        ? 'R-WELLNESS-STRAIN'
        : 'R-PERSIST-WATCH';
  } else if (
    adverseZ !== null &&
    adverseZ >= RULESET_CONFIG.single_reading_thresholds.watch_z
  ) {
    tier = 'watch';
    ruleTriggered = 'R-SINGLE-WATCH';
  } else if (
    adverseZ !== null &&
    adverseZ >= RULESET_CONFIG.single_reading_thresholds.informational_z
  ) {
    tier = 'informational';
    ruleTriggered = 'R-SINGLE-INFO';
  }

  const evidenceIds =
    matchingTail.length > 0
      ? matchingTail.map((o) => o.id)
      : [latestObs.id];

  const signStr =
    deltaFromBaseline !== null && deltaFromBaseline > 0
      ? `+${deltaFromBaseline}`
      : `${deltaFromBaseline ?? 0}`;

  const explanation =
    tier === 'stale'
      ? `No recent ${def.label} reading in the last ${daysSinceLatest} mission days (last recorded MD-${latestObs.missionDay}).`
      : baseline.median !== null && robustZ !== null
      ? `${def.label} is ${latestObs.value} ${def.unit} vs your 14-day personal baseline median of ${baseline.median} ${def.unit} (${signStr} ${def.unit}, z = ${robustZ >= 0 ? '+' : ''}${robustZ.toFixed(1)}, persistence ${persistenceCount}/${tailWindow.length} days).`
      : `${def.label} is ${latestObs.value} ${def.unit} (baseline building: ${baseline.sampleCount}/5 days).`;

  return {
    metric,
    latestValue: latestObs.value,
    latestObservedAt: latestObs.observedAt,
    latestObservationId: latestObs.id,
    latestSource: latestObs.source,
    glucoseContext: latestObs.glucoseContext,
    baseline,
    robustZ,
    adverseZ,
    deltaFromBaseline,
    rollingMedian3,
    rollingMedian7,
    slopePerDay: slopeInfo.slope,
    slopeDirection: slopeInfo.direction,
    persistenceCount,
    persistenceWindow: Math.max(3, tailWindow.length),
    tier,
    ruleTriggered,
    explanation,
    evidenceObservationIds: evidenceIds,
  };
}

/**
 * Evaluate all metrics, generate deduplicated explainable alerts (including R-COMBINED),
 * Vitality Rings, Body Region statuses, and Hazard Ring statuses.
 */
export function evaluateCrewHealthState(
  crewId: string,
  observations: Observation[],
  asOfMissionDay: number,
  existingAlerts: AlertItem[] = []
): {
  evaluations: Record<MetricCode, MetricEvaluation>;
  alerts: AlertItem[];
  vitalityRings: VitalityRingScore[];
  bodyRegions: BodyRegionStatus[];
  hazardNodes: HazardNodeStatus[];
  overallTier: StatusTier;
} {
  const metricCodes = Object.keys(METRIC_DEFINITIONS) as MetricCode[];
  const evaluations = {} as Record<MetricCode, MetricEvaluation>;

  for (const code of metricCodes) {
    evaluations[code] = evaluateMetricSeries(code, observations, asOfMissionDay);
  }

  const generatedAlerts: AlertItem[] = [];

  // 1. Check Multi-Domain Combined Rule (R-COMBINED):
  // Sleep duration <= 6.0h AND Heart Rate adverseZ >= 2.0 AND (Stress or Fatigue adverseZ >= 1.5)
  // persisting across >= 3 of the last 4 days.
  const sleepEval = evaluations.sleep_duration_h;
  const hrEval = evaluations.heart_rate;
  const sbpEval = evaluations.systolic_bp;
  const stressEval = evaluations.stress_score;
  const fatigueEval = evaluations.fatigue_score;

  const sleepShort =
    sleepEval.latestValue !== null &&
    sleepEval.latestValue <= 6.0 &&
    sleepEval.persistenceCount >= 3;
  const hrElevated =
    hrEval.adverseZ !== null &&
    hrEval.adverseZ >= 2.0 &&
    hrEval.persistenceCount >= 3;
  const strainElevated =
    (stressEval.adverseZ !== null && stressEval.adverseZ >= 1.5) ||
    (fatigueEval.adverseZ !== null && fatigueEval.adverseZ >= 1.5);

  if (sleepShort && hrElevated && strainElevated) {
    // Upgrade component evaluations to reflect combined review_required state
    evaluations.heart_rate.tier = 'review_required';
    evaluations.heart_rate.ruleTriggered = 'R-COMBINED';
    evaluations.sleep_duration_h.tier = 'review_required';
    evaluations.sleep_duration_h.ruleTriggered = 'R-COMBINED';

    const combinedEvidence = Array.from(
      new Set([
        ...sleepEval.evidenceObservationIds,
        ...hrEval.evidenceObservationIds,
        ...sbpEval.evidenceObservationIds,
        ...stressEval.evidenceObservationIds,
      ])
    );

    const dominantSource: ProvenanceSource =
      hrEval.latestSource || sleepEval.latestSource || 'simulated';

    generatedAlerts.push({
      id: `ALT-${crewId}-MD${asOfMissionDay}-R-COMBINED`,
      crewId,
      missionDay: asOfMissionDay,
      createdAt:
        hrEval.latestObservedAt || new Date().toISOString(),
      severity: 'review_required',
      status: 'open',
      ruleId: 'R-COMBINED',
      rulesetVersion: RULESET_VERSION,
      title: 'Multi-domain sleep, cardiovascular, and strain shift',
      summary: `Sleep curtailment (${sleepEval.latestValue} h vs ${sleepEval.baseline.median} h baseline) is accompanied by elevated resting heart rate (${hrEval.latestValue} bpm vs ${hrEval.baseline.median} bpm baseline) and rising perceived strain over ${hrEval.persistenceCount} consecutive mission days.`,
      explanation: `Triggered by rule R-COMBINED (ruleset ${RULESET_VERSION}): Sleep duration remained <= 6.0 h (${sleepEval.latestValue} h, z = ${sleepEval.robustZ?.toFixed(1)}), Resting HR shifted +${hrEval.deltaFromBaseline} bpm above personal median (${hrEval.latestValue} bpm vs ${hrEval.baseline.median} bpm, z = +${hrEval.robustZ?.toFixed(1)}), Systolic BP shifted to ${sbpEval.latestValue ?? '—'} mmHg (vs ${sbpEval.baseline.median ?? '—'} mmHg), and Stress reached ${stressEval.latestValue ?? '—'}/5 across ${hrEval.persistenceCount}/4 days.`,
      metricsInvolved: [
        'sleep_duration_h',
        'heart_rate',
        'systolic_bp',
        'stress_score',
        'fatigue_score',
      ],
      bodyRegion: 'cardiovascular',
      hazards: ['isolation_confinement', 'gravity_fields', 'distance_from_earth'],
      persistenceCount: Math.max(
        sleepEval.persistenceCount,
        hrEval.persistenceCount
      ),
      persistenceRequired: 3,
      evidenceObservationIds: combinedEvidence,
      latestValues: {
        sleep_duration_h: sleepEval.latestValue,
        heart_rate: hrEval.latestValue,
        systolic_bp: sbpEval.latestValue,
        stress_score: stressEval.latestValue,
        fatigue_score: fatigueEval.latestValue,
      },
      baselineMedians: {
        sleep_duration_h: sleepEval.baseline.median,
        heart_rate: hrEval.baseline.median,
        systolic_bp: sbpEval.baseline.median,
        stress_score: stressEval.baseline.median,
        fatigue_score: fatigueEval.baseline.median,
      },
      deviations: {
        sleep_duration_h: sleepEval.robustZ,
        heart_rate: hrEval.robustZ,
        systolic_bp: sbpEval.robustZ,
        stress_score: stressEval.robustZ,
        fatigue_score: fatigueEval.robustZ,
      },
      protocolId: 'PROTO-COMBINED',
      source: dominantSource,
      snoozeCount: 0,
      comments: [],
    });
  }

  // 2. Check Activity & Countermeasure Drop Rule (R-ACTIVITY-DROP)
  const exEval = evaluations.exercise_minutes;
  const resEval = evaluations.resistive_load_min;
  const hydEval = evaluations.hydration_ml;

  if (
    (exEval.persistenceCount >= 3 && (exEval.adverseZ ?? 0) >= 1.5) ||
    (resEval.persistenceCount >= 3 && (resEval.adverseZ ?? 0) >= 1.5)
  ) {
    exEval.tier = 'watch';
    exEval.ruleTriggered = 'R-ACTIVITY-DROP';
    resEval.tier = 'watch';
    resEval.ruleTriggered = 'R-ACTIVITY-DROP';

    const evidenceIds = Array.from(
      new Set([
        ...exEval.evidenceObservationIds,
        ...resEval.evidenceObservationIds,
        ...hydEval.evidenceObservationIds,
      ])
    );

    generatedAlerts.push({
      id: `ALT-${crewId}-MD${asOfMissionDay}-R-ACTIVITY-DROP`,
      crewId,
      missionDay: asOfMissionDay,
      createdAt: exEval.latestObservedAt || new Date().toISOString(),
      severity: 'watch',
      status: 'open',
      ruleId: 'R-ACTIVITY-DROP',
      rulesetVersion: RULESET_VERSION,
      title: 'Persistent countermeasure & hydration drop',
      summary: `Aerobic (${exEval.latestValue ?? '—'} min vs ${exEval.baseline.median ?? '—'} min baseline) and ARED resistive load (${resEval.latestValue ?? '—'} min vs ${resEval.baseline.median ?? '—'} min) have remained below personal baseline for ${Math.max(exEval.persistenceCount, resEval.persistenceCount)} consecutive days.`,
      explanation: `Triggered by rule R-ACTIVITY-DROP (ruleset ${RULESET_VERSION}): Multi-day reduction in gravitational countermeasures (${exEval.latestValue} min aerobic, z = ${exEval.robustZ?.toFixed(1)}; ${resEval.latestValue} min resistive, z = ${resEval.robustZ?.toFixed(1)}; hydration ${hydEval.latestValue ?? '—'} mL) increases musculoskeletal unloading and hydration drift risk.`,
      metricsInvolved: ['exercise_minutes', 'resistive_load_min', 'hydration_ml'],
      bodyRegion: 'musculoskeletal',
      hazards: ['gravity_fields'],
      persistenceCount: Math.max(exEval.persistenceCount, resEval.persistenceCount),
      persistenceRequired: 3,
      evidenceObservationIds: evidenceIds,
      latestValues: {
        exercise_minutes: exEval.latestValue,
        resistive_load_min: resEval.latestValue,
        hydration_ml: hydEval.latestValue,
      },
      baselineMedians: {
        exercise_minutes: exEval.baseline.median,
        resistive_load_min: resEval.baseline.median,
        hydration_ml: hydEval.baseline.median,
      },
      deviations: {
        exercise_minutes: exEval.robustZ,
        resistive_load_min: resEval.robustZ,
        hydration_ml: hydEval.robustZ,
      },
      protocolId: 'PROTO-MSK',
      source: exEval.latestSource || 'simulated',
      snoozeCount: 0,
      comments: [],
    });
  }

  // 3. Check Behavioral Wellness Strain Rule (R-WELLNESS-STRAIN) when R-COMBINED did not already cover it
  const moodEval = evaluations.mood_score;
  const sqEval = evaluations.sleep_quality;
  if (
    !generatedAlerts.some((a) => a.ruleId === 'R-COMBINED') &&
    ((moodEval.persistenceCount >= 3 && (moodEval.adverseZ ?? 0) >= 1.5) ||
      (stressEval.persistenceCount >= 3 && (stressEval.adverseZ ?? 0) >= 1.5) ||
      (fatigueEval.persistenceCount >= 3 && (fatigueEval.adverseZ ?? 0) >= 1.5))
  ) {
    const highStrain =
      (moodEval.adverseZ ?? 0) >= 2.2 ||
      (stressEval.adverseZ ?? 0) >= 2.2 ||
      (fatigueEval.adverseZ ?? 0) >= 2.2;
    const sev: AlertSeverity = highStrain ? 'review_required' : 'watch';
    moodEval.tier = sev;
    stressEval.tier = sev;
    fatigueEval.tier = sev;

    const evidenceIds = Array.from(
      new Set([
        ...moodEval.evidenceObservationIds,
        ...stressEval.evidenceObservationIds,
        ...fatigueEval.evidenceObservationIds,
        ...sqEval.evidenceObservationIds,
      ])
    );

    generatedAlerts.push({
      id: `ALT-${crewId}-MD${asOfMissionDay}-R-WELLNESS-STRAIN`,
      crewId,
      missionDay: asOfMissionDay,
      createdAt: moodEval.latestObservedAt || new Date().toISOString(),
      severity: sev,
      status: 'open',
      ruleId: 'R-WELLNESS-STRAIN',
      rulesetVersion: RULESET_VERSION,
      title: 'Sustained mood, stress & fatigue recovery strain',
      summary: `Mood (${moodEval.latestValue ?? '—'}/5 vs ${moodEval.baseline.median ?? '—'}/5), Stress (${stressEval.latestValue ?? '—'}/5), and Fatigue (${fatigueEval.latestValue ?? '—'}/5) show a ${Math.max(moodEval.persistenceCount, stressEval.persistenceCount)}-day shift from personal baseline.`,
      explanation: `Triggered by rule R-WELLNESS-STRAIN (ruleset ${RULESET_VERSION}): Self-reported behavioral readiness indicators shifted outside your 14-day personal band across ${Math.max(moodEval.persistenceCount, stressEval.persistenceCount)}/4 mission days while cardiovascular vitals remain stable.`,
      metricsInvolved: ['mood_score', 'stress_score', 'fatigue_score', 'sleep_quality'],
      bodyRegion: 'mood_cognition',
      hazards: ['isolation_confinement', 'distance_from_earth'],
      persistenceCount: Math.max(
        moodEval.persistenceCount,
        stressEval.persistenceCount,
        fatigueEval.persistenceCount
      ),
      persistenceRequired: 3,
      evidenceObservationIds: evidenceIds,
      latestValues: {
        mood_score: moodEval.latestValue,
        stress_score: stressEval.latestValue,
        fatigue_score: fatigueEval.latestValue,
        sleep_quality: sqEval.latestValue,
      },
      baselineMedians: {
        mood_score: moodEval.baseline.median,
        stress_score: stressEval.baseline.median,
        fatigue_score: fatigueEval.baseline.median,
        sleep_quality: sqEval.baseline.median,
      },
      deviations: {
        mood_score: moodEval.robustZ,
        stress_score: stressEval.robustZ,
        fatigue_score: fatigueEval.robustZ,
        sleep_quality: sqEval.robustZ,
      },
      protocolId: 'PROTO-MIND',
      source: moodEval.latestSource || 'simulated',
      snoozeCount: 0,
      comments: [],
    });
  }

  // 4. Individual metric alerts not already covered by a composite alert
  const coveredMetrics = new Set<MetricCode>(
    generatedAlerts.flatMap((a) => a.metricsInvolved)
  );

  for (const code of metricCodes) {
    if (coveredMetrics.has(code)) continue;
    const ev = evaluations[code];
    const def = METRIC_DEFINITIONS[code];
    if (
      ev.tier === 'review_required' ||
      ev.tier === 'watch' ||
      ev.tier === 'informational'
    ) {
      const severity: AlertSeverity =
        ev.tier === 'review_required'
          ? 'review_required'
          : ev.tier === 'watch'
          ? 'watch'
          : 'informational';

      generatedAlerts.push({
        id: `ALT-${crewId}-MD${asOfMissionDay}-${code}`,
        crewId,
        missionDay: asOfMissionDay,
        createdAt: ev.latestObservedAt || new Date().toISOString(),
        severity,
        status: 'open',
        ruleId: ev.ruleTriggered || 'R-SINGLE-WATCH',
        rulesetVersion: RULESET_VERSION,
        title: `${def.label} shift outside personal baseline`,
        summary: ev.explanation,
        explanation: `Triggered by rule ${ev.ruleTriggered || 'R-SINGLE-WATCH'} (ruleset ${RULESET_VERSION}): ${ev.explanation}`,
        metricsInvolved: [code],
        bodyRegion: def.bodyRegion,
        hazards: def.hazards,
        persistenceCount: Math.max(1, ev.persistenceCount),
        persistenceRequired: severity === 'informational' ? 1 : 3,
        evidenceObservationIds: ev.evidenceObservationIds,
        latestValues: { [code]: ev.latestValue },
        baselineMedians: { [code]: ev.baseline.median },
        deviations: { [code]: ev.robustZ },
        protocolId: def.checklistId,
        source: ev.latestSource || 'simulated',
        snoozeCount: 0,
        comments: [],
      });
    }
  }

  // Preserve review/snooze/comment state from existingAlerts if IDs match
  const existingMap = new Map(existingAlerts.map((a) => [a.id, a]));
  const mergedAlerts = generatedAlerts
    .map((alert) => {
      const prev = existingMap.get(alert.id);
      if (!prev) return alert;
      return {
        ...alert,
        status: prev.status,
        reviewedAt: prev.reviewedAt,
        reviewReason: prev.reviewReason,
        reviewNote: prev.reviewNote,
        snoozedUntil: prev.snoozedUntil,
        snoozeCount: prev.snoozeCount,
        comments: prev.comments,
      };
    })
    .sort((a, b) => {
      const rank: Record<AlertSeverity, number> = {
        review_required: 3,
        watch: 2,
        informational: 1,
      };
      return rank[b.severity] - rank[a.severity];
    });

  // Compute the 3 Concentric Vitality Rings (C-11 to C-14)
  const vitalityRings = computeVitalityRings(evaluations);

  // Compute 10 Body Twin Region Statuses
  const bodyRegions = computeBodyRegionStatuses(evaluations, mergedAlerts);

  // Compute 5 NASA Hazard Ring Statuses
  const hazardNodes = computeHazardStatuses(evaluations, mergedAlerts);

  const severityOrder: Record<StatusTier, number> = {
    review_required: 5,
    watch: 4,
    informational: 3,
    stale: 2,
    not_recorded: 1,
    nominal: 0,
  };

  let overallTier: StatusTier = 'nominal';
  for (const r of bodyRegions) {
    if (severityOrder[r.tier] > severityOrder[overallTier]) {
      overallTier = r.tier;
    }
  }

  return {
    evaluations,
    alerts: mergedAlerts,
    vitalityRings,
    bodyRegions,
    hazardNodes,
    overallTier,
  };
}

/**
 * C-11..C-14: Compute Recovery, Strain, and Mind Vitality Rings
 * Score 0..100 + Confidence 0..1 based on non-null input fraction.
 */
export function computeVitalityRings(
  evaluations: Record<MetricCode, MetricEvaluation>
): VitalityRingScore[] {
  const buildRing = (
    id: 'recovery' | 'strain' | 'mind',
    label: string,
    metricCodes: MetricCode[]
  ): VitalityRingScore => {
    let recordedCount = 0;
    let penaltySum = 0;
    let highestTier: StatusTier = 'nominal';

    const contributors = metricCodes.map((code) => {
      const ev = evaluations[code];
      const def = METRIC_DEFINITIONS[code];
      if (!ev || ev.latestValue === null) {
        return {
          metric: code,
          label: def.shortLabel,
          value: null,
          unit: def.unit,
          impact: 'missing' as const,
        };
      }
      recordedCount++;
      const adv = ev.adverseZ ?? 0;
      // Each 1.0 robust z of adverse deviation subtracts ~14 points from 96
      penaltySum += Math.min(48, adv * 14);

      if (ev.tier === 'review_required') highestTier = 'review_required';
      else if (ev.tier === 'watch' && highestTier !== 'review_required')
        highestTier = 'watch';
      else if (
        ev.tier === 'informational' &&
        highestTier === 'nominal'
      )
        highestTier = 'informational';

      const impact: 'positive' | 'neutral' | 'adverse' =
        adv >= 1.5 ? 'adverse' : adv <= 0.6 ? 'positive' : 'neutral';

      return {
        metric: code,
        label: def.shortLabel,
        value: ev.latestValue,
        unit: def.unit,
        impact,
      };
    });

    const confidence = Number((recordedCount / metricCodes.length).toFixed(2));
    if (recordedCount === 0) {
      return {
        id,
        label,
        score: null,
        confidence: 0,
        tier: 'not_recorded',
        contributors,
        summary: `No recent ${label.toLowerCase()} inputs recorded.`,
      };
    }

    const avgPenalty = penaltySum / recordedCount;
    const rawScore = Math.round(Math.max(18, Math.min(98, 94 - avgPenalty)));

    const summary =
      highestTier === 'nominal'
        ? `${label} inputs are tracking within your personal 14-day band (${recordedCount}/${metricCodes.length} signals active).`
        : `${label} score reflects shifts in ${contributors
            .filter((c) => c.impact === 'adverse')
            .map((c) => c.label)
            .join(', ') || 'recent readings'}.`;

    return {
      id,
      label,
      score: rawScore,
      confidence,
      tier: highestTier,
      contributors,
      summary,
    };
  };

  return [
    buildRing('recovery', 'Recovery', [
      'sleep_duration_h',
      'sleep_quality',
      'heart_rate',
      'spo2_pct',
      'body_temp_c',
    ]),
    buildRing('strain', 'Body Load', [
      'systolic_bp',
      'diastolic_bp',
      'exercise_minutes',
      'resistive_load_min',
      'hydration_ml',
    ]),
    buildRing('mind', 'Mind & Readiness', [
      'mood_score',
      'stress_score',
      'fatigue_score',
      'reaction_time_ms',
    ]),
  ];
}

/**
 * Compute status for all 10 clickable Body Twin regions
 */
export function computeBodyRegionStatuses(
  evaluations: Record<MetricCode, MetricEvaluation>,
  alerts: AlertItem[]
): BodyRegionStatus[] {
  const rank: Record<StatusTier, number> = {
    review_required: 5,
    watch: 4,
    informational: 3,
    stale: 2,
    nominal: 1,
    not_recorded: 0,
  };

  return (Object.keys(BODY_REGIONS) as BodyRegionId[]).map((id) => {
    const region = BODY_REGIONS[id];
    let worstTier: StatusTier = 'not_recorded';

    for (const m of region.metrics) {
      const ev = evaluations[m];
      if (ev && rank[ev.tier] > rank[worstTier]) {
        worstTier = ev.tier;
      }
    }

    const regionAlerts = alerts.filter(
      (a) => a.bodyRegion === id && a.status === 'open'
    );
    if (regionAlerts.some((a) => a.severity === 'review_required')) {
      worstTier = 'review_required';
    } else if (
      regionAlerts.some((a) => a.severity === 'watch') &&
      worstTier !== 'review_required'
    ) {
      worstTier = 'watch';
    }

    const primaryEv = evaluations[region.primaryMetric];
    const headline =
      regionAlerts.length > 0
        ? regionAlerts[0].title
        : primaryEv && primaryEv.latestValue !== null
        ? primaryEv.explanation
        : region.functionSummary;

    const possibleContributors = region.metrics
      .map((m) => evaluations[m])
      .filter((ev) => ev && (ev.adverseZ ?? 0) >= 1.2)
      .map(
        (ev) =>
          `${METRIC_DEFINITIONS[ev.metric].shortLabel}: ${ev.latestValue} ${
            METRIC_DEFINITIONS[ev.metric].unit
          } (z=${ev.robustZ !== null && ev.robustZ >= 0 ? '+' : ''}${
            ev.robustZ?.toFixed(1) ?? '0'
          })`
      );

    return {
      id: region.id,
      label: region.label,
      shortLabel: region.shortLabel,
      side: region.side,
      x: region.x,
      y: region.y,
      tier: worstTier,
      primaryMetric: region.primaryMetric,
      metrics: region.metrics,
      hazards: region.hazards,
      headline,
      possibleContributors:
        possibleContributors.length > 0
          ? possibleContributors
          : ['All tracked inputs inside personal 14-day baseline band'],
      checklistId: region.checklistId,
    };
  });
}

/**
 * Compute status for all 5 orbiting NASA Hazard Ring nodes
 */
export function computeHazardStatuses(
  evaluations: Record<MetricCode, MetricEvaluation>,
  alerts: AlertItem[]
): HazardNodeStatus[] {
  return (Object.keys(NASA_HAZARDS) as HazardId[]).map((id) => {
    const hz = NASA_HAZARDS[id];
    const matchingAlerts = alerts.filter(
      (a) => a.hazards.includes(id) && a.status === 'open'
    );

    let tier: StatusTier = 'nominal';
    if (matchingAlerts.some((a) => a.severity === 'review_required')) {
      tier = 'review_required';
    } else if (matchingAlerts.some((a) => a.severity === 'watch')) {
      tier = 'watch';
    } else if (matchingAlerts.some((a) => a.severity === 'informational')) {
      tier = 'informational';
    } else {
      for (const m of hz.keyMetrics) {
        const ev = evaluations[m];
        if (ev?.tier === 'review_required') tier = 'review_required';
        else if (ev?.tier === 'watch' && tier !== 'review_required')
          tier = 'watch';
      }
    }

    return {
      id: hz.id,
      name: hz.name,
      shortName: hz.shortName,
      angleDeg: hz.angleDeg,
      tier,
      activeAlertCount: matchingAlerts.length,
      summary:
        matchingAlerts.length > 0
          ? matchingAlerts[0].summary
          : hz.description,
      affectedRegions: hz.affectedRegions,
      keyMetrics: hz.keyMetrics,
      countermeasures: hz.countermeasures,
      nasaReferenceTitle: hz.nasaReferenceTitle,
      nasaReferenceUrl: hz.nasaReferenceUrl,
    };
  });
}
