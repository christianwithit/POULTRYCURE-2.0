import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { FilterCriteria } from '../../../types/types';
import FilterPanel from '../FilterPanel';

const mockFilters: FilterCriteria = {
  categories: [],
  severities: [],
  species: [],
};

const mockStats = {
  total: 50,
  byCategory: {
    viral: 15,
    bacterial: 12,
    parasitic: 8,
    nutritional: 10,
    genetic: 3,
    environmental: 2,
  },
  bySeverity: {
    low: 20,
    moderate: 18,
    high: 12,
  },
  bySpecies: {
    chickens: 45,
    turkeys: 30,
    ducks: 25,
    geese: 20,
  },
};

describe('FilterPanel', () => {
  const mockOnClose = jest.fn();
  const mockOnFiltersChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when visible', () => {
    const { getByText } = render(
      <FilterPanel
        visible={true}
        onClose={mockOnClose}
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        diseaseStats={mockStats}
      />
    );

    expect(getByText('Filter Diseases')).toBeTruthy();
    expect(getByText('Disease Categories')).toBeTruthy();
    expect(getByText('Severity Levels')).toBeTruthy();
    expect(getByText('Affected Species')).toBeTruthy();
  });

  it('displays correct counts for each filter option', () => {
    const { getByText } = render(
      <FilterPanel
        visible={true}
        onClose={mockOnClose}
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        diseaseStats={mockStats}
      />
    );

    expect(getByText('15')).toBeTruthy(); // Viral count
    expect(getByText('12')).toBeTruthy(); // Bacterial count
    expect(getByText('20')).toBeTruthy(); // Low severity count
    expect(getByText('45')).toBeTruthy(); // Chickens count
  });

  it('calls onFiltersChange when category filter is toggled', () => {
    const { getByText } = render(
      <FilterPanel
        visible={true}
        onClose={mockOnClose}
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        diseaseStats={mockStats}
      />
    );

    fireEvent.press(getByText('Viral'));

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...mockFilters,
      categories: ['viral'],
    });
  });

  it('calls onFiltersChange when severity filter is toggled', () => {
    const { getByText } = render(
      <FilterPanel
        visible={true}
        onClose={mockOnClose}
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        diseaseStats={mockStats}
      />
    );

    fireEvent.press(getByText('High'));

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...mockFilters,
      severities: ['high'],
    });
  });

  it('calls onFiltersChange when species filter is toggled', () => {
    const { getByText } = render(
      <FilterPanel
        visible={true}
        onClose={mockOnClose}
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        diseaseStats={mockStats}
      />
    );

    fireEvent.press(getByText('Chickens'));

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...mockFilters,
      species: ['chickens'],
    });
  });

  it('shows active filter count when filters are applied', () => {
    const filtersWithActive: FilterCriteria = {
      categories: ['viral', 'bacterial'],
      severities: ['high'],
      species: [],
    };

    const { getByText } = render(
      <FilterPanel
        visible={true}
        onClose={mockOnClose}
        filters={filtersWithActive}
        onFiltersChange={mockOnFiltersChange}
        diseaseStats={mockStats}
      />
    );

    expect(getByText('3 active')).toBeTruthy();
  });

  it('clears all filters when Clear All is pressed', () => {
    const filtersWithActive: FilterCriteria = {
      categories: ['viral'],
      severities: ['high'],
      species: ['chickens'],
    };

    const { getByText } = render(
      <FilterPanel
        visible={true}
        onClose={mockOnClose}
        filters={filtersWithActive}
        onFiltersChange={mockOnFiltersChange}
        diseaseStats={mockStats}
      />
    );

    fireEvent.press(getByText('Clear All'));

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      categories: [],
      severities: [],
      species: [],
      searchQuery: undefined,
    });
  });

  it('calls onClose when Apply Filters is pressed', () => {
    const { getByText } = render(
      <FilterPanel
        visible={true}
        onClose={mockOnClose}
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        diseaseStats={mockStats}
      />
    );

    fireEvent.press(getByText('Apply Filters'));

    expect(mockOnClose).toHaveBeenCalled();
  });
});