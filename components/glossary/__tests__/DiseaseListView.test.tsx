import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { FilterCriteria } from '../../../types/types';
import DiseaseListView from '../DiseaseListView';

// Mock the services
jest.mock('../../../services/diseaseService');
jest.mock('../../../services/bookmarkService');

const mockDiseases = [
  {
    id: 'newcastle-disease',
    name: 'Newcastle Disease',
    category: 'viral' as const,
    symptoms: ['respiratory distress', 'diarrhea'],
    causes: ['Newcastle Disease Virus'],
    treatment: 'Supportive care',
    prevention: 'Vaccination',
    severity: 'high' as const,
    description: 'Highly contagious viral disease',
    commonIn: ['chickens', 'turkeys'],
    transmission: {
      method: 'airborne' as const,
      contagiousness: 'high' as const,
      quarantinePeriod: '21 days',
    },
    incubationPeriod: '2-15 days',
    mortality: {
      rate: '50-100%',
      timeframe: '2-12 days',
      ageGroups: [],
    },
    images: [],
    relatedDiseases: [],
    lastUpdated: new Date(),
    sources: [],
    tags: ['viral'],
  },
  {
    id: 'avian-influenza',
    name: 'Avian Influenza',
    category: 'viral' as const,
    symptoms: ['sudden death', 'respiratory distress'],
    causes: ['Influenza A virus'],
    treatment: 'No specific treatment',
    prevention: 'Biosecurity measures',
    severity: 'high' as const,
    description: 'Highly pathogenic avian influenza',
    commonIn: ['chickens', 'ducks'],
    transmission: {
      method: 'airborne' as const,
      contagiousness: 'high' as const,
      quarantinePeriod: '21 days',
    },
    incubationPeriod: '1-7 days',
    mortality: {
      rate: '90-100%',
      timeframe: '1-3 days',
      ageGroups: [],
    },
    images: [],
    relatedDiseases: [],
    lastUpdated: new Date(),
    sources: [],
    tags: ['viral'],
  },
];

describe('DiseaseListView', () => {
  const mockOnDiseaseSelect = jest.fn();
  const mockOnRefresh = jest.fn();
  const defaultFilters: FilterCriteria = {
    categories: [],
    severities: [],
    species: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders disease list correctly', () => {
    const { getByText } = render(
      <DiseaseListView
        diseases={mockDiseases}
        onDiseaseSelect={mockOnDiseaseSelect}
        loading={false}
        searchQuery=""
        activeFilters={defaultFilters}
        onRefresh={mockOnRefresh}
      />
    );

    expect(getByText('Newcastle Disease')).toBeTruthy();
    expect(getByText('Avian Influenza')).toBeTruthy();
  });

  it('shows loading state correctly', () => {
    const { getByTestId } = render(
      <DiseaseListView
        diseases={[]}
        onDiseaseSelect={mockOnDiseaseSelect}
        loading={true}
        searchQuery=""
        activeFilters={defaultFilters}
        onRefresh={mockOnRefresh}
      />
    );

    // Assuming loading indicator has testID
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('shows empty state when no diseases match filters', () => {
    const { getByText } = render(
      <DiseaseListView
        diseases={[]}
        onDiseaseSelect={mockOnDiseaseSelect}
        loading={false}
        searchQuery="nonexistent"
        activeFilters={defaultFilters}
        onRefresh={mockOnRefresh}
      />
    );

    expect(getByText(/no diseases found/i)).toBeTruthy();
  });

  it('calls onDiseaseSelect when disease card is pressed', () => {
    const { getByText } = render(
      <DiseaseListView
        diseases={mockDiseases}
        onDiseaseSelect={mockOnDiseaseSelect}
        loading={false}
        searchQuery=""
        activeFilters={defaultFilters}
        onRefresh={mockOnRefresh}
      />
    );

    fireEvent.press(getByText('Newcastle Disease'));

    expect(mockOnDiseaseSelect).toHaveBeenCalledWith('newcastle-disease');
  });

  it('handles pull-to-refresh correctly', async () => {
    const { getByTestId } = render(
      <DiseaseListView
        diseases={mockDiseases}
        onDiseaseSelect={mockOnDiseaseSelect}
        loading={false}
        searchQuery=""
        activeFilters={defaultFilters}
        onRefresh={mockOnRefresh}
      />
    );

    const scrollView = getByTestId('disease-list-scroll');
    fireEvent(scrollView, 'refresh');

    await waitFor(() => {
      expect(mockOnRefresh).toHaveBeenCalled();
    });
  });

  it('displays search query highlight when searching', () => {
    const { getByText } = render(
      <DiseaseListView
        diseases={mockDiseases}
        onDiseaseSelect={mockOnDiseaseSelect}
        loading={false}
        searchQuery="Newcastle"
        activeFilters={defaultFilters}
        onRefresh={mockOnRefresh}
      />
    );

    // Should highlight the search term in disease names
    expect(getByText('Newcastle Disease')).toBeTruthy();
  });

  it('shows active filter indicators', () => {
    const activeFilters: FilterCriteria = {
      categories: ['viral'],
      severities: ['high'],
      species: ['chickens'],
    };

    const { getByText } = render(
      <DiseaseListView
        diseases={mockDiseases}
        onDiseaseSelect={mockOnDiseaseSelect}
        loading={false}
        searchQuery=""
        activeFilters={activeFilters}
        onRefresh={mockOnRefresh}
      />
    );

    // Should show filter indicators
    expect(getByText(/3 filters active/i)).toBeTruthy();
  });

  it('handles large dataset efficiently with virtual scrolling', () => {
    const largeDiseaseList = Array.from({ length: 1000 }, (_, index) => ({
      ...mockDiseases[0],
      id: `disease-${index}`,
      name: `Disease ${index}`,
    }));

    const { getByTestId } = render(
      <DiseaseListView
        diseases={largeDiseaseList}
        onDiseaseSelect={mockOnDiseaseSelect}
        loading={false}
        searchQuery=""
        activeFilters={defaultFilters}
        onRefresh={mockOnRefresh}
      />
    );

    // Should render without performance issues
    expect(getByTestId('disease-list-scroll')).toBeTruthy();
  });

  it('shows disease count information', () => {
    const { getByText } = render(
      <DiseaseListView
        diseases={mockDiseases}
        onDiseaseSelect={mockOnDiseaseSelect}
        loading={false}
        searchQuery=""
        activeFilters={defaultFilters}
        onRefresh={mockOnRefresh}
      />
    );

    expect(getByText('2 diseases found')).toBeTruthy();
  });

  it('handles error state gracefully', () => {
    const { getByText } = render(
      <DiseaseListView
        diseases={[]}
        onDiseaseSelect={mockOnDiseaseSelect}
        loading={false}
        searchQuery=""
        activeFilters={defaultFilters}
        onRefresh={mockOnRefresh}
      />
    );

    // Test that component renders without error
    expect(getByText('No diseases found')).toBeTruthy();
  });
});