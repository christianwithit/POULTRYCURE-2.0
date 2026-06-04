// hooks/useDiagnosisSync.ts
// Handles the offline pending queue, retry logic, and sync to Supabase.

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as diagnosisService from "../services/supabase-diagnoses";
import { DiagnosisResult } from "../types/types";

export const STORAGE_KEY = "@poultrycure_history";
export const PENDING_QUEUE_KEY = "@poultrycure_pending_queue";
export const LAST_SYNC_KEY = "@poultrycure_last_sync";

export interface PendingOperation {
  id: string;
  type: "add" | "delete" | "clear";
  data?: DiagnosisResult;
  timestamp: string;
}

const RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
};

const exponentialBackoff = (attempt: number): number => {
  const delay = Math.min(
    RETRY_CONFIG.baseDelay * Math.pow(2, attempt),
    RETRY_CONFIG.maxDelay,
  );
  return delay + Math.random() * 1000;
};

const isRetryableError = (error: any): boolean => {
  if (!error) return false;
  const msg = error.message?.toLowerCase() || "";
  const code = error.code;

  if (
    msg.includes("network") ||
    msg.includes("timeout") ||
    msg.includes("connection") ||
    code === "NETWORK_ERROR" ||
    code === "TIMEOUT"
  )
    return true;

  if (msg.includes("rate limit") || msg.includes("too many requests"))
    return true;

  if (
    msg.includes("unauthorized") ||
    msg.includes("authentication") ||
    msg.includes("jwt")
  )
    return false;

  if (
    msg.includes("invalid") ||
    msg.includes("validation") ||
    msg.includes("uuid")
  )
    return false;

  return true;
};

const VALID_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Save history array to AsyncStorage */
export const saveToLocalStorage = async (
  history: DiagnosisResult[],
): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error("Failed to save history to local storage:", error);
  }
};

/** Append a pending operation to the offline queue */
export const addToPendingQueue = async (
  operation: PendingOperation,
): Promise<void> => {
  try {
    const queueStr = await AsyncStorage.getItem(PENDING_QUEUE_KEY);
    const queue: PendingOperation[] = queueStr ? JSON.parse(queueStr) : [];
    queue.push(operation);
    await AsyncStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error("Failed to add to pending queue:", error);
  }
};

/** Retry a single Supabase operation with exponential backoff */
const retryOperation = async (
  operation: () => Promise<any>,
  operationType: string,
  operationId: string,
): Promise<any | null> => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < RETRY_CONFIG.maxAttempts; attempt++) {
    try {
      if (__DEV__) {
        console.log(
          `Attempting ${operationType} [${operationId}] attempt ${attempt + 1}/${RETRY_CONFIG.maxAttempts}`,
        );
      }
      const result = await operation();
      if (__DEV__ && attempt > 0) {
        console.log(
          `✅ ${operationType} [${operationId}] succeeded on attempt ${attempt + 1}`,
        );
      }
      return result;
    } catch (error) {
      lastError = error as Error;

      if (!isRetryableError(lastError)) {
        if (__DEV__)
          console.error(
            `❌ ${operationType} [${operationId}] non-retryable:`,
            lastError.message,
          );
        return null;
      }

      if (__DEV__)
        console.warn(
          `⚠️ ${operationType} [${operationId}] attempt ${attempt + 1} failed:`,
          lastError.message,
        );

      if (attempt < RETRY_CONFIG.maxAttempts - 1) {
        const delay = exponentialBackoff(attempt);
        if (__DEV__) console.log(`⏳ Retrying in ${Math.round(delay)}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  if (__DEV__)
    console.error(
      `❌ ${operationType} [${operationId}] failed after ${RETRY_CONFIG.maxAttempts} attempts`,
    );
  return null;
};

export interface SyncResult {
  syncError: string | null;
  lastSyncedAt: Date | null;
  shouldRefreshHistory: boolean;
}

/**
 * Process the pending offline queue — strips invalid UUIDs, retries each
 * operation against Supabase, and returns the outcome.
 */
export const processPendingQueue = async (
  isSyncing: boolean,
): Promise<SyncResult | null> => {
  if (isSyncing) return null;

  try {
    const queueStr = await AsyncStorage.getItem(PENDING_QUEUE_KEY);
    if (!queueStr) return null;

    let queue: PendingOperation[] = JSON.parse(queueStr);
    if (queue.length === 0) return null;

    // Strip invalid UUIDs
    const originalLength = queue.length;
    queue = queue.filter((op) => {
      if (op.type === "add" && op.data?.id) {
        const valid = VALID_UUID.test(op.data.id);
        if (__DEV__ && !valid)
          console.log(`🧹 Removing invalid UUID: ${op.data.id}`);
        return valid;
      }
      return true;
    });

    if (__DEV__ && queue.length !== originalLength) {
      console.log(`🧹 Cleaned ${originalLength - queue.length} invalid UUIDs`);
    }

    if (queue.length === 0) {
      await AsyncStorage.removeItem(PENDING_QUEUE_KEY);
      return {
        syncError: null,
        lastSyncedAt: new Date(),
        shouldRefreshHistory: true,
      };
    }

    await AsyncStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(queue));

    if (__DEV__) console.log(`🔄 Syncing ${queue.length} pending operations`);

    const successful: PendingOperation[] = [];
    const failed: PendingOperation[] = [];

    for (const op of queue) {
      let result: any = null;

      if (op.type === "add" && op.data) {
        result = await retryOperation(
          () => diagnosisService.upsertDiagnosis(op.data!),
          "upsert",
          op.id,
        );
      } else if (op.type === "delete") {
        result = await retryOperation(
          () => diagnosisService.deleteDiagnosis(op.id),
          "delete",
          op.id,
        );
      } else if (op.type === "clear") {
        result = await retryOperation(
          () => diagnosisService.clearAllDiagnoses(),
          "clear",
          op.id,
        );
      }

      if (result !== null) {
        successful.push(op);
      } else {
        failed.push(op);
      }
    }

    if (failed.length === 0) {
      if (__DEV__) console.log("✅ All pending operations synced");
      await AsyncStorage.removeItem(PENDING_QUEUE_KEY);
      return {
        syncError: null,
        lastSyncedAt: new Date(),
        shouldRefreshHistory: successful.length > 0,
      };
    }

    await AsyncStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(failed));
    const errorCount = failed.length;
    return {
      syncError: `${errorCount} diagnosis${errorCount > 1 ? "es" : ""} failed to sync`,
      lastSyncedAt: successful.length > 0 ? new Date() : null,
      shouldRefreshHistory: successful.length > 0,
    };
  } catch (error) {
    console.error("Failed to sync pending operations:", error);
    return null;
  }
};
