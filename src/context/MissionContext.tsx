/**
 * AstraPulse — Central Mission Intelligence, Offline Sync & Accessibility Context
 * Team Zenitsu — NASA Space Apps Challenge 2026
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  computeDerivedBloodPressure,
  computeLightTimeDelaySec,
  evaluateCrewHealthState,
  validateObservationPlausibility,
} from '../analytics/engine';
import { ENVIRONMENT_MODES, METRIC_DEFINITIONS } from '../analytics/ruleset';
import { buildDeterministicSeed, CREW_PROFILES } from '../analytics/seed';
import {
  AccessGrant,
  AlertItem,
  AuditLogEntry,
  BodyRegionId,
  BodyRegionStatus,
  CrewProfile,
  DailyCheckin,
  EnvironmentMode,
  GlucoseContext,
  GroundMessage,
  HazardNodeStatus,
  JournalEntry,
  MetricCode,
  MetricEvaluation,
  Observation,
  ProvenanceSource,
  QuestItem,
  StatusTier,
  VitalityRingScore,
} from '../analytics/types';
import {
  auth,
  mirrorObservationToFirestore,
  onAuthStateChanged,
  signInWithGooglePopup,
  signOutFirebase,
  testFirestoreConnection,
  User,
} from '../lib/firebase';
import {
  enqueueOfflineMutation,
   offlineDb,
  OfflineQueueItem,
} from '../offline/db';

export type ScreenRoute =
  | '/enter'
  | '/'
  | '/ritual'
  | '/measure'
  | '/insights'
  | '/alerts'
  | '/wellness'
  | '/link'
  | '/habitat'
  | '/3d'
  | '/copilot'
  | '/quests'
  | '/reports'
  | '/ground'
  | '/settings';

export interface AccessibilitySettings {
  reduceMotion: boolean;
  highContrast: boolean;
  colourBlindSafe: boolean;
  textScale: '100' | '115' | '150';
  gloveMode: boolean;
  calmMode: boolean;
  hideGamification: boolean;
  useAltUnits: {
    bpKpa: boolean;
    tempFahrenheit: boolean;
    glucoseMmol: boolean;
    massLb: boolean;
  };
}

interface MissionContextValue {
  // Navigation & Drawer
  route: ScreenRoute;
  navigate: (to: ScreenRoute) => void;
  selectedBodyRegion: BodyRegionId | null;
  setSelectedBodyRegion: (id: BodyRegionId | null) => void;
  bodyTwinSide: 'front' | 'back';
  setBodyTwinSide: React.Dispatch<React.SetStateAction<'front' | 'back'>>;
  isScanning: boolean;
  triggerBodyScan: () => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  shortcutsModalOpen: boolean;
  setShortcutsModalOpen: (open: boolean) => void;

  // Crew, Role & Environment
  crewList: CrewProfile[];
  activeCrewId: string;
  activeCrew: CrewProfile;
  selectCrew: (crewId: string) => void;
  activeRole: 'astronaut' | 'specialist';
  setActiveRole: (role: 'astronaut' | 'specialist') => void;
  environmentMode: EnvironmentMode;
  setEnvironmentMode: (mode: EnvironmentMode) => void;

  // Time Conductor
  selectedMissionDay: number;
  setSelectedMissionDay: (day: number) => void;
  compareBaselineMode: boolean;
  setCompareBaselineMode: React.Dispatch<React.SetStateAction<boolean>>;

  // Connectivity & Simulation Flags
  offlineSimMode: boolean;
  setOfflineSimMode: (offline: boolean) => void;
  solarBlackoutMode: boolean;
  setSolarBlackoutMode: (blackout: boolean) => void;
  syncQueue: OfflineQueueItem[];
  flushOfflineQueue: () => Promise<void>;

  // Firebase Auth User
  firebaseUser: User | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;

  // Evaluated Health State for Active Crew & Selected Mission Day
  observations: Observation[];
  allObservations: Observation[];
  checkins: DailyCheckin[];
  evaluations: Record<MetricCode, MetricEvaluation>;
  alerts: AlertItem[];
  allCrewAlerts: AlertItem[];
  vitalityRings: VitalityRingScore[];
  bodyRegions: BodyRegionStatus[];
  hazardNodes: HazardNodeStatus[];
  overallTier: StatusTier;
  hasSimulatedDataInView: boolean;

  // Journals, Grants, Messages, Quests, Audit
  journals: JournalEntry[];
  grants: AccessGrant[];
  messages: GroundMessage[];
  quests: QuestItem[];
  auditLog: AuditLogEntry[];

  // Actions
  submitCheckin: (input: {
    metrics: Partial<Record<MetricCode, number | null>>;
    glucoseContext?: GlucoseContext;
    symptoms: string[];
    symptomRegions: BodyRegionId[];
    notes?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  recordSingleObservation: (input: {
    metric: MetricCode;
    value: number;
    glucoseContext?: GlucoseContext;
    pairedDiastolic?: number;
    signalConfidence?: number;
    source?: ProvenanceSource;
    note?: string;
  }) => Promise<{ ok: boolean; error?: string; warning?: string }>;
  amendObservation: (
    obsId: string,
    newValue: number,
    reason: string
  ) => Promise<{ ok: boolean; error?: string }>;
  importObservationsBatch: (
    rows: {
      missionDay: number;
      metric: MetricCode;
      value: number;
      glucoseContext?: GlucoseContext;
    }[]
  ) => Promise<{ acceptedCount: number; rejectedCount: number; errors: string[] }>;
  reviewAlert: (
    alertId: string,
    reason: 'addressed' | 'expected_context' | 'recheck_scheduled' | 'escalated_to_ground',
    note: string
  ) => Promise<void>;
  snoozeAlert: (
    alertId: string,
    hours: 4 | 12 | 24
  ) => Promise<{ ok: boolean; error?: string }>;
  commentOnAlert: (alertId: string, body: string) => Promise<void>;
  createJournalEntry: (input: {
    title: string;
    body: string;
    moodScore: number | null;
    tags: string[];
    sharedWithGround: boolean;
    shareExpiresDays?: number;
  }) => Promise<void>;
  toggleJournalShare: (
    journalId: string,
    share: boolean,
    expiresDays?: number
  ) => Promise<void>;
  verifySpecialistJournalAccess: (
    journalId: string
  ) => Promise<{ allowed: boolean; status: number; message: string }>;
  createAccessGrant: (
    scope: AccessGrant['scope'],
    expiresDays: number,
    note: string
  ) => Promise<void>;
  revokeAccessGrant: (grantId: string) => Promise<void>;
  sendGroundMessage: (input: {
    subject: string;
    body: string;
    priority: GroundMessage['priority'];
    attachmentSizeKb?: number;
    linkedAlertId?: string | null;
    includedMetrics?: MetricCode[];
  }) => Promise<void>;
  completeQuest: (questId: string) => void;
  resetDemoSeed: () => Promise<void>;

  // Accessibility & Units
  accessibility: AccessibilitySettings;
  updateAccessibility: (patch: Partial<AccessibilitySettings>) => void;
  formatMetricValue: (
    metric: MetricCode,
    value: number | null | undefined
  ) => { formatted: string; unit: string };
}

const DEFAULT_ACCESSIBILITY: AccessibilitySettings = {
  reduceMotion: false,
  highContrast: false,
  colourBlindSafe: false,
  textScale: '100',
  gloveMode: false,
  calmMode: false,
  hideGamification: false,
  useAltUnits: {
    bpKpa: false,
    tempFahrenheit: false,
    glucoseMmol: false,
    massLb: false,
  },
};

const MissionContext = createContext<MissionContextValue | null>(null);

export const MissionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const initialSeed = useMemo(() => buildDeterministicSeed(), []);

  // Determine initial route: support `?autostart=1` or default `/` Crew Core with S1 `/enter` accessible anytime
  const [route, setRoute] = useState<ScreenRoute>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') return '/';
    const path = window.location.pathname as ScreenRoute;
    const validRoutes: ScreenRoute[] = [
      '/enter',
      '/',
      '/ritual',
      '/measure',
      '/insights',
      '/alerts',
      '/wellness',
      '/link',
      '/habitat',
      '/quests',
      '/reports',
      '/ground',
      '/settings',
    ];
    return validRoutes.includes(path) ? path : '/';
  });

  const [crewList, setCrewList] = useState<CrewProfile[]>(initialSeed.crew);
  const [activeCrewId, setActiveCrewId] = useState<string>('ASTRA-002');
  const [activeRole, setActiveRole] = useState<'astronaut' | 'specialist'>('astronaut');
  const [environmentMode, setEnvironmentMode] = useState<EnvironmentMode>('spacecraft');
  const [selectedMissionDay, setSelectedMissionDay] = useState<number>(24);
  const [compareBaselineMode, setCompareBaselineMode] = useState<boolean>(false);

  const [selectedBodyRegion, setSelectedBodyRegion] = useState<BodyRegionId | null>(null);
  const [bodyTwinSide, setBodyTwinSide] = useState<'front' | 'back'>('front');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState<boolean>(false);

  const [offlineSimMode, setOfflineSimMode] = useState<boolean>(false);
  const [solarBlackoutMode, setSolarBlackoutMode] = useState<boolean>(false);
  const [syncQueue, setSyncQueue] = useState<OfflineQueueItem[]>([]);

  const [allObservations, setAllObservations] = useState<Observation[]>(
    initialSeed.observations
  );
  const [allCheckins, setAllCheckins] = useState<DailyCheckin[]>(
    initialSeed.checkins
  );
  const [allAlerts, setAllAlerts] = useState<AlertItem[]>(initialSeed.alerts);
  const [allJournals, setAllJournals] = useState<JournalEntry[]>(
    initialSeed.journals
  );
  const [allGrants, setAllGrants] = useState<AccessGrant[]>(initialSeed.grants);
  const [allMessages, setAllMessages] = useState<GroundMessage[]>(
    initialSeed.messages
  );
  const [allQuests, setAllQuests] = useState<Record<string, QuestItem[]>>(
    initialSeed.quests
  );
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>(
    initialSeed.auditLog
  );

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);

  const [accessibility, setAccessibility] = useState<AccessibilitySettings>(() => {
    try {
      const saved = localStorage.getItem('astrapulse_a11y_v2');
      if (saved) {
        return { ...DEFAULT_ACCESSIBILITY, ...JSON.parse(saved) };
      }
    } catch {
      // ignore storage errors
    }
    return DEFAULT_ACCESSIBILITY;
  });

  // Apply accessibility attributes to <html>
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('data-reduce-motion', String(accessibility.reduceMotion));
    html.setAttribute('data-high-contrast', String(accessibility.highContrast));
    html.setAttribute('data-cb-safe', String(accessibility.colourBlindSafe));
    html.setAttribute('data-text-scale', accessibility.textScale);
    html.setAttribute('data-glove-mode', String(accessibility.gloveMode));
    html.setAttribute('data-calm-mode', String(accessibility.calmMode));
    try {
      localStorage.setItem('astrapulse_a11y_v2', JSON.stringify(accessibility));
    } catch {
      // ignore
    }
  }, [accessibility]);

  // Boot connection test to Firebase & load offline queue
  useEffect(() => {
    testFirestoreConnection();
    const unsub = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
    });
    offlineDb.syncQueue.toArray().then(setSyncQueue).catch(() => {});
    return () => unsub();
  }, []);

  const navigate = useCallback((to: ScreenRoute) => {
    setRoute(to);
    try {
      window.history.pushState({}, '', to);
    } catch {
      // ignore iframe history restrictions
    }
  }, []);

  const triggerBodyScan = useCallback(() => {
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 1800);
  }, []);

  const selectCrew = useCallback(
    (crewId: string) => {
      setActiveCrewId(crewId);
      const found = crewList.find((c) => c.id === crewId) || CREW_PROFILES[1];
      setEnvironmentMode(found.defaultEnvironment);
    },
    [crewList]
  );

  const activeCrew = useMemo(
    () => crewList.find((c) => c.id === activeCrewId) || crewList[1],
    [crewList, activeCrewId]
  );

  const observations = useMemo(
    () =>
      allObservations.filter(
        (o) => o.crewId === activeCrewId && !o.supersededById
      ),
    [allObservations, activeCrewId]
  );

  const checkins = useMemo(
    () =>
      allCheckins
        .filter((c) => c.crewId === activeCrewId)
        .sort((a, b) => b.missionDay - a.missionDay),
    [allCheckins, activeCrewId]
  );

  // Re-evaluate active crew health state deterministically for `selectedMissionDay`
  const evaluatedState = useMemo(() => {
    const existingCrewAlerts = allAlerts.filter(
      (a) => a.crewId === activeCrewId
    );
    return evaluateCrewHealthState(
      activeCrewId,
      observations,
      selectedMissionDay,
      existingCrewAlerts
    );
  }, [activeCrewId, observations, selectedMissionDay, allAlerts]);

  const hasSimulatedDataInView = useMemo(
    () => observations.some((o) => o.source === 'simulated'),
    [observations]
  );

  // Filter journals according to activeRole (Specialists NEVER receive unshared private journals)
  const journals = useMemo(() => {
    const crewJournals = allJournals.filter((j) => j.crewId === activeCrewId);
    if (activeRole === 'specialist') {
      const nowIso = new Date().toISOString();
      return crewJournals.filter((j) => {
        if (!j.sharedWithGround) return false;
        const activeGrant = allGrants.find(
          (g) =>
            g.crewId === activeCrewId &&
            g.active &&
            !g.revokedAt &&
            g.expiresAt > nowIso &&
            g.scope === 'specific_journal_entries' &&
            g.journalEntryIds?.includes(j.id)
        );
        return Boolean(activeGrant);
      });
    }
    return crewJournals;
  }, [allJournals, allGrants, activeCrewId, activeRole]);

  const grants = useMemo(
    () => allGrants.filter((g) => g.crewId === activeCrewId),
    [allGrants, activeCrewId]
  );

  const messages = useMemo(
    () => allMessages.filter((m) => m.crewId === activeCrewId),
    [allMessages, activeCrewId]
  );

  const quests = useMemo(
    () => allQuests[activeCrewId] || [],
    [allQuests, activeCrewId]
  );

  const addAudit = useCallback(
    (
      action: string,
      targetType: AuditLogEntry['targetType'],
      targetId: string,
      summary: string
    ) => {
      setAuditLog((prev) => [
        {
          id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toISOString(),
          actorRole: activeRole,
          actorId: activeRole === 'specialist' ? 'GROUND-FLT-SURGEON' : activeCrewId,
          action,
          targetType,
          targetId,
          summary,
        },
        ...prev,
      ]);
    },
    [activeRole, activeCrewId]
  );

  // Submit Pulse Ritual Check-In
  const submitCheckin = useCallback(
    async (input: {
      metrics: Partial<Record<MetricCode, number | null>>;
      glucoseContext?: GlucoseContext;
      symptoms: string[];
      symptomRegions: BodyRegionId[];
      notes?: string;
    }) => {
      const sbp = input.metrics.systolic_bp;
      const dbp = input.metrics.diastolic_bp;

      for (const [mKey, val] of Object.entries(input.metrics)) {
        if (val === null || val === undefined) continue;
        const check = validateObservationPlausibility(
          mKey as MetricCode,
          Number(val),
          {
            glucoseContext: input.glucoseContext,
            pairedDiastolic: mKey === 'systolic_bp' ? dbp : undefined,
          }
        );
        if (!check.valid) {
          return { ok: false, error: check.hardError };
        }
      }

      const enriched: Partial<Record<MetricCode, number | null>> = {
        ...input.metrics,
      };
      if (typeof sbp === 'number' && typeof dbp === 'number') {
        const derived = computeDerivedBloodPressure(sbp, dbp);
        if (!derived.validOrder) {
          return {
            ok: false,
            error: 'Systolic BP must be strictly greater than Diastolic BP.',
          };
        }
        enriched.mean_arterial_pressure = derived.map;
        enriched.pulse_pressure = derived.pulsePressure;
      }

      const nowIso = new Date().toISOString();
      const checkinId = `CHK-${activeCrewId}-MD${selectedMissionDay}-${Date.now()}`;
      const newCheckin: DailyCheckin = {
        id: checkinId,
        crewId: activeCrewId,
        missionDay: selectedMissionDay,
        recordedAt: nowIso,
        environmentMode,
        source: 'user_entered',
        metrics: enriched,
        glucoseContext: input.glucoseContext,
        symptoms: input.symptoms,
        symptomRegions: input.symptomRegions,
        notes: input.notes,
      };

      const createdObs: Observation[] = [];
      for (const [mKey, val] of Object.entries(enriched)) {
        if (val === null || val === undefined) continue;
        const mCode = mKey as MetricCode;
        const def = METRIC_DEFINITIONS[mCode];
        if (!def) continue;
        const obs: Observation = {
          id: `OBS-${activeCrewId}-MD${selectedMissionDay}-${mCode}-${Date.now()}`,
          crewId: activeCrewId,
          checkinId,
          missionDay: selectedMissionDay,
          observedAt: nowIso,
          metric: mCode,
          value: Number(val),
          unit: def.unit,
          glucoseContext:
            mCode === 'blood_glucose' ? input.glucoseContext : undefined,
          source:
            mCode === 'mean_arterial_pressure' || mCode === 'pulse_pressure'
              ? 'derived'
              : 'user_entered',
        };
        createdObs.push(obs);
        mirrorObservationToFirestore(obs.id, obs as unknown as Record<string, unknown>);
      }

      setAllCheckins((prev) => [newCheckin, ...prev]);
      setAllObservations((prev) => [...prev, ...createdObs]);
      setCrewList((prev) =>
        prev.map((c) =>
          c.id === activeCrewId
            ? { ...c, xp: c.xp + 35, lastContactAt: nowIso }
            : c
        )
      );

      addAudit(
        'SEAL_PULSE_RITUAL',
        'checkin',
        checkinId,
        `Sealed MD-${selectedMissionDay} Pulse Ritual with ${createdObs.length} recorded metrics.`
      );

      if (offlineSimMode || !navigator.onLine) {
        const qItem = await enqueueOfflineMutation('/api/v1/checkins', 'POST', {
          ...newCheckin,
        });
        setSyncQueue((prev) => [...prev, qItem]);
      } else {
        fetch('/api/v1/checkins', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': checkinId,
          },
          body: JSON.stringify({
            crewId: activeCrewId,
            missionDay: selectedMissionDay,
            environmentMode,
            source: 'user_entered',
            metrics: enriched,
            glucoseContext: input.glucoseContext,
            symptoms: input.symptoms,
            symptomRegions: input.symptomRegions,
            notes: input.notes,
          }),
        }).catch(() => {});
      }

      triggerBodyScan();
      return { ok: true };
    },
    [
      activeCrewId,
      selectedMissionDay,
      environmentMode,
      offlineSimMode,
      addAudit,
      triggerBodyScan,
    ]
  );

  // Record Single Observation (from Measure Lab)
  const recordSingleObservation = useCallback(
    async (input: {
      metric: MetricCode;
      value: number;
      glucoseContext?: GlucoseContext;
      pairedDiastolic?: number;
      signalConfidence?: number;
      source?: ProvenanceSource;
      note?: string;
    }) => {
      const check = validateObservationPlausibility(input.metric, input.value, {
        glucoseContext: input.glucoseContext,
        pairedDiastolic: input.pairedDiastolic,
        signalConfidence: input.signalConfidence,
      });
      if (!check.valid) {
        return { ok: false, error: check.hardError };
      }

      const nowIso = new Date().toISOString();
      const def = METRIC_DEFINITIONS[input.metric];
      const obs: Observation = {
        id: `OBS-${activeCrewId}-MD${selectedMissionDay}-${input.metric}-${Date.now()}`,
        crewId: activeCrewId,
        missionDay: selectedMissionDay,
        observedAt: nowIso,
        metric: input.metric,
        value: Number(input.value),
        unit: def.unit,
        glucoseContext: input.glucoseContext,
        signalConfidence: input.signalConfidence,
        source: input.source || 'user_entered',
        note: input.note,
      };

      const toAdd: Observation[] = [obs];

      // If pairedDiastolic is provided alongside systolic_bp, also record diastolic_bp, MAP, and PP
      if (
        input.metric === 'systolic_bp' &&
        typeof input.pairedDiastolic === 'number'
      ) {
        const dbpObs: Observation = {
          id: `OBS-${activeCrewId}-MD${selectedMissionDay}-diastolic_bp-${Date.now()}`,
          crewId: activeCrewId,
          missionDay: selectedMissionDay,
          observedAt: nowIso,
          metric: 'diastolic_bp',
          value: input.pairedDiastolic,
          unit: 'mmHg',
          source: input.source || 'user_entered',
          note: input.note,
        };
        toAdd.push(dbpObs);

        const derived = computeDerivedBloodPressure(
          input.value,
          input.pairedDiastolic
        );
        if (derived.map !== null) {
          toAdd.push({
            id: `OBS-${activeCrewId}-MD${selectedMissionDay}-map-${Date.now()}`,
            crewId: activeCrewId,
            missionDay: selectedMissionDay,
            observedAt: nowIso,
            metric: 'mean_arterial_pressure',
            value: derived.map,
            unit: 'mmHg',
            source: 'derived',
          });
        }
        if (derived.pulsePressure !== null) {
          toAdd.push({
            id: `OBS-${activeCrewId}-MD${selectedMissionDay}-pp-${Date.now()}`,
            crewId: activeCrewId,
            missionDay: selectedMissionDay,
            observedAt: nowIso,
            metric: 'pulse_pressure',
            value: derived.pulsePressure,
            unit: 'mmHg',
            source: 'derived',
          });
        }
      }

      setAllObservations((prev) => [...prev, ...toAdd]);
      for (const o of toAdd) {
        mirrorObservationToFirestore(o.id, o as unknown as Record<string, unknown>);
      }

      addAudit(
        'RECORD_MEASUREMENT',
        'observation',
        obs.id,
        `Recorded ${def.label}: ${obs.value} ${def.unit} (${obs.source}).`
      );

      if (offlineSimMode || !navigator.onLine) {
        const qItem = await enqueueOfflineMutation(
          '/api/v1/observations',
          'POST',
          obs as unknown as Record<string, unknown>
        );
        setSyncQueue((prev) => [...prev, qItem]);
      } else {
        fetch('/api/v1/observations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            crewId: activeCrewId,
            missionDay: selectedMissionDay,
            ...input,
          }),
        }).catch(() => {});
      }

      return { ok: true, warning: check.softWarning };
    },
    [activeCrewId, selectedMissionDay, offlineSimMode, addAudit]
  );

  // Append-Only Amendment of an Existing Observation
  const amendObservation = useCallback(
    async (obsId: string, newValue: number, reason: string) => {
      if (!reason.trim()) {
        return {
          ok: false,
          error: 'An audit reason is required to amend an observation.',
        };
      }
      const target = allObservations.find((o) => o.id === obsId);
      if (!target) {
        return { ok: false, error: 'Original observation not found.' };
      }

      const check = validateObservationPlausibility(target.metric, newValue, {
        glucoseContext: target.glucoseContext,
      });
      if (!check.valid) {
        return { ok: false, error: check.hardError };
      }

      const newObsId = `OBS-AMEND-${target.id}-${Date.now()}`;
      const amended: Observation = {
        ...target,
        id: newObsId,
        value: newValue,
        observedAt: new Date().toISOString(),
        amendedFromId: target.id,
        amendReason: reason.trim(),
        supersededById: null,
        source: 'user_entered',
      };

      setAllObservations((prev) =>
        prev
          .map((o) =>
            o.id === obsId ? { ...o, supersededById: newObsId } : o
          )
          .concat(amended)
      );

      addAudit(
        'AMEND_OBSERVATION',
        'observation',
        newObsId,
        `Amended ${obsId} from ${target.value} to ${newValue} (${reason.trim()}).`
      );

      fetch(`/api/v1/observations/${obsId}/amend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newValue, reason }),
      }).catch(() => {});

      return { ok: true };
    },
    [allObservations, addAudit]
  );

  const importObservationsBatch = useCallback(
    async (
      rows: {
        missionDay: number;
        metric: MetricCode;
        value: number;
        glucoseContext?: GlucoseContext;
      }[]
    ) => {
      const accepted: Observation[] = [];
      const errors: string[] = [];

      rows.forEach((r, idx) => {
        const check = validateObservationPlausibility(r.metric, r.value, {
          glucoseContext: r.glucoseContext || 'fasting',
        });
        if (!check.valid) {
          errors.push(`Row ${idx + 1}: ${check.hardError}`);
        } else {
          accepted.push({
            id: `OBS-IMP-${activeCrewId}-MD${r.missionDay}-${r.metric}-${Date.now()}-${idx}`,
            crewId: activeCrewId,
            missionDay: r.missionDay,
            observedAt: new Date().toISOString(),
            metric: r.metric,
            value: r.value,
            unit: METRIC_DEFINITIONS[r.metric].unit,
            glucoseContext:
              r.metric === 'blood_glucose'
                ? r.glucoseContext || 'fasting'
                : undefined,
            source: 'imported',
          });
        }
      });

      if (accepted.length > 0) {
        setAllObservations((prev) => [...prev, ...accepted]);
        addAudit(
          'BATCH_IMPORT',
          'observation',
          `IMP-${Date.now()}`,
          `Imported ${accepted.length} observations (${errors.length} rejected).`
        );
      }

      return {
        acceptedCount: accepted.length,
        rejectedCount: errors.length,
        errors,
      };
    },
    [activeCrewId, addAudit]
  );

  const reviewAlert = useCallback(
    async (
      alertId: string,
      reason:
        | 'addressed'
        | 'expected_context'
        | 'recheck_scheduled'
        | 'escalated_to_ground',
      note: string
    ) => {
      const nowIso = new Date().toISOString();
      const updatedStatus =
        reason === 'escalated_to_ground' ? 'escalated' : 'reviewed';

      setAllAlerts((prev) => {
        const exists = prev.some((a) => a.id === alertId);
        const baseList = exists ? prev : [...prev, ...evaluatedState.alerts];
        return baseList.map((a) =>
          a.id === alertId
            ? {
                ...a,
                status: updatedStatus,
                reviewedAt: nowIso,
                reviewReason: reason,
                reviewNote: note,
              }
            : a
        );
      });

      addAudit(
        'REVIEW_ALERT',
        'alert',
        alertId,
        `Marked ${alertId} as ${updatedStatus} (reason: ${reason}).`
      );

      fetch(`/api/v1/alerts/${alertId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, note, actorRole: activeRole }),
      }).catch(() => {});
    },
    [evaluatedState.alerts, activeRole, addAudit]
  );

  const snoozeAlert = useCallback(
    async (alertId: string, hours: 4 | 12 | 24) => {
      const target =
        allAlerts.find((a) => a.id === alertId) ||
        evaluatedState.alerts.find((a) => a.id === alertId);
      if (!target) return { ok: false, error: 'Alert not found.' };

      if (target.severity === 'review_required' && target.snoozeCount >= 2) {
        return {
          ok: false,
          error:
            'Review-suggested alerts can be snoozed at most 2 times before requiring structured review or Ground escalation.',
        };
      }

      const untilIso = new Date(Date.now() + hours * 3600 * 1000).toISOString();
      setAllAlerts((prev) => {
        const exists = prev.some((a) => a.id === alertId);
        const baseList = exists ? prev : [...prev, ...evaluatedState.alerts];
        return baseList.map((a) =>
          a.id === alertId
            ? {
                ...a,
                status: 'snoozed',
                snoozedUntil: untilIso,
                snoozeCount: a.snoozeCount + 1,
              }
            : a
        );
      });

      addAudit(
        'SNOOZE_ALERT',
        'alert',
        alertId,
        `Snoozed ${alertId} for ${hours} hours.`
      );

      return { ok: true };
    },
    [allAlerts, evaluatedState.alerts, addAudit]
  );

  const commentOnAlert = useCallback(
    async (alertId: string, body: string) => {
      if (!body.trim()) return;
      const newComment = {
        id: `CMT-${Date.now()}`,
        authorRole: activeRole,
        authorName:
          activeRole === 'specialist'
            ? 'Dr. Sarah Chen (Flight Surgeon)'
            : activeCrew.name,
        createdAt: new Date().toISOString(),
        body: body.trim(),
      };

      setAllAlerts((prev) => {
        const exists = prev.some((a) => a.id === alertId);
        const baseList = exists ? prev : [...prev, ...evaluatedState.alerts];
        return baseList.map((a) =>
          a.id === alertId
            ? { ...a, comments: [...a.comments, newComment] }
            : a
        );
      });

      addAudit(
        'COMMENT_ALERT',
        'alert',
        alertId,
        `Added comment on alert ${alertId}.`
      );
    },
    [activeRole, activeCrew.name, evaluatedState.alerts, addAudit]
  );

  const createJournalEntry = useCallback(
    async (input: {
      title: string;
      body: string;
      moodScore: number | null;
      tags: string[];
      sharedWithGround: boolean;
      shareExpiresDays?: number;
    }) => {
      const nowIso = new Date().toISOString();
      const entryId = `JRN-${activeCrewId}-${Date.now()}`;
      let grantId: string | null = null;
      let expiresIso: string | null = null;

      if (input.sharedWithGround) {
        grantId = `GRT-${activeCrewId}-${Date.now()}`;
        expiresIso = new Date(
          Date.now() + (input.shareExpiresDays || 7) * 86400 * 1000
        ).toISOString();
        const newGrant: AccessGrant = {
          id: grantId,
          crewId: activeCrewId,
          grantedToRole: 'specialist',
          scope: 'specific_journal_entries',
          journalEntryIds: [entryId],
          createdAt: nowIso,
          expiresAt: expiresIso,
          active: true,
          note: `Explicit crew share for journal "${input.title}".`,
        };
        setAllGrants((prev) => [newGrant, ...prev]);
      }

      const entry: JournalEntry = {
        id: entryId,
        crewId: activeCrewId,
        missionDay: selectedMissionDay,
        createdAt: nowIso,
        updatedAt: nowIso,
        title: input.title.trim() || 'Mission Reflection',
        body: input.body.trim(),
        moodScore: input.moodScore,
        tags: input.tags,
        sharedWithGround: input.sharedWithGround,
        shareGrantId: grantId,
        shareExpiresAt: expiresIso,
        source: 'user_entered',
      };

      setAllJournals((prev) => [entry, ...prev]);
      addAudit(
        input.sharedWithGround ? 'CREATE_SHARED_JOURNAL' : 'CREATE_PRIVATE_JOURNAL',
        'journal',
        entryId,
        `Created ${input.sharedWithGround ? 'shared' : 'private'} journal entry.`
      );
    },
    [activeCrewId, selectedMissionDay, addAudit]
  );

  const toggleJournalShare = useCallback(
    async (journalId: string, share: boolean, expiresDays = 7) => {
      const nowIso = new Date().toISOString();
      if (share) {
        const grantId = `GRT-${activeCrewId}-${Date.now()}`;
        const expiresIso = new Date(
          Date.now() + expiresDays * 86400 * 1000
        ).toISOString();
        setAllGrants((prev) => [
          {
            id: grantId,
            crewId: activeCrewId,
            grantedToRole: 'specialist',
            scope: 'specific_journal_entries',
            journalEntryIds: [journalId],
            createdAt: nowIso,
            expiresAt: expiresIso,
            active: true,
            note: `Explicit share enabled for ${journalId}.`,
          },
          ...prev,
        ]);
        setAllJournals((prev) =>
          prev.map((j) =>
            j.id === journalId
              ? {
                  ...j,
                  sharedWithGround: true,
                  shareGrantId: grantId,
                  shareExpiresAt: expiresIso,
                  updatedAt: nowIso,
                }
              : j
          )
        );
        addAudit(
          'SHARE_JOURNAL_ENTRY',
          'grant',
          grantId,
          `Granted Ground access to journal ${journalId} for ${expiresDays} days.`
        );
      } else {
        setAllGrants((prev) =>
          prev.map((g) =>
            g.journalEntryIds?.includes(journalId)
              ? { ...g, active: false, revokedAt: nowIso }
              : g
          )
        );
        setAllJournals((prev) =>
          prev.map((j) =>
            j.id === journalId
              ? {
                  ...j,
                  sharedWithGround: false,
                  shareGrantId: null,
                  shareExpiresAt: null,
                  updatedAt: nowIso,
                }
              : j
          )
        );
        addAudit(
          'REVOKE_JOURNAL_SHARE',
          'journal',
          journalId,
          `Immediately revoked Ground access to journal ${journalId}.`
        );
      }
    },
    [activeCrewId, addAudit]
  );

  const verifySpecialistJournalAccess = useCallback(
    async (journalId: string) => {
      try {
        const res = await fetch(`/api/v1/journal/${journalId}`, {
          headers: { 'X-Astra-Role': 'specialist' },
        });
        if (res.status === 403) {
          const problem = await res.json();
          return {
            allowed: false,
            status: 403,
            message:
              problem.detail ||
              '403 Forbidden: Private crew journal is hardware/role-isolated.',
          };
        }
        return {
          allowed: true,
          status: res.status,
          message: '200 OK: Entry has an active crew sharing grant.',
        };
      } catch {
        return {
          allowed: false,
          status: 403,
          message: '403 Forbidden (Offline RBAC policy enforced).',
        };
      }
    },
    []
  );

  const createAccessGrant = useCallback(
    async (scope: AccessGrant['scope'], expiresDays: number, note: string) => {
      const nowIso = new Date().toISOString();
      const grant: AccessGrant = {
        id: `GRT-${activeCrewId}-${Date.now()}`,
        crewId: activeCrewId,
        grantedToRole: 'specialist',
        scope,
        createdAt: nowIso,
        expiresAt: new Date(
          Date.now() + expiresDays * 86400 * 1000
        ).toISOString(),
        active: true,
        note,
      };
      setAllGrants((prev) => [grant, ...prev]);
      addAudit(
        'CREATE_ACCESS_GRANT',
        'grant',
        grant.id,
        `Granted specialist ${scope} access for ${expiresDays} days.`
      );
    },
    [activeCrewId, addAudit]
  );

  const revokeAccessGrant = useCallback(
    async (grantId: string) => {
      const nowIso = new Date().toISOString();
      const target = allGrants.find((g) => g.id === grantId);
      setAllGrants((prev) =>
        prev.map((g) =>
          g.id === grantId ? { ...g, active: false, revokedAt: nowIso } : g
        )
      );
      if (target?.journalEntryIds) {
        setAllJournals((prev) =>
          prev.map((j) =>
            target.journalEntryIds?.includes(j.id)
              ? {
                  ...j,
                  sharedWithGround: false,
                  shareGrantId: null,
                  shareExpiresAt: null,
                }
              : j
          )
        );
      }
      addAudit(
        'REVOKE_ACCESS_GRANT',
        'grant',
        grantId,
        `Immediately revoked access grant ${grantId}.`
      );
    },
    [allGrants, addAudit]
  );

  const sendGroundMessage = useCallback(
    async (input: {
      subject: string;
      body: string;
      priority: GroundMessage['priority'];
      attachmentSizeKb?: number;
      linkedAlertId?: string | null;
      includedMetrics?: MetricCode[];
    }) => {
      const envProfile = ENVIRONMENT_MODES[environmentMode];
      const distanceKm = envProfile.typicalDistanceKm;
      const oneWaySec = computeLightTimeDelaySec(distanceKm);
      const nowMs = Date.now();
      const estIso = new Date(nowMs + (oneWaySec + 6) * 1000).toISOString();

      const msg: GroundMessage = {
        id: `MSG-${activeCrewId}-${nowMs}`,
        crewId: activeCrewId,
        missionDay: selectedMissionDay,
        createdAt: new Date(nowMs).toISOString(),
        senderRole: activeRole,
        senderName:
          activeRole === 'specialist'
            ? 'Dr. Sarah Chen (Flight Surgeon)'
            : activeCrew.name,
        subject: input.subject.trim() || 'Mission Telemetry Packet',
        body: input.body.trim(),
        priority: input.priority,
        state:
          solarBlackoutMode || offlineSimMode ? 'queued' : 'transmitting',
        oneWayDelaySec: oneWaySec,
        distanceKm,
        attachmentSizeKb: input.attachmentSizeKb || 48,
        estimatedArrivalAt: estIso,
        linkedAlertId: input.linkedAlertId || null,
        includedMetrics: input.includedMetrics || [],
      };

      setAllMessages((prev) => [msg, ...prev]);
      addAudit(
        'SEND_GROUND_LINK',
        'message',
        msg.id,
        `Queued Ground Link packet "${msg.subject}" (light-time delay ${oneWaySec}s).`
      );

      if (!solarBlackoutMode && !offlineSimMode) {
        setTimeout(() => {
          setAllMessages((prev) =>
            prev.map((m) =>
              m.id === msg.id ? { ...m, state: 'in_flight' } : m
            )
          );
        }, 1200);
        setTimeout(() => {
          setAllMessages((prev) =>
            prev.map((m) =>
              m.id === msg.id ? { ...m, state: 'delivered' } : m
            )
          );
        }, 3800);
      }
    },
    [
      environmentMode,
      activeCrewId,
      selectedMissionDay,
      activeRole,
      activeCrew.name,
      solarBlackoutMode,
      offlineSimMode,
      addAudit,
    ]
  );

  const completeQuest = useCallback(
    (questId: string) => {
      setAllQuests((prev) => {
        const list = prev[activeCrewId] || [];
        return {
          ...prev,
          [activeCrewId]: list.map((q) =>
            q.id === questId
              ? { ...q, completedToday: true, progress: q.target }
              : q
          ),
        };
      });
      setCrewList((prev) =>
        prev.map((c) => (c.id === activeCrewId ? { ...c, xp: c.xp + 25 } : c))
      );
    },
    [activeCrewId]
  );

  const flushOfflineQueue = useCallback(async () => {
    const items = await offlineDb.syncQueue.toArray();
    if (items.length === 0) return;

    await fetch('/api/v1/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    }).catch(() => {});

    await offlineDb.syncQueue.clear();
    setSyncQueue([]);
    setAllMessages((prev) =>
      prev.map((m) => (m.state === 'queued' ? { ...m, state: 'delivered' } : m))
    );
    addAudit(
      'FLUSH_OFFLINE_QUEUE',
      'sync',
      `SYNC-${Date.now()}`,
      `Flushed ${items.length} queued offline items cleanly.`
    );
  }, [addAudit]);

  const resetDemoSeed = useCallback(async () => {
    const fresh = buildDeterministicSeed();
    setCrewList(fresh.crew);
    setAllObservations(fresh.observations);
    setAllCheckins(fresh.checkins);
    setAllAlerts(fresh.alerts);
    setAllJournals(fresh.journals);
    setAllGrants(fresh.grants);
    setAllMessages(fresh.messages);
    setAllQuests(fresh.quests);
    setAuditLog(fresh.auditLog);
    setSelectedMissionDay(24);
    await offlineDb.syncQueue.clear();
    setSyncQueue([]);
    await fetch('/api/v1/admin/seed', { method: 'POST' }).catch(() => {});
  }, []);

  const updateAccessibility = useCallback(
    (patch: Partial<AccessibilitySettings>) => {
      setAccessibility((prev) => ({
        ...prev,
        ...patch,
        useAltUnits: patch.useAltUnits
          ? { ...prev.useAltUnits, ...patch.useAltUnits }
          : prev.useAltUnits,
      }));
    },
    []
  );

  const formatMetricValue = useCallback(
    (metric: MetricCode, value: number | null | undefined) => {
      const def = METRIC_DEFINITIONS[metric];
      if (value === null || value === undefined || !Number.isFinite(value)) {
        return { formatted: 'Not recorded', unit: def?.unit || '' };
      }

      const alt = accessibility.useAltUnits;
      if (
        (metric === 'systolic_bp' ||
          metric === 'diastolic_bp' ||
          metric === 'mean_arterial_pressure' ||
          metric === 'pulse_pressure') &&
        alt.bpKpa
      ) {
        return {
          formatted: (value * 0.133322).toFixed(1),
          unit: 'kPa',
        };
      }
      if (metric === 'body_temp_c' && alt.tempFahrenheit) {
        return {
          formatted: ((value * 9) / 5 + 32).toFixed(1),
          unit: '°F',
        };
      }
      if (metric === 'blood_glucose' && alt.glucoseMmol) {
        return {
          formatted: (value / 18.0182).toFixed(1),
          unit: 'mmol/L',
        };
      }
      if (metric === 'body_mass_kg' && alt.massLb) {
        return {
          formatted: (value * 2.20462).toFixed(1),
          unit: 'lb',
        };
      }

      return {
        formatted: value.toFixed(def.decimals),
        unit: def.unit,
      };
    },
    [accessibility.useAltUnits]
  );

  // Global keyboard shortcuts per UI/UX Guide Part 2 §14.4
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
        return;
      }

      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const k = e.key.toLowerCase();
      if (k === 'f') {
        e.preventDefault();
        setBodyTwinSide((s) => (s === 'front' ? 'back' : 'front'));
      } else if (k === 's') {
        e.preventDefault();
        triggerBodyScan();
      } else if (k === 'r') {
        e.preventDefault();
        navigate('/ritual');
      } else if (k === 'n') {
        e.preventDefault();
        setSelectedMissionDay(24);
      } else if (k === 'c') {
        e.preventDefault();
        setCompareBaselineMode((p) => !p);
      } else if (k === 'l') {
        e.preventDefault();
        navigate('/link');
      } else if (k === '?') {
        e.preventDefault();
        setShortcutsModalOpen((p) => !p);
      } else if (k === 'escape') {
        setSelectedBodyRegion(null);
        setCommandPaletteOpen(false);
        setShortcutsModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navigate, triggerBodyScan]);

  const signInWithGoogle = useCallback(async () => {
    await signInWithGooglePopup();
  }, []);

  const signOutUser = useCallback(async () => {
    await signOutFirebase();
  }, []);

  const value: MissionContextValue = {
    route,
    navigate,
    selectedBodyRegion,
    setSelectedBodyRegion,
    bodyTwinSide,
    setBodyTwinSide,
    isScanning,
    triggerBodyScan,
    commandPaletteOpen,
    setCommandPaletteOpen,
    shortcutsModalOpen,
    setShortcutsModalOpen,
    crewList,
    activeCrewId,
    activeCrew,
    selectCrew,
    activeRole,
    setActiveRole,
    environmentMode,
    setEnvironmentMode,
    selectedMissionDay,
    setSelectedMissionDay,
    compareBaselineMode,
    setCompareBaselineMode,
    offlineSimMode,
    setOfflineSimMode,
    solarBlackoutMode,
    setSolarBlackoutMode,
    syncQueue,
    flushOfflineQueue,
    firebaseUser,
    signInWithGoogle,
    signOutUser,
    observations,
    allObservations,
    checkins,
    evaluations: evaluatedState.evaluations,
    alerts: evaluatedState.alerts,
    allCrewAlerts: allAlerts,
    vitalityRings: evaluatedState.vitalityRings,
    bodyRegions: evaluatedState.bodyRegions,
    hazardNodes: evaluatedState.hazardNodes,
    overallTier: evaluatedState.overallTier,
    hasSimulatedDataInView,
    journals,
    grants,
    messages,
    quests,
    auditLog,
    submitCheckin,
    recordSingleObservation,
    amendObservation,
    importObservationsBatch,
    reviewAlert,
    snoozeAlert,
    commentOnAlert,
    createJournalEntry,
    toggleJournalShare,
    verifySpecialistJournalAccess,
    createAccessGrant,
    revokeAccessGrant,
    sendGroundMessage,
    completeQuest,
    resetDemoSeed,
    accessibility,
    updateAccessibility,
    formatMetricValue,
  };

  return (
    <MissionContext.Provider value={value}>{children}</MissionContext.Provider>
  );
};

export function useMission() {
  const ctx = useContext(MissionContext);
  if (!ctx) {
    throw new Error('useMission must be used inside <MissionProvider>');
  }
  return ctx;
}
