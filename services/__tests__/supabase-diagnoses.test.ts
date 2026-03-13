// services/__tests__/supabase-diagnoses.test.ts

import '@testing-library/jest-dom';
import { supabase } from '../../lib/supabase';
import { DiagnosisResult } from '../../types/types';
import * as diagnosisService from '../supabase-diagnoses';

// Mock Supabase client
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    channel: jest.fn(),
    removeChannel: jest.fn(),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: {
          user: { id: 'test-user-id' }
        }
      })
    }
  },
}));

// Helper function to create complete mock chain
const createMockQueryBuilder = (resolveValue: any, methodToResolve: 'select' | 'eq' | 'order' | 'range' | 'single' | 'upsert' | 'delete' | 'insert' | 'update' = 'eq') => {
  const mockChain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
  };
  
  // Make the specified method return the resolved value
  mockChain[methodToResolve].mockResolvedValue(resolveValue);
  
  return mockChain;
};

// Mock UUID generation
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid-12345'),
}));

describe('Supabase Diagnosis Service', () => {
  const mockUserId = 'test-user-id';
  const mockDiagnosis: DiagnosisResult = {
    id: 'test-diagnosis-id',
    type: 'symptom',
    input: 'loss of appetite',
    diagnosis: 'Anorexia: Symptom of various underlying diseases',
    confidence: 75,
    recommendations: ['Observe bird for additional symptoms'],
    treatment: 'Supportive care',
    prevention: 'Maintain clean environment',
    severity: 'moderate',
    date: '2026-03-02T13:27:47.430328+00:00',
    imageUri: 'https://example.com/image.jpg',
    updated_at: '2026-03-02T13:27:44.363+00:00',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDiagnoses', () => {
    it('should fetch user diagnoses successfully', async () => {
      const supabaseData = [{ ...mockDiagnosis, user_id: mockUserId, created_at: mockDiagnosis.date, image_url: mockDiagnosis.imageUri }];
      const mockChain = createMockQueryBuilder({ data: supabaseData, error: null }, 'range');
      
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await diagnosisService.getDiagnoses();

      expect(supabase.from).toHaveBeenCalledWith('diagnoses');
      expect(mockChain.select).toHaveBeenCalledWith('*');
      expect(mockChain.eq).toHaveBeenCalledWith('user_id', expect.any(String));
      expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockChain.range).toHaveBeenCalledWith(0, 49); // default limit=50, offset=0
      expect(result).toEqual([mockDiagnosis]); // Service maps from supabase format
    });

    it('should handle fetch errors gracefully', async () => {
      const mockChain = createMockQueryBuilder({ data: null, error: new Error('Database error') }, 'range');
      
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await expect(diagnosisService.getDiagnoses()).rejects.toThrow('Database error');
    });
  });

  describe('upsertDiagnosis', () => {
    it('should insert new diagnosis successfully', async () => {
      const supabaseData = { ...mockDiagnosis, user_id: mockUserId, created_at: mockDiagnosis.date, image_url: mockDiagnosis.imageUri };
      const mockChain = createMockQueryBuilder({ data: supabaseData, error: null }, 'single');
      
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await diagnosisService.upsertDiagnosis(mockDiagnosis);

      expect(supabase.from).toHaveBeenCalledWith('diagnoses');
      expect(result).toEqual(mockDiagnosis); // Service maps from supabase format
    });

    it('should handle upsert errors', async () => {
      const mockChain = createMockQueryBuilder({ data: null, error: new Error('Upsert failed') }, 'single');
      
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await expect(diagnosisService.upsertDiagnosis(mockDiagnosis)).rejects.toThrow('Upsert failed');
    });
  });

  describe('deleteDiagnosis', () => {
    it('should delete diagnosis successfully', async () => {
      const supabaseData = { ...mockDiagnosis, user_id: mockUserId, created_at: mockDiagnosis.date, image_url: mockDiagnosis.imageUri };
      // Mock the select query to get existing diagnosis
      const selectChain = createMockQueryBuilder({ data: supabaseData, error: null }, 'single');
      // Mock the delete query - need to handle delete().eq().eq() chain
      const deleteEq2 = jest.fn().mockResolvedValue({ data: null, error: null });
      const deleteEq1 = jest.fn().mockReturnValue({ eq: deleteEq2 });
      const deleteChain = {
        delete: jest.fn().mockReturnValue({ eq: deleteEq1 }),
      };
      
      (supabase.from as jest.Mock)
        .mockReturnValueOnce(selectChain) // First call (select)
        .mockReturnValueOnce(deleteChain); // Second call (delete)

      const result = await diagnosisService.deleteDiagnosis(mockDiagnosis.id);

      expect(supabase.from).toHaveBeenCalledWith('diagnoses');
      expect(selectChain.select).toHaveBeenCalledWith('*');
      expect(selectChain.eq).toHaveBeenCalledWith('id', mockDiagnosis.id);
      expect(selectChain.eq).toHaveBeenCalledWith('user_id', expect.any(String));
      expect(deleteChain.delete).toHaveBeenCalled();
      expect(deleteEq1).toHaveBeenCalledWith('id', mockDiagnosis.id);
      expect(deleteEq2).toHaveBeenCalledWith('user_id', expect.any(String));
      expect(result).toEqual(mockDiagnosis); // Service maps from supabase format
    });

    it('should handle delete errors', async () => {
      // Mock the select query to find diagnosis
      const selectChain = createMockQueryBuilder({ data: { ...mockDiagnosis, user_id: mockUserId, created_at: mockDiagnosis.date, image_url: mockDiagnosis.imageUri }, error: null }, 'single');
      // Mock the delete query to fail
      const deleteEq2 = jest.fn().mockResolvedValue({ data: null, error: new Error('Delete failed') });
      const deleteEq1 = jest.fn().mockReturnValue({ eq: deleteEq2 });
      const deleteChain = {
        delete: jest.fn().mockReturnValue({ eq: deleteEq1 }),
      };
      
      (supabase.from as jest.Mock)
        .mockReturnValueOnce(selectChain) // First call (select)
        .mockReturnValueOnce(deleteChain); // Second call (delete)

      await expect(diagnosisService.deleteDiagnosis(mockDiagnosis.id)).rejects.toThrow('Delete failed');
    });
  });

  describe('clearAllDiagnoses', () => {
    it('should clear all user diagnoses successfully', async () => {
      const mockChain = createMockQueryBuilder({ data: null, error: null }, 'eq');
      
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await diagnosisService.clearAllDiagnoses();

      expect(supabase.from).toHaveBeenCalledWith('diagnoses');
      expect(mockChain.delete).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith('user_id', expect.any(String));
    });

    it('should handle clear errors', async () => {
      const mockChain = createMockQueryBuilder({ data: null, error: new Error('Clear failed') }, 'eq');
      
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await expect(diagnosisService.clearAllDiagnoses()).rejects.toThrow('Clear failed');
    });
  });

  describe('getDiagnosesCount', () => {
    it('should get diagnosis count successfully', async () => {
      const mockChain = createMockQueryBuilder({ count: 5, error: null }, 'eq');
      
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await diagnosisService.getDiagnosesCount();

      expect(supabase.from).toHaveBeenCalledWith('diagnoses');
      expect(mockChain.select).toHaveBeenCalledWith('*', { count: 'exact', head: true });
      expect(mockChain.eq).toHaveBeenCalledWith('user_id', expect.any(String));
      expect(result).toBe(5);
    });

    it('should handle count errors', async () => {
      const mockChain = createMockQueryBuilder({ count: null, error: new Error('Count failed') }, 'eq');
      
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await expect(diagnosisService.getDiagnosesCount()).rejects.toThrow('Count failed');
    });
  });

  describe('getDiagnosisById', () => {
    it('should get diagnosis by ID successfully', async () => {
      const supabaseData = { ...mockDiagnosis, user_id: mockUserId, created_at: mockDiagnosis.date, image_url: mockDiagnosis.imageUri };
      const mockChain = createMockQueryBuilder({ data: supabaseData, error: null }, 'single');
      
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await diagnosisService.getDiagnosisById(mockDiagnosis.id);

      expect(supabase.from).toHaveBeenCalledWith('diagnoses');
      expect(mockChain.select).toHaveBeenCalledWith('*');
      expect(mockChain.eq).toHaveBeenCalledWith('id', mockDiagnosis.id);
      expect(mockChain.eq).toHaveBeenCalledWith('user_id', expect.any(String));
      expect(result).toEqual(mockDiagnosis); // Service maps from supabase format
    });

    it('should handle get by ID errors', async () => {
      const mockChain = createMockQueryBuilder({ data: null, error: new Error('Not found') }, 'single');
      
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await expect(diagnosisService.getDiagnosisById(mockDiagnosis.id)).rejects.toThrow('Not found');
    });
  });
});
