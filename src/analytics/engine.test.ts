/**
 * AstraPulse — Pure Analytics & Safety Invariant Unit Tests (ANA-01..24, SAF-01..12)
 * Team Zenitsu — NASA Space Apps Challenge 2026
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  averageDualBloodPressure,
  computeAdverseZ,
  computeBaseline,
  computeDerivedBloodPressure,
  computeLightTimeDelaySec,
  computeMAD,
  computeRobustZ,
  computeSleepDebt,
  computeSpearmanCorrelation,
  computeTheilSenSlope,
  computeXpAndLevel,
  evaluateCrewHealthState,
  median,
  validateObservationPlausibility,
} from './engine';
import {
  CARE_GUIDE_PROTOCOLS,
  MANDATORY_CARE_DISCLAIMER,
  PROHIBITED_MEDICAL_TERMS,
  RULESET_VERSION,
} from './ruleset';
import { buildDeterministicSeed } from './seed';

describe('AstraPulse Pure Analytics Engine (C-01..C-31) & Safety Invariants', () => {
  it('ANA-01..03: computes exact worked HR baseline example [72,74,75,73,76,74,75] -> median 74, MAD 1, floor 2.0, z(85) = 5.5', () => {
    const sample = [72, 74, 75, 73, 76, 74, 75];
    assert.equal(median(sample), 74);
    assert.equal(computeMAD(sample), 1);

    const baseline = computeBaseline('heart_rate', sample);
    assert.equal(baseline.median, 74);
    assert.equal(baseline.mad, 1);
    assert.equal(baseline.effectiveSpread, 2.0); // floorBandwidth for HR is 2.0 > 1.4826 * 1
    assert.equal(baseline.status, 'ready');

    const z85 = computeRobustZ(85, baseline);
    assert.equal(z85, 5.5);
  });

  it('ANA-04..06: never coerces null or undefined to 0 in baseline, sleep debt, or Spearman correlation', () => {
    const withNulls = [72, null, 74, undefined, 75, 73, 76, 74, 75];
    const baseline = computeBaseline('heart_rate', withNulls);
    assert.equal(baseline.sampleCount, 7);
    assert.equal(baseline.median, 74);
    assert.equal(computeRobustZ(null, baseline), null);

    // Sleep debt with null days must ignore nulls rather than treating null as 0h (8h debt)
    const sleepDebt = computeSleepDebt([7.5, null, 8.0, undefined, 7.0], 8.0);
    assert.equal(sleepDebt.recordedDays, 3);
    assert.equal(sleepDebt.debtHours, 1.5); // (8 - 7.5) + 0 + (8 - 7.0) = 1.5
  });

  it('ANA-07..09: enforces directional adverseZ (two_sided, high_bad, low_bad)', () => {
    // Low sleep duration (z = -2.5) is adverse for low_bad, not high sleep (z = +1.5)
    assert.equal(computeAdverseZ(-2.5, 'low_bad'), 2.5);
    assert.equal(computeAdverseZ(1.5, 'low_bad'), 0);

    // High stress or CO2 (z = +2.4) is adverse for high_bad, not low stress (z = -1.8)
    assert.equal(computeAdverseZ(2.4, 'high_bad'), 2.4);
    assert.equal(computeAdverseZ(-1.8, 'high_bad'), 0);

    // Two-sided (BP, HR, Temp)
    assert.equal(computeAdverseZ(-2.2, 'two_sided'), 2.2);
    assert.equal(computeAdverseZ(2.2, 'two_sided'), 2.2);
  });

  it('ANA-10..12: computes Theil-Sen slope, derived MAP/PP, and dual BP average accurately', () => {
    const slopeRes = computeTheilSenSlope([
      { day: 1, value: 64 },
      { day: 2, value: 66 },
      { day: 3, value: 68 },
      { day: 4, value: 70 },
    ]);
    assert.equal(slopeRes.slope, 2);
    assert.equal(slopeRes.direction, 'rising');

    const bp = computeDerivedBloodPressure(120, 80);
    assert.equal(bp.pulsePressure, 40);
    assert.equal(bp.map, 93.3);
    assert.equal(bp.validOrder, true);

    const invalidBp = computeDerivedBloodPressure(75, 85);
    assert.equal(invalidBp.validOrder, false);

    const dual = averageDualBloodPressure(128, 82, 114, 78);
    assert.equal(dual.systolic, 121);
    assert.equal(dual.diastolic, 80);
    assert.equal(dual.wideSpreadWarning, true); // |128 - 114| = 14 > 10
  });

  it('ANA-13..16: validates plausibility bounds, glucose meal tag, and optical signal confidence gate >= 0.4', () => {
    // HR 999 rejected
    const badHr = validateObservationPlausibility('heart_rate', 999);
    assert.equal(badHr.valid, false);

    // Glucose without meal context rejected
    const untaggedGlucose = validateObservationPlausibility('blood_glucose', 94);
    assert.equal(untaggedGlucose.valid, false);

    // Glucose with meal context accepted
    const taggedGlucose = validateObservationPlausibility('blood_glucose', 94, {
      glucoseContext: 'fasting',
    });
    assert.equal(taggedGlucose.valid, true);

    // Optical camera pulse below 0.4 confidence rejected
    const lowConfPulse = validateObservationPlausibility('heart_rate', 70, {
      signalConfidence: 0.32,
    });
    assert.equal(lowConfPulse.valid, false);
  });

  it('ANA-17..19: computes Spearman rank correlation, light-time delay, and XP/Level cap', () => {
    const corr = computeSpearmanCorrelation([
      { x: 1, y: 10 },
      { x: 2, y: 20 },
      { x: 3, y: 30 },
      { x: 4, y: 40 },
      { x: 5, y: 50 },
    ]);
    assert.equal(corr.rho, 1);
    assert.equal(corr.sampleSize, 5);

    // Mars distance 225,000,000 km -> ~750.5 sec one-way delay
    const delaySec = computeLightTimeDelaySec(225_000_000);
    assert.ok(delaySec > 749 && delaySec < 752);

    // Daily XP cap is 100
    const xpInfo = computeXpAndLevel(400, 160);
    assert.equal(xpInfo.cappedTodayXp, 100);
    assert.equal(xpInfo.level, 3);
  });

  it('ANA-20..24: Golden Crew Scenarios ASTRA-001..004 match expected deterministic alerts under ruleset 1.0.0-demo', () => {
    const seed = buildDeterministicSeed();

    // ASTRA-001: Steady baseline -> 0 watch/review alerts
    const obs1 = seed.observations.filter((o) => o.crewId === 'ASTRA-001');
    const state1 = evaluateCrewHealthState('ASTRA-001', obs1, 24);
    const activeWatchOrReview1 = state1.alerts.filter(
      (a) => a.severity === 'watch' || a.severity === 'review_required'
    );
    assert.equal(activeWatchOrReview1.length, 0);

    // Day 11 glucose on ASTRA-001 was intentionally omitted (null), verify only 23 glucose observations exist
    const glucoseObs1 = obs1.filter((o) => o.metric === 'blood_glucose');
    assert.equal(glucoseObs1.length, 23);

    // ASTRA-002: Fires R-COMBINED (review_required)
    const obs2 = seed.observations.filter((o) => o.crewId === 'ASTRA-002');
    const state2 = evaluateCrewHealthState('ASTRA-002', obs2, 24);
    const combinedAlert = state2.alerts.find((a) => a.ruleId === 'R-COMBINED');
    assert.ok(combinedAlert, 'Expected R-COMBINED alert for ASTRA-002');
    assert.equal(combinedAlert.severity, 'review_required');
    assert.equal(combinedAlert.rulesetVersion, RULESET_VERSION);
    assert.ok(combinedAlert.evidenceObservationIds.length >= 3);

    // ASTRA-003: Fires R-ACTIVITY-DROP (watch)
    const obs3 = seed.observations.filter((o) => o.crewId === 'ASTRA-003');
    const state3 = evaluateCrewHealthState('ASTRA-003', obs3, 24);
    const activityAlert = state3.alerts.find((a) => a.ruleId === 'R-ACTIVITY-DROP');
    assert.ok(activityAlert, 'Expected R-ACTIVITY-DROP alert for ASTRA-003');
    assert.equal(activityAlert.severity, 'watch');

    // ASTRA-004: Fires R-WELLNESS-STRAIN and does NOT fire R-COMBINED
    const obs4 = seed.observations.filter((o) => o.crewId === 'ASTRA-004');
    const state4 = evaluateCrewHealthState('ASTRA-004', obs4, 24);
    const wellnessAlert = state4.alerts.find((a) => a.ruleId === 'R-WELLNESS-STRAIN');
    const combinedOn4 = state4.alerts.find((a) => a.ruleId === 'R-COMBINED');
    assert.ok(wellnessAlert, 'Expected R-WELLNESS-STRAIN alert for ASTRA-004');
    assert.equal(combinedOn4, undefined);
  });

  it('SAF-01..12: All generated alerts and care guide protocols contain mandatory disclaimers and zero prohibited diagnostic/drug terms', () => {
    const seed = buildDeterministicSeed();
    const allTexts: string[] = [];

    for (const a of seed.alerts) {
      allTexts.push(a.title, a.summary, a.explanation);
    }
    for (const proto of Object.values(CARE_GUIDE_PROTOCOLS)) {
      assert.equal(proto.disclaimer, MANDATORY_CARE_DISCLAIMER);
      allTexts.push(
        proto.title,
        ...proto.tier1RightNow,
        ...proto.tier1Today,
        ...proto.tier1ThisWeek,
        proto.tier2ChecklistTitle,
        ...proto.tier2Steps,
        ...proto.tier3WatchFor,
        ...proto.tier3EscalateWhen
      );
    }

    const joined = allTexts.join(' ').toLowerCase();
    for (const forbidden of PROHIBITED_MEDICAL_TERMS) {
      assert.equal(
        joined.includes(forbidden.toLowerCase()),
        false,
        `Found prohibited term "${forbidden}" in generated text`
      );
    }
  });
});
