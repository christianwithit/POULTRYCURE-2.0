import { Alert, Share } from 'react-native';
import { ExtendedDiseaseInfo } from '../../types/types';
import { shareService, ShareService } from '../shareService';

// Mock React Native modules
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
  Share: {
    share: jest.fn(),
    sharedAction: 'sharedAction',
    dismissedAction: 'dismissedAction',
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

describe('ShareService', () => {
  let mockDisease: ExtendedDiseaseInfo;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockDisease = {
      id: 'test-disease-1',
      name: 'Test Disease',
      description: 'A test disease for unit testing',
      category: 'viral',
      severity: 'moderate',
      symptoms: ['Symptom 1', 'Symptom 2', 'Symptom 3'],
      treatment: 'Test treatment protocol',
      prevention: 'Test prevention measures',
      commonIn: ['chickens', 'turkeys'],
      causes: ['Test cause 1', 'Test cause 2'],
      transmission: {
        method: 'direct',
        contagiousness: 'moderate',
        quarantinePeriod: '7-14 days'
      },
      incubationPeriod: '3-5 days',
      mortality: {
        rate: '10-20%',
        timeframe: '1-2 weeks',
        ageGroups: [
          { ageGroup: 'Chicks (0-8 weeks)', mortalityRate: '15-25%' },
          { ageGroup: 'Adults (>8 weeks)', mortalityRate: '5-10%' }
        ]
      },
      images: [],
      relatedDiseases: ['related-disease-1'],
      lastUpdated: new Date('2024-01-01'),
      sources: ['Test source 1'],
      tags: ['test', 'viral', 'respiratory']
    };
  });

  describe('getInstance', () => {
    it('should return a singleton instance', () => {
      const instance1 = ShareService.getInstance();
      const instance2 = ShareService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('shareDiseaseInfo', () => {
    it('should share disease information with basic format', async () => {
      const mockShareResult = { action: Share.sharedAction };
      (Share.share as jest.Mock).mockResolvedValue(mockShareResult);

      const result = await shareService.shareDiseaseInfo(mockDisease, {
        shareFormat: 'basic',
        includeDisclaimer: true
      });

      expect(Share.share).toHaveBeenCalledWith({
        message: expect.stringContaining('Test Disease'),
        title: 'Test Disease - Disease Information',
        url: 'https://poultrycure.app/glossary/test-disease-1'
      });
      expect(result).toBe(true);
    });

    it('should include personal note when specified', async () => {
      const mockShareResult = { action: Share.sharedAction };
      (Share.share as jest.Mock).mockResolvedValue(mockShareResult);

      await shareService.shareDiseaseInfo(mockDisease, {
        includePersonalNote: true,
        personalNote: 'This is my personal note',
        shareFormat: 'basic'
      });

      expect(Share.share).toHaveBeenCalledWith({
        message: expect.stringContaining('📝 Personal Note: This is my personal note'),
        title: 'Test Disease - Disease Information',
        url: 'https://poultrycure.app/glossary/test-disease-1'
      });
    });

    it('should include disclaimer by default', async () => {
      const mockShareResult = { action: Share.sharedAction };
      (Share.share as jest.Mock).mockResolvedValue(mockShareResult);

      await shareService.shareDiseaseInfo(mockDisease);

      expect(Share.share).toHaveBeenCalledWith({
        message: expect.stringContaining('⚠️ IMPORTANT DISCLAIMER'),
        title: 'Test Disease - Disease Information',
        url: 'https://poultrycure.app/glossary/test-disease-1'
      });
    });

    it('should exclude disclaimer when specified', async () => {
      const mockShareResult = { action: Share.sharedAction };
      (Share.share as jest.Mock).mockResolvedValue(mockShareResult);

      await shareService.shareDiseaseInfo(mockDisease, {
        includeDisclaimer: false
      });

      const shareCall = (Share.share as jest.Mock).mock.calls[0][0];
      expect(shareCall.message).not.toContain('⚠️ IMPORTANT DISCLAIMER');
    });

    it('should handle share errors gracefully', async () => {
      const mockError = new Error('Share failed');
      (Share.share as jest.Mock).mockRejectedValue(mockError);

      const result = await shareService.shareDiseaseInfo(mockDisease);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Share Error',
        'Unable to share disease information. Please try again.'
      );
      expect(result).toBe(false);
    });

    it('should return false when share is dismissed', async () => {
      const mockShareResult = { action: Share.dismissedAction };
      (Share.share as jest.Mock).mockResolvedValue(mockShareResult);

      const result = await shareService.shareDiseaseInfo(mockDisease);

      expect(result).toBe(false);
    });
  });

  describe('generateShareableLink', () => {
    it('should generate correct shareable link', () => {
      const link = shareService.generateShareableLink('test-disease-1');
      
      expect(link.url).toBe('https://poultrycure.app/glossary/test-disease-1');
      expect(link.shortUrl).toBe('https://poultrycure.app/glossary/test-disease-1');
      expect(link.expiresAt).toBeUndefined();
    });
  });

  describe('shareToSpecificPlatform', () => {
    it('should format content for email platform', async () => {
      const mockShareResult = { action: Share.sharedAction };
      (Share.share as jest.Mock).mockResolvedValue(mockShareResult);

      const result = await shareService.shareToSpecificPlatform(mockDisease, 'email', {
        shareFormat: 'detailed'
      });

      expect(Share.share).toHaveBeenCalledWith({
        message: expect.stringContaining('🔗 View full details:'),
        title: 'Test Disease - Disease Information',
        url: 'https://poultrycure.app/glossary/test-disease-1'
      });
      expect(result).toBe(true);
    });

    it('should format content for SMS platform', async () => {
      const mockShareResult = { action: Share.sharedAction };
      (Share.share as jest.Mock).mockResolvedValue(mockShareResult);

      const result = await shareService.shareToSpecificPlatform(mockDisease, 'sms');

      const shareCall = (Share.share as jest.Mock).mock.calls[0][0];
      expect(shareCall.message).toContain('🦆 Test Disease');
      expect(shareCall.message.length).toBeLessThan(500); // SMS should be concise
      expect(result).toBe(true);
    });

    it('should format content for social platform', async () => {
      const mockShareResult = { action: Share.sharedAction };
      (Share.share as jest.Mock).mockResolvedValue(mockShareResult);

      const result = await shareService.shareToSpecificPlatform(mockDisease, 'social');

      expect(Share.share).toHaveBeenCalledWith({
        message: expect.stringContaining('#PoultryHealth #FarmLife #AnimalCare'),
        title: 'Test Disease - Disease Information',
        url: 'https://poultrycure.app/glossary/test-disease-1'
      });
      expect(result).toBe(true);
    });

    it('should handle platform-specific share errors', async () => {
      const mockError = new Error('Platform share failed');
      (Share.share as jest.Mock).mockRejectedValue(mockError);

      const result = await shareService.shareToSpecificPlatform(mockDisease, 'email');

      expect(Alert.alert).toHaveBeenCalledWith(
        'Share Error',
        'Unable to share to email. Please try again.'
      );
      expect(result).toBe(false);
    });
  });

  describe('shareMultipleDiseases', () => {
    it('should share multiple diseases', async () => {
      const mockDisease2 = { ...mockDisease, id: 'test-disease-2', name: 'Test Disease 2' };
      const diseases = [mockDisease, mockDisease2];
      
      const mockShareResult = { action: Share.sharedAction };
      (Share.share as jest.Mock).mockResolvedValue(mockShareResult);

      const result = await shareService.shareMultipleDiseases(diseases);

      expect(Share.share).toHaveBeenCalledWith({
        message: expect.stringContaining('🦆 Poultry Disease Reference Guide'),
        title: 'Poultry Disease Reference - 2 Diseases'
      });
      expect(result).toBe(true);
    });

    it('should handle empty disease array', async () => {
      const result = await shareService.shareMultipleDiseases([]);

      expect(Alert.alert).toHaveBeenCalledWith(
        'No Diseases',
        'Please select at least one disease to share.'
      );
      expect(result).toBe(false);
    });
  });

  describe('content formatting', () => {
    it('should format basic content correctly', async () => {
      const mockShareResult = { action: Share.sharedAction };
      (Share.share as jest.Mock).mockResolvedValue(mockShareResult);

      await shareService.shareDiseaseInfo(mockDisease, {
        shareFormat: 'basic',
        includeDisclaimer: false
      });

      const shareCall = (Share.share as jest.Mock).mock.calls[0][0];
      expect(shareCall.message).toContain('🦆 Test Disease');
      expect(shareCall.message).toContain('📋 Description: A test disease for unit testing');
      expect(shareCall.message).toContain('🔍 Category: Viral');
      expect(shareCall.message).toContain('⚠️ Severity: Moderate');
      expect(shareCall.message).toContain('🐓 Affects: chickens, turkeys');
      expect(shareCall.message).toContain('🩺 Key Symptoms:');
      expect(shareCall.message).toContain('💊 Treatment: Test treatment protocol');
      expect(shareCall.message).toContain('🛡️ Prevention: Test prevention measures');
    });

    it('should format detailed content correctly', async () => {
      const mockShareResult = { action: Share.sharedAction };
      (Share.share as jest.Mock).mockResolvedValue(mockShareResult);

      await shareService.shareDiseaseInfo(mockDisease, {
        shareFormat: 'detailed',
        includeDisclaimer: false
      });

      const shareCall = (Share.share as jest.Mock).mock.calls[0][0];
      expect(shareCall.message).toContain('📊 Additional Information:');
      expect(shareCall.message).toContain('• Incubation Period: 3-5 days');
      expect(shareCall.message).toContain('• Transmission: direct (moderate contagiousness)');
      expect(shareCall.message).toContain('• Quarantine Period: 7-14 days');
      expect(shareCall.message).toContain('• Mortality Rate: 10-20% (1-2 weeks)');
      expect(shareCall.message).toContain('🔬 Causes:');
    });

    it('should format summary content correctly', async () => {
      const mockShareResult = { action: Share.sharedAction };
      (Share.share as jest.Mock).mockResolvedValue(mockShareResult);

      await shareService.shareDiseaseInfo(mockDisease, {
        shareFormat: 'summary',
        includeDisclaimer: false
      });

      const shareCall = (Share.share as jest.Mock).mock.calls[0][0];
      expect(shareCall.message).toContain('🦆 Test Disease (viral)');
      expect(shareCall.message).toContain('⚠️ Moderate severity disease affecting chickens, turkeys');
      expect(shareCall.message).toContain('🩺 Main symptoms: Symptom 1, Symptom 2, Symptom 3');
      expect(shareCall.message).toContain('💊 Treatment: Test treatment protocol');
    });
  });

  describe('analytics', () => {
    it('should track share events', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const mockShareResult = { action: Share.sharedAction };
      (Share.share as jest.Mock).mockResolvedValue(mockShareResult);

      await shareService.shareDiseaseInfo(mockDisease);

      expect(consoleSpy).toHaveBeenCalledWith('Share Event:', {
        diseaseId: 'test-disease-1',
        shareType: 'basic',
        action: 'sharedAction',
        timestamp: expect.any(String)
      });

      consoleSpy.mockRestore();
    });
  });
});