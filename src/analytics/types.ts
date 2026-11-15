/**
 * AstraPulse — Canonical Data Dictionary & Analytics Types
 * Team Zenitsu — NASA Space Apps Challenge 2026
 */

export type ProvenanceSource = 'user_entered' | 'imported' | 'simulated' | 'reference' | 'derived';

export type MetricCode =
  | 'systolic_bp'
  | 'diastolic_bp'
  | 'mean_arterial_pressure'
  | 'pulse_pressure'
  | 'heart_rate'
  | 'blood_glucose'
  | 'body_temp_c'
  | 'spo2_pct'
  | 'respiratory_rate'
  | 'body_mass_kg'
  | 'sleep_duration_h'
  | 'sleep_quality'
  | 'mood_score'
  | 'stress_score'
  | 'fatigue_score'
  | 'exercise_minutes'
  | 'resistive_load_min'
  | 'hydration_ml'
  | 'meal_completion_pct'
  | 'reaction_time_ms'
  | 'cabin_co2_ppm'
  | 'cabin_noise_dba'
  | 'radiation_dose_mgy';

export type MetricDirection = 'two_sided' | 'high_bad' | 'low_bad';

export type GlucoseContext = 'fasting' | 'pre_meal' | 'post_meal';

export type StatusTier = 'nominal' | 'watch' | 'review_required' | 'informational' | 'stale' | 'not_recorded';

export type AlertSeverity = 'informational' | 'watch' | 'review_required';

export type AlertStatus = 'open' | 'reviewed' | 'snoozed' | 'escalated';

export type EnvironmentMode = 'spacecraft' | 'station' | 'rover' | 'lunar_base' | 'mars_base';

export type BodyRegionId =
  | 'head_neuro'
  | 'eyes_vision'
  | 'cardiovascular'
  | 'respiratory'
  | 'musculoskeletal'
  | 'gastrointestinal'
  | 'immune_skin'
  | 'sleep_circadian'
  | 'mood_cognition'
  | 'radiation_exposure';

export type HazardId =
  | 'space_radiation'
  | 'isolation_confinement'
  | 'distance_from_earth'
  | 'gravity_fields'
  | 'hostile_closed_environment';

export interface MetricDefinition {
  code: MetricCode;
  label: string;
  shortLabel: string;
  unit: string;
  altUnit?: string;
  category: 'vital' | 'wellness' | 'behaviour' | 'cognition' | 'habitat';
  bodyRegion: BodyRegionId;
  hazards: HazardId[];
  direction: MetricDirection;
  minPlausible: number;
  maxPlausible: number;
  softLow: number;
  softHigh: number;
  floorBandwidth: number;
  decimals: number;
  description: string;
  whyItMatters: string;
  howToMeasure: string[];
  checklistId: string;
  isPersonal: boolean;
}

export interface Observation {
  id: string;
  crewId: string;
  checkinId?: string;
  missionDay: number;
  observedAt: string; // ISO-8601 UTC
  metric: MetricCode;
  value: number | null;
  unit: string;
  glucoseContext?: GlucoseContext;
  signalConfidence?: number; // 0..1 for camera pulse etc.
  source: ProvenanceSource;
  amendedFromId?: string | null;
  amendReason?: string | null;
  supersededById?: string | null;
  note?: string;
}

export interface DailyCheckin {
  id: string;
  crewId: string;
  missionDay: number;
  recordedAt: string;
  environmentMode: EnvironmentMode;
  source: ProvenanceSource;
  idempotencyKey?: string;
  metrics: Partial<Record<MetricCode, number | null>>;
  glucoseContext?: GlucoseContext;
  symptoms: string[];
  symptomRegions: BodyRegionId[];
  notes?: string;
}

export interface BaselineStats {
  metric: MetricCode;
  median: number | null;
  mad: number | null;
  iqr: number | null;
  effectiveSpread: number | null;
  sampleCount: number;
  windowDays: number;
  status: 'ready' | 'building' | 'insufficient';
  bandLow: number | null;
  bandHigh: number | null;
}

export interface MetricEvaluation {
  metric: MetricCode;
  latestValue: number | null;
  latestObservedAt: string | null;
  latestObservationId: string | null;
  latestSource: ProvenanceSource | null;
  glucoseContext?: GlucoseContext;
  baseline: BaselineStats;
  robustZ: number | null;
  adverseZ: number | null;
  deltaFromBaseline: number | null;
  rollingMedian3: number | null;
  rollingMedian7: number | null;
  slopePerDay: number | null;
  slopeDirection: 'rising' | 'falling' | 'flat' | 'insufficient';
  persistenceCount: number;
   persistenceWindow: number;
  tier: StatusTier;
  ruleTriggered: string | null;
  explanation: string;
  evidenceObservationIds: string[];
}

export interface CareGuideProtocol {
  id: string;
  title: string;
  tier1RightNow: string[];
  tier1Today: string[];
  tier1ThisWeek: string[];
  tier2ChecklistTitle: string;
  tier2Steps: string[];
  tier3WatchFor: string[];
  tier3EscalateWhen: string[];
  nasaHazardLinks: HazardId[];
  disclaimer: string;
}

export interface AlertComment {
  id: string;
  authorRole: 'astronaut' | 'specialist';
  authorName: string;
  createdAt: string;
  body: string;
}

export interface AlertItem {
  id: string;
  crewId: string;
  missionDay: number;
  createdAt: string;
  severity: AlertSeverity;
  status: AlertStatus;
  ruleId: string;
  rulesetVersion: string;
  title: string;
  summary: string;
  explanation: string;
  metricsInvolved: MetricCode[];
  bodyRegion: BodyRegionId;
  hazards: HazardId[];
  persistenceCount: number;
  persistenceRequired: number;
  evidenceObservationIds: string[];
  latestValues: Partial<Record<MetricCode, number | null>>;
  baselineMedians: Partial<Record<MetricCode, number | null>>;
  deviations: Partial<Record<MetricCode, number | null>>;
  protocolId: string;
  source: ProvenanceSource;
  reviewedAt?: string | null;
  reviewReason?: 'addressed' | 'expected_context' | 'recheck_scheduled' | 'escalated_to_ground' | null;
  reviewNote?: string | null;
  snoozedUntil?: string | null;
  snoozeCount: number;
  comments: AlertComment[];
}

export interface VitalityRingScore {
  id: 'recovery' | 'strain' | 'mind';
  label: string;
  score: number | null; // 0..100
  confidence: number; // 0..1 (recorded / total inputs)
  tier: StatusTier;
  contributors: {
    metric: MetricCode;
    label: string;
    value: number | null;
    unit: string;
    impact: 'positive' | 'neutral' | 'adverse' | 'missing';
  }[];
  summary: string;
}

export interface BodyRegionStatus {
  id: BodyRegionId;
  label: string;
  shortLabel: string;
  side: 'front' | 'back' | 'both';
  x: number; // SVG 0..200 coordinate
  y: number; // SVG 0..420 coordinate
  tier: StatusTier;
  primaryMetric: MetricCode;
  metrics: MetricCode[];
  hazards: HazardId[];
  headline: string;
  possibleContributors: string[];
  checklistId: string;
}

export interface HazardNodeStatus {
  id: HazardId;
  name: string;
  shortName: string;
  angleDeg: number;
  tier: StatusTier;
  activeAlertCount: number;
  summary: string;
  affectedRegions: BodyRegionId[];
  keyMetrics: MetricCode[];
  countermeasures: string[];
  nasaReferenceTitle: string;
  nasaReferenceUrl: string;
}

export interface JournalEntry {
  id: string;
  crewId: string;
  missionDay: number;
  createdAt: string;
  updatedAt: string;
  title: string;
  body: string;
  moodScore: number | null;
  tags: string[];
  sharedWithGround: boolean;
  shareGrantId?: string | null;
  shareExpiresAt?: string | null;
  source: ProvenanceSource;
}

export interface AccessGrant {
  id: string;
  crewId: string;
  grantedToRole: 'specialist';
  scope: 'summary_and_alerts' | 'all_vitals' | 'specific_journal_entries';
  journalEntryIds?: string[];
  createdAt: string;
  expiresAt: string;
  revokedAt?: string | null;
  active: boolean;
  note: string;
}

export interface GroundMessage {
  id: string;
  crewId: string;
  missionDay: number;
  createdAt: string;
  senderRole: 'astronaut' | 'specialist';
  senderName: string;
  subject: string;
  body: string;
  priority: 'routine' | 'priority' | 'medical_review';
  state: 'draft' | 'queued' | 'transmitting' | 'in_flight' | 'delivered' | 'reply_received';
  oneWayDelaySec: number;
  distanceKm: number;
  attachmentSizeKb?: number;
  estimatedArrivalAt: string;
  linkedAlertId?: string | null;
  includedMetrics?: MetricCode[];
  replyBody?: string | null;
  replyReceivedAt?: string | null;
}

export interface QuestItem {
  id: string;
  code: string;
  title: string;
  description: string;
  category: 'ritual' | 'hydration' | 'countermeasure' | 'sleep' | 'mindfulness';
  cadence: 'daily' | 'weekly';
  xpReward: number;
  completedToday: boolean;
  progress: number;
  target: number;
  constellationX: number;
  constellationY: number;
}

export interface CrewProfile {
  id: string; // ASTRA-001 .. ASTRA-004
  code: string;
  name: string;
  callsign: string;
  role: string;
  missionName: string;
  defaultEnvironment: EnvironmentMode;
  currentMissionDay: number;
  totalMissionDays: number;
  scenarioTitle: string;
  scenarioDescription: string;
  expectedOutcomeSummary: string;
  distanceFromEarthKm: number;
  avatarColor: string;
  xp: number;
  streakDays: number;
  graceDaysUsedThisWeek: number;
  lastContactAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorRole: 'astronaut' | 'specialist' | 'system';
  actorId: string;
  action: string;
  targetType: 'observation' | 'checkin' | 'alert' | 'journal' | 'grant' | 'message' | 'seed' | 'sync';
  targetId: string;
  summary: string;
}
