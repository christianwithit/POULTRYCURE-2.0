// services/api.ts
import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';
import { matchDisease } from '../data/disease';
import { ApiResponse, DiagnosisResult } from '../types/types';

// Generate UUID v4 for Supabase compatibility
const generateUUID = (): string => {
  const bytes = Crypto.getRandomBytes(16);
  const hex = Array.from(bytes)
    .map((b: number, i: number) => {
      // Set version (4) and variant bits
      const hexByte = b.toString(16).padStart(2, '0');
      if (i === 6) return (parseInt(hexByte, 16) & 0x0f | 0x40).toString(16).padStart(2, '0');
      if (i === 8) return (parseInt(hexByte, 16) & 0x3f | 0x80).toString(16).padStart(2, '0');
      return hexByte;
    })
    .join('');
  
  return [
    hex.substring(0, 8),
    hex.substring(8, 12),
    hex.substring(12, 16),
    hex.substring(16, 20),
    hex.substring(20, 32)
  ].join('-');
};

// API key validation and security
// Use Constants.expoConfig.extra for production builds, fallback to process.env for development
const GEMINI_API_KEY = Constants.expoConfig?.extra?.geminiApiKey || process.env.EXPO_PUBLIC_GEMINI_API_KEY;

// Log API key status (safe for production - doesn't expose key)
console.log('=== API KEY DEBUG ===');
console.log('Constants.expoConfig exists:', !!Constants.expoConfig);
console.log('Constants.expoConfig.extra exists:', !!Constants.expoConfig?.extra);
console.log('geminiApiKey from extra:', Constants.expoConfig?.extra?.geminiApiKey ? 'FOUND' : 'NOT FOUND');
console.log('process.env key:', process.env.EXPO_PUBLIC_GEMINI_API_KEY ? 'FOUND' : 'NOT FOUND');
console.log('Final GEMINI_API_KEY:', GEMINI_API_KEY ? 'YES' : 'NO');
if (GEMINI_API_KEY) {
  console.log('First 10 chars:', GEMINI_API_KEY.substring(0, 10));
  console.log('Key length:', GEMINI_API_KEY.length);
}
console.log('===================');

// Validate API key format
if (GEMINI_API_KEY && !GEMINI_API_KEY.startsWith('AIza')) {
  console.warn('⚠️ API key format appears invalid - should start with "AIza"');
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://your-api.com';
const API_KEY = process.env.EXPO_PUBLIC_API_KEY || '';

export class DiagnosisAPI {
  /**
   * Validate API configuration on startup
   */
  static validateConfiguration(): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if API key exists
    if (!GEMINI_API_KEY) {
      errors.push('EXPO_PUBLIC_GEMINI_API_KEY is not set in environment variables');
    } else {
      // Check API key format
      if (!GEMINI_API_KEY.startsWith('AIza')) {
        warnings.push('API key format appears invalid - should start with "AIza"');
      }
      
      // Check API key length (typical Google API keys are 39 characters)
      if (GEMINI_API_KEY.length < 30) {
        warnings.push('API key appears too short - may be incomplete');
      }
    }

    // Check model configuration
    const model = process.env.EXPO_PUBLIC_GEMINI_MODEL;
    if (model && !['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-flash-latest', 'gemini-pro-latest'].includes(model)) {
      warnings.push(`Configured model "${model}" may not be supported`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
  /**
   * Analyze symptoms using Gemini AI with fallback to local analysis
   */
  static async analyzeSymptoms(symptoms: string): Promise<ApiResponse<DiagnosisResult>> {
    // Check if fallback mode is forced
    if (this.forceFallback) {
      console.log('Using forced fallback mode');
      return this.localSymptomAnalysis(symptoms);
    }

    try {
      // First try Gemini API using REST API v1 approach
      const prompt = `You are a poultry disease diagnosis expert. Analyze these symptoms: "${symptoms}". 
      
      Respond with ONLY valid JSON in this exact format (no markdown, no code blocks):
      {
        "diagnosis": "Disease name",
        "confidence": 85,
        "recommendations": ["recommendation 1", "recommendation 2"],
        "treatment": "treatment details",
        "severity": "low|moderate|high"
      }`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }]
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        // Log error without exposing sensitive information
        console.error('Gemini API Error:', {
          status: response.status,
          error: errorData.error?.message || 'Unknown error'
        });
        
        // Provide user-friendly error messages without exposing API details
        let userMessage = 'AI analysis temporarily unavailable';
        if (response.status === 403) {
          userMessage = 'API authentication failed - please check configuration';
        } else if (response.status === 429) {
          userMessage = 'API rate limit exceeded - please try again later';
        } else if (response.status >= 500) {
          userMessage = 'AI service temporarily unavailable - please try again later';
        }
        
        throw new Error(userMessage);
      }

      const data = await response.json();
      if (__DEV__) {
        console.log('Gemini API Response received successfully');
      }

      // Parse the response - handle markdown code blocks
      let responseText = data.candidates[0].content.parts[0].text;
      
      // Remove markdown code blocks if present
      if (responseText.includes('```json')) {
        responseText = responseText.replace(/```json\s*/, '').replace(/```\s*$/, '');
      } else if (responseText.includes('```')) {
        responseText = responseText.replace(/```\s*/, '').replace(/```\s*$/, '');
      }
      
      const aiResult = JSON.parse(responseText.trim());
      
      return {
        success: true,
        data: {
          id: generateUUID(),
          type: 'symptom',
          input: symptoms,
          diagnosis: aiResult.diagnosis,
          confidence: aiResult.confidence,
          recommendations: aiResult.recommendations,
          treatment: aiResult.treatment,
          severity: aiResult.severity,
          date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };

    } catch (error: any) {
      console.error('Full error:', JSON.stringify(error, null, 2));
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      console.log('Falling back to local diagnosis...');
      return this.localSymptomAnalysis(symptoms);
    }
  }

  /**
   * Analyze image using Gemini AI with multimodal capabilities
   */
  static async analyzeImage(imageUri: string): Promise<ApiResponse<DiagnosisResult>> {
    // Check if fallback mode is forced
    if (this.forceFallback) {
      console.log('Using forced fallback mode for image analysis');
      return {
        success: true,
        data: {
          id: generateUUID(),
          type: 'image',
          input: 'Image analysis (forced fallback)',
          diagnosis: 'Image Analysis Unavailable (Fallback Mode)',
          confidence: 0,
          recommendations: [
            'Fallback mode is enabled - AI analysis disabled',
            'Please try symptom-based diagnosis instead',
            'Or consult with a veterinarian for visual examination'
          ],
          severity: 'low',
          date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          imageUri
        }
      };
    }

    try {
      // Convert image to base64
      const imageBase64 = await this.convertImageToBase64(imageUri);
      
      const prompt = `You are a poultry disease diagnosis expert. Analyze this image of a poultry bird for signs of disease or health issues.

      Please examine the image for:
      - Physical abnormalities or lesions
      - Behavioral indicators visible in the image
      - Feather condition and appearance
      - Eye, beak, and comb condition
      - Overall bird posture and appearance

      Respond with ONLY valid JSON in this exact format (no markdown, no code blocks):
      {
        "diagnosis": "Most likely condition based on visual analysis",
        "confidence": 75,
        "recommendations": ["recommendation 1", "recommendation 2"],
        "treatment": "Recommended treatment approach",
        "severity": "low|moderate|high",
        "reasoning": "What you observed in the image that led to this diagnosis"
      }`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: imageBase64
                  }
                }
              ]
            }]
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        // Log error without exposing sensitive information
        console.error('Gemini Image API Error:', {
          status: response.status,
          error: errorData.error?.message || 'Unknown error'
        });
        
        // Provide user-friendly error messages
        let userMessage = 'Image analysis temporarily unavailable';
        if (response.status === 403) {
          userMessage = 'API authentication failed - please check configuration';
        } else if (response.status === 429) {
          userMessage = 'API rate limit exceeded - please try again later';
        } else if (response.status >= 500) {
          userMessage = 'Image analysis service temporarily unavailable';
        }
        
        throw new Error(userMessage);
      }

      const data = await response.json();
      if (__DEV__) {
        console.log('Gemini Image Analysis Response received successfully');
      }

      // Parse the response - handle markdown code blocks
      let responseText = data.candidates[0].content.parts[0].text;
      
      // Remove markdown code blocks if present
      if (responseText.includes('```json')) {
        responseText = responseText.replace(/```json\s*/, '').replace(/```\s*$/, '');
      } else if (responseText.includes('```')) {
        responseText = responseText.replace(/```\s*/, '').replace(/```\s*$/, '');
      }
      
      const aiResult = JSON.parse(responseText.trim());
      
      return {
        success: true,
        data: {
          id: generateUUID(),
          type: 'image',
          input: 'Image analysis',
          diagnosis: aiResult.diagnosis,
          confidence: aiResult.confidence,
          recommendations: aiResult.recommendations,
          treatment: aiResult.treatment,
          severity: aiResult.severity,
          date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          imageUri
        }
      };

    } catch (error: any) {
      console.error('Full error:', JSON.stringify(error, null, 2));
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      console.log('Falling back to local diagnosis...');
      return {
        success: true,
        data: {
          id: generateUUID(),
          type: 'image',
          input: 'Image analysis (fallback)',
          diagnosis: 'Image Analysis Unavailable',
          confidence: 0,
          recommendations: [
            'Image analysis service is currently unavailable',
            'Please try symptom-based diagnosis instead',
            'Or consult with a veterinarian for visual examination'
          ],
          severity: 'low',
          date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          imageUri
        }
      };
    }
  }

  /**
   * Convert image URI to base64 for API transmission
   */
  private static async convertImageToBase64(imageUri: string): Promise<string> {
    try {
      // For React Native, we'll need to use fetch to get the image data
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          // Remove the data:image/jpeg;base64, prefix
          const base64 = base64data.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Image conversion error:', error);
      throw new Error('Failed to convert image to base64');
    }
  }

  /**
   * Local symptom analysis fallback method
   */
  private static async localSymptomAnalysis(symptoms: string): Promise<ApiResponse<DiagnosisResult>> {
    const matches = matchDisease(symptoms);

    if (matches.length === 0) {
      return {
        success: true,
        data: {
          id: generateUUID(),
          type: 'symptom',
          input: symptoms,
          diagnosis: 'No Specific Disease Identified (Local Analysis)',
          confidence: 0,
          recommendations: [
            'Monitor bird closely for 24-48 hours',
            'Ensure proper nutrition and clean water',
            'Isolate bird if symptoms worsen',
            'Consult with a veterinarian if concerned'
          ],
          severity: 'low',
          date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };
    }

    const topMatch = matches[0];
    
    return {
      success: true,
      data: {
        id: generateUUID(),
        type: 'symptom',
        input: symptoms,
        diagnosis: `${topMatch.disease} (Local Analysis)`,
        confidence: topMatch.confidence,
        recommendations: this.generateRecommendations(topMatch.info),
        treatment: topMatch.info.treatment,
        prevention: topMatch.info.prevention,
        severity: topMatch.info.severity,
        date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };
  }

  /**
   * Generate actionable recommendations based on disease info
   */
  private static generateRecommendations(diseaseInfo: any): string[] {
    const recommendations = [
      `Immediate isolation of affected bird(s)`,
      `Treatment: ${diseaseInfo.treatment}`,
      `Consult a veterinarian for proper diagnosis`,
    ];

    if (diseaseInfo.severity === 'high') {
      recommendations.unshift('⚠️ HIGH SEVERITY - Seek immediate veterinary attention');
      recommendations.push('Monitor entire flock closely');
      recommendations.push('Consider testing and culling if necessary');
    }

    return recommendations;
  }

  /**
   * Test Gemini API connection with detailed logging
   */
  static async testConnection(): Promise<void> {
    console.log('Testing Gemini API...');
    console.log('API Key exists:', !!GEMINI_API_KEY);
    
    // Only show API key preview in development
    if (__DEV__) {
      console.log('API Key preview:', GEMINI_API_KEY?.substring(0, 15) + '...');
    }
    
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Hello' }] }]
          }),
        }
      );
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API Connection successful!');
        if (__DEV__) {
          console.log('Response text:', data.candidates?.[0]?.content?.parts?.[0]?.text);
        }
      } else {
        const data = await response.json();
        console.log('❌ API Error:', {
          status: response.status,
          message: data.error?.message || 'Unknown error'
        });
      }
    } catch (error: any) {
      console.error('❌ Connection failed:', error.message);
    }
  }

  /**
   * Check API health/connectivity
   */
  static async checkConnection(): Promise<boolean> {
    try {
      // Simple connection test using direct fetch
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Hello' }] }]
          }),
        }
      );
      return response.ok;
    } catch (error: any) {
      console.error('Connection check failed:', error);
      return false;
    }
  }

  /**
   * Get current API status
   */
  static async getApiStatus(): Promise<{
    available: boolean;
    model: string;
    lastChecked: string;
    error?: string;
  }> {
    try {
      const isAvailable = await this.checkConnection();
      return {
        available: isAvailable,
        model: process.env.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-2.5-flash',
        lastChecked: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        available: false,
        model: process.env.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-2.5-flash',
        lastChecked: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Force fallback mode for testing or when API is known to be unavailable
   */
  private static forceFallback = false;

  static toggleFallbackMode(enabled: boolean): void {
    this.forceFallback = enabled;
    console.log(`Fallback mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  static isFallbackMode(): boolean {
    return this.forceFallback;
  }
}