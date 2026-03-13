import { useAccessibilityFocus } from '@/hooks/useAccessibility';
import { getImageTypeAccessibilityLabel } from '@/utils/accessibility';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BORDER_RADIUS, COLORS, FONT_SIZES, SPACING } from '../../constants/theme';
import { DiseaseImage } from '../../types/types';
import ProgressiveImage from './ProgressiveImage';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ImageGalleryProps {
  images: DiseaseImage[];
  diseaseName: string;
}

interface ImageViewerProps {
  visible: boolean;
  images: DiseaseImage[];
  initialIndex: number;
  onClose: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ visible, images, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const insets = useSafeAreaInsets();
  const { announceChange } = useAccessibilityFocus();

  const goToPrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
    setCurrentIndex(newIndex);
    const image = images[newIndex];
    announceChange(`Viewing image ${newIndex + 1} of ${images.length}: ${getImageTypeAccessibilityLabel(image.type, image.caption)}`);
  };

  const goToNext = () => {
    const newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(newIndex);
    const image = images[newIndex];
    announceChange(`Viewing image ${newIndex + 1} of ${images.length}: ${getImageTypeAccessibilityLabel(image.type, image.caption)}`);
  };

  const getImageTypeIcon = (type: string) => {
    switch (type) {
      case 'symptom':
        return 'medical';
      case 'lesion':
        return 'eye';
      case 'microscopic':
        return 'search';
      case 'treatment':
        return 'bandage';
      default:
        return 'image';
    }
  };

  const getImageTypeColor = (type: string) => {
    switch (type) {
      case 'symptom':
        return COLORS.error;
      case 'lesion':
        return COLORS.warning;
      case 'microscopic':
        return COLORS.primary;
      case 'treatment':
        return COLORS.success;
      default:
        return COLORS.textMuted;
    }
  };

  if (!visible || images.length === 0) return null;

  const currentImage = images[currentIndex];

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={onClose}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Close image viewer"
            accessibilityHint="Return to disease information"
          >
            <Ionicons 
              name="close" 
              size={24} 
              color={COLORS.white}
              accessible={false}
            />
          </TouchableOpacity>
          
          <View 
            style={styles.imageCounter}
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel={`Image ${currentIndex + 1} of ${images.length}`}
          >
            <Text 
              style={styles.counterText}
              accessible={false}
            >
              {currentIndex + 1} of {images.length}
            </Text>
          </View>
          
          <View style={styles.headerSpacer} />
        </View>

        {/* Image Container */}
        <View 
          style={styles.imageContainer}
          accessible={true}
          accessibilityRole="image"
          accessibilityLabel={getImageTypeAccessibilityLabel(currentImage.type, currentImage.caption)}
        >
          <ProgressiveImage
            source={{ uri: currentImage.url }}
            style={styles.fullImage}
            resizeMode="contain"
            fallbackText="This image could not be loaded"
            showLoadingIndicator={true}
            loadingSize="large"
            accessible={true}
            accessibilityRole="image"
            accessibilityLabel={getImageTypeAccessibilityLabel(currentImage.type, currentImage.caption)}
            errorComponent={
              <View 
                style={styles.errorContainer}
                accessible={true}
                accessibilityRole="text"
                accessibilityLabel="Image not available. This image could not be loaded"
              >
                <Ionicons 
                  name="image-outline" 
                  size={64} 
                  color={COLORS.white}
                  accessible={false}
                />
                <Text 
                  style={styles.errorText}
                  accessible={false}
                >
                  Image not available
                </Text>
                <Text 
                  style={styles.errorSubtext}
                  accessible={false}
                >
                  This image could not be loaded
                </Text>
              </View>
            }
          />

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <TouchableOpacity 
                style={styles.navButtonLeft} 
                onPress={goToPrevious}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Previous image"
                accessibilityHint={`View previous image, currently showing ${currentIndex + 1} of ${images.length}`}
              >
                <Ionicons 
                  name="chevron-back" 
                  size={32} 
                  color={COLORS.white}
                  accessible={false}
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.navButtonRight} 
                onPress={goToNext}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Next image"
                accessibilityHint={`View next image, currently showing ${currentIndex + 1} of ${images.length}`}
              >
                <Ionicons 
                  name="chevron-forward" 
                  size={32} 
                  color={COLORS.white}
                  accessible={false}
                />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Image Info */}
        <View 
          style={styles.imageInfo}
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel={`Image details: ${getImageTypeAccessibilityLabel(currentImage.type, currentImage.caption)}`}
        >
          <View 
            style={styles.imageTypeContainer}
            accessible={false}
          >
            <Ionicons
              name={getImageTypeIcon(currentImage.type) as any}
              size={16}
              color={getImageTypeColor(currentImage.type)}
              accessible={false}
            />
            <Text 
              style={[styles.imageType, { color: getImageTypeColor(currentImage.type) }]}
              accessible={false}
            >
              {currentImage.type.charAt(0).toUpperCase() + currentImage.type.slice(1)}
            </Text>
          </View>
          
          <Text 
            style={styles.imageCaption}
            accessible={false}
          >
            {currentImage.caption}
          </Text>
        </View>

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.thumbnailStrip}
            contentContainerStyle={styles.thumbnailContainer}
            accessible={true}
            accessibilityRole="list"
            accessibilityLabel="Image thumbnails"
          >
            {images.map((image, index) => (
              <TouchableOpacity
                key={image.id}
                style={[
                  styles.thumbnail,
                  index === currentIndex && styles.activeThumbnail
                ]}
                onPress={() => {
                  setCurrentIndex(index);
                  announceChange(`Viewing image ${index + 1} of ${images.length}: ${getImageTypeAccessibilityLabel(image.type, image.caption)}`);
                }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`View image ${index + 1}: ${getImageTypeAccessibilityLabel(image.type, image.caption)}`}
                accessibilityState={{ selected: index === currentIndex }}
              >
                <ProgressiveImage
                  source={{ uri: image.url }}
                  style={styles.thumbnailImage}
                  resizeMode="cover"
                  showLoadingIndicator={false}
                  accessible={false}
                  errorComponent={
                    <View style={styles.thumbnailError}>
                      <Ionicons 
                        name="image-outline" 
                        size={20} 
                        color={COLORS.textMuted}
                        accessible={false}
                      />
                    </View>
                  }
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, diseaseName }) => {
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { announceChange } = useAccessibilityFocus();

  const handleImagePress = (index: number) => {
    setSelectedIndex(index);
    setViewerVisible(true);
    const image = images[index];
    announceChange(`Opening full screen view for ${getImageTypeAccessibilityLabel(image.type, image.caption)}`);
  };

  const getImageTypeIcon = (type: string) => {
    switch (type) {
      case 'symptom':
        return 'medical';
      case 'lesion':
        return 'eye';
      case 'microscopic':
        return 'search';
      case 'treatment':
        return 'bandage';
      default:
        return 'image';
    }
  };

  const getImageTypeColor = (type: string) => {
    switch (type) {
      case 'symptom':
        return COLORS.error;
      case 'lesion':
        return COLORS.warning;
      case 'microscopic':
        return COLORS.primary;
      case 'treatment':
        return COLORS.success;
      default:
        return COLORS.textMuted;
    }
  };

  if (!images || images.length === 0) {
    return (
      <View style={styles.noImagesContainer}>
        <Ionicons name="image-outline" size={48} color={COLORS.textMuted} />
        <Text style={styles.noImagesText}>No images available</Text>
        <Text style={styles.noImagesSubtext}>
          Visual identification images for {diseaseName} are not currently available
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Visual Identification</Text>
      <Text style={styles.sectionSubtitle}>
        Tap any image to view in full screen
      </Text>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.imageScroll}
        contentContainerStyle={styles.imageScrollContent}
        accessible={true}
        accessibilityRole="list"
        accessibilityLabel={`${images.length} disease identification images for ${diseaseName}`}
      >
        {images.map((image, index) => (
          <TouchableOpacity
            key={image.id}
            style={styles.imageCard}
            onPress={() => handleImagePress(index)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={getImageTypeAccessibilityLabel(image.type, image.caption)}
            accessibilityHint="Double tap to view full screen image with navigation controls"
          >
            <View style={styles.imageWrapper}>
              <ProgressiveImage
                source={{ uri: image.url }}
                style={styles.previewImage}
                resizeMode="cover"
                fallbackText="Image not available"
                showLoadingIndicator={true}
                loadingSize="small"
                accessible={true}
                accessibilityRole="image"
                accessibilityLabel={`${image.type} image showing ${image.caption}`}
              />
              
              <View 
                style={styles.imageOverlay}
                accessible={false}
              >
                <View 
                  style={styles.imageTypeTag}
                  accessible={false}
                >
                  <Ionicons
                    name={getImageTypeIcon(image.type) as any}
                    size={12}
                    color={COLORS.white}
                    accessible={false}
                  />
                  <Text 
                    style={styles.imageTypeText}
                    accessible={false}
                  >
                    {image.type.charAt(0).toUpperCase() + image.type.slice(1)}
                  </Text>
                </View>
              </View>
            </View>
            
            <Text 
              style={styles.imageCaption} 
              numberOfLines={2}
              accessible={false}
            >
              {image.caption}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ImageViewer
        visible={viewerVisible}
        images={images}
        initialIndex={selectedIndex}
        onClose={() => setViewerVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
  },
  imageScroll: {
    marginHorizontal: -SPACING.lg,
  },
  imageScrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingRight: SPACING.xl,
  },
  imageCard: {
    width: 200,
    marginRight: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageWrapper: {
    position: 'relative',
    height: 150,
    backgroundColor: COLORS.background,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  imageErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  imageErrorText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
  },
  imageTypeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    gap: SPACING.xs,
  },
  imageTypeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
    fontWeight: '600',
  },
  imageCaption: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    padding: SPACING.md,
    lineHeight: 18,
  },
  noImagesContainer: {
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
  },
  noImagesText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  noImagesSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  closeButton: {
    padding: SPACING.sm,
  },
  imageCounter: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
  },
  counterText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  fullImage: {
    width: screenWidth,
    height: screenHeight * 0.6,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.md,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginTop: SPACING.md,
  },
  errorSubtext: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    opacity: 0.7,
    marginTop: SPACING.xs,
  },
  navButtonLeft: {
    position: 'absolute',
    left: SPACING.lg,
    top: '50%',
    transform: [{ translateY: -16 }],
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: SPACING.sm,
  },
  navButtonRight: {
    position: 'absolute',
    right: SPACING.lg,
    top: '50%',
    transform: [{ translateY: -16 }],
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: SPACING.sm,
  },
  imageInfo: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  imageTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  imageType: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  thumbnailStrip: {
    maxHeight: 80,
  },
  thumbnailContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeThumbnail: {
    borderColor: COLORS.white,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailError: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});

export default ImageGallery;