// __tests__/integration/diagnosis-sync-integration.test.tsx

import React, { ReactNode } from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { DiagnosisProvider, useDiagnosis } from '../../contexts/DiagnosisContext';
import { AuthContext } from '../../contexts/AuthContext';
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

// Test user and data
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

// Test wrapper
const TestWrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <AuthContext.Provider value={{ user: mockUser, signIn: jest.fn(), signOut: jest.fn() }}>
      <DiagnosisProvider>{children}</DiagnosisProvider>
    </AuthContext.Provider>
  );
};

// Test component
const DiagnosisTestComponent: React.FC = () => {
  const {
    history,
    addDiagnosis,
    deleteDiagnosis,
    clearHistory,
    isLoading,
    isSyncing,
    isOnline,
    isRealtimeConnected,
  } = useDiagnosis();

  return (
    <>
      <test-testid="history-count">{history.length}</test-testid>
      <test-testid="is-loading">{isLoading.toString()}</test-testid>
      <test-testid="is-syncing">{isSyncing.toString()}</test-testid>
      <test-testid="is-online">{isOnline.toString()}</test-testid>
      <test-testid="is-realtime-connected">{isRealtimeConnected.toString()}</test-testid>
    </>
  );
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

  describe('Basic Integration', () => {
    it('should load initial diagnoses and establish real-time connection', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <DiagnosisTestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('history-count')).toHaveTextContent('1');
        expect(getByTestId('is-loading')).toHaveTextContent('false');
        expect(getByTestId('is-realtime-connected')).toHaveTextContent('true');
      });

      expect(mockDiagnosisService.getDiagnoses).toHaveBeenCalled();
      expect(mockSupabase.channel).toHaveBeenCalledWith('diagnoses_changes');
    });

    it('should handle diagnosis addition and sync', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <DiagnosisTestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('history-count')).toHaveTextContent('1');
      });

      await act(async () => {
        await addDiagnosis(mockDiagnosis);
      });

      await waitFor(() => {
        expect(mockDiagnosisService.upsertDiagnosis).toHaveBeenCalledWith(mockDiagnosis);
        expect(mockAsyncStorage.setItem).toHaveBeenCalled();
      });
    });

    it('should handle diagnosis deletion and sync', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <DiagnosisTestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('history-count')).toHaveTextContent('1');
      });

      await act(async () => {
        await deleteDiagnosis(mockDiagnosis.id);
      });

      await waitFor(() => {
        expect(mockDiagnosisService.deleteDiagnosis).toHaveBeenCalledWith(mockDiagnosis.id);
        expect(mockAsyncStorage.setItem).toHaveBeenCalled();
      });
    });

    it('should handle history clearing and sync', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <DiagnosisTestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('history-count')).toHaveTextContent('1');
      });

      await act(async () => {
        await clearHistory();
      });

      await waitFor(() => {
        expect(mockDiagnosisService.clearAllDiagnoses).toHaveBeenCalled();
        expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@poultrycure_history');
      });
    });
  });

  describe('Offline to Online Sync', () => {
    it('should queue operations when offline and sync when online', async () => {
      let netInfoCallback: (state: any) => void;
      
      mockNetInfo.addEventListener.mockImplementation((callback) => {
        netInfoCallback = callback;
        return jest.fn();
      });

      // Start offline
      netInfoCallback({ isConnected: false });

      const { getByTestId } = render(
        <TestWrapper>
          <DiagnosisTestComponent />
        </TestWrapper>
      );

      // Add diagnosis while offline
      await act(async () => {
        await addDiagnosis(mockDiagnosis);
      });

      // Should be queued, not synced
      expect(mockDiagnosisService.upsertDiagnosis).not.toHaveBeenCalled();
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@poultrycure_pending_queue',
        expect.stringContaining('add')
      );

      // Go online
      netInfoCallback({ isConnected: true });

      await waitFor(() => {
        expect(mockDiagnosisService.upsertDiagnosis).toHaveBeenCalledWith(mockDiagnosis);
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should handle real-time diagnosis updates', async () => {
      let realtimeCallback: (payload: any) => void;
      
      const mockChannel = {
        on: jest.fn().mockImplementation((event, config, callback) => {
          if (event === 'postgres_changes') {
            realtimeCallback = callback;
          }
          return mockChannel;
        }),
        subscribe: jest.fn().mockImplementation((callback) => {
          callback('SUBSCRIBED');
          return mockChannel;
        }),
      };
      mockSupabase.channel.mockReturnValue(mockChannel);

      const { getByTestId } = render(
        <TestWrapper>
          <DiagnosisTestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('is-realtime-connected')).toHaveTextContent('true');
      });

      // Simulate real-time INSERT
      const insertPayload = {
        eventType: 'INSERT',
        new: { ...mockDiagnosis, user_id: mockUser.id },
        old: {},
      };

      await act(async () => {
        realtimeCallback(insertPayload);
      });

      await waitFor(() => {
        expect(mockAsyncStorage.setItem).toHaveBeenCalled();
      });
    });
  });

  describe('Error Recovery', () => {
    it('should handle sync errors gracefully', async () => {
      mockDiagnosisService.upsertDiagnosis.mockRejectedValue(new Error('Network error'));

      const { getByTestId } = render(
        <TestWrapper>
          <DiagnosisTestComponent />
        </TestWrapper>
      );

      await act(async () => {
        await addDiagnosis(mockDiagnosis);
      });

      await waitFor(() => {
        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
          '@poultrycure_pending_queue',
          expect.stringContaining('add')
        );
      });
    });
  });
});
