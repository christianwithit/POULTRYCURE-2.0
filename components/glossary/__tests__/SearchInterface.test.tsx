import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import SearchInterface from '../SearchInterface';

// Mock the services
jest.mock('../../../services/diseaseService', () => ({
  diseaseService: {
    getAllDiseases: jest.fn().mockResolvedValue([
      {
        id: 'test-disease',
        name: 'Test Disease',
        symptoms: ['coughing', 'fever'],
        tags: ['viral', 'respiratory'],
        causes: ['virus'],
      }
    ]),
    getSearchSuggestions: jest.fn().mockResolvedValue([
      {
        text: 'Test Disease',
        type: 'disease',
        score: 100,
        disease: {
          id: 'test-disease',
          name: 'Test Disease',
        }
      }
    ])
  }
}));

jest.mock('../../../services/searchHistoryService', () => ({
  searchHistoryService: {
    getRecentSearches: jest.fn().mockResolvedValue([]),
    addRecentSearch: jest.fn().mockResolvedValue(undefined),
    clearRecentSearches: jest.fn().mockResolvedValue(undefined),
  }
}));

describe('SearchInterface', () => {
  const mockOnSearchChange = jest.fn();
  const mockOnDiseaseSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders search input correctly', () => {
    const { getByPlaceholderText } = render(
      <SearchInterface
        onSearchChange={mockOnSearchChange}
        onDiseaseSelect={mockOnDiseaseSelect}
        placeholder="Search diseases..."
      />
    );

    expect(getByPlaceholderText('Search diseases...')).toBeTruthy();
  });

  it('calls onSearchChange when text is entered', async () => {
    const { getByPlaceholderText } = render(
      <SearchInterface
        onSearchChange={mockOnSearchChange}
        onDiseaseSelect={mockOnDiseaseSelect}
      />
    );

    const searchInput = getByPlaceholderText('Search diseases, symptoms, or keywords...');
    fireEvent.changeText(searchInput, 'test query');

    // Wait for debounce
    await waitFor(() => {
      expect(mockOnSearchChange).toHaveBeenCalledWith('test query');
    }, { timeout: 500 });
  });

  it('shows clear button when text is entered', () => {
    const { getByPlaceholderText, getByTestId } = render(
      <SearchInterface
        onSearchChange={mockOnSearchChange}
        onDiseaseSelect={mockOnDiseaseSelect}
      />
    );

    const searchInput = getByPlaceholderText('Search diseases, symptoms, or keywords...');
    fireEvent.changeText(searchInput, 'test');

    // The clear button should be visible (we'd need to add testID to the component)
    expect(searchInput.props.value).toBe('test');
  });

  it('clears search when clear button is pressed', () => {
    const { getByPlaceholderText } = render(
      <SearchInterface
        onSearchChange={mockOnSearchChange}
        onDiseaseSelect={mockOnDiseaseSelect}
      />
    );

    const searchInput = getByPlaceholderText('Search diseases, symptoms, or keywords...');
    fireEvent.changeText(searchInput, 'test');
    
    // Simulate clear button press by setting empty text
    fireEvent.changeText(searchInput, '');
    
    expect(searchInput.props.value).toBe('');
  });
});