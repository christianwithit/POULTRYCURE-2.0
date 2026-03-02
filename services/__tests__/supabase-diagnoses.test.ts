// services/__tests__/supabase-diagnoses.test.ts

import { supabase } from '../../lib/supabase';
import * as diagnosisService from '../supabase-diagnoses';
import { DiagnosisResult } from '../../types/types';

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
    updated_at: '2026-03-02T13:27:44.363+00:00',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDiagnoses', () => {
    it('should fetch user diagnoses successfully', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockReturnThis();
      const mockData = [{ ...mockDiagnosis, user_id: mockUserId }];
      
      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      });

      mockOrder.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await diagnosisService.getDiagnoses();

      expect(supabase.from).toHaveBeenCalledWith('diagnoses');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('user_id', expect.any(String));
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(mockData);
    });

    it('should handle fetch errors gracefully', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockReturnThis();
      
      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      });

      mockOrder.mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      });

      await expect(diagnosisService.getDiagnoses()).rejects.toThrow('Database error');
    });
  });

  describe('upsertDiagnosis', () => {
    it('should insert new diagnosis successfully', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockReturnThis();
      const mockData = { ...mockDiagnosis, user_id: mockUserId };
      
      (supabase.from as jest.Mock).mockReturnValue({
        upsert: jest.fn().mockReturnValue({
          select: mockSelect,
          eq: mockEq,
          single: mockSingle,
        }),
      });

      mockSingle.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await diagnosisService.upsertDiagnosis(mockDiagnosis);

      expect(supabase.from).toHaveBeenCalledWith('diagnoses');
      expect(result).toEqual(mockData);
    });

    it('should handle upsert errors', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockReturnThis();
      
      (supabase.from as jest.Mock).mockReturnValue({
        upsert: jest.fn().mockReturnValue({
          select: mockSelect,
          eq: mockEq,
          single: mockSingle,
        }),
      });

      mockSingle.mockResolvedValue({
        data: null,
        error: new Error('Upsert failed'),
      });

      await expect(diagnosisService.upsertDiagnosis(mockDiagnosis)).rejects.toThrow('Upsert failed');
    });
  });

  describe('deleteDiagnosis', () => {
    it('should delete diagnosis successfully', async () => {
      const mockEq = jest.fn().mockReturnThis();
      const mockData = { ...mockDiagnosis, user_id: mockUserId };
      
      (supabase.from as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: mockEq,
        }),
      });

      mockEq.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await diagnosisService.deleteDiagnosis(mockDiagnosis.id);

      expect(supabase.from).toHaveBeenCalledWith('diagnoses');
      expect(mockEq).toHaveBeenCalledWith('id', mockDiagnosis.id);
      expect(result).toEqual(mockData);
    });

    it('should handle delete errors', async () => {
      const mockEq = jest.fn().mockReturnThis();
      
      (supabase.from as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: mockEq,
        }),
      });

      mockEq.mockResolvedValue({
        data: null,
        error: new Error('Delete failed'),
      });

      await expect(diagnosisService.deleteDiagnosis(mockDiagnosis.id)).rejects.toThrow('Delete failed');
    });
  });

  describe('clearAllDiagnoses', () => {
    it('should clear all user diagnoses successfully', async () => {
      const mockEq = jest.fn().mockReturnThis();
      
      (supabase.from as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: mockEq,
        }),
      });

      mockEq.mockResolvedValue({
        data: null,
        error: null,
      });

      await diagnosisService.clearAllDiagnoses();

      expect(supabase.from).toHaveBeenCalledWith('diagnoses');
      expect(mockEq).toHaveBeenCalledWith('user_id', expect.any(String));
    });

    it('should handle clear errors', async () => {
      const mockEq = jest.fn().mockReturnThis();
      
      (supabase.from as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: mockEq,
        }),
      });

      mockEq.mockResolvedValue({
        data: null,
        error: new Error('Clear failed'),
      });

      await expect(diagnosisService.clearAllDiagnoses()).rejects.toThrow('Clear failed');
    });
  });

  describe('getDiagnosesCount', () => {
    it('should get diagnosis count successfully', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockData = [{ count: 5 }];
      
      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
      });

      mockEq.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await diagnosisService.getDiagnosesCount();

      expect(supabase.from).toHaveBeenCalledWith('diagnoses');
      expect(mockSelect).toHaveBeenCalledWith('id', { count: 'exact', head: true });
      expect(mockEq).toHaveBeenCalledWith('user_id', expect.any(String));
      expect(result).toBe(5);
    });

    it('should handle count errors', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      
      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
      });

      mockEq.mockResolvedValue({
        data: null,
        error: new Error('Count failed'),
      });

      await expect(diagnosisService.getDiagnosesCount()).rejects.toThrow('Count failed');
    });
  });

  describe('getDiagnosisById', () => {
    it('should get diagnosis by ID successfully', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockReturnThis();
      const mockData = { ...mockDiagnosis, user_id: mockUserId };
      
      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      });

      mockSingle.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await diagnosisService.getDiagnosisById(mockDiagnosis.id);

      expect(supabase.from).toHaveBeenCalledWith('diagnoses');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('id', mockDiagnosis.id);
      expect(result).toEqual(mockData);
    });

    it('should handle get by ID errors', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockReturnThis();
      
      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      });

      mockSingle.mockResolvedValue({
        data: null,
        error: new Error('Not found'),
      });

      await expect(diagnosisService.getDiagnosisById(mockDiagnosis.id)).rejects.toThrow('Not found');
    });
  });
});
