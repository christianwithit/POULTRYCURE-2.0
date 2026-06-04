import { supabase } from "../lib/supabase";
import { DiagnosisResult } from "../types/types";

// Simple UUID generator using crypto
const generateUUID = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export interface EdgeFunctionResponse<T = any> {
  success: boolean;
  data?: T;
  diagnosis?: {
    disease: string;
    confidence: number;
    severity: "low" | "medium" | "high";
    recommendations: string[];
    treatment: string;
    prevention: string;
  };
  error?: string;
  usage?: {
    requestsToday: number;
    requestsLimit: number;
    resetTime: string;
  };
}

export interface DiagnosisRequest {
  type: "text" | "image";
  input: string;
  userId: string;
  symptoms?: string[];
  imageData?: string;
}

class EdgeFunctionClient {
  private supabaseUrl: string;
  private supabaseAnonKey: string;

  constructor() {
    this.supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
    this.supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";
  }

  /**
   * Call the diagnose edge function
   */
  async diagnose(
    request: DiagnosisRequest,
  ): Promise<EdgeFunctionResponse<DiagnosisResult>> {
    try {
      console.log("🤖 Calling Edge Function for diagnosis...");

      const { data, error } = await supabase.functions.invoke("diagnose", {
        body: request,
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (error) {
        console.error("❌ Edge Function error:", error);
        return {
          success: false,
          error: error.message || "Failed to process diagnosis request",
        };
      }

      console.log("✅ Edge Function response received:", data);

      return data as EdgeFunctionResponse<DiagnosisResult>;
    } catch (error) {
      console.error("❌ Edge Function client error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Get current usage information for a user
   */
  async getUsage(userId: string): Promise<EdgeFunctionResponse> {
    try {
      const today = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("usage_tracking")
        .select("*")
        .eq("user_id", userId)
        .eq("date", today)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("❌ Error fetching usage:", error);
        return {
          success: false,
          error: "Failed to fetch usage information",
        };
      }

      const requestsToday = data?.request_count || 0;
      const requestsLimit = 50; // Free tier limit

      // Calculate reset time (next day at midnight UTC)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setUTCHours(0, 0, 0, 0);
      const resetTime = tomorrow.toISOString();

      return {
        success: true,
        data: {
          requestsToday,
          requestsLimit,
          resetTime,
        },
      };
    } catch (error) {
      console.error("❌ Usage client error:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get usage information",
      };
    }
  }

  /**
   * Get diagnosis history for analytics
   */
  async getDiagnosisHistory(
    userId: string,
    limit: number = 50,
  ): Promise<EdgeFunctionResponse> {
    try {
      const { data, error } = await supabase
        .from("diagnosis_logs")
        .select("*")
        .eq("user_id", userId)
        .order("timestamp", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("❌ Error fetching diagnosis history:", error);
        return {
          success: false,
          error: "Failed to fetch diagnosis history",
        };
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error("❌ Diagnosis history client error:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get diagnosis history",
      };
    }
  }

  /**
   * Check if user can make a request (rate limiting)
   */
  async canMakeRequest(
    userId: string,
  ): Promise<{ allowed: boolean; usage?: any }> {
    const usageResponse = await this.getUsage(userId);

    if (!usageResponse.success) {
      return { allowed: false };
    }

    const usage = usageResponse.data;
    return {
      allowed: usage.requestsToday < usage.requestsLimit,
      usage,
    };
  }

  /**
   * Fallback to client-side processing if edge function fails
   */
  async fallbackDiagnosis(
    request: DiagnosisRequest,
  ): Promise<EdgeFunctionResponse<DiagnosisResult>> {
    if (__DEV__) console.log("🔄 Using fallback client-side diagnosis...");

    try {
      // Use the active DiagnosisAPI (REST-based Gemini client)
      const { DiagnosisAPI } = await import("../services/api");

      let response;
      if (request.type === "image") {
        if (!request.imageData) {
          return {
            success: false,
            error: "Image data required for image-based diagnosis",
          };
        }
        response = await DiagnosisAPI.analyzeImage(request.imageData);
      } else {
        response = await DiagnosisAPI.analyzeSymptoms(request.input);
      }

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || "Fallback diagnosis failed",
        };
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error("❌ Fallback diagnosis error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Fallback diagnosis failed",
      };
    }
  }

  /**
   * Smart diagnosis with automatic fallback
   */
  async smartDiagnosis(
    request: DiagnosisRequest,
  ): Promise<EdgeFunctionResponse<DiagnosisResult>> {
    // First try edge function
    const edgeResult = await this.diagnose(request);

    if (edgeResult.success) {
      return edgeResult;
    }

    // If edge function fails, try fallback
    console.log("⚠️ Edge Function failed, trying fallback...");
    const fallbackResult = await this.fallbackDiagnosis(request);

    if (fallbackResult.success) {
      console.log("✅ Fallback diagnosis successful");
      return fallbackResult;
    }

    // If both fail, return error
    return {
      success: false,
      error:
        "Both edge function and fallback diagnosis failed. Please try again later.",
    };
  }

  /**
   * Health check for edge functions
   */
  async healthCheck(): Promise<EdgeFunctionResponse> {
    try {
      const { data, error } = await supabase.functions.invoke("health-check", {
        body: { timestamp: Date.now() },
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Health check failed",
      };
    }
  }
}

// Create singleton instance
export const edgeFunctionClient = new EdgeFunctionClient();

// Export convenience functions
export const diagnoseWithEdgeFunction = (request: DiagnosisRequest) =>
  edgeFunctionClient.smartDiagnosis(request);

export const getUsageInfo = (userId: string) =>
  edgeFunctionClient.getUsage(userId);

export const canMakeDiagnosisRequest = (userId: string) =>
  edgeFunctionClient.canMakeRequest(userId);

export const getDiagnosisAnalytics = (userId: string, limit?: number) =>
  edgeFunctionClient.getDiagnosisHistory(userId, limit);

export const checkEdgeFunctionHealth = () => edgeFunctionClient.healthCheck();
