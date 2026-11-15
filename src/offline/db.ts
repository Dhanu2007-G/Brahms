/**
 * AstraPulse — Dexie IndexedDB Offline Storage & Store-and-Forward Sync Queue
 * Team Zenitsu — NASA Space Apps Challenge 2026
 */

import Dexie, { type Table } from 'dexie';
import {
  AlertItem,
  DailyCheckin,
  GroundMessage,
  JournalEntry,
  Observation,
} from '../analytics/types';

export interface OfflineQueueItem {
  id: string;
  createdAt: string;
  endpoint: string;
  method: 'POST' | 'PATCH' | 'DELETE';
  payload: Record<string, unknown>;
  status: 'queued' | 'syncing' | 'synced' | 'conflict';
  retryCount: number;
  conflictReason?: string;
}

export class AstraPulseOfflineDB extends Dexie {
  observations!: Table<Observation, string>;
  checkins!: Table<DailyCheckin, string>;
  alerts!: Table<AlertItem, string>;
  journals!: Table<JournalEntry, string>;
  messages!: Table<GroundMessage, string>;
  syncQueue!: Table<OfflineQueueItem, string>;

  constructor() {
    super('AstraPulseOfflineDB_v2');
    this.version(1).stores({
      observations: 'id, crewId, missionDay, metric, observedAt',
      checkins: 'id, crewId, missionDay, recordedAt',
      alerts: 'id, crewId, missionDay, severity, status',
      journals: 'id, crewId, missionDay, sharedWithGround',
      messages: 'id, crewId, missionDay, state',
      syncQueue: 'id, createdAt, status, endpoint',
    });
  }
}

export const offlineDb = new AstraPulseOfflineDB();

export async function enqueueOfflineMutation(
  endpoint: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  payload: Record<string, unknown>
): Promise<OfflineQueueItem> {
  const item: OfflineQueueItem = {
    id: `Q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    endpoint,
    method,
    payload,
    status: 'queued',
    retryCount: 0,
  };
  await offlineDb.syncQueue.put(item);
  return item;
}
