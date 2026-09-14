import type { SurveyRecord, SurveyData, SurveyPhoto, SurveyLocation } from '../types';
import { SyncStatus, Category } from '../types';
import { SurveysDB, DraftsDB } from './database';
import { queueForSync, removeFromSync } from './sync';
import { v4 as uuidv4 } from 'uuid';

export function createEmptySurvey(): SurveyRecord {
  const now = Date.now();
  return {
    id: uuidv4(),
    location: { building: '', floor: '', room: '' },
    category: Category.HARDWARE,
    rating: 3,
    notes: '',
    photos: [],
    createdAt: now,
    updatedAt: now,
    syncStatus: SyncStatus.DRAFT,
    syncAttempts: 0
  };
}

export async function saveDraft(id: string, data: Partial<SurveyRecord>): Promise<void> {
  await DraftsDB.save(id, data);
  const survey = await SurveysDB.get(id);
  if (survey) {
    const merged: SurveyRecord = {
      ...survey,
      ...data,
      updatedAt: Date.now()
    };
    await SurveysDB.put(merged);
  }
}

export async function getDraft(id: string): Promise<Partial<SurveyRecord> | undefined> {
  const fromDB = await DraftsDB.get(id);
  const survey = await SurveysDB.get(id);
  if (!fromDB && !survey) return undefined;
  return { ...survey, ...fromDB } as Partial<SurveyRecord>;
}

export async function saveSurveyAsDraft(survey: SurveyRecord): Promise<void> {
  survey.updatedAt = Date.now();
  survey.syncStatus = SyncStatus.DRAFT;
  await SurveysDB.put(survey);
  await DraftsDB.delete(survey.id);
}

export async function submitSurvey(survey: SurveyRecord): Promise<void> {
  survey.updatedAt = Date.now();
  await SurveysDB.put(survey);
  await DraftsDB.delete(survey.id);
  await queueForSync(survey.id);
}

export async function getAllSurveys(): Promise<SurveyRecord[]> {
  return SurveysDB.getAll();
}

export async function getSurveyById(id: string): Promise<SurveyRecord | undefined> {
  return SurveysDB.get(id);
}

export async function deleteSurvey(id: string): Promise<void> {
  await removeFromSync(id);
  await DraftsDB.delete(id);
  await SurveysDB.delete(id);
}

export function updateSurveyLocation(
  survey: SurveyRecord,
  loc: Partial<SurveyLocation>
): SurveyRecord {
  return {
    ...survey,
    location: { ...survey.location, ...loc },
    updatedAt: Date.now()
  };
}

export function addSurveyPhoto(survey: SurveyRecord, photo: SurveyPhoto): SurveyRecord {
  return {
    ...survey,
    photos: [...survey.photos, photo],
    updatedAt: Date.now()
  };
}

export function removeSurveyPhoto(survey: SurveyRecord, photoId: string): SurveyRecord {
  return {
    ...survey,
    photos: survey.photos.filter((p) => p.id !== photoId),
    updatedAt: Date.now()
  };
}

export function surveyToData(survey: SurveyRecord): SurveyData {
  const { syncStatus, syncAttempts, lastSyncError, syncedAt, ...data } = survey;
  return data as SurveyData;
}

export function isSurveyComplete(survey: SurveyRecord): boolean {
  return (
    !!survey.location.building &&
    !!survey.location.floor &&
    !!survey.location.room &&
    !!survey.category &&
    survey.rating >= 1 &&
    survey.rating <= 5
  );
}
