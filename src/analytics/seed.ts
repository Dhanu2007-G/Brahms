/**
 * AstraPulse — Deterministic 24-Day Mission Seed Generator (ARES-01)
 * Team Zenitsu — NASA Space Apps Challenge 2026
 */

import { computeDerivedBloodPressure, evaluateCrewHealthState } from './engine';
import { METRIC_DEFINITIONS } from './ruleset';
import {
  AccessGrant,
  AlertItem,
  AuditLogEntry,
  CrewProfile,
  DailyCheckin,
  GroundMessage,
  JournalEntry,
  MetricCode,
  Observation,
  QuestItem,
} from './types';

export const CREW_PROFILES: CrewProfile[] = [
  {
    id: 'ASTRA-001',
    code: 'ASTRA-001',
    name: 'Cmdr. Elena Rostova',
    callsign: 'VEGA-1',
    role: 'Mission Commander',
    missionName: 'ARES-01 Deep Space Transit',
    defaultEnvironment: 'spacecraft',
    currentMissionDay: 24,
    totalMissionDays: 180,
    scenarioTitle: 'Steady Baseline (Nominal Control)',
    scenarioDescription:
      'Consistent 7.6 h sleep, regular ARED/aerobic countermeasures, and stable cardiovascular vitals across 24 mission days.',
    expectedOutcomeSummary: 'All systems nominal (● In your range); 0 watch or review alerts.',
    distanceFromEarthKm: 18_500_000,
    avatarColor: '#2DD4BF',
    xp: 1450,
    streakDays: 24,
    graceDaysUsedThisWeek: 0,
    lastContactAt: '2026-04-24T07:40:00.000Z',
  },
  {
    id: 'ASTRA-002',
    code: 'ASTRA-002',
    name: 'Dr. Marcus Vance',
    callsign: 'PULSE-2',
    role: 'Crew Medical & Payload Officer',
    missionName: 'ARES-01 Deep Space Transit',
    defaultEnvironment: 'spacecraft',
    currentMissionDay: 24,
    totalMissionDays: 180,
    scenarioTitle: 'Multi-Domain Sleep, Cardio & CO₂ Shift',
    scenarioDescription:
      '19 days of stable baseline followed by 4 consecutive days of sleep curtailment (4.8–5.5 h), rising resting HR (82 bpm), elevated systolic BP (135 mmHg), rising stress, and elevated sleeping-berth CO₂.',
    expectedOutcomeSummary:
      'Fires R-COMBINED (◆ Review suggested) + R-HABITAT-CO2 (▲ Keep watching) with full persistence evidence.',
    distanceFromEarthKm: 18_500_000,
    avatarColor: '#FF5C93',
    xp: 1220,
    streakDays: 19,
    graceDaysUsedThisWeek: 1,
    lastContactAt: '2026-04-24T06:50:00.000Z',
  },
  {
    id: 'ASTRA-003',
    code: 'ASTRA-003',
    name: 'Spec. Tariq Al-Mansoor',
    callsign: 'ATLAS-3',
    role: 'EVA & Robotics Specialist',
    missionName: 'ARES-01 Deep Space Transit',
    defaultEnvironment: 'lunar_base',
    currentMissionDay: 24,
    totalMissionDays: 180,
    scenarioTitle: 'Countermeasure & Hydration Adherence Drop',
    scenarioDescription:
      'Stable cardiovascular vitals, but 4 consecutive days of reduced ARED resistive loading, reduced aerobic exercise, and low fluid intake during heavy EVA prep.',
    expectedOutcomeSummary:
      'Fires R-ACTIVITY-DROP (▲ Keep watching) on Musculoskeletal & Hydration regions.',
    distanceFromEarthKm: 384_400,
    avatarColor: '#FFB547',
    xp: 1180,
    streakDays: 14,
    graceDaysUsedThisWeek: 1,
    lastContactAt: '2026-04-24T07:15:00.000Z',
  },
  {
    id: 'ASTRA-004',
    code: 'ASTRA-004',
    name: 'Eng. Mei Lin',
    callsign: 'AURORA-4',
    role: 'Flight Systems & ECLSS Engineer',
    missionName: 'ARES-01 Deep Space Transit',
    defaultEnvironment: 'mars_base',
    currentMissionDay: 24,
    totalMissionDays: 180,
    scenarioTitle: 'Isolation & Behavioral Readiness Strain',
    scenarioDescription:
      'Physiological vitals and sleep hours remain inside personal band, but 4 consecutive days show declining mood, high cognitive stress, and elevated subjective fatigue under 12-minute Mars light-time delay.',
    expectedOutcomeSummary:
      'Fires R-WELLNESS-STRAIN on Mind & Mood while Cardiovascular stays nominal.',
    distanceFromEarthKm: 225_000_000,
    avatarColor: '#8B7CFF',
    xp: 1340,
    streakDays: 21,
    graceDaysUsedThisWeek: 0,
    lastContactAt: '2026-04-24T05:30:00.000Z',
  },
];

export interface SeededStore {
  crew: CrewProfile[];
  observations: Observation[];
  checkins: DailyCheckin[];
  alerts: AlertItem[];
  journals: JournalEntry[];
  grants: AccessGrant[];
  messages: GroundMessage[];
  quests: Record<string, QuestItem[]>;
  auditLog: AuditLogEntry[];
}

/**
 * Deterministic small wobble pattern by day index (1..24)
 */
const WOBBLE = [-1, 0, 1, 0, -1, 1, 0, -1, 0, 1, 0, 0, -1, 1, 0, -1, 1, 0, 0, -1, 0, 1, -1, 0];

export function buildDeterministicSeed(): SeededStore {
  const observations: Observation[] = [];
  const checkins: DailyCheckin[] = [];
  const alerts: AlertItem[] = [];

  for (const profile of CREW_PROFILES) {
    const crewObs: Observation[] = [];

    for (let day = 1; day <= 24; day++) {
      const w = WOBBLE[(day - 1) % WOBBLE.length];
      const dateStr = `2026-04-${String(day).padStart(2, '0')}T07:30:00.000Z`;
      const checkinId = `CHK-${profile.id}-MD${day}`;

      // Baseline defaults
      let sbp = 116 + w * 2;
      let dbp = 74 + w;
      let hr = 64 + w;
      let glucose: number | null = 88 + w * 2;
      let temp = Number((36.6 + w * 0.08).toFixed(1));
      let spo2 = 98 + (day % 3 === 0 ? 1 : 0);
      let resp = 14 + (day % 4 === 0 ? 1 : 0);
      let mass = Number((72.4 - day * 0.01).toFixed(1));
      let sleepH = Number((7.6 + w * 0.2).toFixed(1));
      let sleepQ = 4;
      let mood = 4;
      let stress = 2;
      let fatigue = 2;
      let exercise = 52 + w * 3;
      let resistive = 44 + w * 2;
      let hydration = 2550 + w * 80;
      let mealPct = 96 + w * 2;
      let pvtMs = 238 + w * 6;
      let co2Ppm = 2450 + w * 90;
      let noiseDba = Number((54.5 + w * 0.8).toFixed(1));
      let radMgy = Number((0.46 + (day % 5 === 0 ? 0.04 : 0)).toFixed(2));
      const symptoms: string[] = [];

      // Intentional missingness on Day 11 for blood_glucose on ASTRA-001 to prove null handling
      if (profile.id === 'ASTRA-001' && day === 11) {
        glucose = null;
      }

      // Scenario 2: ASTRA-002 (Days 21..24 multi-domain sleep + cardio + strain + CO2 shift)
      if (profile.id === 'ASTRA-002' && day >= 21) {
        const tailIdx = day - 21; // 0..3
        sleepH = [5.5, 5.2, 5.0, 4.8][tailIdx];
        sleepQ = [3, 2, 2, 2][tailIdx];
        hr = [76, 78, 80, 82][tailIdx];
        sbp = [128, 131, 133, 135][tailIdx];
        dbp = [82, 84, 85, 86][tailIdx];
        stress = [4, 4, 4, 5][tailIdx];
        fatigue = [4, 4, 5, 5][tailIdx];
        mood = [3, 3, 2, 2][tailIdx];
        pvtMs = [292, 310, 326, 342][tailIdx];
        co2Ppm = [3550, 3680, 3820, 3940][tailIdx];
        hydration = [2100, 1950, 1900, 1850][tailIdx];
        symptoms.push('Mild morning headache', 'Unrefreshed waking');
      }

      // Scenario 3: ASTRA-003 (Days 21..24 countermeasure & hydration drop)
      if (profile.id === 'ASTRA-003' && day >= 21) {
        const tailIdx = day - 21;
        exercise = [22, 18, 15, 14][tailIdx];
        resistive = [16, 12, 10, 10][tailIdx];
        hydration = [1680, 1560, 1490, 1420][tailIdx];
        mealPct = [82, 80, 78, 76][tailIdx];
        symptoms.push('Lower back tightness');
      }

      // Scenario 4: ASTRA-004 (Days 21..24 isolation & behavioral strain, vitals nominal)
      if (profile.id === 'ASTRA-004' && day >= 21) {
        const tailIdx = day - 21;
        mood = [2, 2, 2, 1][tailIdx];
        stress = [4, 4, 5, 5][tailIdx];
        fatigue = [4, 4, 4, 5][tailIdx];
        sleepQ = [2, 2, 2, 2][tailIdx];
        sleepH = [7.2, 7.1, 7.0, 7.1][tailIdx];
        pvtMs = [285, 298, 312, 320][tailIdx];
        symptoms.push('Cognitive fatigue');
      }

      const derivedBp = computeDerivedBloodPressure(sbp, dbp);

      const dayMetrics: Partial<Record<MetricCode, number | null>> = {
        systolic_bp: sbp,
        diastolic_bp: dbp,
        mean_arterial_pressure: derivedBp.map,
        pulse_pressure: derivedBp.pulsePressure,
        heart_rate: hr,
        blood_glucose: glucose,
        body_temp_c: temp,
        spo2_pct: spo2,
        respiratory_rate: resp,
        body_mass_kg: mass,
        sleep_duration_h: sleepH,
        sleep_quality: sleepQ,
        mood_score: mood,
        stress_score: stress,
        fatigue_score: fatigue,
        exercise_minutes: exercise,
        resistive_load_min: resistive,
        hydration_ml: hydration,
        meal_completion_pct: mealPct,
        reaction_time_ms: pvtMs,
        cabin_co2_ppm: co2Ppm,
        cabin_noise_dba: noiseDba,
        radiation_dose_mgy: radMgy,
      };

      checkins.push({
        id: checkinId,
        crewId: profile.id,
        missionDay: day,
        recordedAt: dateStr,
        environmentMode: profile.defaultEnvironment,
        source: 'simulated',
        idempotencyKey: `SEED-${profile.id}-MD${day}`,
        metrics: dayMetrics,
        glucoseContext: 'fasting',
        symptoms,
        symptomRegions:
          profile.id === 'ASTRA-002' && day >= 21
            ? ['head_neuro', 'cardiovascular', 'sleep_circadian']
            : profile.id === 'ASTRA-003' && day >= 21
            ? ['musculoskeletal']
            : profile.id === 'ASTRA-004' && day >= 21
            ? ['mood_cognition']
            : [],
        notes:
          day === 24
            ? `MD-${day} morning Pulse Ritual logged (${profile.scenarioTitle}).`
            : undefined,
      });

      for (const [metricKey, val] of Object.entries(dayMetrics)) {
        const mCode = metricKey as MetricCode;
        if (val === null || val === undefined) continue;
        const obs: Observation = {
          id: `OBS-${profile.id}-MD${day}-${mCode}`,
          crewId: profile.id,
          checkinId,
          missionDay: day,
          observedAt: dateStr,
          metric: mCode,
          value: val,
          unit: METRIC_DEFINITIONS[mCode].unit,
          glucoseContext: mCode === 'blood_glucose' ? 'fasting' : undefined,
          source:
            mCode === 'radiation_dose_mgy' ||
            mCode === 'cabin_co2_ppm' ||
            mCode === 'cabin_noise_dba'
              ? 'imported'
              : mCode === 'mean_arterial_pressure' || mCode === 'pulse_pressure'
              ? 'derived'
              : 'simulated',
        };
        observations.push(obs);
        crewObs.push(obs);
      }
    }

    const evalResult = evaluateCrewHealthState(profile.id, crewObs, 24, []);
    alerts.push(...evalResult.alerts);
  }

  const journals: JournalEntry[] = [
    {
      id: 'JRN-ASTRA-002-01',
      crewId: 'ASTRA-002',
      missionDay: 23,
      createdAt: '2026-04-23T21:15:00.000Z',
      updatedAt: '2026-04-23T21:15:00.000Z',
      title: 'Sleeping berth airflow & late payload calibration',
      body: 'Stayed up late finishing the spectrometer alignment. Woke up twice with a warm sleeping berth and slight frontal pressure. Going to check the berth fan baffle and hydrate early tomorrow.',
      moodScore: 3,
      tags: ['sleep', 'co2-baffle', 'workload'],
      sharedWithGround: false,
      source: 'simulated',
    },
    {
      id: 'JRN-ASTRA-002-02',
      crewId: 'ASTRA-002',
      missionDay: 24,
      createdAt: '2026-04-24T07:45:00.000Z',
      updatedAt: '2026-04-24T07:45:00.000Z',
      title: 'Shared summary for Flight Surgeon review',
      body: 'Sharing this note with Ground: resting HR and BP have crept up over the past 4 mornings alongside shorter sleep. Adjusted the sleeping-quarter air diffuser this morning.',
      moodScore: 2,
      tags: ['flight-surgeon-share', 'cardio', 'sleep'],
      sharedWithGround: true,
      shareGrantId: 'GRT-ASTRA-002-02',
      shareExpiresAt: '2026-05-01T00:00:00.000Z',
      source: 'simulated',
    },
    {
      id: 'JRN-ASTRA-004-01',
      crewId: 'ASTRA-004',
      missionDay: 24,
      createdAt: '2026-04-24T06:20:00.000Z',
      updatedAt: '2026-04-24T06:20:00.000Z',
      title: 'Private reflection on 12-minute Mars comms cadence',
      body: 'Private note: The 25-minute round-trip delay makes real-time troubleshooting with Houston impossible. Using box breathing before afternoon ECLSS maintenance.',
      moodScore: 2,
      tags: ['private', 'comms-delay', 'pacing'],
      sharedWithGround: false,
      source: 'simulated',
    },
  ];

  const grants: AccessGrant[] = [
    {
      id: 'GRT-ASTRA-001-01',
      crewId: 'ASTRA-001',
      grantedToRole: 'specialist',
      scope: 'summary_and_alerts',
      createdAt: '2026-04-01T00:00:00.000Z',
      expiresAt: '2026-06-01T00:00:00.000Z',
      active: true,
      note: 'Standard mission summary & alert telemetry grant.',
    },
    {
      id: 'GRT-ASTRA-002-01',
      crewId: 'ASTRA-002',
      grantedToRole: 'specialist',
      scope: 'all_vitals',
      createdAt: '2026-04-01T00:00:00.000Z',
      expiresAt: '2026-06-01T00:00:00.000Z',
      active: true,
      note: 'Full vitals & baseline band telemetry grant for Flight Surgeon.',
    },
    {
      id: 'GRT-ASTRA-002-02',
      crewId: 'ASTRA-002',
      grantedToRole: 'specialist',
      scope: 'specific_journal_entries',
      journalEntryIds: ['JRN-ASTRA-002-02'],
      createdAt: '2026-04-24T07:45:00.000Z',
      expiresAt: '2026-05-01T00:00:00.000Z',
      active: true,
      note: 'Time-limited share for JRN-ASTRA-002-02 only.',
    },
    {
      id: 'GRT-ASTRA-003-01',
      crewId: 'ASTRA-003',
      grantedToRole: 'specialist',
      scope: 'all_vitals',
      createdAt: '2026-04-01T00:00:00.000Z',
      expiresAt: '2026-06-01T00:00:00.000Z',
      active: true,
      note: 'EVA countermeasure & vitals telemetry grant.',
    },
    {
      id: 'GRT-ASTRA-004-01',
      crewId: 'ASTRA-004',
      grantedToRole: 'specialist',
      scope: 'summary_and_alerts',
      createdAt: '2026-04-01T00:00:00.000Z',
      expiresAt: '2026-06-01T00:00:00.000Z',
      active: true,
      note: 'Summary & alert telemetry grant (private journals excluded).',
    },
  ];

  const messages: GroundMessage[] = [
    {
      id: 'MSG-ASTRA-002-01',
      crewId: 'ASTRA-002',
      missionDay: 24,
      createdAt: '2026-04-24T07:55:00.000Z',
      senderRole: 'astronaut',
      senderName: 'Dr. Marcus Vance',
      subject: 'MD-24 Multi-domain R-COMBINED trend packet for review',
      body: 'Attached 7-day trend summary for Sleep Duration, Resting HR, Systolic BP, and Habitat CO₂. Sleeping-quarter ventilation fan baffle realigned at 07:40 UTC; planning 8.5 h protected sleep window tonight.',
      priority: 'medical_review',
      state: 'reply_received',
      oneWayDelaySec: 61.7,
      distanceKm: 18_500_000,
      attachmentSizeKb: 64,
      estimatedArrivalAt: '2026-04-24T07:56:09.000Z',
      linkedAlertId: 'ALT-ASTRA-002-MD24-R-COMBINED',
      includedMetrics: ['sleep_duration_h', 'heart_rate', 'systolic_bp', 'cabin_co2_ppm'],
      replyBody:
        'Flight Surgeon Console (Houston): Packet received. Concur with Tier 1 hydration (+400 mL), berth fan realignment, and protected 8.5 h sleep window tonight. Please repeat dual-cuff BP + resting HR tomorrow morning (MD-25).',
      replyReceivedAt: '2026-04-24T08:04:12.000Z',
    },
    {
      id: 'MSG-ASTRA-003-01',
      crewId: 'ASTRA-003',
      missionDay: 24,
      createdAt: '2026-04-24T07:20:00.000Z',
      senderRole: 'specialist',
      senderName: 'Dr. Sarah Chen (Flight Surgeon)',
      subject: 'ARED resistive load & EVA hydration check-in',
      body: 'Noted the 4-day dip in ARED resistive minutes and fluid intake during airlock prep. Recommend prioritizing a 35-min ARED session and 2,400 mL hydration today.',
      priority: 'routine',
      state: 'delivered',
      oneWayDelaySec: 1.3,
      distanceKm: 384_400,
      attachmentSizeKb: 24,
      estimatedArrivalAt: '2026-04-24T07:20:04.000Z',
      linkedAlertId: 'ALT-ASTRA-003-MD24-R-ACTIVITY-DROP',
      includedMetrics: ['resistive_load_min', 'exercise_minutes', 'hydration_ml'],
    },
  ];

  const baseQuests: QuestItem[] = [
    {
      id: 'Q-01',
      code: 'MORNING_RITUAL',
      title: 'Seal Morning Pulse Ritual',
      description: 'Complete your 6-step daily self-assessment to keep your 14-day rolling baseline sharp.',
      category: 'ritual',
      cadence: 'daily',
      xpReward: 35,
      completedToday: true,
      progress: 1,
      target: 1,
      constellationX: 70,
      constellationY: 60,
    },
    {
      id: 'Q-02',
      code: 'HYDRATION_SHIELD',
      title: 'Renal & Plasma Hydration Target (2,200+ mL)',
      description: 'Log at least 2,200 mL of water/electrolyte intake to support intravascular volume and renal health.',
      category: 'hydration',
      cadence: 'daily',
      xpReward: 25,
      completedToday: false,
      progress: 1850,
      target: 2200,
      constellationX: 165,
      constellationY: 48,
    },
    {
      id: 'Q-03',
      code: 'GRAVITY_GUARDIAN',
      title: 'ARED + Aerobic Countermeasure Block',
      description: 'Complete >= 35 min resistive loading and >= 30 min aerobic conditioning.',
      category: 'countermeasure',
      cadence: 'daily',
      xpReward: 30,
      completedToday: true,
      progress: 75,
      target: 65,
      constellationX: 255,
      constellationY: 85,
    },
    {
      id: 'Q-04',
      code: 'CIRCADIAN_ANCHOR',
      title: 'Circadian Wind-Down & 4-6 Breathing',
      description: 'Complete 4 minutes of paced recovery breathing and pre-sleep warm light alignment.',
      category: 'mindfulness',
      cadence: 'daily',
      xpReward: 20,
      completedToday: false,
      progress: 0,
      target: 1,
      constellationX: 120,
      constellationY: 135,
    },
    {
      id: 'Q-05',
      code: 'PVT_VIGILANCE',
      title: 'Weekly Psychomotor Vigilance & Vision Check',
      description: 'Run the 1-minute Reaction Test and SANS Amsler grid check in Measure Lab.',
      category: 'sleep',
      cadence: 'weekly',
      xpReward: 40,
      completedToday: true,
      progress: 2,
      target: 2,
      constellationX: 215,
      constellationY: 145,
    },
  ];

  const quests: Record<string, QuestItem[]> = {};
  for (const c of CREW_PROFILES) {
    quests[c.id] = baseQuests.map((q) => ({ ...q, id: `${q.id}-${c.id}` }));
  }

  const auditLog: AuditLogEntry[] = [
    {
      id: 'AUD-001',
      timestamp: '2026-04-24T07:30:00.000Z',
      actorRole: 'system',
      actorId: 'analytics-engine-v1.0.0-demo',
      action: 'EVALUATE_SEED_SCENARIOS',
      targetType: 'seed',
      targetId: 'ARES-01-MD24',
      summary: 'Initialized 24-day deterministic mission scenarios for ASTRA-001..ASTRA-004 under ruleset 1.0.0-demo.',
    },
    {
      id: 'AUD-002',
      timestamp: '2026-04-24T07:45:00.000Z',
      actorRole: 'astronaut',
      actorId: 'ASTRA-002',
      action: 'GRANT_JOURNAL_SHARE',
      targetType: 'grant',
      targetId: 'GRT-ASTRA-002-02',
      summary: 'Dr. Marcus Vance shared journal entry JRN-ASTRA-002-02 with Flight Surgeon (expires 2026-05-01).',
    },
  ];

  return {
    crew: CREW_PROFILES.map((c) => ({ ...c })),
    observations,
    checkins,
    alerts,
    journals,
    grants,
    messages,
    quests,
    auditLog,
  };
}
