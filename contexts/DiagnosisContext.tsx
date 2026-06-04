// contexts/DiagnosisContext.tsx
// Thin coordinator — delegates sync and realtime concerns to dedicated hooks.

import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import React, {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";
import { useDiagnosisRealtime } from "../hooks/useDiagnosisRealtime";
import {
    addToPendingQueue,
    LAST_SYNC_KEY,
    processPendingQueue,
    saveToLocalStorage,
    STORAGE_KEY
} from "../hooks/useDiagnosisSync";
import { notificationService } from "../services/notificationService";
import * as diagnosisService from "../services/supabase-diagnoses";
import { DiagnosisResult } from "../types/types";
import {
    canMakeDiagnosisRequest,
    getUsageInfo,
} from "../utils/edgeFunctionClient";
import { useAuth } from "./AuthContext";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
  addImageDiagnosis: (imageUri: string, analysisResult: any) => Promise<void>;
  deleteDiagnosisImage: (diagnosisId: string) => Promise<void>;
  updateDiagnosisImage: (
    diagnosisId: string,
    imageUri: string,
  ) => Promise<void>;
  diagnoseWithEdgeFunction: (
    type: "text" | "image",
    input: string,
    symptoms?: string[],
    imageData?: string,
  ) => Promise<any>;
  getUsageInfo: () => Promise<any>;
  canMakeDiagnosisRequest: () => Promise<{ allowed: boolean; usage?: any }>;
}

const DiagnosisContext = createContext<DiagnosisContextType | undefined>(
  undefined,
);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export const DiagnosisProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [history, setHistory] = useState<DiagnosisResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const { user } = useAuth();

  // Real-time subscription (delegated to hook)
  const { isRealtimeConnected } = useDiagnosisRealtime({
    userId: user?.id,
    isOnline,
    setHistory,
    setLastSyncedAt,
  });

  // Network monitoring
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
    });
    return () => unsubscribe();
  }, []);

  // Load history on auth change
  useEffect(() => {
    if (user) {
      loadHistory();
    } else {
      setHistory([]);
      setIsLoading(false);
    }
  }, [user]);

  // Sync pending queue when connectivity is restored
  useEffect(() => {
    if (user && isOnline) {
      syncPending();
    }
  }, [user, isOnline]);

  // -------------------------------------------------------------------------
  // History loading
  // -------------------------------------------------------------------------

  const loadHistory = async () => {
    try {
      setIsLoading(true);

      if (isOnline && user) {
        const remoteDiagnoses = await diagnosisService.getDiagnoses();
        setHistory([...remoteDiagnoses]);
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(remoteDiagnoses),
        );

        const now = new Date();
        setLastSyncedAt(now);
        await AsyncStorage.setItem(LAST_SYNC_KEY, now.toISOString());
      } else {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) setHistory([...JSON.parse(stored)]);

        const lastSync = await AsyncStorage.getItem(LAST_SYNC_KEY);
        if (lastSync) setLastSyncedAt(new Date(lastSync));
      }
    } catch (error) {
      console.error("Failed to load history:", error);
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) setHistory([...JSON.parse(stored)]);
      } catch {
        // ignore secondary failure
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refreshHistory = async () => {
    if (!user) return;
    if (__DEV__)
      console.log("refreshHistory: forcing fresh fetch from Supabase");
    await loadHistory();
  };

  // -------------------------------------------------------------------------
  // Pending queue sync (delegated to useDiagnosisSync)
  // -------------------------------------------------------------------------

  const syncPending = async () => {
    if (!user || !isOnline || isSyncing) return;
    setIsSyncing(true);
    try {
      const result = await processPendingQueue(false);
      if (result) {
        if (result.syncError) setSyncError(result.syncError);
        else setSyncError(null);

        if (result.lastSyncedAt) setLastSyncedAt(result.lastSyncedAt);
        if (result.shouldRefreshHistory) await loadHistory();
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // -------------------------------------------------------------------------
  // CRUD operations
  // -------------------------------------------------------------------------

  const addDiagnosis = async (result: DiagnosisResult) => {
    try {
      const entry = {
        ...result,
        updated_at: result.updated_at || new Date().toISOString(),
      };

      // Optimistic update
      const optimistic = [entry, ...history];
      setHistory(optimistic);
      await saveToLocalStorage(optimistic);
      await AsyncStorage.setItem("lastDiagnosis", JSON.stringify(entry));

      if (isOnline && user) {
        try {
          const saved = await diagnosisService.upsertDiagnosis(entry);
          const confirmed = [saved, ...history];
          setHistory(confirmed);
          await saveToLocalStorage(confirmed);

          const now = new Date();
          setLastSyncedAt(now);
          await AsyncStorage.setItem(LAST_SYNC_KEY, now.toISOString());
        } catch (error) {
          console.error(
            "Failed to save to Supabase, queuing for later:",
            error,
          );
          await addToPendingQueue({
            id: entry.id,
            type: "add",
            data: entry,
            timestamp: new Date().toISOString(),
          });
        }
      } else {
        await addToPendingQueue({
          id: entry.id,
          type: "add",
          data: entry,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Failed to add diagnosis:", error);
      throw error;
    } finally {
      try {
        await notificationService.sendLocalNotification({
          type: "diagnosis_complete",
          title: "Diagnosis Complete",
          body: `Your ${result.type === "image" ? "image" : "symptom"} analysis is ready.`,
          data: { diagnosisId: result.id, type: result.type },
        });
      } catch {
        // Non-critical — don't surface notification errors
      }
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
          console.error(
            "Failed to clear from Supabase, queuing for later:",
            error,
          );
          await addToPendingQueue({
            id: "clear-all",
            type: "clear",
            timestamp: new Date().toISOString(),
          });
        }
      } else {
        await addToPendingQueue({
          id: "clear-all",
          type: "clear",
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Failed to clear history:", error);
      throw error;
    }
  };

  const deleteDiagnosis = async (id: string) => {
    try {
      const updated = history.filter((item) => item.id !== id);
      setHistory(updated);
      await saveToLocalStorage(updated);

      if (isOnline && user) {
        try {
          await diagnosisService.deleteDiagnosis(id);
          const now = new Date();
          setLastSyncedAt(now);
          await AsyncStorage.setItem(LAST_SYNC_KEY, now.toISOString());
        } catch (error) {
          console.error(
            "Failed to delete from Supabase, queuing for later:",
            error,
          );
          await addToPendingQueue({
            id,
            type: "delete",
            timestamp: new Date().toISOString(),
          });
        }
      } else {
        await addToPendingQueue({
          id,
          type: "delete",
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Failed to delete diagnosis:", error);
      throw error;
    }
  };

  const clearSyncError = () => setSyncError(null);

  const clearPendingQueue = async () => {
    try {
      await AsyncStorage.removeItem("@poultrycure_pending_queue");
      setSyncError(null);
      if (__DEV__) console.log("Pending queue cleared");
    } catch (error) {
      console.error("Failed to clear pending queue:", error);
    }
  };

  // -------------------------------------------------------------------------
  // Image operations
  // -------------------------------------------------------------------------

  const addImageDiagnosis = async (imageUri: string, analysisResult: any) => {
    try {
      const { uploadDiagnosisImage } = await import("../services/imageService");
      const uploadResult = await uploadDiagnosisImage(
        imageUri,
        analysisResult.id || "temp",
        user!.id,
      );

      const imageDiagnosis: DiagnosisResult = {
        ...analysisResult,
        type: "image",
        imageUri,
        imageUrl: uploadResult.url,
        imagePath: uploadResult.path,
        imageMetadata: uploadResult.metadata,
        date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await addDiagnosis(imageDiagnosis);
    } catch (error) {
      console.error("❌ Failed to add image diagnosis:", error);
      throw error;
    }
  };

  const deleteDiagnosisImage = async (diagnosisId: string) => {
    try {
      const diagnosis = history.find((d) => d.id === diagnosisId);
      if (diagnosis?.imagePath) {
        const { deleteImage } = await import("../services/imageService");
        await deleteImage("diagnosis-images", diagnosis.imagePath);
      }
      await deleteDiagnosis(diagnosisId);
    } catch (error) {
      console.error("❌ Failed to delete diagnosis image:", error);
      throw error;
    }
  };

  const updateDiagnosisImage = async (
    diagnosisId: string,
    imageUri: string,
  ) => {
    try {
      const diagnosis = history.find((d) => d.id === diagnosisId);
      if (!diagnosis) throw new Error("Diagnosis not found");

      if (diagnosis.imagePath) {
        const { deleteImage } = await import("../services/imageService");
        await deleteImage("diagnosis-images", diagnosis.imagePath);
      }

      const { uploadDiagnosisImage } = await import("../services/imageService");
      const uploadResult = await uploadDiagnosisImage(
        imageUri,
        diagnosisId,
        user!.id,
      );

      const updated: DiagnosisResult = {
        ...diagnosis,
        imageUri,
        imageUrl: uploadResult.url,
        imagePath: uploadResult.path,
        imageMetadata: uploadResult.metadata,
        updated_at: new Date().toISOString(),
      };

      const newHistory = history.map((d) =>
        d.id === diagnosisId ? updated : d,
      );
      setHistory(newHistory);
      await saveToLocalStorage(newHistory);

      if (isOnline && user) {
        await diagnosisService.upsertDiagnosis(updated);
      }
    } catch (error) {
      console.error("❌ Failed to update diagnosis image:", error);
      throw error;
    }
  };

  // -------------------------------------------------------------------------
  // Edge function stubs (disabled — kept for interface compatibility)
  // -------------------------------------------------------------------------

  const diagnoseWithEdgeFunctionMethod = async (
    _type: "text" | "image",
    _input: string,
    _symptoms?: string[],
    _imageData?: string,
  ) => {
    throw new Error(
      "Edge Functions disabled - use client-side diagnosis instead",
    );
  };

  const getUsageInfoMethod = async () => {
    if (!user) throw new Error("User not authenticated");
    return getUsageInfo(user.id);
  };

  const canMakeDiagnosisRequestMethod = async () => {
    if (!user) return { allowed: false };
    try {
      return await canMakeDiagnosisRequest(user.id);
    } catch {
      return { allowed: false };
    }
  };

  // -------------------------------------------------------------------------
  // Provider render
  // -------------------------------------------------------------------------

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
        diagnoseWithEdgeFunction: diagnoseWithEdgeFunctionMethod,
        getUsageInfo: getUsageInfoMethod,
        canMakeDiagnosisRequest: canMakeDiagnosisRequestMethod,
      }}
    >
      {children}
    </DiagnosisContext.Provider>
  );
};

export const useDiagnosis = () => {
  const context = useContext(DiagnosisContext);
  if (context === undefined) {
    throw new Error("useDiagnosis must be used within a DiagnosisProvider");
  }
  return context;
};
