import { render, screen } from '@testing-library/react-native';
import React from 'react';
import DiseaseDetailScreen from '../../../app/glossary/[diseaseId]';
import { diseaseService } from '../../../services/diseaseService';

// Mock the required modules
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ diseaseId: 'newcastle-disease' }),
  router: {
    push: jest.fn(),
    back: jest.fn(),
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user', name: 'Test User', email: 'test@example.com' },
  }),
}));

jest.mock('../../../services/diseaseService');
jest.mock('../../../services/bookmarkService');

const mockDiseaseService = diseaseService as jest.Mocked<typeof diseaseService>;

describe('DiseaseDetailScreen', () => {
  const mockDisease = {
    id: 'newcastle-disease',
    name: 'Newcastle Disease',
    category: 'viral' as const,
    symptoms: ['respiratory distress', 'diarrhea', 'twisted neck'],
    causes: ['Newcastle Disease Virus (NDV)', 'Contact with infected birds'],
    treatment: 'No specific treatment. Supportive care with antibiotics.',
    prevention: 'Regular vaccination, strict biosecurity measures.',
    severity: 'high' as const,
    description: 'A highly contagious viral disease affecting most bird species.',
    commonIn: ['chickens', 'turkeys', 'ducks'],
    transmission: {
      method: 'airborne' as const,
      contagiousness: 'high' as const,
      quarantinePeriod: '21 days',
    },
    incubationPeriod: '2-15 days',
    mortality: {
      rate: '50-100%',
      timeframe: '2-12 days',
      ageGroups: [
        { ageGroup: 'Chicks (0-4 weeks)', mortalityRate: '90-100%' },
      ],
    },
    images: [],
    relatedDiseases: ['avian-influenza'],
    lastUpdated: new Date('2024-01-15'),
    sources: ['OIE Manual'],
    tags: ['viral', 'respiratory'],
  };

  beforeEach(() => {
    mockDiseaseService.getDiseaseById.mockResolvedValue(mockDisease);
    mockDiseaseService.getRelatedDiseases.mockResolvedValue([]);
  });

  it('renders disease information correctly', async () => {
    render(<DiseaseDetailScreen />);
    
    // Wait for the disease data to load and check if the disease name is displayed
    expect(await screen.findByText('Newcastle Disease')).toBeTruthy();
    expect(screen.getByText('A highly contagious viral disease affecting most bird species.')).toBeTruthy();
  });

  it('displays disease severity and category', async () => {
    render(<DiseaseDetailScreen />);
    
    expect(await screen.findByText('Viral')).toBeTruthy();
    expect(screen.getByText('High Risk')).toBeTruthy();
  });

  it('shows transmission information', async () => {
    render(<DiseaseDetailScreen />);
    
    expect(await screen.findByText('21 days')).toBeTruthy();
    expect(screen.getByText('Airborne')).toBeTruthy();
  });

  it('displays mortality information', async () => {
    render(<DiseaseDetailScreen />);
    
    expect(await screen.findByText('50-100%')).toBeTruthy();
    expect(screen.getByText('2-12 days')).toBeTruthy();
  });
});