// components/images/__tests__/CachedImage.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { CachedImage } from '../CachedImage';

// Mock dependencies
jest.mock('../../services/imageCache', () => ({
  getCachedImage: jest.fn(),
  addImageToCache: jest.fn(),
}));

jest.mock('../../utils/imageValidation', () => ({
  validateImageFile: jest.fn(),
  getErrorMessage: jest.fn(),
}));

jest.mock('react-native/Libraries/Image/Image', () => 'Image');

describe('CachedImage Component', () => {
  const mockSource = 'https://example.com/test-image.jpg';
  const mockStyle = { width: 100, height: 100 };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', () => {
    const { getByTestId } = render(
      <CachedImage
        source={mockSource}
        style={mockStyle}
        showLoading={true}
        testID="cached-image"
      />
    );

    // Should show loading indicator
    expect(getByTestId('cached-image')).toBeTruthy();
  });

  it('should load image successfully', async () => {
    const { getCachedImage } = require('../../services/imageCache');
    const { validateImageFile } = require('../../utils/imageValidation');
    
    // Mock successful validation and cache
    validateImageFile.mockResolvedValue({ isValid: true, errors: [], warnings: [] });
    getCachedImage.mockResolvedValue('cached-uri');

    const { getByTestId } = render(
      <CachedImage
        source={mockSource}
        style={mockStyle}
        testID="cached-image"
      />
    );

    await waitFor(() => {
      expect(getCachedImage).toHaveBeenCalledWith(mockSource);
    });
  });

  it('should handle validation errors', async () => {
    const { validateImageFile } = require('../../utils/imageValidation');
    const { getErrorMessage } = require('../../utils/imageValidation');
    
    // Mock validation failure
    validateImageFile.mockResolvedValue({
      isValid: false,
      errors: [{ code: 'INVALID_FORMAT', message: 'Invalid format' }],
      warnings: [],
    });
    getErrorMessage.mockReturnValue('Invalid image format');

    const { getByText } = render(
      <CachedImage
        source={mockSource}
        style={mockStyle}
        showError={true}
      />
    );

    await waitFor(() => {
      expect(getByText('Invalid image format')).toBeTruthy();
    });
  });

  it('should show custom placeholder', async () => {
    const { validateImageFile } = require('../../utils/imageValidation');
    
    // Mock validation to take time
    validateImageFile.mockImplementation(() => new Promise(resolve => setTimeout(() => 
      resolve({ isValid: true, errors: [], warnings: [] }), 100
    )));

    const { getByText } = render(
      <CachedImage
        source={mockSource}
        style={mockStyle}
        placeholder="Loading image..."
        showLoading={true}
      />
    );

    expect(getByText('Loading image...')).toBeTruthy();
  });

  it('should show custom fallback component on error', async () => {
    const { validateImageFile } = require('../../utils/imageValidation');
    
    // Mock validation failure
    validateImageFile.mockResolvedValue({
      isValid: false,
      errors: [{ code: 'INVALID_FORMAT', message: 'Invalid format' }],
      warnings: [],
    });

    const fallbackComponent = <div testID="custom-fallback">Custom Error</div>;

    const { getByTestId } = render(
      <CachedImage
        source={mockSource}
        style={mockStyle}
        fallbackComponent={fallbackComponent}
      />
    );

    await waitFor(() => {
      expect(getByTestId('custom-fallback')).toBeTruthy();
    });
  });

  it('should call onLoad callback when image loads', async () => {
    const { getCachedImage } = require('../../services/imageCache');
    const { validateImageFile } = require('../../utils/imageValidation');
    const onLoadMock = jest.fn();
    
    // Mock successful validation and cache
    validateImageFile.mockResolvedValue({ isValid: true, errors: [], warnings: [] });
    getCachedImage.mockResolvedValue('cached-uri');

    render(
      <CachedImage
        source={mockSource}
        style={mockStyle}
        onLoad={onLoadMock}
      />
    );

    await waitFor(() => {
      expect(onLoadMock).toHaveBeenCalled();
    });
  });

  it('should call onError callback when image fails', async () => {
    const { validateImageFile } = require('../../utils/imageValidation');
    const onErrorMock = jest.fn();
    
    // Mock validation failure
    validateImageFile.mockResolvedValue({
      isValid: false,
      errors: [{ code: 'INVALID_FORMAT', message: 'Invalid format' }],
      warnings: [],
    });

    render(
      <CachedImage
        source={mockSource}
        style={mockStyle}
        onError={onErrorMock}
      />
    );

    await waitFor(() => {
      expect(onErrorMock).toHaveBeenCalled();
    });
  });

  it('should handle empty source', async () => {
    const { getByText } = render(
      <CachedImage
        source=""
        style={mockStyle}
        showError={true}
      />
    );

    await waitFor(() => {
      expect(getByText('No image source provided')).toBeTruthy();
    });
  });

  it('should use custom cache key', async () => {
    const { getCachedImage } = require('../../services/imageCache');
    const { validateImageFile } = require('../../utils/imageValidation');
    const customCacheKey = 'custom-key';
    
    // Mock successful validation and cache
    validateImageFile.mockResolvedValue({ isValid: true, errors: [], warnings: [] });
    getCachedImage.mockResolvedValue('cached-uri');

    render(
      <CachedImage
        source={mockSource}
        style={mockStyle}
        cacheKey={customCacheKey}
      />
    );

    await waitFor(() => {
      expect(getCachedImage).toHaveBeenCalledWith(mockSource);
    });
  });

  it('should not show loading when showLoading is false', () => {
    const { queryByText } = render(
      <CachedImage
        source={mockSource}
        style={mockStyle}
        showLoading={false}
      />
    );

    // Should not show loading indicator
    expect(queryByText(/loading/i)).toBeNull();
  });

  it('should not show error when showError is false', async () => {
    const { validateImageFile } = require('../../utils/imageValidation');
    
    // Mock validation failure
    validateImageFile.mockResolvedValue({
      isValid: false,
      errors: [{ code: 'INVALID_FORMAT', message: 'Invalid format' }],
      warnings: [],
    });

    const { queryByText } = render(
      <CachedImage
        source={mockSource}
        style={mockStyle}
        showError={false}
      />
    );

    await waitFor(() => {
      expect(queryByText(/error/i)).toBeNull();
    });
  });
});
