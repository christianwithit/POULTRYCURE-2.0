// contexts/__tests__/DiagnosisContext.test.tsx

// Mock environment variables and supabase before any imports
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

// Mock supabase module
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      }))
    },
    channel: jest.fn(),
    removeChannel: jest.fn(),
  }
}));

// Mock NetInfo native module
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
  addEventListener: jest.fn(() => jest.fn()),
  useNetInfo: jest.fn(() => ({ isConnected: true })),
}));

import { render, act, waitFor, fireEvent } from '@testing-library/react';
import React, { ReactNode } from 'react';
import { DiagnosisProvider, useDiagnosis } from '../DiagnosisContext';
import { AuthContext } from '../AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as diagnosisService from '../../services/supabase-diagnoses';
import { supabase } from '../../lib/supabase';
import { DiagnosisResult } from '../../types/types';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../../services/supabase-diagnoses');
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
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user,
      isLoading: false,
      login: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn()
    }}>
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
    <div>
      <div data-testid="history-count">{history.length}</div>
      <div data-testid="is-loading">{isLoading.toString()}</div>
      <div data-testid="is-syncing">{isSyncing.toString()}</div>
      <div data-testid="is-online">{isOnline.toString()}</div>
      <div data-testid="is-realtime-connected">{isRealtimeConnected.toString()}</div>
      <div data-testid="sync-error">{syncError || 'none'}</div>
      <div data-testid="last-synced-at">{lastSyncedAt?.toISOString() || 'never'}</div>
      <button
        data-testid="add-diagnosis"
        onClick={async () => {
          await addDiagnosis(mockDiagnosis);
        }}
      >
        Add Diagnosis
      </button>
      <button
        data-testid="clear-history"
        onClick={() => clearHistory()}
      >
        Clear History
      </button>
      <button
        data-testid="delete-diagnosis"
        onClick={() => deleteDiagnosis(mockDiagnosis.id)}
      >
        Delete Diagnosis
      </button>
      <button
        data-testid="refresh-history"
        onClick={() => refreshHistory()}
      >
        Refresh History
      </button>
      <button
        data-testid="clear-sync-error"
        onClick={() => clearSyncError()}
      >
        Clear Sync Error
      </button>
      <button
        data-testid="clear-pending-queue"
        onClick={() => clearPendingQueue()}
      >
        Clear Pending Queue
      </button>
    </div>
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
      topic: 'diagnoses_changes',
      params: {},
      socket: null,
      bindings: [],
      state: 'SUBSCRIBED',
      joinPush: null,
      on: jest.fn().mockReturnThis(),
      off: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockImplementation((callback) => {
        callback('SUBSCRIBED');
        return mockChannel;
      }),
      unsubscribe: jest.fn().mockResolvedValue(undefined),
      push: jest.fn(),
      leave: jest.fn(),
      trigger: jest.fn(),
      send: jest.fn(),
      recv: jest.fn(),
      filter: jest.fn(),
      map: jest.fn(),
      join: jest.fn(),
      leavePush: null,
      rejoin: jest.fn(),
      reset: jest.fn(),
      destroy: jest.fn(),
      isJoined: jest.fn(),
      isJoining: jest.fn(),
      isLeaving: jest.fn(),
      isClosed: jest.fn(),
      isErrored: jest.fn(),
      isSubscribed: jest.fn(),
      presenceState: jest.fn(),
      presence: jest.fn(),
      track: jest.fn(),
      untrack: jest.fn(),
      onMessage: jest.fn(),
      onClose: jest.fn(),
      onError: jest.fn(),
      onJoin: jest.fn(),
      onLeave: jest.fn(),
      onAccessDenied: jest.fn(),
    };
    mockSupabase.channel.mockReturnValue(mockChannel as any);
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
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        expect(mockDiagnosisService.upsertDiagnosis).toHaveBeenCalledWith(mockDiagnosis);
        expect(mockAsyncStorage.setItem).toHaveBeenCalled();
      });
    });

    it('should queue diagnosis when offline', async () => {
      // Mock offline state
      mockNetInfo.addEventListener.mockImplementation((callback) => {
        callback({ 
          isConnected: false,
          type: 'none' as any,
          isInternetReachable: false,
          details: { connectionType: 'none' } as any
        });
        return jest.fn();
      });

      const { getByTestId } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const addButton = getByTestId('add-diagnosis');
      
      await act(async () => {
        fireEvent.click(addButton);
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
        fireEvent.click(deleteButton);
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
        fireEvent.click(clearButton);
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
        fireEvent.click(refreshButton);
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
        fireEvent.click(addButton);
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
        fireEvent.click(addButton);
      });

      const clearErrorButton = getByTestId('clear-sync-error');
      
      await act(async () => {
        fireEvent.click(clearErrorButton);
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
        fireEvent.click(clearQueueButton);
      });

      await waitFor(() => {
        expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@poultrycure_pending_queue');
      });
    });
  });

  describe('Real-time Connection', () => {
    it('should establish real-time connection when user is online', async () => {
      const { getByTestId } = render(
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
        callback({ 
          isConnected: false,
          type: 'none' as any,
          isInternetReachable: false,
          details: { connectionType: 'none' } as any
        });
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
