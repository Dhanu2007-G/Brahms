/**
 * AstraPulse — Canonical Ruleset v1.0.0-demo, Metric Catalogue, Protocols & NASA Evidence Library
 * Team Zenitsu — NASA Space Apps Challenge 2026
 */

import * as yaml from 'js-yaml';
import {
  BodyRegionId,
  CareGuideProtocol,
  EnvironmentMode,
  HazardId,
  MetricCode,
  MetricDefinition,
} from './types';

export const RULESET_VERSION = '1.0.0-demo';

export const RULESET_YAML = `
version: "1.0.0-demo"
team: "Zenitsu"
application: "AstraPulse"
baseline:
  window_days: 14
  min_samples: 5
  building_min_samples: 3
  mad_scale_factor: 1.4826
  iqr_scale_factor: 0.7413
single_reading_thresholds:
  informational_z: 1.8
  watch_z: 2.3
  review_required_z: 3.2
persistence_rules:
  R-PERSIST-WATCH:
    id: "R-PERSIST-WATCH"
    severity: "watch"
    window_days: 4
    min_matching_days: 3
    adverse_z_threshold: 1.6
  R-PERSIST-REVIEW:
    id: "R-PERSIST-REVIEW"
    severity: "review_required"
    window_days: 5
    min_matching_days: 4
    adverse_z_threshold: 2.2
  R-ACTIVITY-DROP:
    id: "R-ACTIVITY-DROP"
    severity: "watch"
    metrics: ["exercise_minutes", "resistive_load_min", "hydration_ml"]
    window_days: 3
    min_matching_days: 3
    adverse_z_threshold: 1.5
  R-WELLNESS-STRAIN:
    id: "R-WELLNESS-STRAIN"
    severity: "watch"
    metrics: ["mood_score", "stress_score", "fatigue_score", "sleep_quality"]
    window_days: 4
    min_matching_days: 3
    adverse_z_threshold: 1.5
combined_rules:
  R-COMBINED:
    id: "R-COMBINED"
    severity: "review_required"
    title: "Multi-domain sleep, cardiovascular, and stress shift"
    window_days: 3
    min_matching_days: 3
    conditions:
      sleep_duration_h_max: 6.0
      heart_rate_adverse_z_min: 2.0
      stress_or_fatigue_adverse_z_min: 1.5
  R-SLEEP-CRITICAL:
    id: "R-SLEEP-CRITICAL"
    severity: "watch"
    sleep_duration_h_threshold: 4.5
  R-HABITAT-CO2:
    id: "R-HABITAT-CO2"
    severity: "watch"
    cabin_co2_ppm_watch: 3500
    cabin_co2_ppm_review: 5000
`;

export interface RulesetConfig {
  version: string;
  team: string;
  application: string;
  baseline: {
    window_days: number;
    min_samples: number;
    building_min_samples: number;
    mad_scale_factor: number;
    iqr_scale_factor: number;
  };
  single_reading_thresholds: {
    informational_z: number;
    watch_z: number;
    review_required_z: number;
  };
}

export const RULESET_CONFIG = yaml.load(RULESET_YAML) as RulesetConfig;

export const PROHIBITED_MEDICAL_TERMS = [
  'diagnosed with',
  'you have hypertension',
  'you have diabetes',
  'you have depression',
  'you have arrhythmia',
  'you have sepsis',
  'take ibuprofen',
  'take acetaminophen',
  'take zolpidem',
  'take modafinil',
  'prescribe',
  'mg tablet',
  'clinical diagnosis',
];

export const MANDATORY_CARE_DISCLAIMER =
  'Demonstration content — requires replacement/approval by qualified flight medical personnel before real use.';

export const MANDATORY_SIMULATED_DISCLOSURE =
  'Demo data is simulated. Decision-support prototype. Not a medical device.';

export const METRIC_DEFINITIONS: Record<MetricCode, MetricDefinition> = {
  systolic_bp: {
    code: 'systolic_bp',
    label: 'Systolic Blood Pressure',
    shortLabel: 'Systolic BP',
    unit: 'mmHg',
    altUnit: 'kPa',
    category: 'vital',
    bodyRegion: 'cardiovascular',
    hazards: ['gravity_fields', 'isolation_confinement'],
    direction: 'two_sided',
    minPlausible: 60,
    maxPlausible: 250,
    softLow: 90,
    softHigh: 140,
    floorBandwidth: 4.0,
    decimals: 0,
    description: 'Peak arterial pressure during cardiac contraction.',
    whyItMatters:
      'Microgravity causes cephalad fluid shifts and baroreceptor adaptation, altering arterial pressure regulation during transit and surface transitions.',
    howToMeasure: [
      'Rest quietly in a seated or neutral microgravity posture for 5 minutes before cuff inflation.',
      'Position the brachial cuff at heart level with your arm supported.',
      'Take 2 readings 60 seconds apart; AstraPulse automatically computes the average.',
    ],
    checklistId: 'PROTO-CARDIO',
    isPersonal: true,
  },
  diastolic_bp: {
    code: 'diastolic_bp',
    label: 'Diastolic Blood Pressure',
    shortLabel: 'Diastolic BP',
    unit: 'mmHg',
    altUnit: 'kPa',
    category: 'vital',
    bodyRegion: 'cardiovascular',
    hazards: ['gravity_fields', 'isolation_confinement'],
    direction: 'two_sided',
    minPlausible: 35,
    maxPlausible: 150,
    softLow: 55,
    softHigh: 90,
    floorBandwidth: 3.0,
    decimals: 0,
    description: 'Resting arterial pressure between heartbeats.',
    whyItMatters:
      'Tracks vascular resistance changes alongside systolic BP to compute Mean Arterial Pressure (MAP) and Pulse Pressure (PP).',
    howToMeasure: [
      'Recorded automatically alongside Systolic BP using the upper-arm oscillometric cuff.',
      'Keep muscles relaxed and avoid talking during cuff deflation.',
    ],
    checklistId: 'PROTO-CARDIO',
    isPersonal: true,
  },
  mean_arterial_pressure: {
    code: 'mean_arterial_pressure',
    label: 'Mean Arterial Pressure',
    shortLabel: 'MAP',
    unit: 'mmHg',
    altUnit: 'kPa',
    category: 'vital',
    bodyRegion: 'cardiovascular',
    hazards: ['gravity_fields'],
    direction: 'two_sided',
    minPlausible: 45,
    maxPlausible: 180,
    softLow: 65,
    softHigh: 105,
    floorBandwidth: 3.0,
    decimals: 1,
    description: 'Derived average arterial perfusion pressure across one cardiac cycle: DBP + (SBP - DBP) / 3.',
    whyItMatters:
      'Reflects organ and cerebral perfusion pressure during fluid shifts and orthostatic stress.',
    howToMeasure: ['Derived automatically whenever Systolic and Diastolic BP are recorded together.'],
    checklistId: 'PROTO-CARDIO',
    isPersonal: true,
  },
  pulse_pressure: {
    code: 'pulse_pressure',
    label: 'Pulse Pressure',
    shortLabel: 'Pulse Pressure',
    unit: 'mmHg',
    altUnit: 'kPa',
    category: 'vital',
    bodyRegion: 'cardiovascular',
    hazards: ['gravity_fields'],
    direction: 'two_sided',
    minPlausible: 15,
    maxPlausible: 120,
    softLow: 30,
    softHigh: 60,
    floorBandwidth: 3.0,
    decimals: 0,
    description: 'Difference between systolic and diastolic blood pressure (SBP - DBP).',
    whyItMatters:
      'Changes in pulse pressure can reflect stroke volume shifts, hydration status, or arterial stiffness changes in microgravity.',
    howToMeasure: ['Derived automatically from paired Systolic and Diastolic BP readings.'],
    checklistId: 'PROTO-CARDIO',
    isPersonal: true,
  },
  heart_rate: {
    code: 'heart_rate',
    label: 'Resting Heart Rate',
    shortLabel: 'Heart Rate',
    unit: 'bpm',
    category: 'vital',
    bodyRegion: 'cardiovascular',
    hazards: ['gravity_fields', 'isolation_confinement', 'hostile_closed_environment'],
    direction: 'two_sided',
    minPlausible: 30,
    maxPlausible: 220,
    softLow: 48,
    softHigh: 95,
    floorBandwidth: 2.0,
    decimals: 0,
    description: 'Resting ventricular beats per minute measured before heavy exertion.',
    whyItMatters:
      'Sustained elevations above your personal baseline can reflect autonomic strain, sleep debt, dehydration, or cardiovascular deconditioning.',
    howToMeasure: [
      'Measure within 15 minutes of waking or after 5 minutes of calm rest.',
      'Use chest/wrist telemetry, Tap-Tempo counter, or the Experimental Camera Pulse tool (confidence >= 0.4).',
    ],
    checklistId: 'PROTO-CARDIO',
    isPersonal: true,
  },
  blood_glucose: {
    code: 'blood_glucose',
    label: 'Blood Glucose',
    shortLabel: 'Glucose',
    unit: 'mg/dL',
    altUnit: 'mmol/L',
    category: 'vital',
    bodyRegion: 'gastrointestinal',
    hazards: ['gravity_fields', 'space_radiation', 'isolation_confinement'],
    direction: 'two_sided',
    minPlausible: 35,
    maxPlausible: 500,
    softLow: 70,
    softHigh: 140,
    floorBandwidth: 4.0,
    decimals: 0,
    description: 'Capillary or continuous interstitial blood glucose concentration (requires meal-timing tag).',
    whyItMatters:
      'Spaceflight is associated with subclinical insulin resistance and altered carbohydrate metabolism; always tag readings as fasting, pre-meal, or post-meal.',
    howToMeasure: [
      'Select your context tag (Fasting >=8h, Pre-meal, or Post-meal 2h) before saving.',
      'Clean fingertip, use capillary test strip or log verified continuous sensor reading.',
    ],
    checklistId: 'PROTO-METABOLIC',
    isPersonal: true,
  },
  body_temp_c: {
    code: 'body_temp_c',
    label: 'Body Temperature',
    shortLabel: 'Temp',
    unit: '°C',
    altUnit: '°F',
    category: 'vital',
    bodyRegion: 'immune_skin',
    hazards: ['space_radiation', 'hostile_closed_environment', 'isolation_confinement'],
    direction: 'two_sided',
    minPlausible: 33.0,
    maxPlausible: 42.5,
    softLow: 36.0,
    softHigh: 37.6,
    floorBandwidth: 0.15,
    decimals: 1,
    description: 'Core or tympanic/oral body temperature.',
    whyItMatters:
      'Spaceflight alters thermoregulation ("space fever" during exercise) and immune reactivation; tracking against your personal baseline helps spot inflammatory or circadian shifts early.',
    howToMeasure: [
      'Wait at least 20 minutes after hot/cold liquids or exercise.',
      'Use the crew tympanic or sublingual thermometer in the same anatomical site each day.',
    ],
    checklistId: 'PROTO-IMMUNE',
    isPersonal: true,
  },
  spo2_pct: {
    code: 'spo2_pct',
    label: 'Blood Oxygen (SpO₂)',
    shortLabel: 'SpO₂',
    unit: '%',
    category: 'vital',
    bodyRegion: 'respiratory',
    hazards: ['hostile_closed_environment', 'gravity_fields'],
    direction: 'low_bad',
    minPlausible: 65,
    maxPlausible: 100,
    softLow: 94,
    softHigh: 100,
    floorBandwidth: 0.8,
    decimals: 0,
    description: 'Peripheral arterial hemoglobin oxygen saturation.',
    whyItMatters:
      'Monitors respiratory gas exchange across changing cabin atmosphere pressures and pre-EVA denitrogenation protocols.',
    howToMeasure: [
      'Ensure fingertip is warm and still inside the pulse oximeter clip for 20 seconds.',
      'Verify a steady plethysmograph waveform before recording.',
    ],
    checklistId: 'PROTO-RESP',
    isPersonal: true,
  },
  respiratory_rate: {
    code: 'respiratory_rate',
    label: 'Respiratory Rate',
    shortLabel: 'Resp Rate',
    unit: 'br/min',
    category: 'vital',
    bodyRegion: 'respiratory',
    hazards: ['hostile_closed_environment', 'isolation_confinement'],
    direction: 'two_sided',
    minPlausible: 5,
    maxPlausible: 50,
    softLow: 10,
    softHigh: 20,
    floorBandwidth: 1.0,
    decimals: 0,
    description: 'Resting breaths per minute.',
    whyItMatters:
      'Sensitive to cabin CO₂ partial pressure, metabolic demand, and autonomic stress load.',
    howToMeasure: [
      'Breathe naturally while seated or floating calmly.',
      'Use the 30-second Respiratory Tap tool in Measure Lab or wearable chest strap.',
    ],
    checklistId: 'PROTO-RESP',
    isPersonal: true,
  },
  body_mass_kg: {
    code: 'body_mass_kg',
    label: 'Body Mass',
    shortLabel: 'Body Mass',
    unit: 'kg',
    altUnit: 'lb',
    category: 'vital',
    bodyRegion: 'musculoskeletal',
    hazards: ['gravity_fields', 'distance_from_earth'],
    direction: 'two_sided',
    minPlausible: 35,
    maxPlausible: 180,
    softLow: 50,
    softHigh: 110,
    floorBandwidth: 0.4,
    decimals: 1,
    description: 'Inertial body mass measured via Space Linear Acceleration Mass Measurement Device (SLAMMD) or surface scale.',
    whyItMatters:
      'Unintended mass loss in spaceflight accelerates lean muscle and bone mineral density depletion.',
    howToMeasure: [
      'Measure at the same time of day in standard flight garments using SLAMMD or habitat mass rig.',
    ],
    checklistId: 'PROTO-MSK',
    isPersonal: true,
  },
  sleep_duration_h: {
    code: 'sleep_duration_h',
    label: 'Daily Sleep Duration',
    shortLabel: 'Sleep Hours',
    unit: 'h',
    category: 'wellness',
    bodyRegion: 'sleep_circadian',
    hazards: ['isolation_confinement', 'hostile_closed_environment', 'gravity_fields'],
    direction: 'low_bad',
    minPlausible: 0,
    maxPlausible: 18,
    softLow: 6.5,
    softHigh: 9.5,
    floorBandwidth: 0.4,
    decimals: 1,
    description: 'Total consolidated sleep hours in the past 24-hour mission cycle.',
    whyItMatters:
      'Orbital sunrises or habitat lighting disrupt circadian entrainment; cumulative sleep debt degrades reaction speed, mood stability, and cardiovascular recovery.',
    howToMeasure: [
      'Log lights-out and wake times on the 24-hour Sleep Dial during your morning Pulse Ritual.',
    ],
    checklistId: 'PROTO-SLEEP',
    isPersonal: true,
  },
  sleep_quality: {
    code: 'sleep_quality',
    label: 'Sleep Quality',
    shortLabel: 'Sleep Quality',
    unit: '/5',
    category: 'wellness',
    bodyRegion: 'sleep_circadian',
    hazards: ['isolation_confinement', 'hostile_closed_environment'],
    direction: 'low_bad',
    minPlausible: 1,
    maxPlausible: 5,
    softLow: 3,
    softHigh: 5,
    floorBandwidth: 0.5,
    decimals: 1,
    description: 'Subjective restorative quality of sleep on a 1 (fragmented) to 5 (deeply restorative) scale.',
    whyItMatters:
      'Captures sleep fragmentation from cabin noise, CO₂ pockets, or circadian misalignment even when total hours appear adequate.',
    howToMeasure: ['Select one of the 5 Sleep Quality Orbs upon waking in Pulse Ritual.'],
    checklistId: 'PROTO-SLEEP',
    isPersonal: true,
  },
  mood_score: {
    code: 'mood_score',
    label: 'Mood Valence',
    shortLabel: 'Mood',
    unit: '/5',
    category: 'wellness',
    bodyRegion: 'mood_cognition',
    hazards: ['isolation_confinement', 'distance_from_earth'],
    direction: 'low_bad',
    minPlausible: 1,
    maxPlausible: 5,
    softLow: 3,
    softHigh: 5,
    floorBandwidth: 0.5,
    decimals: 1,
    description: 'Self-reported mood state from 1 (depleted/strained) to 5 (grounded/energized).',
    whyItMatters:
      'Long-duration confinement and communication delays create cumulative behavioral health strain; early self-awareness supports proactive pacing and crew cohesion.',
    howToMeasure: ['Select the Mood Orb that best matches your current state in Pulse Ritual.'],
    checklistId: 'PROTO-MIND',
    isPersonal: true,
  },
  stress_score: {
    code: 'stress_score',
    label: 'Perceived Stress Load',
    shortLabel: 'Stress',
    unit: '/5',
    category: 'wellness',
    bodyRegion: 'mood_cognition',
    hazards: ['isolation_confinement', 'distance_from_earth'],
    direction: 'high_bad',
    minPlausible: 1,
    maxPlausible: 5,
    softLow: 1,
    softHigh: 3,
    floorBandwidth: 0.5,
    decimals: 1,
    description: 'Self-reported cognitive and operational stress load from 1 (calm) to 5 (overloaded).',
    whyItMatters:
      'Sustained high stress combines with sleep curtailment to elevate heart rate and slow psychomotor vigilance.',
    howToMeasure: ['Rate current workload and emotional tension from 1 to 5 in Pulse Ritual.'],
    checklistId: 'PROTO-MIND',
    isPersonal: true,
  },
  fatigue_score: {
    code: 'fatigue_score',
    label: 'Subjective Fatigue',
    shortLabel: 'Fatigue',
    unit: '/5',
    category: 'wellness',
    bodyRegion: 'mood_cognition',
    hazards: ['isolation_confinement', 'gravity_fields'],
    direction: 'high_bad',
    minPlausible: 1,
    maxPlausible: 5,
    softLow: 1,
    softHigh: 3,
    floorBandwidth: 0.5,
    decimals: 1,
    description: 'Perceived physical and mental exhaustion from 1 (fresh) to 5 (exhausted).',
    whyItMatters:
      'High subjective fatigue before EVA or robotic arm operations increases procedural error risk.',
    howToMeasure: ['Rate your current fatigue level from 1 to 5 in Pulse Ritual.'],
    checklistId: 'PROTO-MIND',
    isPersonal: true,
  },
  exercise_minutes: {
    code: 'exercise_minutes',
    label: 'Aerobic Countermeasure Time',
    shortLabel: 'Aerobic Exercise',
    unit: 'min',
    category: 'behaviour',
    bodyRegion: 'musculoskeletal',
    hazards: ['gravity_fields'],
    direction: 'low_bad',
    minPlausible: 0,
    maxPlausible: 240,
    softLow: 35,
    softHigh: 90,
    floorBandwidth: 6.0,
    decimals: 0,
    description: 'Daily minutes of cycle ergometer (CEVIS) or treadmill (T2) cardiovascular countermeasure.',
    whyItMatters:
      'Consistent aerobic exercise preserves VO₂ max, plasma volume, and orthostatic tolerance in altered gravity.',
    howToMeasure: ['Log completed CEVIS or treadmill session minutes in Fuel & Move.'],
    checklistId: 'PROTO-MSK',
    isPersonal: true,
  },
  resistive_load_min: {
    code: 'resistive_load_min',
    label: 'Resistive Exercise (ARED)',
    shortLabel: 'Resistive Load',
    unit: 'min',
    category: 'behaviour',
    bodyRegion: 'musculoskeletal',
    hazards: ['gravity_fields'],
    direction: 'low_bad',
    minPlausible: 0,
    maxPlausible: 180,
    softLow: 30,
    softHigh: 75,
    floorBandwidth: 5.0,
    decimals: 0,
    description: 'Daily minutes of Advanced Resistive Exercise Device (ARED) bone/muscle loading.',
    whyItMatters:
      'High-load resistive exercise is the primary defence against femoral/spinal bone mineral loss (~1–1.5%/month in microgravity) and postural muscle atrophy.',
    howToMeasure: ['Log completed ARED resistive session minutes in Fuel & Move.'],
    checklistId: 'PROTO-MSK',
    isPersonal: true,
  },
  hydration_ml: {
    code: 'hydration_ml',
    label: 'Daily Fluid Intake',
    shortLabel: 'Hydration',
    unit: 'mL',
    category: 'behaviour',
    bodyRegion: 'gastrointestinal',
    hazards: ['gravity_fields', 'hostile_closed_environment'],
    direction: 'low_bad',
    minPlausible: 0,
    maxPlausible: 6000,
    softLow: 2000,
    softHigh: 3500,
    floorBandwidth: 150,
    decimals: 0,
    description: 'Total daily water and electrolyte drink intake in millilitres.',
    whyItMatters:
      'Adequate hydration reduces kidney stone risk from bone calcium mobilization and supports plasma volume maintenance.',
    howToMeasure: ['Tap water pouches/glasses (250 mL each) or enter total mL in Fuel & Move.'],
    checklistId: 'PROTO-METABOLIC',
    isPersonal: true,
  },
  meal_completion_pct: {
    code: 'meal_completion_pct',
    label: 'Caloric & Ration Completion',
    shortLabel: 'Meal Intake',
    unit: '%',
    category: 'behaviour',
    bodyRegion: 'gastrointestinal',
    hazards: ['distance_from_earth', 'gravity_fields'],
    direction: 'low_bad',
    minPlausible: 0,
    maxPlausible: 150,
    softLow: 80,
    softHigh: 110,
    floorBandwidth: 6.0,
    decimals: 0,
    description: 'Percentage of planned daily mission caloric/nutrient ration consumed.',
    whyItMatters:
      'Spaceflight menu fatigue and fluid shifts often suppress appetite; energy deficit compounds bone loss and immune changes.',
    howToMeasure: ['Estimate percentage of scheduled ration packs finished today.'],
    checklistId: 'PROTO-METABOLIC',
    isPersonal: true,
  },
  reaction_time_ms: {
    code: 'reaction_time_ms',
    label: 'Psychomotor Vigilance (PVT)',
    shortLabel: 'Reaction Time',
    unit: 'ms',
    category: 'cognition',
    bodyRegion: 'head_neuro',
    hazards: ['isolation_confinement', 'hostile_closed_environment', 'space_radiation'],
    direction: 'high_bad',
    minPlausible: 120,
    maxPlausible: 1500,
    softLow: 180,
    softHigh: 340,
    floorBandwidth: 15.0,
    decimals: 0,
    description: 'Median response latency (ms) on the 1-minute Psychomotor Vigilance Reaction Test.',
    whyItMatters:
      'Objective measure of attentional alertness sensitive to sleep loss, circadian phase, and elevated cabin CO₂.',
    howToMeasure: [
      'Complete the 60-second Reaction Test in Measure Lab before high-precision tasks.',
    ],
    checklistId: 'PROTO-NEURO',
    isPersonal: true,
  },
  cabin_co2_ppm: {
    code: 'cabin_co2_ppm',
    label: 'Cabin CO₂ Concentration',
    shortLabel: 'Cabin CO₂',
    unit: 'ppm',
    category: 'habitat',
    bodyRegion: 'head_neuro',
    hazards: ['hostile_closed_environment'],
    direction: 'high_bad',
    minPlausible: 300,
    maxPlausible: 15000,
    softLow: 400,
    softHigh: 3500,
    floorBandwidth: 150,
    decimals: 0,
    description: 'Ambient habitat carbon dioxide concentration in parts per million (Environment reading — not a personal vital).',
    whyItMatters:
      'In microgravity, lack of natural convection allows CO₂ pockets to form around sleeping crew, contributing to morning headaches, slowed vigilance, and fragmented sleep above ~3,500 ppm.',
    howToMeasure: ['Read from cabin CDRA / environmental sensor bus or log portable CO₂ meter reading.'],
    checklistId: 'PROTO-HABITAT',
    isPersonal: false,
  },
  cabin_noise_dba: {
    code: 'cabin_noise_dba',
    label: 'Habitat Acoustic Level',
    shortLabel: 'Cabin Noise',
    unit: 'dBA',
    category: 'habitat',
    bodyRegion: 'sleep_circadian',
    hazards: ['hostile_closed_environment'],
    direction: 'high_bad',
    minPlausible: 25,
    maxPlausible: 120,
    softLow: 40,
    softHigh: 65,
    floorBandwidth: 2.0,
    decimals: 1,
    description: 'Continuous A-weighted ambient sound pressure level in the habitat module.',
    whyItMatters:
      'Fans, pumps, and life-support racks generate continuous background noise that can fragment sleep and cause temporary threshold shifts.',
    howToMeasure: ['Use the Ambient Noise Check tool in Measure Lab or log acoustic dosimeter reading.'],
    checklistId: 'PROTO-HABITAT',
    isPersonal: false,
  },
  radiation_dose_mgy: {
    code: 'radiation_dose_mgy',
    label: 'Daily Absorbed Radiation Dose',
    shortLabel: 'Radiation Dose',
    unit: 'mGy/d',
    category: 'habitat',
    bodyRegion: 'radiation_exposure',
    hazards: ['space_radiation'],
    direction: 'high_bad',
    minPlausible: 0.01,
    maxPlausible: 50.0,
    softLow: 0.1,
    softHigh: 1.5,
    floorBandwidth: 0.08,
    decimals: 2,
    description: 'Daily absorbed ionizing radiation dose in milligray (mGy/day) from GCR and solar particle events.',
    whyItMatters:
      'Tracks cumulative galactic cosmic ray (GCR) and solar particle event (SPE) exposure; note that absorbed dose (Gy) is distinct from biological dose equivalent (Sv).',
    howToMeasure: ['Synced from onboard Crew Passive Dosimeter / RadLab telemetry bus.'],
    checklistId: 'PROTO-RADIATION',
    isPersonal: false,
  },
};

export const BODY_REGIONS: Record<
  BodyRegionId,
  {
    id: BodyRegionId;
    label: string;
    shortLabel: string;
    side: 'front' | 'back' | 'both';
    x: number;
    y: number;
    primaryMetric: MetricCode;
    metrics: MetricCode[];
    hazards: HazardId[];
    checklistId: string;
    functionSummary: string;
  }
> = {
  head_neuro: {
    id: 'head_neuro',
    label: 'Head, Neuro & Vestibular',
    shortLabel: 'Head & Neuro',
    side: 'front',
    x: 100,
    y: 26,
    primaryMetric: 'reaction_time_ms',
    metrics: ['reaction_time_ms', 'cabin_co2_ppm', 'sleep_duration_h'],
    hazards: ['gravity_fields', 'hostile_closed_environment', 'space_radiation'],
    checklistId: 'PROTO-NEURO',
    functionSummary:
      'Monitors psychomotor vigilance, cephalad fluid-shift pressure sensation, and CO₂-linked headache risk.',
  },
  eyes_vision: {
    id: 'eyes_vision',
    label: 'Eyes & Vision (SANS Watch)',
    shortLabel: 'Eyes & SANS',
    side: 'front',
    x: 128,
    y: 52,
    primaryMetric: 'systolic_bp',
    metrics: ['systolic_bp', 'mean_arterial_pressure', 'cabin_co2_ppm'],
    hazards: ['gravity_fields', 'hostile_closed_environment'],
    checklistId: 'PROTO-VISION',
    functionSummary:
      'Spaceflight-Associated Neuro-ocular Syndrome (SANS) surveillance via Amsler grid, acuity self-check, and ocular ultrasound caliper.',
  },
  cardiovascular: {
    id: 'cardiovascular',
    label: 'Heart & Vascular Regulation',
    shortLabel: 'Cardiovascular',
    side: 'front',
    x: 118,
    y: 138,
    primaryMetric: 'heart_rate',
    metrics: ['heart_rate', 'systolic_bp', 'diastolic_bp', 'mean_arterial_pressure', 'pulse_pressure'],
    hazards: ['gravity_fields', 'isolation_confinement', 'space_radiation'],
    checklistId: 'PROTO-CARDIO',
    functionSummary:
      'Tracks resting heart rate, arterial blood pressure, MAP, and pulse pressure across fluid shifts and aerobic conditioning.',
  },
  respiratory: {
    id: 'respiratory',
    label: 'Lungs & Gas Exchange',
    shortLabel: 'Respiratory',
    side: 'front',
    x: 78,
    y: 110,
    primaryMetric: 'spo2_pct',
    metrics: ['spo2_pct', 'respiratory_rate', 'cabin_co2_ppm'],
    hazards: ['hostile_closed_environment', 'gravity_fields'],
    checklistId: 'PROTO-RESP',
    functionSummary:
      'Monitors oxygen saturation, resting respiratory rate, and response to cabin atmosphere and lunar/planetary dust.',
  },
  gastrointestinal: {
    id: 'gastrointestinal',
    label: 'Metabolism, Hydration & Fuel',
    shortLabel: 'Fuel & Hydration',
    side: 'front',
    x: 100,
    y: 196,
    primaryMetric: 'blood_glucose',
    metrics: ['blood_glucose', 'hydration_ml', 'meal_completion_pct'],
    hazards: ['distance_from_earth', 'gravity_fields'],
    checklistId: 'PROTO-METABOLIC',
    functionSummary:
      'Tracks context-tagged blood glucose, fluid intake for renal stone prevention, and daily ration completion.',
  },
  musculoskeletal: {
    id: 'musculoskeletal',
    label: 'Bone, Spine & Muscle Load',
    shortLabel: 'Musculoskeletal',
    side: 'back',
    x: 100,
    y: 238,
    primaryMetric: 'resistive_load_min',
    metrics: ['resistive_load_min', 'exercise_minutes', 'body_mass_kg'],
    hazards: ['gravity_fields'],
    checklistId: 'PROTO-MSK',
    functionSummary:
      'Tracks ARED resistive loading, aerobic exercise adherence, and inertial body mass to protect bone density and postural muscle.',
  },
  immune_skin: {
    id: 'immune_skin',
    label: 'Immune & Thermoregulation',
    shortLabel: 'Immune & Skin',
    side: 'front',
    x: 42,
    y: 174,
    primaryMetric: 'body_temp_c',
    metrics: ['body_temp_c', 'sleep_duration_h', 'hydration_ml'],
    hazards: ['space_radiation', 'hostile_closed_environment', 'isolation_confinement'],
    checklistId: 'PROTO-IMMUNE',
    functionSummary:
      'Monitors core temperature shifts, skin integrity logs, and countermeasure habits supporting immune resilience.',
  },
  sleep_circadian: {
    id: 'sleep_circadian',
    label: 'Sleep & Circadian Rhythm',
    shortLabel: 'Sleep & Circadian',
    side: 'back',
    x: 100,
    y: 78,
    primaryMetric: 'sleep_duration_h',
    metrics: ['sleep_duration_h', 'sleep_quality', 'cabin_noise_dba'],
    hazards: ['isolation_confinement', 'hostile_closed_environment'],
    checklistId: 'PROTO-SLEEP',
    functionSummary:
      'Tracks 24-hour consolidated sleep, subjective restoration, 7-day cumulative sleep debt, and acoustic environment.',
  },
  mood_cognition: {
    id: 'mood_cognition',
    label: 'Behavioral Health & Readiness',
    shortLabel: 'Mind & Mood',
    side: 'front',
    x: 68,
    y: 56,
    primaryMetric: 'mood_score',
    metrics: ['mood_score', 'stress_score', 'fatigue_score', 'reaction_time_ms'],
    hazards: ['isolation_confinement', 'distance_from_earth'],
    checklistId: 'PROTO-MIND',
    functionSummary:
      'Supports self-reflection on mood, perceived stress, subjective fatigue, and operational readiness under communication delay.',
  },
  radiation_exposure: {
    id: 'radiation_exposure',
    label: 'Whole-Body Radiation Dosimetry',
    shortLabel: 'Radiation Shield',
    side: 'back',
    x: 144,
    y: 152,
    primaryMetric: 'radiation_dose_mgy',
    metrics: ['radiation_dose_mgy', 'body_temp_c'],
    hazards: ['space_radiation'],
    checklistId: 'PROTO-RADIATION',
    functionSummary:
      'Displays daily absorbed dose (mGy/d), mission cumulative projection, and storm-shelter readiness.',
  },
};

export const NASA_HAZARDS: Record<
  HazardId,
  {
    id: HazardId;
    name: string;
    shortName: string;
    code: string;
    angleDeg: number;
    description: string;
    physiologicalMechanism: string;
    affectedRegions: BodyRegionId[];
    keyMetrics: MetricCode[];
    countermeasures: string[];
    nasaReferenceTitle: string;
    nasaReferenceUrl: string;
    accessedDate: string;
  }
> = {
  space_radiation: {
    id: 'space_radiation',
    name: 'Space Radiation',
    shortName: 'Radiation',
    code: 'HZ-01',
    angleDeg: 270,
    description:
      'Galactic cosmic rays (GCR) and solar particle events (SPE) beyond Earth’s magnetosphere.',
    physiologicalMechanism:
      'High-energy protons and HZE ions cause cellular oxidative stress, hematologic/immune modulation, endothelial changes, and neurocognitive risk.',
    affectedRegions: ['radiation_exposure', 'immune_skin', 'cardiovascular', 'head_neuro'],
    keyMetrics: ['radiation_dose_mgy', 'body_temp_c', 'reaction_time_ms'],
    countermeasures: [
      'Verify passive/active dosimeter telemetry each morning.',
      'Know the storm-shelter mass-shielding configuration for SPE advisories.',
      'Maintain antioxidant-rich ration completion and circadian regularity.',
    ],
    nasaReferenceTitle: 'NASA HRP — 5 Hazards of Human Spaceflight: Space Radiation',
    nasaReferenceUrl: 'https://www.nasa.gov/hrp/5-hazards-of-human-spaceflight/',
    accessedDate: '2026-04-01',
  },
  isolation_confinement: {
    id: 'isolation_confinement',
    name: 'Isolation & Confinement',
    shortName: 'Isolation',
    code: 'HZ-02',
    angleDeg: 342,
    description:
      'Prolonged living in a small enclosed volume with a fixed crew, restricted sensory variety, and circadian disruption.',
    physiologicalMechanism:
      'Elevates HPA-axis stress reactivity, fragments sleep architecture, and can contribute to mood decline, fatigue, and immune dysregulation.',
    affectedRegions: ['mood_cognition', 'sleep_circadian', 'cardiovascular', 'immune_skin'],
    keyMetrics: ['sleep_duration_h', 'sleep_quality', 'mood_score', 'stress_score', 'fatigue_score'],
    countermeasures: [
      'Protect an 8.5-hour sleep opportunity window with scheduled blue-enriched wake light and warm pre-sleep dimming.',
      'Use guided paced breathing (4-6 or box breathing) and private reflective journaling.',
      'Schedule cooperative crew leisure activities and asynchronous family messages.',
    ],
    nasaReferenceTitle: 'NASA HRP — Behavioral Health & Performance Element',
    nasaReferenceUrl: 'https://www.nasa.gov/hrp/elements/bhp/',
    accessedDate: '2026-04-01',
  },
  distance_from_earth: {
    id: 'distance_from_earth',
    name: 'Distance from Earth',
    shortName: 'Distance',
    code: 'HZ-03',
    angleDeg: 54,
    description:
      'Up to 22-minute one-way communication latency to Mars, solar conjunction blackouts, and no real-time evacuation or resupply.',
    physiologicalMechanism:
      'Shifts initial medical assessment, triage, and trend interpretation onto the crew before asynchronous Ground Flight Surgeon review.',
    affectedRegions: ['mood_cognition', 'gastrointestinal', 'cardiovascular'],
    keyMetrics: ['meal_completion_pct', 'blood_glucose', 'heart_rate'],
    countermeasures: [
      'Complete daily Pulse Ritual so personal 14-day rolling baselines remain high-confidence during comms blackouts.',
      'Bundle structured multi-day trend summaries and evidence observation IDs into Ground Link packets.',
      'Review autonomous Tier 1 and Tier 2 crew checklists prior to solar conjunction windows.',
    ],
    nasaReferenceTitle: 'NASA HRP — Exploration Medical Capability (ExMC)',
    nasaReferenceUrl: 'https://www.nasa.gov/hrp/elements/exmc/',
    accessedDate: '2026-04-01',
  },
  gravity_fields: {
    id: 'gravity_fields',
    name: 'Altered Gravity Fields',
    shortName: 'Gravity',
    code: 'HZ-04',
    angleDeg: 126,
    description:
      'Transitions between 0 g transit, 1/6 g lunar, 3/8 g Martian, and hyper-g entry/landing.',
    physiologicalMechanism:
      'Cephalad fluid shift alters jugular/ocular venous pressure (SANS), reduces plasma volume, unloads weight-bearing bone and muscle, and triggers neurovestibular adaptation.',
    affectedRegions: ['cardiovascular', 'musculoskeletal', 'eyes_vision', 'head_neuro', 'gastrointestinal'],
    keyMetrics: [
      'heart_rate',
      'systolic_bp',
      'diastolic_bp',
      'resistive_load_min',
      'exercise_minutes',
      'hydration_ml',
      'body_mass_kg',
    ],
    countermeasures: [
      'Complete prescribed daily ARED resistive loading and CEVIS/treadmill aerobic sessions.',
      'Maintain daily fluid intake >= 2,200 mL to protect intravascular volume and lower renal stone risk.',
      'Perform scheduled visual acuity and Amsler grid checks for SANS monitoring.',
    ],
    nasaReferenceTitle: 'NASA HRP — Human Health Countermeasures (HHC)',
    nasaReferenceUrl: 'https://www.nasa.gov/hrp/elements/hhc/',
    accessedDate: '2026-04-01',
  },
  hostile_closed_environment: {
    id: 'hostile_closed_environment',
    name: 'Hostile Closed Environment',
    shortName: 'Closed Env',
    code: 'HZ-05',
    angleDeg: 198,
    description:
      'Recycled cabin atmosphere, localized CO₂ pockets, continuous mechanical noise, altered microbial flora, and planetary dust.',
    physiologicalMechanism:
      'Elevated cabin CO₂ (>3,500 ppm) increases cerebral blood flow, headache incidence, and reaction latency; continuous >60 dBA noise fragments slow-wave sleep.',
    affectedRegions: ['respiratory', 'head_neuro', 'sleep_circadian', 'immune_skin'],
    keyMetrics: ['cabin_co2_ppm', 'cabin_noise_dba', 'spo2_pct', 'respiratory_rate', 'body_temp_c'],
    countermeasures: [
      'Verify sleeping-berth ventilation fan alignment to disperse localized CO₂ pockets.',
      'Use acoustic ear protection during sleep periods when cabin noise exceeds 58 dBA.',
      'Correlate personal headache or fatigue entries against the Habitat CO₂ overlay.',
    ],
    nasaReferenceTitle: 'NASA Spaceflight Human-System Standard (NASA-STD-3001)',
    nasaReferenceUrl: 'https://www.nasa.gov/ochmo/health-and-medical/nasa-std-3001/',
    accessedDate: '2026-04-01',
  },
};

export const CARE_GUIDE_PROTOCOLS: Record<string, CareGuideProtocol> = {
  'PROTO-COMBINED': {
    id: 'PROTO-COMBINED',
    title: 'Multi-Domain Sleep, Cardiovascular & Strain Recovery Protocol',
    tier1RightNow: [
      'Sit or float calmly for 5 minutes and perform a confirmatory Resting HR and dual-reading Blood Pressure check.',
      'Drink 350–500 mL of water or electrolyte solution and log intake in Fuel & Move.',
      'Complete 4 minutes of 4-6 Recovery Breathing in the Wellness Sanctuary.',
    ],
    tier1Today: [
      'Protect an uninterrupted 8.5-hour sleep window tonight; enable pre-sleep warm lighting 60 minutes before lights-out.',
      'Verify sleeping-quarter ventilation fan flow and check Habitat CO₂ ppm.',
      'Shift non-critical high-cognitive maintenance tasks to tomorrow’s mid-morning circadian peak.',
    ],
    tier1ThisWeek: [
      'Aim to reduce 7-day cumulative sleep debt below 3.0 hours.',
      'Maintain light-to-moderate aerobic exercise without skipping hydration targets.',
    ],
    tier2ChecklistTitle: 'Crew Medical Officer (CMO) Check-In Checklist (Protocol Ref: EXMC-DEMO-01)',
    tier2Steps: [
      'Verify cuff size, placement, and sensor calibration on a second reading after 10 minutes of quiet rest.',
      'Review 7-day overlay of Sleep Duration, Resting HR, Systolic BP, and Cabin CO₂ with the designated Crew Medical Officer.',
      'Complete a 1-minute Psychomotor Vigilance Reaction Test before any scheduled EVA or robotics operation.',
    ],
    tier3WatchFor: [
      'Resting HR remaining > 3.0 robust z-scores above personal baseline after hydration and rest.',
      'New visual changes (central distortion, globe flattening signs), persistent headache, dizziness, or chest discomfort.',
      'Persistence across >= 3 consecutive mission days despite protected sleep opportunity.',
    ],
    tier3EscalateWhen: [
      'Send a Priority Ground Link packet attaching the last 7 days of vitals, baseline bands, and evidence observation IDs for asynchronous Flight Surgeon review.',
    ],
    nasaHazardLinks: ['isolation_confinement', 'gravity_fields', 'distance_from_earth'],
    disclaimer: MANDATORY_CARE_DISCLAIMER,
  },
  'PROTO-CARDIO': {
    id: 'PROTO-CARDIO',
    title: 'Cardiovascular & Hemodynamic Self-Assessment Guide',
    tier1RightNow: [
      'Rest quietly for 5 minutes with arm supported at heart level and take a repeat BP + HR reading.',
      'Drink 300 mL water and review today’s total fluid intake against your 2,400 mL mission target.',
    ],
    tier1Today: [
      'Avoid caffeine within 8 hours of scheduled sleep and log today’s aerobic countermeasure duration.',
      'Check whether recent heavy resistive exercise or thermal load preceded the reading.',
    ],
    tier1ThisWeek: [
      'Keep daily aerobic (CEVIS/T2) and hydration habits steady to support plasma volume.',
    ],
    tier2ChecklistTitle: 'Crew Hemodynamic Re-Verification Checklist (Protocol Ref: EXMC-DEMO-02)',
    tier2Steps: [
      'Perform paired seated/neutral and post-exertion recovery HR checks.',
      'Confirm Mean Arterial Pressure (MAP) and Pulse Pressure (PP) trends over the past 7 days.',
    ],
    tier3WatchFor: [
      'Sustained systolic BP > 140 mmHg or < 90 mmHg across multiple rested checks.',
      'Lightheadedness, palpitations, visual dimming, or unusual shortness of breath.',
    ],
    tier3EscalateWhen: [
      'Queue a Medical Review packet via Ground Link whenever cardiovascular review-suggested alerts persist for 3+ days or are accompanied by symptoms.',
    ],
    nasaHazardLinks: ['gravity_fields', 'isolation_confinement'],
    disclaimer: MANDATORY_CARE_DISCLAIMER,
  },
  'PROTO-MSK': {
    id: 'PROTO-MSK',
    title: 'Musculoskeletal & Countermeasure Adherence Guide',
    tier1RightNow: [
      'Review today’s completed ARED resistive and aerobic minutes in Fuel & Move.',
      'Perform 5 minutes of gentle spinal/hip mobility prep before loading.',
    ],
    tier1Today: [
      'Complete at least 35 minutes of resistive loading (ARED) and 30 minutes of aerobic conditioning if cleared for normal operations.',
      'Log full ration completion and 2,400+ mL hydration to support bone/renal balance.',
    ],
    tier1ThisWeek: [
      'Avoid 3 consecutive days of reduced resistive load to prevent accelerated bone mineral loss.',
    ],
    tier2ChecklistTitle: 'Countermeasure Equipment & Harness Check (Protocol Ref: HHC-DEMO-03)',
    tier2Steps: [
      'Inspect ARED vacuum cylinder load calibration and treadmill bungee harness fit for pressure hotspots.',
      'Verify weekly inertial body mass (SLAMMD) trend against mission baseline.',
    ],
    tier3WatchFor: [
      'Localized joint pain, radicular back discomfort, or flanks/urinary symptoms suggestive of renal calculi.',
    ],
    tier3EscalateWhen: [
      'Share countermeasure log and symptom location with Ground Exercise Physiology & Flight Surgeon team.',
    ],
    nasaHazardLinks: ['gravity_fields'],
    disclaimer: MANDATORY_CARE_DISCLAIMER,
  },
  'PROTO-MIND': {
    id: 'PROTO-MIND',
    title: 'Behavioral Health, Pacing & Stress Recovery Guide',
    tier1RightNow: [
      'Step into the Wellness Sanctuary for a 4-minute guided breathing session (4-6 Recovery or Box 4-4-4-4).',
      'Write a private reflection in your encrypted crew journal (stays on-device unless you explicitly share).',
    ],
    tier1Today: [
      'Protect a 30-minute low-stimulation personal recovery block and review circadian light timing.',
      'Connect with a crewmate for a shared meal or cooperative crew challenge if helpful.',
    ],
    tier1ThisWeek: [
      'Review workload pacing and sleep debt across the last 7 days in Insights.',
    ],
    tier2ChecklistTitle: 'Behavioral Readiness Self-Check (Protocol Ref: BHP-DEMO-04)',
    tier2Steps: [
      'Compare subjective fatigue and stress scores with objective 1-minute PVT reaction time.',
      'Review upcoming mission timeline for high-demand EVA or docking windows.',
    ],
    tier3WatchFor: [
      'Persistent low mood, high stress, or poor sleep lasting 4+ consecutive days.',
      'Difficulty concentrating during safety-critical procedures.',
    ],
    tier3EscalateWhen: [
      'Use the pre-filled Support message in Ground Link to request an asynchronous behavioral health check-in.',
    ],
    nasaHazardLinks: ['isolation_confinement', 'distance_from_earth'],
    disclaimer: MANDATORY_CARE_DISCLAIMER,
  },
  'PROTO-SLEEP': {
    id: 'PROTO-SLEEP',
    title: 'Circadian Entrainment & Sleep Restoration Guide',
    tier1RightNow: [
      'Check your 7-day cumulative Sleep Debt and today’s Reaction Time in Insights.',
      'Log cabin noise and sleeping-berth CO₂ levels if you woke feeling unrefreshed.',
    ],
    tier1Today: [
      'Use high-melanopic blue-enriched light during the first 2 hours after waking.',
      'Switch habitat lighting to warm low-lux mode 90 minutes before scheduled sleep.',
    ],
    tier1ThisWeek: [
      'Keep wake time within ±30 minutes across consecutive mission days.',
    ],
    tier2ChecklistTitle: 'Sleep Environment Audit (Protocol Ref: BHP-DEMO-05)',
    tier2Steps: [
      'Verify sleeping-quarter air diffuser flow to prevent stagnant CO₂ buildup.',
      'Check acoustic dosimetry and wear passive hearing protection if cabin noise > 58 dBA.',
    ],
    tier3WatchFor: [
      'Single-night sleep < 4.5 hours or 7-day sleep debt > 5.0 hours prior to critical operations.',
    ],
    tier3EscalateWhen: [
      'Notify Ground Flight Surgeon if circadian misalignment persists across 5+ mission days.',
    ],
    nasaHazardLinks: ['isolation_confinement', 'hostile_closed_environment'],
    disclaimer: MANDATORY_CARE_DISCLAIMER,
  },
  'PROTO-METABOLIC': {
    id: 'PROTO-METABOLIC',
    title: 'Metabolic, Glucose & Hydration Balance Guide',
    tier1RightNow: [
      'Confirm that your Blood Glucose entry includes the correct meal-timing tag (Fasting, Pre-meal, or Post-meal).',
      'Drink 250–500 mL of water and log it in Fuel & Move.',
    ],
    tier1Today: [
      'Aim for >= 90% ration completion with balanced protein, calcium/vitamin D countermeasure packs, and fluids.',
    ],
    tier1ThisWeek: [
      'Compare fasting glucose and weekly body mass stability against your 14-day personal baseline.',
    ],
    tier2ChecklistTitle: 'Capillary Glucose & Hydration Verification (Protocol Ref: HHC-DEMO-06)',
    tier2Steps: [
      'Repeat capillary glucose with a fresh test strip if a reading falls outside your personal band.',
      'Review urine specific gravity / hydration colour chart if fluid intake has been < 2,000 mL/day.',
    ],
    tier3WatchFor: [
      'Fasting glucose repeatedly outside personal band or unintended body mass loss > 1.5% over 14 days.',
    ],
    tier3EscalateWhen: [
      'Attach 14-day metabolic and ration trend table to an asynchronous Ground Link review packet.',
    ],
    nasaHazardLinks: ['gravity_fields', 'distance_from_earth'],
    disclaimer: MANDATORY_CARE_DISCLAIMER,
  },
  'PROTO-RESP': {
    id: 'PROTO-RESP',
    title: 'Respiratory & Atmospheric Assessment Guide',
    tier1RightNow: [
      'Warm fingertip, rest still for 60 seconds, and repeat SpO₂ and Respiratory Rate check.',
      'Cross-check Habitat Cabin CO₂ (ppm) and module total pressure.',
    ],
    tier1Today: [
      'Ensure airlock dust-mitigation wipe-down was completed if returning from surface EVA.',
    ],
    tier1ThisWeek: [
      'Track resting respiratory rate alongside aerobic exercise recovery.',
    ],
    tier2ChecklistTitle: 'Respiratory & Cabin Gas Cross-Check (Protocol Ref: EXMC-DEMO-07)',
    tier2Steps: [
      'Verify pulse oximeter signal quality waveform on an alternate finger.',
      'Compare crew respiratory symptoms with environmental telemetry.',
    ],
    tier3WatchFor: [
      'Verified SpO₂ < 94%, resting respiratory rate > 22 br/min, cough, or chest tightness.',
    ],
    tier3EscalateWhen: [
      'Escalate immediately via Priority Ground Link and alert onboard Crew Medical Officer.',
    ],
    nasaHazardLinks: ['hostile_closed_environment', 'gravity_fields'],
    disclaimer: MANDATORY_CARE_DISCLAIMER,
  },
  'PROTO-IMMUNE': {
    id: 'PROTO-IMMUNE',
    title: 'Immune Readiness, Thermal & Skin Integrity Guide',
    tier1RightNow: [
      'Wait 20 minutes after exercise or hot beverages and take a confirmatory body temperature reading.',
      'Log any skin irritation, rash, or slow-healing abrasion in the Skin Photo Log.',
    ],
    tier1Today: [
      'Prioritize hydration (2,500 mL) and full sleep window to support immune regulation.',
    ],
    tier1ThisWeek: [
      'Monitor temperature and resting heart rate together for multi-day baseline shifts.',
    ],
    tier2ChecklistTitle: 'Thermal & Skin Inspection Checklist (Protocol Ref: EXMC-DEMO-08)',
    tier2Steps: [
      'Inspect harness contact points and document any skin findings with a local reference scale.',
      'Cross-check body temperature with resting heart rate and fatigue score.',
    ],
    tier3WatchFor: [
      'Body temperature >= 37.8 °C at rest, spreading skin redness, or chills/malaise.',
    ],
    tier3EscalateWhen: [
      'Send a Medical Review packet to Ground Flight Surgeon with temperature curve and observations.',
    ],
    nasaHazardLinks: ['space_radiation', 'hostile_closed_environment'],
    disclaimer: MANDATORY_CARE_DISCLAIMER,
  },
  'PROTO-NEURO': {
    id: 'PROTO-NEURO',
    title: 'Neurovestibular, Vigilance & CO₂ Headache Guide',
    tier1RightNow: [
      'Check Habitat CO₂ concentration; if > 3,000 ppm, move to a well-ventilated module area and increase fan circulation.',
      'Drink 300 mL water and rest eyes from high-glare displays for 10 minutes.',
    ],
    tier1Today: [
      'Repeat the 1-minute Reaction Test after rest and ventilation adjustment.',
    ],
    tier1ThisWeek: [
      'Correlate headache or slowed vigilance days with Cabin CO₂ and Sleep Duration in Insights.',
    ],
    tier2ChecklistTitle: 'Neuro-Ocular & Vigilance Cross-Check (Protocol Ref: EXMC-DEMO-09)',
    tier2Steps: [
      'Perform Vision Self-Check (acuity + Amsler grid) in Measure Lab.',
      'Compare PVT median latency (ms) and lapse count against 14-day personal baseline.',
    ],
    tier3WatchFor: [
      'Persistent headache unresponsive to ventilation/hydration, new visual distortion, or vertigo.',
    ],
    tier3EscalateWhen: [
      'Escalate to Ground Flight Surgeon with paired CO₂, BP, Vision, and PVT records.',
    ],
    nasaHazardLinks: ['hostile_closed_environment', 'gravity_fields'],
    disclaimer: MANDATORY_CARE_DISCLAIMER,
  },
  'PROTO-VISION': {
    id: 'PROTO-VISION',
    title: 'Ocular & SANS Self-Check Protocol',
    tier1RightNow: [
      'Complete the Near/Distance Acuity and Amsler Grid self-check in Measure Lab at calibrated arm’s length.',
    ],
    tier1Today: [
      'Log paired Blood Pressure and Cabin CO₂ readings to provide hemodynamic context.',
    ],
    tier1ThisWeek: [
      'Compare weekly optic nerve sheath / globe ultrasound caliper reference measurements.',
    ],
    tier2ChecklistTitle: 'SANS Ocular Ultrasound & Acuity Checklist (Protocol Ref: HHC-DEMO-10)',
    tier2Steps: [
      'Review ocular ultrasound reference clip in Measure Lab using the distance caliper tool.',
      'Document any hyperopic shift or central grid waviness.',
    ],
    tier3WatchFor: [
      'New metamorphopsia (wavy lines on Amsler grid), blind spots, or persistent retro-orbital pressure.',
    ],
    tier3EscalateWhen: [
      'Transmit ocular caliper measurement and vision log via Ground Link for Flight Surgeon review.',
    ],
    nasaHazardLinks: ['gravity_fields', 'hostile_closed_environment'],
    disclaimer: MANDATORY_CARE_DISCLAIMER,
  },
  'PROTO-HABITAT': {
    id: 'PROTO-HABITAT',
    title: 'Habitat Environmental & Acoustic Mitigation Guide',
    tier1RightNow: [
      'Verify CDRA / scrubber telemetry and portable air fan positioning.',
      'Note that environmental readings describe cabin conditions, not personal physiological measurements.',
    ],
    tier1Today: [
      'Use acoustic ear protection if working or sleeping in modules above 58 dBA.',
    ],
    tier1ThisWeek: [
      'Review multi-day cabin CO₂ and noise overlay against crew sleep quality and headache logs.',
    ],
    tier2ChecklistTitle: 'Environmental Control & Life Support (ECLSS) Spot-Check',
    tier2Steps: [
      'Compare fixed rack CO₂ sensor reading with handheld portable monitor.',
      'Log post-EVA airlock particulate filter status.',
    ],
    tier3WatchFor: [
      'Cabin CO₂ approaching 5,000 ppm or simultaneous headaches across multiple crew members.',
    ],
    tier3EscalateWhen: [
      'Notify Mission Control ECLSS and Flight Surgeon teams via Priority Ground Link.',
    ],
    nasaHazardLinks: ['hostile_closed_environment'],
    disclaimer: MANDATORY_CARE_DISCLAIMER,
  },
  'PROTO-RADIATION': {
    id: 'PROTO-RADIATION',
    title: 'Space Radiation Dosimetry & Shelter Readiness Guide',
    tier1RightNow: [
      'Compare current daily absorbed dose (mGy/d) against quiet-sun transit baseline.',
      'Remember: Absorbed dose (Gy) and biological dose equivalent (Sv) measure different quantities and are never combined directly.',
    ],
    tier1Today: [
      'Verify storm-shelter stowage configuration in case of a Solar Particle Event (SPE) alert.',
    ],
    tier1ThisWeek: [
      'Review cumulative mission dose projection on the Insights Radiation tab.',
    ],
    tier2ChecklistTitle: 'Dosimetry Verification & Shelter Drill (Protocol Ref: RAD-DEMO-11)',
    tier2Steps: [
      'Cross-check personal passive dosimeter badge ID with active habitat tissue-equivalent proportional counter (TEPC).',
      'Confirm water-wall / stowage shielding mass around crew sleep stations.',
    ],
    tier3WatchFor: [
      'SPE proton flux elevation or daily absorbed dose exceeding 1.5 mGy/day.',
    ],
    tier3EscalateWhen: [
      'Coordinate with Space Radiation Analysis Group (SRAG) via Ground Link.',
    ],
    nasaHazardLinks: ['space_radiation'],
    disclaimer: MANDATORY_CARE_DISCLAIMER,
  },
};

export interface EnvironmentProfile {
  id: EnvironmentMode;
  name: string;
  shortName: string;
  gravityLabel: string;
  gravityG: number;
  typicalDistanceKm: number;
  defaultOneWayDelaySec: number;
  ambientRadiationMgyPerDay: number;
  typicalCo2Ppm: number;
  description: string;
  operationalFocus: string;
}

export const ENVIRONMENT_MODES: Record<EnvironmentMode, EnvironmentProfile> = {
  spacecraft: {
    id: 'spacecraft',
    name: 'Deep-Space Transit Spacecraft',
    shortName: 'Spacecraft',
    gravityLabel: '0 g Microgravity',
    gravityG: 0,
    typicalDistanceKm: 18_500_000,
    defaultOneWayDelaySec: 62,
    ambientRadiationMgyPerDay: 0.48,
    typicalCo2Ppm: 2800,
    description: 'Interplanetary transit vehicle beyond Earth magnetosphere with tight acoustic/CO₂ volume and growing light-time delay.',
    operationalFocus: 'Fluid-shift adaptation, ARED bone/muscle protection, CO₂ pocket vigilance, and autonomous baseline tracking.',
  },
  station: {
    id: 'station',
    name: 'Orbital Space Station (LEO / Gateway)',
    shortName: 'Station',
    gravityLabel: '0 g Microgravity',
    gravityG: 0,
    typicalDistanceKm: 408,
    defaultOneWayDelaySec: 1.2,
    ambientRadiationMgyPerDay: 0.28,
    typicalCo2Ppm: 2400,
    description: 'Microgravity orbital research station with 16 sunrises/day (LEO) or cislunar halo orbit (Gateway).',
    operationalFocus: 'Circadian lighting entrainment, SANS ocular monitoring, and daily countermeasure adherence.',
  },
  rover: {
    id: 'rover',
    name: 'Pressurized Surface RoverTraverse',
    shortName: 'Rover',
    gravityLabel: '0.16–0.38 g Traverse',
    gravityG: 0.38,
    typicalDistanceKm: 92_000_000,
    defaultOneWayDelaySec: 307,
    ambientRadiationMgyPerDay: 0.56,
    typicalCo2Ppm: 3200,
    description: 'Compact pressurized mobile surface vehicle during multi-day exploration sorties with high EVA cadence.',
    operationalFocus: 'High physical exertion recovery, tight cabin CO₂ scrubbing, hydration, and pre-EVA vigilance checks.',
  },
  lunar_base: {
    id: 'lunar_base',
    name: 'Artemis Lunar South Pole Base',
    shortName: 'Lunar Base',
    gravityLabel: '0.16 g Lunar',
    gravityG: 0.16,
    typicalDistanceKm: 384_400,
    defaultOneWayDelaySec: 1.3,
    ambientRadiationMgyPerDay: 0.36,
    typicalCo2Ppm: 2100,
    description: 'Partial-gravity lunar surface habitat with frequent EVA dust exposure risks and solar particle event watch.',
    operationalFocus: 'Respiratory lunar-dust surveillance, EVA workload pacing, and SPE shelter readiness.',
  },
  mars_base: {
    id: 'mars_base',
    name: 'Mars Surface Habitat (Ares Base)',
    shortName: 'Mars Base',
    gravityLabel: '0.38 g Martian',
    gravityG: 0.38,
    typicalDistanceKm: 225_000_000,
    defaultOneWayDelaySec: 750,
    ambientRadiationMgyPerDay: 0.42,
    typicalCo2Ppm: 2300,
    description: 'Long-duration planetary base with 3–22 min one-way comms delay and periodic solar conjunction blackouts.',
    operationalFocus: 'Full crew medical autonomy, store-and-forward Ground Link packets, and long-horizon behavioral resilience.',
  },
};

export interface NasaDatasetEntry {
  id: string;
  name: string;
  agency: string;
  accessType: 'Open Public API' | 'Open Repository' | 'Controlled Research Access';
  usageInAstraPulse: string;
  whatItCannotProve: string;
  url: string;
  accessedDate: string;
}

export const NASA_DATASET_REGISTRY: NasaDatasetEntry[] = [
  {
    id: 'DS-01',
    name: 'NASA Human Research Program (HRP) — 5 Hazards of Human Spaceflight',
    agency: 'NASA HRP',
    accessType: 'Open Public API',
    usageInAstraPulse:
      'Defines the 5-node Hazard Ring architecture, hazard-to-body-system mappings, and countermeasure domain structure.',
    whatItCannotProve:
      'Provides mission risk frameworks and educational context; does not validate clinical diagnostic thresholds.',
    url: 'https://www.nasa.gov/hrp/5-hazards-of-human-spaceflight/',
    accessedDate: '2026-04-01',
  },
  {
    id: 'DS-02',
    name: 'NASA Open Science Data Repository (OSDR) & RadLab Telemetry',
    agency: 'NASA GeneLab / OSDR',
    accessType: 'Open Repository',
    usageInAstraPulse:
      'Provides reference environmental radiation dosimetry context (absorbed dose in mGy/day) on the Habitat screen alongside simulated mission streams.',
    whatItCannotProve:
      'OSDR predominantly contains space-biology omics and area radiation telemetry, not continuous human crew clinical vital sign streams.',
    url: 'https://osdr.nasa.gov/bio/repo',
    accessedDate: '2026-04-01',
  },
  {
    id: 'DS-03',
    name: 'NASA Life Sciences Data Archive (LSDA) / Lifetime Surveillance of Astronaut Health (LSAH)',
    agency: 'NASA JSC',
    accessType: 'Controlled Research Access',
    usageInAstraPulse:
      'Informs physiological parameter selection (BP, HR, sleep, ARED load, vision/SANS, CO₂) while respecting astronaut medical privacy.',
    whatItCannotProve:
      'Individual astronaut medical records are privacy-protected and require formal NASA IRB/research requests; AstraPulse uses clearly labelled deterministic simulated crew scenarios.',
    url: 'https://lsda.jsc.nasa.gov/',
    accessedDate: '2026-04-01',
  },
  {
    id: 'DS-04',
    name: 'NASA-STD-3001 Spaceflight Human-System Standard (Vol. 1 & Vol. 2)',
    agency: 'NASA OCHMO',
    accessType: 'Open Repository',
    usageInAstraPulse:
      'Provides reference bounds for cabin CO₂ concentration, acoustic dBA exposure, circadian lighting, and countermeasure scheduling.',
    whatItCannotProve:
      'Defines engineering and human-system design standards rather than individualized clinical diagnosis.',
    url: 'https://www.nasa.gov/ochmo/health-and-medical/nasa-std-3001/',
    accessedDate: '2026-04-01',
  },
];
