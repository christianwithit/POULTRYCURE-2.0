import { Alert, Share } from 'react-native';
import { ExtendedDiseaseInfo } from '../types/types';

export interface ShareOptions {
  includePersonalNote?: boolean;
  personalNote?: string;
  shareFormat?: 'basic' | 'detailed' | 'summary';
  includeDisclaimer?: boolean;
}

export interface ShareableLink {
  url: string;
  shortUrl?: string;
  expiresAt?: Date;
}

export class ShareService {
  private static instance: ShareService;
  private baseUrl = 'https://poultrycure.app'; // In production, this would be the actual app URL

  private constructor() {}

  public static getInstance(): ShareService {
    if (!ShareService.instance) {
      ShareService.instance = new ShareService();
    }
    return ShareService.instance;
  }

  /**
   * Share disease information with customizable options
   */
  public async shareDiseaseInfo(
    disease: ExtendedDiseaseInfo,
    options: ShareOptions = {}
  ): Promise<boolean> {
    try {
      const {
        includePersonalNote = false,
        personalNote = '',
        shareFormat = 'basic',
        includeDisclaimer = true
      } = options;

      const shareContent = this.formatDiseaseContent(disease, shareFormat, includePersonalNote, personalNote);
      const disclaimer = includeDisclaimer ? this.getVeterinaryDisclaimer() : '';
      
      const fullContent = `${shareContent}${disclaimer ? '\n\n' + disclaimer : ''}`;

      const result = await Share.share({
        message: fullContent,
        title: `${disease.name} - Disease Information`,
        url: this.generateDiseaseUrl(disease.id), // For platforms that support URL sharing
      });

      // Track sharing analytics (in a real app, you'd send this to your analytics service)
      this.trackShareEvent(disease.id, shareFormat, result.action);

      return result.action === Share.sharedAction;
    } catch (error) {
      console.error('Error sharing disease information:', error);
      Alert.alert('Share Error', 'Unable to share disease information. Please try again.');
      return false;
    }
  }

  /**
   * Generate a shareable link for a specific disease
   */
  public generateShareableLink(diseaseId: string): ShareableLink {
    const url = this.generateDiseaseUrl(diseaseId);
    
    // In a real app, you might generate a short URL through a service like bit.ly
    // For now, we'll just return the full URL
    return {
      url,
      shortUrl: url, // In production, this would be a shortened version
      expiresAt: undefined // Links don't expire in this implementation
    };
  }

  /**
   * Share disease information via specific platform
   */
  public async shareToSpecificPlatform(
    disease: ExtendedDiseaseInfo,
    platform: 'email' | 'sms' | 'social',
    options: ShareOptions = {}
  ): Promise<boolean> {
    try {
      const shareableLink = this.generateShareableLink(disease.id);
      let content = '';

      switch (platform) {
        case 'email':
          content = this.formatForEmail(disease, shareableLink, options);
          break;
        case 'sms':
          content = this.formatForSMS(disease, shareableLink, options);
          break;
        case 'social':
          content = this.formatForSocial(disease, shareableLink, options);
          break;
      }

      const result = await Share.share({
        message: content,
        title: `${disease.name} - Disease Information`,
        url: shareableLink.url,
      });

      this.trackShareEvent(disease.id, platform, result.action);
      return result.action === Share.sharedAction;
    } catch (error) {
      console.error(`Error sharing to ${platform}:`, error);
      Alert.alert('Share Error', `Unable to share to ${platform}. Please try again.`);
      return false;
    }
  }

  /**
   * Share multiple diseases as a comparison or reference
   */
  public async shareMultipleDiseases(
    diseases: ExtendedDiseaseInfo[],
    options: ShareOptions = {}
  ): Promise<boolean> {
    try {
      if (diseases.length === 0) {
        Alert.alert('No Diseases', 'Please select at least one disease to share.');
        return false;
      }

      const content = this.formatMultipleDiseases(diseases, options);
      const disclaimer = options.includeDisclaimer !== false ? this.getVeterinaryDisclaimer() : '';
      
      const fullContent = `${content}${disclaimer ? '\n\n' + disclaimer : ''}`;

      const result = await Share.share({
        message: fullContent,
        title: `Poultry Disease Reference - ${diseases.length} Diseases`,
      });

      // Track multiple disease sharing
      diseases.forEach(disease => {
        this.trackShareEvent(disease.id, 'multiple', result.action);
      });

      return result.action === Share.sharedAction;
    } catch (error) {
      console.error('Error sharing multiple diseases:', error);
      Alert.alert('Share Error', 'Unable to share disease information. Please try again.');
      return false;
    }
  }

  /**
   * Format disease content based on the specified format
   */
  private formatDiseaseContent(
    disease: ExtendedDiseaseInfo,
    format: 'basic' | 'detailed' | 'summary',
    includePersonalNote: boolean,
    personalNote: string
  ): string {
    let content = '';

    // Add personal note if provided
    if (includePersonalNote && personalNote.trim()) {
      content += `📝 Personal Note: ${personalNote.trim()}\n\n`;
    }

    switch (format) {
      case 'summary':
        content += this.formatSummaryContent(disease);
        break;
      case 'detailed':
        content += this.formatDetailedContent(disease);
        break;
      case 'basic':
      default:
        content += this.formatBasicContent(disease);
        break;
    }

    return content;
  }

  /**
   * Format basic disease information
   */
  private formatBasicContent(disease: ExtendedDiseaseInfo): string {
    return `🦆 ${disease.name}

📋 Description: ${disease.description}

🔍 Category: ${disease.category.charAt(0).toUpperCase() + disease.category.slice(1)}
⚠️ Severity: ${disease.severity.charAt(0).toUpperCase() + disease.severity.slice(1)}
🐓 Affects: ${disease.commonIn.join(', ')}

🩺 Key Symptoms:
${disease.symptoms.slice(0, 5).map(symptom => `• ${symptom}`).join('\n')}

💊 Treatment: ${disease.treatment}

🛡️ Prevention: ${disease.prevention}`;
  }

  /**
   * Format detailed disease information
   */
  private formatDetailedContent(disease: ExtendedDiseaseInfo): string {
    let content = this.formatBasicContent(disease);

    // Add additional detailed information
    content += `\n\n📊 Additional Information:
• Incubation Period: ${disease.incubationPeriod}
• Transmission: ${disease.transmission.method} (${disease.transmission.contagiousness} contagiousness)
• Quarantine Period: ${disease.transmission.quarantinePeriod}
• Mortality Rate: ${disease.mortality.rate} (${disease.mortality.timeframe})`;

    // Add causes
    if (disease.causes.length > 0) {
      content += `\n\n🔬 Causes:
${disease.causes.map(cause => `• ${cause}`).join('\n')}`;
    }

    // Add all symptoms if more than 5
    if (disease.symptoms.length > 5) {
      content += `\n\n🩺 Complete Symptom List:
${disease.symptoms.map(symptom => `• ${symptom}`).join('\n')}`;
    }

    return content;
  }

  /**
   * Format summary disease information
   */
  private formatSummaryContent(disease: ExtendedDiseaseInfo): string {
    return `🦆 ${disease.name} (${disease.category})

⚠️ ${disease.severity.charAt(0).toUpperCase() + disease.severity.slice(1)} severity disease affecting ${disease.commonIn.join(', ')}

🩺 Main symptoms: ${disease.symptoms.slice(0, 3).join(', ')}

💊 Treatment: ${disease.treatment.length > 100 ? disease.treatment.substring(0, 100) + '...' : disease.treatment}`;
  }

  /**
   * Format content for email sharing
   */
  private formatForEmail(
    disease: ExtendedDiseaseInfo,
    shareableLink: ShareableLink,
    options: ShareOptions
  ): string {
    const content = this.formatDiseaseContent(disease, options.shareFormat || 'detailed', 
      options.includePersonalNote || false, options.personalNote || '');
    
    return `${content}

🔗 View full details: ${shareableLink.url}

${this.getVeterinaryDisclaimer()}

---
Shared from PoultryCure App - Your Poultry Health Companion`;
  }

  /**
   * Format content for SMS sharing
   */
  private formatForSMS(
    disease: ExtendedDiseaseInfo,
    shareableLink: ShareableLink,
    options: ShareOptions
  ): string {
    // SMS has character limits, so keep it concise
    let content = `🦆 ${disease.name} - ${disease.severity} severity ${disease.category} disease\n\n`;
    
    if (options.includePersonalNote && options.personalNote) {
      content += `Note: ${options.personalNote}\n\n`;
    }

    content += `Symptoms: ${disease.symptoms.slice(0, 2).join(', ')}\n`;
    content += `Treatment: ${disease.treatment.substring(0, 80)}...\n\n`;
    content += `Full info: ${shareableLink.shortUrl || shareableLink.url}\n\n`;
    content += `⚠️ Consult a veterinarian for proper diagnosis`;

    return content;
  }

  /**
   * Format content for social media sharing
   */
  private formatForSocial(
    disease: ExtendedDiseaseInfo,
    shareableLink: ShareableLink,
    options: ShareOptions
  ): string {
    let content = `🦆 Important Poultry Health Info: ${disease.name}\n\n`;
    
    if (options.includePersonalNote && options.personalNote) {
      content += `${options.personalNote}\n\n`;
    }

    content += `📋 ${disease.description}\n`;
    content += `⚠️ Severity: ${disease.severity.charAt(0).toUpperCase() + disease.severity.slice(1)}\n`;
    content += `🐓 Affects: ${disease.commonIn.join(', ')}\n\n`;
    content += `🔗 Learn more: ${shareableLink.shortUrl || shareableLink.url}\n\n`;
    content += `#PoultryHealth #FarmLife #AnimalCare\n\n`;
    content += `⚠️ Always consult with a veterinarian`;

    return content;
  }

  /**
   * Format multiple diseases for sharing
   */
  private formatMultipleDiseases(diseases: ExtendedDiseaseInfo[], options: ShareOptions): string {
    let content = `🦆 Poultry Disease Reference Guide\n`;
    content += `📊 ${diseases.length} Disease${diseases.length > 1 ? 's' : ''} Summary\n\n`;

    if (options.includePersonalNote && options.personalNote) {
      content += `📝 Note: ${options.personalNote}\n\n`;
    }

    diseases.forEach((disease, index) => {
      content += `${index + 1}. ${disease.name}\n`;
      content += `   Category: ${disease.category} | Severity: ${disease.severity}\n`;
      content += `   Affects: ${disease.commonIn.join(', ')}\n`;
      content += `   Key symptoms: ${disease.symptoms.slice(0, 2).join(', ')}\n\n`;
    });

    content += `🔗 View detailed information in the PoultryCure app`;

    return content;
  }

  /**
   * Generate disease URL for deep linking
   */
  private generateDiseaseUrl(diseaseId: string): string {
    return `${this.baseUrl}/glossary/${diseaseId}`;
  }

  /**
   * Get veterinary consultation disclaimer
   */
  private getVeterinaryDisclaimer(): string {
    return `⚠️ IMPORTANT DISCLAIMER: This information is for educational purposes only and should not replace professional veterinary advice. Always consult with a qualified veterinarian for proper diagnosis, treatment recommendations, and health management of your poultry. Individual cases may vary, and professional guidance is essential for the health and welfare of your birds.`;
  }

  /**
   * Track sharing events for analytics
   */
  private trackShareEvent(diseaseId: string, shareType: string, action: string): void {
    // In a real app, this would send data to your analytics service
    console.log('Share Event:', {
      diseaseId,
      shareType,
      action,
      timestamp: new Date().toISOString()
    });

    // You could also store this locally for offline analytics
    try {
      // Store share analytics locally
      this.storeShareAnalytics(diseaseId, shareType, action);
    } catch (error) {
      console.debug('Error storing share analytics:', error);
    }
  }

  /**
   * Store share analytics locally
   */
  private async storeShareAnalytics(diseaseId: string, shareType: string, action: string): Promise<void> {
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const storageKey = 'share_analytics';
      
      const existingData = await AsyncStorage.default.getItem(storageKey);
      const analytics = existingData ? JSON.parse(existingData) : [];
      
      analytics.push({
        diseaseId,
        shareType,
        action,
        timestamp: new Date().toISOString()
      });

      // Keep only the last 100 share events to prevent storage bloat
      const recentAnalytics = analytics.slice(-100);
      
      await AsyncStorage.default.setItem(storageKey, JSON.stringify(recentAnalytics));
    } catch (error) {
      console.debug('Error storing share analytics:', error);
    }
  }

  /**
   * Get share statistics
   */
  public async getShareStatistics(): Promise<{
    totalShares: number;
    sharesByType: Record<string, number>;
    sharesByDisease: Record<string, number>;
    recentShares: {
      diseaseId: string;
      shareType: string;
      action: string;
      timestamp: string;
    }[];
  }> {
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const storageKey = 'share_analytics';
      const existingData = await AsyncStorage.default.getItem(storageKey);
      const analytics = existingData ? JSON.parse(existingData) : [];

      const sharesByType: Record<string, number> = {};
      const sharesByDisease: Record<string, number> = {};

      analytics.forEach((event: any) => {
        if (event.action === Share.sharedAction) {
          sharesByType[event.shareType] = (sharesByType[event.shareType] || 0) + 1;
          sharesByDisease[event.diseaseId] = (sharesByDisease[event.diseaseId] || 0) + 1;
        }
      });

      return {
        totalShares: analytics.filter((event: any) => event.action === Share.sharedAction).length,
        sharesByType,
        sharesByDisease,
        recentShares: analytics.slice(-10) // Last 10 shares
      };
    } catch (error) {
      console.error('Error getting share statistics:', error);
      return {
        totalShares: 0,
        sharesByType: {},
        sharesByDisease: {},
        recentShares: []
      };
    }
  }

  /**
   * Clear share analytics
   */
  public async clearShareAnalytics(): Promise<void> {
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      await AsyncStorage.default.removeItem('share_analytics');
    } catch (error) {
      console.error('Error clearing share analytics:', error);
    }
  }
}

// Export singleton instance
export const shareService = ShareService.getInstance();