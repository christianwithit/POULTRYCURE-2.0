// contexts/__tests__/DiagnosisContext.test.tsx

import React, { ReactNode } from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { DiagnosisProvider, useDiagnosis } from '../DiagnosisContext';
import { AuthContext } from '../AuthContext';
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

// Test user
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
};

// Mock diagnosis data
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

// Test wrapper component
const TestWrapper: React.FC<{ children: ReactNode; user?: any }> = ({ children, user = mockUser }) => {
  return (
    <AuthContext.Provider value={{ user, signIn: jest.fn(), signOut: jest.fn() }}>
      <DiagnosisProvider>{children}</DiagnosisProvider>
    </AuthContext.Provider>
  );
};

// Test component to use the hook
const TestComponent: React.FC = () => {
  const {
    history,
    addDiagnosis,
    clearHistory,
    deleteDiagnosis,
    refreshHistory,
    isLoading,
    isSyncing,
    isOnline,
    lastSyncedAt,
    syncError,
    clearSyncError,
    clearPendingQueue,
    isRealtimeConnected,
  } = useDiagnosis();

  return (
    <>
      <test-testid="history-count">{history.length}</test-testid>
      <test-testid="is-loading">{isLoading.toString()}</test-testid>
      <test-testid="is-syncing">{isSyncing.toString()}</test-testid>
      <test-testid="is-online">{isOnline.toString()}</test-testid>
      <test-testid="is-realtime-connected">{isRealtimeConnected.toString()}</test-testid>
      <test-testid="sync-error">{syncError || 'none'}</test-testid>
      <test-testid="last-synced-at">{lastSyncedAt?.toISOString() || 'never'}</test-testid>
      <button
        test-id="add-diagnosis"
        onPress={() => addDiagnosis(mockDiagnosis)}
      />
      <button
        test-id="clear-history"
        onPress={() => clearHistory()}
      />
      <button
        test-id="delete-diagnosis"
        onPress={() => deleteDiagnosis(mockDiagnosis.id)}
      />
      <button
        test-id="refresh-history"
        onPress={() => refreshHistory()}
      />
      <button
        test-id="clear-sync-error"
        onPress={() => clearSyncError()}
      />
      <button
        test-id="clear-pending-queue"
        onPress={() => clearPendingQueue()}
      />
    </>
  );
};

describe('DiagnosisContext', () => {
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

  describe('Initial State', () => {
    it('should provide correct initial values', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('is-loading')).toHaveTextContent('false');
        expect(getByTestId('is-syncing')).toHaveTextContent('false');
        expect(getByTestId('is-online')).toHaveTextContent('true');
        expect(getByTestId('is-realtime-connected')).toHaveTextContent('true');
        expect(getByTestId('sync-error')).toHaveTextContent('none');
        expect(getByTestId('history-count')).toHaveTextContent('1');
      });
    });

    it('should handle no user state', async () => {
      const { getByTestId } = render(
        <TestWrapper user={null}>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('history-count')).toHaveTextContent('0');
        expect(getByTestId('is-loading')).toHaveTextContent('false');
      });
    });
  });

  describe('addDiagnosis', () => {
    it('should add diagnosis successfully when online', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('history-count')).toHaveTextContent('1');
      });

      const addButton = getByTestId('add-diagnosis');
      
      await act(async () => {
        addButton.props.onPress();
      });

      await waitFor(() => {
        expect(mockDiagnosisService.upsertDiagnosis).toHaveBeenCalledWith(mockDiagnosis);
        expect(mockAsyncStorage.setItem).toHaveBeenCalled();
      });
    });

    it('should queue diagnosis when offline', async () => {
      // Mock offline state
      mockNetInfo.addEventListener.mockImplementation((callback) => {
        callback({ isConnected: false });
        return jest.fn();
      });

      const { getByTestId } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const addButton = getByTestId('add-diagnosis');
      
      await act(async () => {
        addButton.props.onPress();
      });

      await waitFor(() => {
        expect(mockDiagnosisService.upsertDiagnosis).not.toHaveBeenCalled();
        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
          '@poultrycure_pending_queue',
          expect.stringContaining('add')
        );
      });
    });
  });

  describe('deleteDiagnosis', () => {
    it('should delete diagnosis successfully when online', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('history-count')).toHaveTextContent('1');
      });

      const deleteButton = getByTestId('delete-diagnosis');
      
      await act(async () => {
        deleteButton.props.onPress();
      });

      await waitFor(() => {
        expect(mockDiagnosisService.deleteDiagnosis).toHaveBeenCalledWith(mockDiagnosis.id);
        expect(mockAsyncStorage.setItem).toHaveBeenCalled();
      });
    });
  });

  describe('clearHistory', () => {
    it('should clear history successfully when online', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('history-count')).toHaveTextContent('1');
      });

      const clearButton = getByTestId('clear-history');
      
      await act(async () => {
        clearButton.props.onPress();
      });

      await waitFor(() => {
        expect(mockDiagnosisService.clearAllDiagnoses).toHaveBeenCalled();
        expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@poultrycure_history');
      });
    });
  });

  describe('refreshHistory', () => {
    it('should refresh history from remote', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const refreshButton = getByTestId('refresh-history');
      
      await act(async () => {
        refreshButton.props.onPress();
      });

      await waitFor(() => {
        expect(mockDiagnosisService.getDiagnoses).toHaveBeenCalled();
        expect(mockAsyncStorage.setItem).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle sync errors gracefully', async () => {
      mockDiagnosisService.upsertDiagnosis.mockRejectedValue(new Error('Sync failed'));

      const { getByTestId } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const addButton = getByTestId('add-diagnosis');
      
      await act(async () => {
        addButton.props.onPress();
      });

      await waitFor(() => {
        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
          '@poultrycure_pending_queue',
          expect.stringContaining('add')
        );
      });
    });
  });

  describe('clearSyncError', () => {
    it('should clear sync error', async () => {
      // Mock sync error
      mockDiagnosisService.upsertDiagnosis.mockRejectedValue(new Error('Sync failed'));

      const { getByTestId } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const addButton = getByTestId('add-diagnosis');
      
      await act(async () => {
        addButton.props.onPress();
      });

      const clearErrorButton = getByTestId('clear-sync-error');
      
      await act(async () => {
        clearErrorButton.props.onPress();
      });

      await waitFor(() => {
        expect(getByTestId('sync-error')).toHaveTextContent('none');
      });
    });
  });

  describe('clearPendingQueue', () => {
    it('should clear pending queue', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const clearQueueButton = getByTestId('clear-pending-queue');
      
      await act(async () => {
        clearQueueButton.props.onPress();
      });

      await waitFor(() => {
        expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@poultrycure_pending_queue');
      });
    });
  });

  describe('Real-time Connection', () => {
    it('should establish real-time connection when user is online', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockSupabase.channel).toHaveBeenCalledWith('diagnoses_changes');
        expect(getByTestId('is-realtime-connected')).toHaveTextContent('true');
      });
    });

    it('should disconnect real-time when user is offline', async () => {
      // Mock offline state
      mockNetInfo.addEventListener.mockImplementation((callback) => {
        callback({ isConnected: false });
        return jest.fn();
      });

      const { getByTestId } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('is-realtime-connected')).toHaveTextContent('false');
      });
    });
  });
});
