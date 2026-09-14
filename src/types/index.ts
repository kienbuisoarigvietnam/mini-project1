export enum Category {
  HARDWARE = 'Hardware',
  PROJECTOR = 'Projector',
  AC = 'AC',
  ELECTRICAL = 'Electrical',
  FURNITURE = 'Furniture'
}

export enum SyncStatus {
  DRAFT = 'DRAFT',
  PENDING_SYNC = 'PENDING_SYNC',
  SYNCING = 'SYNCING',
  SYNCED = 'SYNCED',
  FAILED = 'FAILED'
}

export interface SurveyPhoto {
  id: string;
  dataUrl: string;
  createdAt: number;
}

export interface SurveyLocation {
  building: string;
  floor: string;
  room: string;
}

export interface SurveyData {
  id: string;
  location: SurveyLocation;
  category: Category;
  rating: number;
  notes: string;
  photos: SurveyPhoto[];
  createdAt: number;
  updatedAt: number;
}

export interface SurveyRecord extends SurveyData {
  syncStatus: SyncStatus;
  syncAttempts: number;
  lastSyncError?: string;
  syncedAt?: number;
}

export interface SyncQueueItem {
  id: string;
  surveyId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  error?: string;
  attempts: number;
  createdAt: number;
  lastAttemptAt?: number;
}

export const CATEGORY_LIST: Category[] = [
  Category.HARDWARE,
  Category.PROJECTOR,
  Category.AC,
  Category.ELECTRICAL,
  Category.FURNITURE
];

export const BUILDING_LIST = [
  'A1 - Main Building',
  'A2 - Engineering',
  'B1 - IT Center',
  'B2 - Library',
  'C1 - Auditorium',
  'C2 - Laboratory',
  'D1 - Dormitory A',
  'D2 - Dormitory B'
];

export const FLOOR_LIST = ['1', '2', '3', '4', '5', '6', 'B1', 'B2'];

export type FormStep = 1 | 2 | 3 | 4;
