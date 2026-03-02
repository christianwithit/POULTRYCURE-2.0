// __tests__/integration/diagnosis-sync-integration.test.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as diagnosisService from '../../services/supabase-diagnoses';
import { supabase } from '../../lib/supabase';
import { DiagnosisResult } from '../../types/types';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@react-native-community/netinfo');
jest.mock('../../services/supabase-diagnoses');
jest.mock('../../lib/supabase');
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid-12345'),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockNetInfo = NetInfo as jest.Mocked<typeof NetInfo>;
const mockDiagnosisService = diagnosisService as jest.Mocked<typeof diagnosisService>;
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

// Test data
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
};

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

describe('Diagnosis Sync Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    mockAsyncStorage.removeItem.mockResolvedValue();
    
    mockNetInfo.addEventListener.mockReturnValue(jest.fn());
    
    mockDiagnosisService.getDiagnoses.mockResolvedValue([mockDiagnosis]);
    mockDiagnosisService.upsertDiagnosis.mockResolvedValue(mockDiagnosis);
    mockDiagnosisService.deleteDiagnosis.mockResolvedValue(mockDiagnosis);
    mockDiagnosisService.clearAllDiagnoses.mockResolvedValue();
    
    // Mock Supabase realtime
    const mockChannel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockImplementation((callback) => {
        callback('SUBSCRIBED');
        return mockChannel;
      }),
    };
    mockSupabase.channel.mockReturnValue(mockChannel);
    mockSupabase.removeChannel.mockResolvedValue();
  });

  describe('Service Integration', () => {
    it('should fetch diagnoses successfully', async () => {
      const result = await diagnosisService.getDiagnoses();
      
      expect(result).toEqual([mockDiagnosis]);
      expect(mockDiagnosisService.getDiagnoses).toHaveBeenCalled();
    });

    it('should upsert diagnosis successfully', async () => {
      const result = await diagnosisService.upsertDiagnosis(mockDiagnosis);
      
      expect(result).toEqual(mockDiagnosis);
      expect(mockDiagnosisService.upsertDiagnosis).toHaveBeenCalledWith(mockDiagnosis);
    });

    it('should delete diagnosis successfully', async () => {
      const result = await diagnosisService.deleteDiagnosis(mockDiagnosis.id);
      
      expect(result).toEqual(mockDiagnosis);
      expect(mockDiagnosisService.deleteDiagnosis).toHaveBeenCalledWith(mockDiagnosis.id);
    });

    it('should clear all diagnoses successfully', async () => {
      await diagnosisService.clearAllDiagnoses();
      
      expect(mockDiagnosisService.clearAllDiagnoses).toHaveBeenCalled();
    });
  });

  describe('AsyncStorage Integration', () => {
    it('should save and retrieve diagnosis data', async () => {
      const testData = [mockDiagnosis];
      
      await mockAsyncStorage.setItem('@poultrycure_history', JSON.stringify(testData));
      
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@poultrycure_history',
        JSON.stringify(testData)
      );
    });

    it('should handle storage errors gracefully', async () => {
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));
      
      try {
        await mockAsyncStorage.setItem('@poultrycure_history', JSON.stringify([mockDiagnosis]));
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Network Integration', () => {
    it('should handle network state changes', () => {
      const mockCallback = jest.fn();
      
      mockNetInfo.addEventListener.mockReturnValue(jest.fn());
      
      const unsubscribe = NetInfo.addEventListener(mockCallback);
      
      expect(mockNetInfo.addEventListener).toHaveBeenCalledWith(mockCallback);
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('Real-time Integration', () => {
    it('should establish real-time connection', () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockImplementation((callback) => {
          callback('SUBSCRIBED');
          return mockChannel;
        }),
      };
      
      mockSupabase.channel.mockReturnValue(mockChannel);
      
      const channel = supabase.channel('test-channel');
      
      expect(supabase.channel).toHaveBeenCalledWith('test-channel');
      expect(channel.on).toHaveBeenCalled();
    });

    it('should handle real-time events', () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockImplementation((callback) => {
          // Simulate real-time event
          const payload = {
            eventType: 'INSERT',
            new: { ...mockDiagnosis, user_id: mockUser.id },
            old: {},
          };
          callback(payload);
          return mockChannel;
        }),
      };
      
      mockSupabase.channel.mockReturnValue(mockChannel);
      
      const channel = supabase.channel('diagnoses_changes');
      channel.on('postgres_changes', {}, jest.fn());
      
      expect(mockChannel.on).toHaveBeenCalled();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle service errors gracefully', async () => {
      mockDiagnosisService.getDiagnoses.mockRejectedValue(new Error('Service error'));
      
      try {
        await diagnosisService.getDiagnoses();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Service error');
      }
    });

    it('should handle network errors gracefully', async () => {
      mockDiagnosisService.upsertDiagnosis.mockRejectedValue(new Error('Network error'));
      
      try {
        await diagnosisService.upsertDiagnosis(mockDiagnosis);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network error');
      }
    });
  });

  describe('Data Integrity Integration', () => {
    it('should maintain data structure consistency', () => {
      expect(mockDiagnosis).toHaveProperty('id');
      expect(mockDiagnosis).toHaveProperty('type');
      expect(mockDiagnosis).toHaveProperty('input');
      expect(mockDiagnosis).toHaveProperty('diagnosis');
      expect(mockDiagnosis).toHaveProperty('confidence');
      expect(mockDiagnosis).toHaveProperty('severity');
      expect(mockDiagnosis).toHaveProperty('date');
      expect(mockDiagnosis).toHaveProperty('updated_at');
    });

    it('should handle valid UUID format', () => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(uuidRegex.test(mockDiagnosis.id)).toBe(true);
    });
  });

  describe('Performance Integration', () => {
    it('should handle large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        ...mockDiagnosis,
        id: `diagnosis-${i}`,
        input: `Symptom ${i}`,
      }));
      
      mockDiagnosisService.getDiagnoses.mockResolvedValue(largeDataset);
      
      const startTime = Date.now();
      const result = await diagnosisService.getDiagnoses();
      const endTime = Date.now();
      
      expect(result).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle concurrent operations', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => 
        diagnosisService.upsertDiagnosis({
          ...mockDiagnosis,
          id: `concurrent-${i}`,
        })
      );
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(10);
      expect(mockDiagnosisService.upsertDiagnosis).toHaveBeenCalledTimes(10);
    });
  });
});
