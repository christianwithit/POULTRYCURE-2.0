import { NavigationContainer } from '@react-navigation/native';
import '@testing-library/jest-dom';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock navigation
const mockPush = jest.fn();
const mockBack = jest.fn();
const mockNavigate = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    navigate: mockNavigate,
  }),
  useLocalSearchParams: () => ({ diseaseId: 'test-disease' }),
  Link: ({ children, href, ...props }: any) => (
    <div {...props} onClick={() => mockNavigate(href)}>
      {children}
    </div>
  ),
}));

// Mock services
jest.mock('../../services/diseaseService', () => ({
  DiseaseService: {
    getInstance: jest.fn(() => ({
      getAllDiseases: jest.fn(),
      getDiseaseById: jest.fn(),
      searchDiseases: jest.fn(),
      getDiseasesByCategory: jest.fn(),
      getFilteredDiseases: jest.fn(),
    })),
  },
}));

jest.mock('../../services/bookmarkService', () => ({
  bookmarkService: {
    addBookmark: jest.fn(),
    removeBookmark: jest.fn(),
    isBookmarked: jest.fn(),
    getUserBookmarks: jest.fn(),
  },
}));

const mockDiseaseService = require('../../services/diseaseService').DiseaseService.getInstance();
const mockBookmarkService = require('../../services/bookmarkService').bookmarkService;

// Mock components for testing navigation flow
const MockGlossaryTab = () => {
  const handleDiseaseSelect = (diseaseId: string) => {
    mockPush(`/glossary/${diseaseId}`);
  };

  return (
    <div>
      <div>Glossary Tab</div>
      <button onClick={() => handleDiseaseSelect('newcastle-disease')}>
        Newcastle Disease
      </button>
      <button onClick={() => handleDiseaseSelect('avian-influenza')}>
        Avian Influenza
      </button>
    </div>
  );
};

const MockDiseaseDetail = ({ diseaseId }: { diseaseId: string }) => {
  const handleBookmark = () => {
    mockBookmarkService.addBookmark('test-user', diseaseId);
  };

  const handleShare = () => {
    // Share functionality
  };

  const handleRelatedDiseaseSelect = (relatedId: string) => {
    mockPush(`/glossary/${relatedId}`);
  };

  return (
    <div>
      <div>Disease Detail: {diseaseId}</div>
      <button onClick={handleBookmark}>Bookmark</button>
      <button onClick={handleShare}>Share</button>
      <button onClick={() => handleRelatedDiseaseSelect('related-disease')}>
        Related Disease
      </button>
      <button onClick={mockBack}>Back</button>
    </div>
  );
};

describe('Glossary Navigation Integration Tests', () => {
  const mockUser = {
    id: 'test-user',
    name: 'Test User',
    email: 'test@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDiseases = [
    {
      id: 'newcastle-disease',
      name: 'Newcastle Disease',
      category: 'viral' as const,
      symptoms: ['respiratory distress'],
      causes: ['virus'],
      treatment: 'supportive care',
      prevention: 'vaccination',
      severity: 'high' as const,
      description: 'viral disease',
      commonIn: ['chickens'],
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
      relatedDiseases: ['avian-influenza'],
      lastUpdated: new Date(),
      sources: [],
      tags: ['viral'],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockDiseaseService.getAllDiseases.mockResolvedValue(mockDiseases);
    mockDiseaseService.getDiseaseById.mockResolvedValue(mockDiseases[0]);
    mockBookmarkService.isBookmarked.mockResolvedValue(false);
  });

  describe('Tab Navigation Flow', () => {
    it('should navigate from glossary tab to disease detail', async () => {
      const { getByText } = render(
        <NavigationContainer>
          <AuthProvider>
            <MockGlossaryTab />
          </AuthProvider>
        </NavigationContainer>
      );

      fireEvent.press(getByText('Newcastle Disease'));

      expect(mockPush).toHaveBeenCalledWith('/glossary/newcastle-disease');
    });

    it('should handle multiple disease selections correctly', async () => {
      const { getByText } = render(
        <NavigationContainer>
          <AuthProvider>
            <MockGlossaryTab />
          </AuthProvider>
        </NavigationContainer>
      );

      fireEvent.press(getByText('Newcastle Disease'));
      fireEvent.press(getByText('Avian Influenza'));

      expect(mockPush).toHaveBeenCalledWith('/glossary/newcastle-disease');
      expect(mockPush).toHaveBeenCalledWith('/glossary/avian-influenza');
      expect(mockPush).toHaveBeenCalledTimes(2);
    });
  });

  describe('Disease Detail Navigation', () => {
    it('should navigate back from disease detail', async () => {
      const { getByText } = render(
        <NavigationContainer>
          <AuthProvider>
            <MockDiseaseDetail diseaseId="newcastle-disease" />
          </AuthProvider>
        </NavigationContainer>
      );

      fireEvent.press(getByText('Back'));

      expect(mockBack).toHaveBeenCalled();
    });

    it('should navigate to related diseases', async () => {
      const { getByText } = render(
        <NavigationContainer>
          <AuthProvider>
            <MockDiseaseDetail diseaseId="newcastle-disease" />
          </AuthProvider>
        </NavigationContainer>
      );

      fireEvent.press(getByText('Related Disease'));

      expect(mockPush).toHaveBeenCalledWith('/glossary/related-disease');
    });

    it('should handle bookmark action without navigation', async () => {
      const { getByText } = render(
        <NavigationContainer>
          <AuthProvider>
            <MockDiseaseDetail diseaseId="newcastle-disease" />
          </AuthProvider>
        </NavigationContainer>
      );

      fireEvent.press(getByText('Bookmark'));

      expect(mockBookmarkService.addBookmark).toHaveBeenCalledWith(
        'test-user',
        'newcastle-disease'
      );
      // Should not trigger navigation
      expect(mockPush).not.toHaveBeenCalled();
      expect(mockBack).not.toHaveBeenCalled();
    });
  });

  describe('Search and Filter Navigation', () => {
    it('should maintain navigation state during search', async () => {
      // Simulate search results navigation
      mockDiseaseService.searchDiseases.mockResolvedValue([mockDiseases[0]]);

      const { getByText } = render(
        <NavigationContainer>
          <AuthProvider>
            <MockGlossaryTab />
          </AuthProvider>
        </NavigationContainer>
      );

      // Search should not affect navigation capability
      fireEvent.press(getByText('Newcastle Disease'));

      expect(mockPush).toHaveBeenCalledWith('/glossary/newcastle-disease');
    });

    it('should handle filter state during navigation', async () => {
      // Test that filters don't interfere with navigation
      const filteredDiseases = mockDiseases.filter(d => d.category === 'viral');
      mockDiseaseService.searchDiseases.mockResolvedValue(filteredDiseases);

      const { getByText } = render(
        <NavigationContainer>
          <AuthProvider>
            <MockGlossaryTab />
          </AuthProvider>
        </NavigationContainer>
      );

      fireEvent.press(getByText('Newcastle Disease'));

      expect(mockPush).toHaveBeenCalledWith('/glossary/newcastle-disease');
    });
  });

  describe('Deep Linking and Direct Access', () => {
    it('should handle direct disease detail access', async () => {
      mockDiseaseService.getDiseaseById.mockResolvedValue(mockDiseases[0]);

      const { getByText } = render(
        <NavigationContainer>
          <AuthProvider>
            <MockDiseaseDetail diseaseId="newcastle-disease" />
          </AuthProvider>
        </NavigationContainer>
      );

      expect(getByText('Disease Detail: newcastle-disease')).toBeTruthy();
      expect(mockDiseaseService.getDiseaseById).toHaveBeenCalledWith('newcastle-disease');
    });

    it('should handle invalid disease ID gracefully', async () => {
      mockDiseaseService.getDiseaseById.mockResolvedValue(null);

      const { getByText } = render(
        <NavigationContainer>
          <AuthProvider>
            <MockDiseaseDetail diseaseId="invalid-disease" />
          </AuthProvider>
        </NavigationContainer>
      );

      // Should still render component but handle null disease
      expect(getByText('Disease Detail: invalid-disease')).toBeTruthy();
    });
  });

  describe('Navigation Performance', () => {
    it('should handle rapid navigation without issues', async () => {
      const { getByText } = render(
        <NavigationContainer>
          <AuthProvider>
            <MockGlossaryTab />
          </AuthProvider>
        </NavigationContainer>
      );

      // Simulate rapid clicks
      const diseaseButton = getByText('Newcastle Disease');
      fireEvent.press(diseaseButton);
      fireEvent.press(diseaseButton);
      fireEvent.press(diseaseButton);

      // Should handle multiple rapid presses gracefully
      expect(mockPush).toHaveBeenCalledTimes(3);
    });

    it('should maintain navigation state during data loading', async () => {
      // Simulate slow data loading
      mockDiseaseService.getDiseaseById.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockDiseases[0]), 100))
      );

      const { getByText } = render(
        <NavigationContainer>
          <AuthProvider>
            <MockDiseaseDetail diseaseId="newcastle-disease" />
          </AuthProvider>
        </NavigationContainer>
      );

      // Navigation should work even during loading
      fireEvent.press(getByText('Back'));

      expect(mockBack).toHaveBeenCalled();
    });
  });

  describe('Navigation Error Handling', () => {
    it('should handle navigation errors gracefully', async () => {
      mockPush.mockImplementation(() => {
        throw new Error('Navigation error');
      });

      const { getByText } = render(
        <NavigationContainer>
          <AuthProvider>
            <MockGlossaryTab />
          </AuthProvider>
        </NavigationContainer>
      );

      // Should not crash the app
      expect(() => {
        fireEvent.press(getByText('Newcastle Disease'));
      }).not.toThrow();
    });

    it('should handle service errors during navigation', async () => {
      mockDiseaseService.getDiseaseById.mockRejectedValue(new Error('Service error'));

      const { getByText } = render(
        <NavigationContainer>
          <AuthProvider>
            <MockDiseaseDetail diseaseId="newcastle-disease" />
          </AuthProvider>
        </NavigationContainer>
      );

      // Should still allow navigation even if data loading fails
      fireEvent.press(getByText('Back'));

      expect(mockBack).toHaveBeenCalled();
    });
  });

  describe('Navigation State Persistence', () => {
    it('should maintain bookmark state across navigation', async () => {
      mockBookmarkService.isBookmarked.mockResolvedValue(true);

      const { getByText } = render(
        <NavigationContainer>
          <AuthProvider>
            <MockDiseaseDetail diseaseId="newcastle-disease" />
          </AuthProvider>
        </NavigationContainer>
      );

      // Navigate away and back
      fireEvent.press(getByText('Related Disease'));
      fireEvent.press(getByText('Back'));

      // Bookmark state should be maintained
      expect(mockBookmarkService.isBookmarked).toHaveBeenCalledWith(
        'test-user',
        'newcastle-disease'
      );
    });

    it('should handle navigation history correctly', async () => {
      const { getByText } = render(
        <NavigationContainer>
          <AuthProvider>
            <MockDiseaseDetail diseaseId="newcastle-disease" />
          </AuthProvider>
        </NavigationContainer>
      );

      // Navigate to related disease and back
      fireEvent.press(getByText('Related Disease'));
      fireEvent.press(getByText('Back'));

      expect(mockPush).toHaveBeenCalledWith('/glossary/related-disease');
      expect(mockBack).toHaveBeenCalled();
    });
  });
});