// services/gemini-client.ts
import { GenerationConfig, GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import Constants from 'expo-constants';
import { DiseaseInfo } from '../types/types';

export interface GeminiConfig {
  apiKey: string;
  model: 'gemini-2.5-flash' | 'gemini-2.5-pro' | 'gemini-2.0-flash' | 'gemini-flash-latest' | 'gemini-pro-latest';
  maxTokens: number;
  temperature: number;
  timeout: number;
}

export interface GeminiResponse {
  candidates: [{
    content: {
      parts: [{ text: string }];
    };
    finishReason: string;
    safetyRatings: any[];
  }];
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export class GeminiAPIError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'GeminiAPIError';
  }
}

export class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private config: GeminiConfig;

  constructor(config?: Partial<GeminiConfig>) {
    // Load configuration from environment variables with defaults
    // Use Constants.expoConfig.extra for production builds, fallback to process.env for development
    const apiKey = Constants.expoConfig?.extra?.geminiApiKey || process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
    
    this.config = {
      apiKey,
      model: (process.env.EXPO_PUBLIC_GEMINI_MODEL as 'gemini-2.5-flash' | 'gemini-2.5-pro' | 'gemini-2.0-flash' | 'gemini-flash-latest' | 'gemini-pro-latest') || 'gemini-2.5-flash',
      maxTokens: parseInt(process.env.EXPO_PUBLIC_GEMINI_MAX_TOKENS || '2048'),
      temperature: 0.7,
      timeout: parseInt(process.env.EXPO_PUBLIC_GEMINI_TIMEOUT || '30000'),
      ...config
    };

    if (!this.config.apiKey) {
      throw new GeminiAPIError('Gemini API key is required', 'MISSING_API_KEY');
    }

    this.genAI = new GoogleGenerativeAI(this.config.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: this.config.model });
  }

  /**
   * Validate API key and connection to Gemini service
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const generationConfig: GenerationConfig = {
        temperature: 0.1,
        maxOutputTokens: 10,
        responseMimeType: "text/plain",
      };

      // Simple test request to validate API key
      await Promise.race([
        this.model.generateContent({
          contents: [{ role: "user", parts: [{ text: "Hello" }] }],
          generationConfig
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ]);

      return true;
    } catch (error: any) {
      console.error('API key validation failed:', error);
      
      if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('403')) {
        throw new GeminiAPIError('Invalid API key', 'INVALID_API_KEY');
      }
      
      if (error.message?.includes('Timeout')) {
        throw new GeminiAPIError('Connection timeout', 'TIMEOUT', true);
      }
      
      throw new GeminiAPIError('Connection failed', 'CONNECTION_ERROR', true);
    }
  }

  /**
   * Analyze symptoms with disease context
   */
  async analyzeSymptoms(symptoms: string, context: DiseaseInfo[]): Promise<GeminiResponse> {
    try {
      const prompt = this.buildSymptomsPrompt(symptoms, context);
      
      const generationConfig: GenerationConfig = {
        temperature: this.config.temperature,
        maxOutputTokens: this.config.maxTokens,
        responseMimeType: "application/json",
      };

      const result = await Promise.race([
        this.model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), this.config.timeout)
        )
      ]);

      return result as GeminiResponse;
    } catch (error: any) {
      console.error('Symptom analysis failed:', error);
      this.handleApiError(error);
      throw error; // Re-throw after handling
    }
  }

  /**
   * Analyze image with optional symptoms and disease context
   */
  async analyzeImage(imageBase64: string, symptoms?: string, context: DiseaseInfo[] = []): Promise<GeminiResponse> {
    try {
      const prompt = this.buildImagePrompt(symptoms, context);
      
      const generationConfig: GenerationConfig = {
        temperature: this.config.temperature,
        maxOutputTokens: this.config.maxTokens,
        responseMimeType: "application/json",
      };

      const parts = [
        { text: prompt },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: imageBase64
          }
        }
      ];

      const result = await Promise.race([
        this.model.generateContent({
          contents: [{ role: "user", parts }],
          generationConfig
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), this.config.timeout)
        )
      ]);

      return result as GeminiResponse;
    } catch (error: any) {
      console.error('Image analysis failed:', error);
      this.handleApiError(error);
      throw error; // Re-throw after handling
    }
  }

  /**
   * Build prompt for symptom analysis
   */
  private buildSymptomsPrompt(symptoms: string, context: DiseaseInfo[]): string {
    const contextText = context.map(disease => 
      `${disease.name}: ${disease.description}\nSymptoms: ${disease.symptoms.join(', ')}\nTreatment: ${disease.treatment}\nSeverity: ${disease.severity}`
    ).join('\n\n');

    return `You are a poultry disease diagnosis expert. Analyze the following symptoms and provide a diagnosis based on the disease database provided.

SYMPTOMS TO ANALYZE:
${symptoms}

DISEASE DATABASE CONTEXT:
${contextText}

Please respond with a JSON object in this exact format:
{
  "diagnosis": "Most likely disease name from the database",
  "confidence": 85,
  "recommendations": ["Specific actionable recommendation 1", "Specific actionable recommendation 2"],
  "treatment": "Specific treatment from database or similar",
  "severity": "low|moderate|high",
  "reasoning": "Brief explanation of why this diagnosis was chosen"
}

Focus on diseases from the provided database. If symptoms don't clearly match any disease, provide general poultry health recommendations with lower confidence.`;
  }

  /**
   * Build prompt for image analysis
   */
  private buildImagePrompt(symptoms?: string, context: DiseaseInfo[] = []): string {
    const contextText = context.map(disease => 
      `${disease.name}: ${disease.description}\nSymptoms: ${disease.symptoms.join(', ')}\nTreatment: ${disease.treatment}\nSeverity: ${disease.severity}`
    ).join('\n\n');

    const symptomsText = symptoms ? `\n\nADDITIONAL SYMPTOMS PROVIDED:\n${symptoms}` : '';

    return `You are a poultry disease diagnosis expert. Analyze the provided image of a poultry bird for signs of disease or health issues.

DISEASE DATABASE CONTEXT:
${contextText}${symptomsText}

Please examine the image for:
- Physical abnormalities or lesions
- Behavioral indicators visible in the image
- Feather condition and appearance
- Eye, beak, and comb condition
- Overall bird posture and appearance

Respond with a JSON object in this exact format:
{
  "diagnosis": "Most likely condition based on visual analysis",
  "confidence": 75,
  "recommendations": ["Specific actionable recommendation 1", "Specific actionable recommendation 2"],
  "treatment": "Recommended treatment approach",
  "severity": "low|moderate|high",
  "reasoning": "What you observed in the image that led to this diagnosis"
}

If the image quality is poor or no clear issues are visible, indicate this with lower confidence and general health recommendations.`;
  }

  /**
   * Handle API errors and convert to appropriate GeminiAPIError
   */
  private handleApiError(error: any): void {
    if (error.message?.includes('timeout') || error.message?.includes('Request timeout')) {
      throw new GeminiAPIError('Request timed out', 'TIMEOUT', true);
    }
    
    if (error.message?.includes('quota') || error.message?.includes('QUOTA_EXCEEDED')) {
      throw new GeminiAPIError('API quota exceeded', 'QUOTA_EXCEEDED', false);
    }
    
    if (error.message?.includes('rate limit') || error.message?.includes('RATE_LIMIT_EXCEEDED')) {
      throw new GeminiAPIError('Rate limit exceeded', 'RATE_LIMIT', true);
    }
    
    if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('403')) {
      throw new GeminiAPIError('Invalid API key', 'INVALID_API_KEY', false);
    }
    
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      throw new GeminiAPIError('Network error', 'NETWORK_ERROR', true);
    }
    
    // Generic API error
    throw new GeminiAPIError('API request failed', 'API_ERROR', true);
  }

  /**
   * Get current configuration
   */
  getConfig(): GeminiConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<GeminiConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Reinitialize client if API key changed
    if (newConfig.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.config.apiKey);
      this.model = this.genAI.getGenerativeModel({ model: this.config.model });
    }
  }
}