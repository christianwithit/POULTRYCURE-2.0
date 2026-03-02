// contexts/DiagnosisContext.tsx

import AsyncStorage from '@react-native-async-storage/async-storage';

import React, { createContext, ReactNode, useContext, useEffect, useState, useRef } from 'react';

import { DiagnosisResult } from '../types/types';

import { useAuth } from './AuthContext';

import * as diagnosisService from '../services/supabase-diagnoses';

import { supabase } from '../lib/supabase';

import NetInfo from '@react-native-community/netinfo';

import { RealtimeChannel } from '@supabase/supabase-js';

interface DiagnosisContextType {

  history: DiagnosisResult[];

  addDiagnosis: (result: DiagnosisResult) => Promise<void>;

  clearHistory: () => Promise<void>;

  deleteDiagnosis: (id: string) => Promise<void>;

  refreshHistory: () => Promise<void>;

  isLoading: boolean;

  isSyncing: boolean;

  isOnline: boolean;

  lastSyncedAt: Date | null;

  syncError: string | null;

  clearSyncError: () => void;

  clearPendingQueue: () => Promise<void>;

  isRealtimeConnected: boolean;

  // Image-related functions
  addImageDiagnosis: (imageUri: string, analysisResult: any) => Promise<void>;
  deleteDiagnosisImage: (diagnosisId: string) => Promise<void>;
  updateDiagnosisImage: (diagnosisId: string, imageUri: string) => Promise<void>;

}

const DiagnosisContext = createContext<DiagnosisContextType | undefined>(undefined);



const STORAGE_KEY = '@poultrycure_history';

const PENDING_QUEUE_KEY = '@poultrycure_pending_queue';

const LAST_SYNC_KEY = '@poultrycure_last_sync';

// Retry configuration
const RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
};

// Exponential backoff with jitter
const exponentialBackoff = (attempt: number): number => {
  const delay = Math.min(RETRY_CONFIG.baseDelay * Math.pow(2, attempt), RETRY_CONFIG.maxDelay);
  // Add jitter to avoid thundering herd
  return delay + Math.random() * 1000;
};

// Error type detection
const isRetryableError = (error: any): boolean => {
  if (!error) return false;
  
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code;
  
  // Network errors are retryable
  if (errorMessage.includes('network') || 
      errorMessage.includes('timeout') || 
      errorMessage.includes('connection') ||
      errorCode === 'NETWORK_ERROR' ||
      errorCode === 'TIMEOUT') {
    return true;
  }
  
  // Supabase rate limit errors are retryable
  if (errorMessage.includes('rate limit') || 
      errorMessage.includes('too many requests')) {
    return true;
  }
  
  // Auth errors are not retryable
  if (errorMessage.includes('unauthorized') || 
      errorMessage.includes('authentication') ||
      errorMessage.includes('jwt')) {
    return false;
  }
  
  // Data validation errors are not retryable
  if (errorMessage.includes('invalid') || 
      errorMessage.includes('validation') ||
      errorMessage.includes('uuid')) {
    return false;
  }
  
  // Default: assume retryable for unknown errors
  return true;
};



interface PendingOperation {

  id: string;

  type: 'add' | 'delete' | 'clear';

  data?: DiagnosisResult;

  timestamp: string;

}



export const DiagnosisProvider: React.FC<{ children: ReactNode }> = ({ children }) => {

  const [history, setHistory] = useState<DiagnosisResult[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [isSyncing, setIsSyncing] = useState(false);

  const [isOnline, setIsOnline] = useState(true);

  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const [syncError, setSyncError] = useState<string | null>(null);

  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  const { user } = useAuth();

  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {

    const unsubscribe = NetInfo.addEventListener(state => {

      setIsOnline(state.isConnected ?? false);

    });



    return () => unsubscribe();

  }, []);



  useEffect(() => {

    if (user) {

      loadHistory();

    } else {

      setHistory([]);

      setIsLoading(false);

    }

  }, [user]);



  useEffect(() => {

    if (user && isOnline) {

      syncPendingOperations();

    }

  }, [user, isOnline]);



  useEffect(() => {
    if (!user || !isOnline) {
      // Disconnect if user is offline or not logged in
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
        setIsRealtimeConnected(false);
      }
      return;
    }

    // Setup real-time subscription
    const setupRealtimeSubscription = async () => {
      try {
        // Clean up existing subscription
        if (realtimeChannelRef.current) {
          supabase.removeChannel(realtimeChannelRef.current);
        }

        // Create new subscription for user's diagnoses
        const channel = supabase
          .channel('diagnoses_changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'diagnoses',
              filter: `user_id=eq.${user.id}`
            },
            (payload: any) => handleRealtimeChange(payload)
          )
          .subscribe((status: any) => {
            console.log('Realtime subscription status:', status);
            setIsRealtimeConnected(status === 'SUBSCRIBED');
          });

        realtimeChannelRef.current = channel;
        console.log('✅ Real-time subscription established for user:', user.id);
      } catch (error) {
        console.error('❌ Failed to setup real-time subscription:', error);
        setIsRealtimeConnected(false);
      }
    };

    setupRealtimeSubscription();

    // Cleanup on unmount
    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
        setIsRealtimeConnected(false);
      }
    };
  }, [user, isOnline]);



  const handleRealtimeChange = async (payload: any) => {
    console.log('🔄 Real-time change detected:', payload);

    try {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      switch (eventType) {
        case 'INSERT':
          // New diagnosis added from another device
          if (newRecord && newRecord.user_id === user?.id) {
            console.log('➕ New diagnosis added remotely:', newRecord.id);
            // Add to local history if not already present
            setHistory(prevHistory => {
              const exists = prevHistory.some(item => item.id === newRecord.id);
              if (!exists) {
                const updatedHistory = [newRecord, ...prevHistory];
                saveToLocalStorage(updatedHistory);
                return updatedHistory;
              }
              return prevHistory;
            });
          }
          break;

        case 'UPDATE':
          // Diagnosis updated from another device
          if (newRecord && newRecord.user_id === user?.id) {
            console.log('✏️ Diagnosis updated remotely:', newRecord.id);
            setHistory(prevHistory => {
              const updatedHistory = prevHistory.map(item => 
                item.id === newRecord.id ? newRecord : item
              );
              saveToLocalStorage(updatedHistory);
              return updatedHistory;
            });
          }
          break;

        case 'DELETE':
          // Diagnosis deleted from another device
          if (oldRecord && oldRecord.user_id === user?.id) {
            console.log('🗑️ Diagnosis deleted remotely:', oldRecord.id);
            setHistory(prevHistory => {
              const updatedHistory = prevHistory.filter(item => item.id !== oldRecord.id);
              saveToLocalStorage(updatedHistory);
              return updatedHistory;
            });
          }
          break;

        default:
          console.log('❓ Unknown real-time event:', eventType);
      }

      // Update last sync time
      const now = new Date();
      setLastSyncedAt(now);
      await AsyncStorage.setItem(LAST_SYNC_KEY, now.toISOString());

    } catch (error) {
      console.error('❌ Failed to handle real-time change:', error);
    }
  };



  const loadHistory = async () => {

    try {

      setIsLoading(true);



      if (isOnline && user) {

        const remoteDiagnoses = await diagnosisService.getDiagnoses();

        setHistory([...remoteDiagnoses]);

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(remoteDiagnoses));

        

        const now = new Date();

        setLastSyncedAt(now);

        await AsyncStorage.setItem(LAST_SYNC_KEY, now.toISOString());

      } else {

        const stored = await AsyncStorage.getItem(STORAGE_KEY);

        if (stored) {

          const parsed = JSON.parse(stored);

          setHistory([...parsed]);

        }



        const lastSync = await AsyncStorage.getItem(LAST_SYNC_KEY);

        if (lastSync) {

          setLastSyncedAt(new Date(lastSync));

        }

      }

    } catch (error) {

      console.error('Failed to load history:', error);

      

      const stored = await AsyncStorage.getItem(STORAGE_KEY);

      if (stored) {

        const parsed = JSON.parse(stored);

        setHistory([...parsed]);

      }

    } finally {

      setIsLoading(false);

    }

  };



  const refreshHistory = async () => {

    if (!user) return;

    console.log('refreshHistory: forcing fresh fetch from Supabase');

    await loadHistory();

  };



  const saveToLocalStorage = async (newHistory: DiagnosisResult[]) => {

    try {

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));

    } catch (error) {

      console.error('Failed to save to local storage:', error);

    }

  };



  const addToPendingQueue = async (operation: PendingOperation) => {

    try {

      const queueStr = await AsyncStorage.getItem(PENDING_QUEUE_KEY);

      const queue: PendingOperation[] = queueStr ? JSON.parse(queueStr) : [];

      queue.push(operation);

      await AsyncStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(queue));

    } catch (error) {

      console.error('Failed to add to pending queue:', error);

    }

  };



  // Retry wrapper function
  const retryOperation = async (
    operation: () => Promise<any>,
    operationType: string,
    operationId: string
  ): Promise<any | null> => {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < RETRY_CONFIG.maxAttempts; attempt++) {
      try {
        console.log(`Attempting ${operationType} operation ${operationId}, attempt ${attempt + 1}/${RETRY_CONFIG.maxAttempts}`);
        const result = await operation();
        
        if (attempt > 0) {
          console.log(`✅ ${operationType} operation ${operationId} succeeded on attempt ${attempt + 1}`);
        }
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        // Check if error is retryable
        if (!isRetryableError(lastError)) {
          console.error(`❌ ${operationType} operation ${operationId} failed with non-retryable error:`, lastError);
          return null;
        }
        
        console.error(`⚠️ ${operationType} operation ${operationId} attempt ${attempt + 1} failed:`, lastError);
        
        // If this is the last attempt, don't wait
        if (attempt === RETRY_CONFIG.maxAttempts - 1) {
          console.error(`❌ ${operationType} operation ${operationId} failed after ${RETRY_CONFIG.maxAttempts} attempts`);
          continue;
        }
        
        // Wait before retrying
        const delay = exponentialBackoff(attempt);
        console.log(`⏳ Retrying ${operationType} operation ${operationId} in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return null;
  };



  const syncPendingOperations = async () => {

    if (!user || !isOnline || isSyncing) return;

    try {
      setIsSyncing(true);
      const queueStr = await AsyncStorage.getItem(PENDING_QUEUE_KEY);
      if (!queueStr) return;

      let queue: PendingOperation[] = JSON.parse(queueStr);
      if (queue.length === 0) return;

      console.log(`🔍 Checking ${queue.length} operations for invalid UUIDs...`);
      const originalLength = queue.length;
      queue = queue.filter(operation => {
        if (operation.type === 'add' && operation.data?.id) {
          console.log(`🔍 Checking operation ID: ${operation.data.id}`);
          // Check if ID is a valid UUID format (contains hyphens and proper length)
          const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(operation.data.id);
          if (!isValidUUID) {
            console.log(`🧹 Removing invalid UUID from queue: ${operation.data.id}`);
            return false;
          }
        }
        return true;
      });

      // Update queue if we removed invalid items
      if (queue.length !== originalLength) {
        console.log(`🧹 Cleaned ${originalLength - queue.length} invalid UUIDs from pending queue`);
        if (queue.length === 0) {
          await AsyncStorage.removeItem(PENDING_QUEUE_KEY);
          await loadHistory();
          setIsSyncing(false);
          return;
        } else {
          await AsyncStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(queue));
        }
      }

      console.log(`🔄 Starting sync of ${queue.length} pending operations`);

      // Process operations with retry logic
      const successfulOperations: PendingOperation[] = [];
      const failedOperations: PendingOperation[] = [];



      for (const operation of queue) {

        let success = false;

        if (operation.type === 'add' && operation.data) {

          const result = await retryOperation(

            () => diagnosisService.upsertDiagnosis(operation.data!),

            'upsert',

            operation.id

          );

          success = result !== null;

        } else if (operation.type === 'delete') {

          const result = await retryOperation(

            () => diagnosisService.deleteDiagnosis(operation.id),

            'delete',

            operation.id

          );

          success = result !== null;

        } else if (operation.type === 'clear') {

          const result = await retryOperation(

            () => diagnosisService.clearAllDiagnoses(),

            'clear',

            operation.id

          );

          success = result !== null;

        }



        if (success) {

          successfulOperations.push(operation);

        } else {

          failedOperations.push(operation);

        }

      }



      // Update queue with only failed operations

      if (failedOperations.length === 0) {

        console.log('✅ All operations synced successfully');

        await AsyncStorage.removeItem(PENDING_QUEUE_KEY);

        setSyncError(null);

      } else {

        console.log(`⚠️ ${failedOperations.length} operations failed to sync, keeping in queue`);

        await AsyncStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(failedOperations));

        // Set sync error if there are failed operations
        const errorCount = failedOperations.length;
        setSyncError(`${errorCount} diagnosis${errorCount > 1 ? 'es' : ''} failed to sync due to invalid data`);

      }



      // Refresh history if any operations succeeded

      if (successfulOperations.length > 0) {

        await loadHistory();

      }



    } catch (error) {

      console.error('Failed to sync pending operations:', error);

    } finally {

      setIsSyncing(false);

    }

  };



  const resolveConflict = async (local: DiagnosisResult, remote: DiagnosisResult): Promise<DiagnosisResult> => {

    const localTime = new Date(local.updated_at || local.date).getTime();

    const remoteTime = new Date(remote.updated_at || remote.date).getTime();



    if (remoteTime > localTime) {

      return remote;

    } else if (localTime > remoteTime) {

      return local;

    } else {

      return remote;

    }

  };



  const addDiagnosis = async (result: DiagnosisResult) => {

    try {

      const resultWithTimestamp = {

        ...result,

        updated_at: result.updated_at || new Date().toISOString(),

      };



      const newHistory = [resultWithTimestamp, ...history];

      setHistory(newHistory);

      await saveToLocalStorage(newHistory);



      await AsyncStorage.setItem('lastDiagnosis', JSON.stringify(resultWithTimestamp));



      if (isOnline && user) {

        try {

          const savedDiagnosis = await diagnosisService.upsertDiagnosis(resultWithTimestamp);

          const updatedHistory = [savedDiagnosis, ...history];

          setHistory(updatedHistory);

          await saveToLocalStorage(updatedHistory);

          

          const now = new Date();

          setLastSyncedAt(now);

          await AsyncStorage.setItem(LAST_SYNC_KEY, now.toISOString());

        } catch (error) {

          console.error('Failed to save to Supabase, queuing for later:', error);

          await addToPendingQueue({

            id: resultWithTimestamp.id,

            type: 'add',

            data: resultWithTimestamp,

            timestamp: new Date().toISOString(),

          });

        }

      } else {

        await addToPendingQueue({

          id: resultWithTimestamp.id,

          type: 'add',

          data: resultWithTimestamp,

          timestamp: new Date().toISOString(),

        });

      }

    } catch (error) {

      console.error('Failed to add diagnosis:', error);

      throw error;

    }

  };



  const clearHistory = async () => {

    try {

      setHistory([]);

      await AsyncStorage.removeItem(STORAGE_KEY);



      if (isOnline && user) {

        try {

          await diagnosisService.clearAllDiagnoses();

          

          const now = new Date();

          setLastSyncedAt(now);

          await AsyncStorage.setItem(LAST_SYNC_KEY, now.toISOString());

        } catch (error) {

          console.error('Failed to clear from Supabase, queuing for later:', error);

          await addToPendingQueue({

            id: 'clear-all',

            type: 'clear',

            timestamp: new Date().toISOString(),

          });

        }

      } else {

        await addToPendingQueue({

          id: 'clear-all',

          type: 'clear',

          timestamp: new Date().toISOString(),

        });

      }

    } catch (error) {

      console.error('Failed to clear history:', error);

      throw error;

    }

  };



  const deleteDiagnosis = async (id: string) => {

    try {

      const newHistory = history.filter(item => item.id !== id);

      setHistory(newHistory);

      await saveToLocalStorage(newHistory);



      if (isOnline && user) {

        try {

          await diagnosisService.deleteDiagnosis(id);

          

          const now = new Date();

          setLastSyncedAt(now);

          await AsyncStorage.setItem(LAST_SYNC_KEY, now.toISOString());

        } catch (error) {

          console.error('Failed to delete from Supabase, queuing for later:', error);

          await addToPendingQueue({

            id,

            type: 'delete',

            timestamp: new Date().toISOString(),

          });

        }

      } else {

        await addToPendingQueue({

          id,

          type: 'delete',

          timestamp: new Date().toISOString(),

        });

      }

    } catch (error) {

      console.error('Failed to delete diagnosis:', error);

      throw error;

    }

  };



  const clearSyncError = () => {

    setSyncError(null);

  };



  const clearPendingQueue = async () => {

    try {

      await AsyncStorage.removeItem(PENDING_QUEUE_KEY);

      setSyncError(null);

      console.log('Pending queue cleared');

    } catch (error) {

      console.error('Failed to clear pending queue:', error);

    }
  };

  // Image-related functions
  const addImageDiagnosis = async (imageUri: string, analysisResult: any) => {
    try {
      console.log('🖼️ Adding image diagnosis...');
      
      // Upload image to Supabase first
      const { uploadDiagnosisImage } = await import('../services/imageService');
      const uploadResult = await uploadDiagnosisImage(imageUri, analysisResult.id || 'temp', user!.id);
      
      // Create a diagnosis result with image information
      const imageDiagnosis: DiagnosisResult = {
        ...analysisResult,
        type: 'image',
        imageUri,
        imageUrl: uploadResult.url,
        imagePath: uploadResult.path,
        imageMetadata: uploadResult.metadata,
        date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Use the existing addDiagnosis function
      await addDiagnosis(imageDiagnosis);
      
      console.log('✅ Image diagnosis added successfully with Supabase URL');
    } catch (error) {
      console.error('❌ Failed to add image diagnosis:', error);
      throw error;
    }
  };

  const deleteDiagnosisImage = async (diagnosisId: string) => {
    try {
      console.log('🗑️ Deleting diagnosis image...', diagnosisId);
      
      // Find the diagnosis with the image
      const diagnosis = history.find(d => d.id === diagnosisId);
      
      if (diagnosis?.imagePath) {
        // Delete image from storage
        const { deleteImage } = await import('../services/imageService');
        await deleteImage('diagnosis-images', diagnosis.imagePath);
      }
      
      // Delete the diagnosis record
      await deleteDiagnosis(diagnosisId);
      
      console.log('✅ Diagnosis image deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete diagnosis image:', error);
      throw error;
    }
  };

  const updateDiagnosisImage = async (diagnosisId: string, imageUri: string) => {
    try {
      console.log('🔄 Updating diagnosis image...', diagnosisId);
      
      // Find the existing diagnosis
      const diagnosis = history.find(d => d.id === diagnosisId);
      if (!diagnosis) {
        throw new Error('Diagnosis not found');
      }

      // Delete old image if it exists
      if (diagnosis.imagePath) {
        const { deleteImage } = await import('../services/imageService');
        await deleteImage('diagnosis-images', diagnosis.imagePath);
      }

      // Upload new image
      const { uploadDiagnosisImage } = await import('../services/imageService');
      const uploadResult = await uploadDiagnosisImage(imageUri, diagnosisId, user!.id);

      // Update diagnosis with new image information
      const updatedDiagnosis: DiagnosisResult = {
        ...diagnosis,
        imageUri,
        imageUrl: uploadResult.url,
        imagePath: uploadResult.path,
        imageMetadata: uploadResult.metadata,
        updated_at: new Date().toISOString(),
      };

      // Update in local state
      const newHistory = history.map(d => 
        d.id === diagnosisId ? updatedDiagnosis : d
      );
      setHistory(newHistory);
      await saveToLocalStorage(newHistory);

      // Update in Supabase
      if (isOnline && user) {
        await diagnosisService.upsertDiagnosis(updatedDiagnosis);
      }

      console.log('✅ Diagnosis image updated successfully');
    } catch (error) {
      console.error('❌ Failed to update diagnosis image:', error);
      throw error;
    }
  };



  return (

    <DiagnosisContext.Provider

      value={{

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

        addImageDiagnosis,
        deleteDiagnosisImage,
        updateDiagnosisImage,

      }}

    >

      {children}

    </DiagnosisContext.Provider>

  );

};



export const useDiagnosis = () => {

  const context = useContext(DiagnosisContext);

  if (context === undefined) {

    throw new Error('useDiagnosis must be used within a DiagnosisProvider');

  }

  return context;

};