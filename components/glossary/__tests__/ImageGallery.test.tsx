import { render } from '@testing-library/react-native';
import React from 'react';
import { DiseaseImage } from '../../../types/types';
import ImageGallery from '../ImageGallery';

// Mock the ProgressiveImage component
jest.mock('../ProgressiveImage', () => {
  const { View, Text } = require('react-native');
  return function MockProgressiveImage({ source, fallbackText }: any) {
    return (
      <View testID="progressive-image">
        <Text>{source.uri || fallbackText}</Text>
      </View>
    );
  };
});

const mockImages: DiseaseImage[] = [
  {
    id: 'test-1',
    url: 'https://example.com/image1.jpg',
    caption: 'Test image 1 caption',
    type: 'symptom'
  },
  {
    id: 'test-2',
    url: 'https://example.com/image2.jpg',
    caption: 'Test image 2 caption',
    type: 'lesion'
  }
];

describe('ImageGallery', () => {
  it('renders correctly with images', () => {
    const { getByText, getAllByTestId } = render(
      <ImageGallery images={mockImages} diseaseName="Test Disease" />
    );

    // Check if section title is rendered
    expect(getByText('Visual Identification')).toBeTruthy();
    expect(getByText('Tap any image to view in full screen')).toBeTruthy();

    // Check if images are rendered
    const progressiveImages = getAllByTestId('progressive-image');
    expect(progressiveImages).toHaveLength(2);

    // Check if captions are rendered
    expect(getByText('Test image 1 caption')).toBeTruthy();
    expect(getByText('Test image 2 caption')).toBeTruthy();
  });

  it('renders no images state correctly', () => {
    const { getByText } = render(
      <ImageGallery images={[]} diseaseName="Test Disease" />
    );

    expect(getByText('No images available')).toBeTruthy();
    expect(getByText('Visual identification images for Test Disease are not currently available')).toBeTruthy();
  });

  it('handles undefined images array', () => {
    const { getByText } = render(
      <ImageGallery images={undefined as any} diseaseName="Test Disease" />
    );

    expect(getByText('No images available')).toBeTruthy();
  });
});