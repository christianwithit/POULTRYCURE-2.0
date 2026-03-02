// types/types.ts
import { ImageMetadata } from './image';

export interface DiagnosisResult {
  id: string;
  type: 'symptom' | 'image';
  input: string;
  diagnosis: string;
  confidence: number;
  recommendations: string[];
  treatment?: string;
  prevention?: string;
  severity: 'low' | 'moderate' | 'high';
  date: string;
  imageUri?: string;          // Local URI before upload
  imageUrl?: string;          // Supabase Storage URL after upload
  imagePath?: string;         // Storage path
  imageMetadata?: ImageMetadata;
  updated_at: string;
}

export interface Symptom {
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  description: string;
}

export interface DiseaseInfo {
  name: string;
  symptoms: string[];
  treatment: string;
  prevention: string;
  severity: 'low' | 'moderate' | 'high';
  description: string;
  commonIn: string[];
}

// Enhanced Disease Information Model for Glossary
export interface ExtendedDiseaseInfo extends DiseaseInfo {
  id: string;
  category: DiseaseCategory;
  causes: string[];
  transmission: TransmissionInfo;
  incubationPeriod: string;
  mortality: MortalityInfo;
  images: DiseaseImage[];
  relatedDiseases: string[];
  lastUpdated: Date;
  sources: string[];
  tags: string[];
}

export interface TransmissionInfo {
  method: 'direct' | 'indirect' | 'vector' | 'airborne' | 'waterborne';
  contagiousness: 'low' | 'moderate' | 'high';
  quarantinePeriod: string;
}

export interface MortalityInfo {
  rate: string;
  timeframe: string;
  ageGroups: AgeGroupMortality[];
}

export interface AgeGroupMortality {
  ageGroup: string;
  mortalityRate: string;
}

export interface DiseaseImage {
  id: string;
  url: string;
  caption: string;
  type: 'symptom' | 'lesion' | 'microscopic' | 'treatment';
}

export type DiseaseCategory = 'viral' | 'bacterial' | 'parasitic' | 'nutritional' | 'genetic' | 'environmental';

export interface FilterCriteria {
  categories: DiseaseCategory[];
  severities: ('low' | 'moderate' | 'high')[];
  species: string[];
  searchQuery?: string;
}

// Bookmark Model
export interface DiseaseBookmark {
  id: string;
  userId: string;
  diseaseId: string;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Authentication and User Management Types
export interface User {
  id: string;
  name: string;
  email: string;
  profilePhoto?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SessionData {
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
  token?: string;
}

export interface EncryptedCredentials {
  hashedPassword: string;
  salt: string;
}

export interface UserProfile extends User {
  hashedPassword: string;
  salt: string;
  lastLoginAt?: Date;
}