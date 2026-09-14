import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { SurveyRecord, SyncQueueItem } from '../types';

interface VKUSurveyDB extends DBSchema {
  surveys: {
    key: string;
    value: SurveyRecord;
    indexes: {
      bySyncStatus: string;
      byUpdatedAt: number;
    };
  };
  syncQueue: {
    key: string;
    value: SyncQueueItem;
    indexes: {
      byStatus: string;
      byCreatedAt: number;
    };
  };
  drafts: {
    key: string;
    value: { id: string; data: Partial<SurveyRecord>; updatedAt: number };
  };
}

const DB_NAME = 'vku-field-survey-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<VKUSurveyDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<VKUSurveyDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<VKUSurveyDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('surveys')) {
        const surveysStore = db.createObjectStore('surveys', { keyPath: 'id' });
        surveysStore.createIndex('bySyncStatus', 'syncStatus');
        surveysStore.createIndex('byUpdatedAt', 'updatedAt');
      }

      if (!db.objectStoreNames.contains('syncQueue')) {
        const queueStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
        queueStore.createIndex('byStatus', 'status');
        queueStore.createIndex('byCreatedAt', 'createdAt');
      }

      if (!db.objectStoreNames.contains('drafts')) {
        db.createObjectStore('drafts', { keyPath: 'id' });
      }
    }
  });

  return dbInstance;
}

export const SurveysDB = {
  async put(survey: SurveyRecord): Promise<void> {
    const db = await getDB();
    await db.put('surveys', survey);
  },

  async get(id: string): Promise<SurveyRecord | undefined> {
    const db = await getDB();
    return db.get('surveys', id);
  },

  async getAll(): Promise<SurveyRecord[]> {
    const db = await getDB();
    const all = await db.getAll('surveys');
    return all.sort((a, b) => b.updatedAt - a.updatedAt);
  },

  async getBySyncStatus(status: SurveyRecord['syncStatus']): Promise<SurveyRecord[]> {
    const db = await getDB();
    return db.getAllFromIndex('surveys', 'bySyncStatus', status);
  },

  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('surveys', id);
  },

  async clear(): Promise<void> {
    const db = await getDB();
    await db.clear('surveys');
  }
};

export const SyncQueueDB = {
  async enqueue(item: SyncQueueItem): Promise<void> {
    const db = await getDB();
    await db.put('syncQueue', item);
  },

  async dequeue(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('syncQueue', id);
  },

  async getPending(): Promise<SyncQueueItem[]> {
    const db = await getDB();
    const items = await db.getAllFromIndex('syncQueue', 'byStatus', 'PENDING');
    return items.sort((a, b) => a.createdAt - b.createdAt);
  },

  async update(item: SyncQueueItem): Promise<void> {
    const db = await getDB();
    await db.put('syncQueue', item);
  },

  async getAll(): Promise<SyncQueueItem[]> {
    const db = await getDB();
    return db.getAll('syncQueue');
  },

  async deleteBySurveyId(surveyId: string): Promise<void> {
    const db = await getDB();
    const all = await db.getAll('syncQueue');
    const toDelete = all.filter((i) => i.surveyId === surveyId);
    const tx = db.transaction('syncQueue', 'readwrite');
    await Promise.all(toDelete.map((i) => tx.store.delete(i.id)));
    await tx.done;
  }
};

export const DraftsDB = {
  async save(id: string, data: Partial<SurveyRecord>): Promise<void> {
    const db = await getDB();
    await db.put('drafts', { id, data, updatedAt: Date.now() });
  },

  async get(id: string): Promise<Partial<SurveyRecord> | undefined> {
    const db = await getDB();
    const entry = await db.get('drafts', id);
    return entry?.data;
  },

  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('drafts', id);
  }
};
