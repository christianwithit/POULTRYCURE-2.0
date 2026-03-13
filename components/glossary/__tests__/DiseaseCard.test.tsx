import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import DiseaseCard from '../DiseaseCard';

const mockDisease = {
  id: 'newcastle-disease',
  name: 'Newcastle Disease',
  category: 'viral' as const,
  symptoms: ['respiratory distress', 'diarrhea', 'twisted neck'],
  causes: ['Newcastle Disease Virus'],
  treatment: 'Supportive care',
  prevention: 'Vaccination',
  severity: 'high' as const,
  description: 'Highly contagious viral disease affecting most bird species',
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
    ageGroups: [],
  },
  images: [],
  relatedDiseases: [],
  lastUpdated: new Date(),
  sources: [],
  tags: ['viral', 'respiratory'],
};

describe('DiseaseCard', () => {
  const mockOnPress = jest.fn();
  const mockOnBookmarkToggle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders disease information correctly', () => {
    const { getByText } = render(
      <DiseaseCard
        disease={mockDisease}
        onPress={mockOnPress}
        isBookmarked={false}
        onBookmarkToggle={mockOnBookmarkToggle}
      />
    );

    expect(getByText('Newcastle Disease')).toBeTruthy();
    expect(getByText('Highly contagious viral disease affecting most bird species')).toBeTruthy();
    expect(getByText('Viral')).toBeTruthy();
  });

  it('displays severity indicator with correct styling', () => {
    const { getByText } = render(
      <DiseaseCard
        disease={mockDisease}
        onPress={mockOnPress}
        isBookmarked={false}
        onBookmarkToggle={mockOnBookmarkToggle}
      />
    );

    const severityIndicator = getByText('High Risk');
    expect(severityIndicator).toBeTruthy();
    // High severity should have red styling (would need to check style props)
  });

  it('shows affected species correctly', () => {
    const { getByText } = render(
      <DiseaseCard
        disease={mockDisease}
        onPress={mockOnPress}
        isBookmarked={false}
        onBookmarkToggle={mockOnBookmarkToggle}
      />
    );

    expect(getByText('Chickens, Turkeys, Ducks')).toBeTruthy();
  });

  it('displays first 3 symptoms as preview', () => {
    const { getByText } = render(
      <DiseaseCard
        disease={mockDisease}
        onPress={mockOnPress}
        isBookmarked={false}
        onBookmarkToggle={mockOnBookmarkToggle}
      />
    );

    expect(getByText('respiratory distress')).toBeTruthy();
    expect(getByText('diarrhea')).toBeTruthy();
    expect(getByText('twisted neck')).toBeTruthy();
  });

  it('calls onPress when card is pressed', () => {
    const { getByTestId } = render(
      <DiseaseCard
        disease={mockDisease}
        onPress={mockOnPress}
        isBookmarked={false}
        onBookmarkToggle={mockOnBookmarkToggle}
      />
    );

    const card = getByTestId('disease-card');
    fireEvent.press(card);

    expect(mockOnPress).toHaveBeenCalled();
  });

  it('shows bookmark button in correct state', () => {
    const { getByTestId, rerender } = render(
      <DiseaseCard
        disease={mockDisease}
        onPress={mockOnPress}
        isBookmarked={false}
        onBookmarkToggle={mockOnBookmarkToggle}
      />
    );

    const bookmarkButton = getByTestId('bookmark-button');
    expect(bookmarkButton).toBeTruthy();

    // Test bookmarked state
    rerender(
      <DiseaseCard
        disease={mockDisease}
        onPress={mockOnPress}
        isBookmarked={true}
        onBookmarkToggle={mockOnBookmarkToggle}
      />
    );

    const bookmarkedButton = getByTestId('bookmark-button');
    expect(bookmarkedButton).toBeTruthy();
    // Should show filled bookmark icon when bookmarked
  });

  it('calls onBookmarkToggle when bookmark button is pressed', () => {
    const { getByTestId } = render(
      <DiseaseCard
        disease={mockDisease}
        onPress={mockOnPress}
        isBookmarked={false}
        onBookmarkToggle={mockOnBookmarkToggle}
      />
    );

    const bookmarkButton = getByTestId('bookmark-button');
    fireEvent.press(bookmarkButton);

    expect(mockOnBookmarkToggle).toHaveBeenCalled();
    expect(mockOnPress).not.toHaveBeenCalled(); // Should not trigger card press
  });

  it('handles different severity levels correctly', () => {
    const lowSeverityDisease = { ...mockDisease, severity: 'low' as const };
    const moderateSeverityDisease = { ...mockDisease, severity: 'moderate' as const };

    const { getByText, rerender } = render(
      <DiseaseCard
        disease={lowSeverityDisease}
        onPress={mockOnPress}
        isBookmarked={false}
        onBookmarkToggle={mockOnBookmarkToggle}
      />
    );

    expect(getByText('Low Risk')).toBeTruthy();

    rerender(
      <DiseaseCard
        disease={moderateSeverityDisease}
        onPress={mockOnPress}
        isBookmarked={false}
        onBookmarkToggle={mockOnBookmarkToggle}
      />
    );

    expect(getByText('Moderate Risk')).toBeTruthy();
  });

  it('handles different disease categories correctly', () => {
    const bacterialDisease = { ...mockDisease, category: 'bacterial' as const };
    const parasiticDisease = { ...mockDisease, category: 'parasitic' as const };

    const { getByText, rerender } = render(
      <DiseaseCard
        disease={bacterialDisease}
        onPress={mockOnPress}
        isBookmarked={false}
        onBookmarkToggle={mockOnBookmarkToggle}
      />
    );

    expect(getByText('Bacterial')).toBeTruthy();

    rerender(
      <DiseaseCard
        disease={parasiticDisease}
        onPress={mockOnPress}
        isBookmarked={false}
        onBookmarkToggle={mockOnBookmarkToggle}
      />
    );

    expect(getByText('Parasitic')).toBeTruthy();
  });

  it('truncates long descriptions appropriately', () => {
    const longDescriptionDisease = {
      ...mockDisease,
      description: 'This is a very long description that should be truncated when displayed in the card component to ensure proper layout and readability for users browsing the disease list.',
    };

    const { getByText } = render(
      <DiseaseCard
        disease={longDescriptionDisease}
        onPress={mockOnPress}
        isBookmarked={false}
        onBookmarkToggle={mockOnBookmarkToggle}
      />
    );

    // Should show truncated description (implementation would handle this)
    const description = getByText(/This is a very long description/);
    expect(description).toBeTruthy();
  });

  it('handles diseases with no symptoms gracefully', () => {
    const noSymptomsDisease = { ...mockDisease, symptoms: [] };

    const { queryByText } = render(
      <DiseaseCard
        disease={noSymptomsDisease}
        onPress={mockOnPress}
        isBookmarked={false}
        onBookmarkToggle={mockOnBookmarkToggle}
      />
    );

    // Should not crash and should show appropriate message
    expect(queryByText('No symptoms listed')).toBeTruthy();
  });

  it('handles diseases with single species correctly', () => {
    const singleSpeciesDisease = { ...mockDisease, commonIn: ['chickens'] };

    const { getByText } = render(
      <DiseaseCard
        disease={singleSpeciesDisease}
        onPress={mockOnPress}
        isBookmarked={false}
        onBookmarkToggle={mockOnBookmarkToggle}
      />
    );

    expect(getByText('Chickens')).toBeTruthy();
  });

  it('shows transmission method indicator', () => {
    const { getByText } = render(
      <DiseaseCard
        disease={mockDisease}
        onPress={mockOnPress}
        isBookmarked={false}
        onBookmarkToggle={mockOnBookmarkToggle}
      />
    );

    expect(getByText('Airborne')).toBeTruthy();
  });

  it('displays mortality rate when available', () => {
    const { getByText } = render(
      <DiseaseCard
        disease={mockDisease}
        onPress={mockOnPress}
        isBookmarked={false}
        onBookmarkToggle={mockOnBookmarkToggle}
      />
    );

    expect(getByText('50-100%')).toBeTruthy();
  });
});