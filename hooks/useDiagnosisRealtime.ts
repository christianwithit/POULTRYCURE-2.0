// hooks/useDiagnosisRealtime.ts
// Manages the Supabase real-time postgres_changes subscription for diagnoses.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { DiagnosisResult } from "../types/types";
import { LAST_SYNC_KEY, saveToLocalStorage } from "./useDiagnosisSync";

interface UseRealtimeOptions {
  userId: string | undefined;
  isOnline: boolean;
  setHistory: React.Dispatch<React.SetStateAction<DiagnosisResult[]>>;
  setLastSyncedAt: React.Dispatch<React.SetStateAction<Date | null>>;
}

/**
 * Sets up and tears down a Supabase real-time subscription for the user's
 * diagnoses table. Applies INSERT / UPDATE / DELETE changes to local state.
 */
export const useDiagnosisRealtime = ({
  userId,
  isOnline,
  setHistory,
  setLastSyncedAt,
}: UseRealtimeOptions) => {
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!userId || !isOnline) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setIsRealtimeConnected(false);
      }
      return;
    }

    const setup = async () => {
      try {
        // Clean up any existing channel first
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
          setIsRealtimeConnected(false);
        }

        // Small delay to prevent rapid reconnections
        await new Promise((resolve) => setTimeout(resolve, 500));

        const channel = supabase
          .channel(`diagnoses_changes_${userId}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "diagnoses",
              filter: `user_id=eq.${userId}`,
            },
            (payload: any) => handleChange(payload),
          )
          .subscribe((status: any) => {
            if (__DEV__) console.log("Realtime status:", status);
            setIsRealtimeConnected(status === "SUBSCRIBED");
          });

        channelRef.current = channel;
        if (__DEV__)
          console.log("✅ Realtime subscription established for user:", userId);
      } catch (error) {
        console.error("❌ Failed to setup realtime subscription:", error);
        setIsRealtimeConnected(false);
      }
    };

    setup();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setIsRealtimeConnected(false);
      }
    };
  }, [userId, isOnline]);

  const handleChange = async (payload: any) => {
    if (__DEV__) console.log("🔄 Realtime change:", payload.eventType);

    try {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      switch (eventType) {
        case "INSERT":
          if (newRecord?.user_id === userId) {
            setHistory((prev) => {
              if (prev.some((item) => item.id === newRecord.id)) return prev;
              const updated = [newRecord, ...prev];
              saveToLocalStorage(updated);
              return updated;
            });
          }
          break;

        case "UPDATE":
          if (newRecord?.user_id === userId) {
            setHistory((prev) => {
              const updated = prev.map((item) =>
                item.id === newRecord.id ? newRecord : item,
              );
              saveToLocalStorage(updated);
              return updated;
            });
          }
          break;

        case "DELETE":
          if (oldRecord?.user_id === userId) {
            setHistory((prev) => {
              const updated = prev.filter((item) => item.id !== oldRecord.id);
              saveToLocalStorage(updated);
              return updated;
            });
          }
          break;

        default:
          if (__DEV__) console.log("❓ Unknown realtime event:", eventType);
      }

      const now = new Date();
      setLastSyncedAt(now);
      await AsyncStorage.setItem(LAST_SYNC_KEY, now.toISOString());
    } catch (error) {
      console.error("❌ Failed to handle realtime change:", error);
    }
  };

  return { isRealtimeConnected };
};
