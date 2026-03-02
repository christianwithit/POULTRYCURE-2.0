import { supabase } from '../lib/supabase';
import { DiagnosisResult } from '../types/types';

export interface SupabaseDiagnosis {
  id: string;
  user_id: string;
  type: 'symptom' | 'image';
  input: string;
  diagnosis: string;
  confidence: number;
  recommendations: string[];
  treatment?: string;
  prevention?: string;
  severity: 'low' | 'moderate' | 'high';
  image_url?: string;
  created_at: string;
  updated_at: string;
}

const normalizeSeverity = (severity: string): 'low' | 'moderate' | 'high' => {
  const severityLower = severity.toLowerCase();
  
  if (severityLower.includes('low') || severityLower.includes('mild')) {
    return 'low';
  }
  if (severityLower.includes('high') || severityLower.includes('severe') || severityLower.includes('critical')) {
    return 'high';
  }
  if (severityLower.includes('moderate') || severityLower.includes('medium')) {
    return 'moderate';
  }
  
  return 'low';
};

const mapToSupabaseDiagnosis = (diagnosis: DiagnosisResult, userId: string): Omit<SupabaseDiagnosis, 'created_at' | 'updated_at'> => {
  return {
    id: diagnosis.id,
    user_id: userId,
    type: diagnosis.type,
    input: diagnosis.input,
    diagnosis: diagnosis.diagnosis,
    confidence: diagnosis.confidence,
    recommendations: diagnosis.recommendations,
    treatment: diagnosis.treatment,
    prevention: diagnosis.prevention,
    severity: normalizeSeverity(diagnosis.severity),
    image_url: diagnosis.imageUri,
  };
};

const mapToSupabaseDiagnosisWithTimestamp = (diagnosis: DiagnosisResult, userId: string): Omit<SupabaseDiagnosis, 'created_at'> => {
  return {
    id: diagnosis.id,
    user_id: userId,
    type: diagnosis.type,
    input: diagnosis.input,
    diagnosis: diagnosis.diagnosis,
    confidence: diagnosis.confidence,
    recommendations: diagnosis.recommendations,
    treatment: diagnosis.treatment,
    prevention: diagnosis.prevention,
    severity: normalizeSeverity(diagnosis.severity),
    image_url: diagnosis.imageUri,
    updated_at: diagnosis.updated_at || new Date().toISOString(),
  };
};

const mapFromSupabaseDiagnosis = (supabaseDiagnosis: SupabaseDiagnosis): DiagnosisResult => {
  return {
    id: supabaseDiagnosis.id,
    type: supabaseDiagnosis.type,
    input: supabaseDiagnosis.input,
    diagnosis: supabaseDiagnosis.diagnosis,
    confidence: supabaseDiagnosis.confidence,
    recommendations: supabaseDiagnosis.recommendations,
    treatment: supabaseDiagnosis.treatment,
    prevention: supabaseDiagnosis.prevention,
    severity: supabaseDiagnosis.severity,
    date: supabaseDiagnosis.created_at,
    imageUri: supabaseDiagnosis.image_url,
    updated_at: supabaseDiagnosis.updated_at,
  };
};

export const saveDiagnosis = async (diagnosis: DiagnosisResult): Promise<DiagnosisResult> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const supabaseDiagnosis = mapToSupabaseDiagnosis(diagnosis, user.id);

  const { data, error } = await supabase
    .from('diagnoses')
    .insert(supabaseDiagnosis)
    .select()
    .single();

  if (error) {
    console.error('Error saving diagnosis:', error);
    throw new Error(error.message);
  }

  return mapFromSupabaseDiagnosis(data);
};

export const upsertDiagnosis = async (diagnosis: DiagnosisResult): Promise<DiagnosisResult> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const supabaseDiagnosis = mapToSupabaseDiagnosisWithTimestamp(diagnosis, user.id);

  const { data, error } = await supabase
    .from('diagnoses')
    .upsert(supabaseDiagnosis, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('Error upserting diagnosis:', error);
    throw new Error(error.message);
  }

  return mapFromSupabaseDiagnosis(data);
};

export const getDiagnoses = async (limit: number = 50, offset: number = 0): Promise<DiagnosisResult[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('diagnoses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching diagnoses:', error);
    throw new Error(error.message);
  }

  return (data || []).map(mapFromSupabaseDiagnosis);
};

export const getDiagnosisById = async (id: string): Promise<DiagnosisResult | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('diagnoses')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching diagnosis:', error);
    throw new Error(error.message);
  }

  return mapFromSupabaseDiagnosis(data);
};

export const updateDiagnosis = async (id: string, updates: Partial<DiagnosisResult>): Promise<DiagnosisResult> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const updateData: Partial<Omit<SupabaseDiagnosis, 'id' | 'user_id' | 'created_at' | 'updated_at'>> = {};
  
  if (updates.input !== undefined) updateData.input = updates.input;
  if (updates.diagnosis !== undefined) updateData.diagnosis = updates.diagnosis;
  if (updates.confidence !== undefined) updateData.confidence = updates.confidence;
  if (updates.recommendations !== undefined) updateData.recommendations = updates.recommendations;
  if (updates.treatment !== undefined) updateData.treatment = updates.treatment;
  if (updates.prevention !== undefined) updateData.prevention = updates.prevention;
  if (updates.severity !== undefined) updateData.severity = normalizeSeverity(updates.severity);
  if (updates.imageUri !== undefined) updateData.image_url = updates.imageUri;

  const { data, error } = await supabase
    .from('diagnoses')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating diagnosis:', error);
    throw new Error(error.message);
  }

  return mapFromSupabaseDiagnosis(data);
};

export const deleteDiagnosis = async (id: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('diagnoses')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting diagnosis:', error);
    throw new Error(error.message);
  }
};

export const clearAllDiagnoses = async (): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('diagnoses')
    .delete()
    .eq('user_id', user.id);

  if (error) {
    console.error('Error clearing diagnoses:', error);
    throw new Error(error.message);
  }
};

export const getDiagnosesCount = async (): Promise<number> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { count, error } = await supabase
    .from('diagnoses')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (error) {
    console.error('Error getting diagnoses count:', error);
    throw new Error(error.message);
  }

  return count || 0;
};
