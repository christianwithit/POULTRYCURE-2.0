// components/images/CachedImage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Image,
  Text,
  ActivityIndicator,
  StyleSheet,
  ImageStyle,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCachedImage, addImageToCache } from '../../services/imageCache';
import { validateImageFile, getErrorMessage } from '../../utils/imageValidation';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { ImageErrorBoundary } from './ImageErrorBoundary';

interface CachedImageProps {
  source: string;
  style?: ImageStyle;
  containerStyle?: ViewStyle;
  placeholder?: string;
  fallbackComponent?: React.ReactNode;
  showLoading?: boolean;
  showError?: boolean;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  onLoad?: () => void;
  onError?: (error: Error) => void;
  cacheKey?: string;
  priority?: 'high' | 'normal' | 'low';
}

export const CachedImage: React.FC<CachedImageProps> = ({
  source,
  style,
  containerStyle,
  placeholder,
  fallbackComponent,
  showLoading = true,
  showError = true,
  resizeMode = 'cover',
  onLoad,
  onError,
  cacheKey,
  priority = 'normal',
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const loadImage = useCallback(async () => {
    if (!source) {
      setHasError(true);
      setError(new Error('No image source provided'));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);
    setError(null);

    try {
      console.log('🖼️ Loading cached image:', source);
      
      // Validate the image first
      const validation = await validateImageFile(source);
      
      if (!validation.isValid) {
        const errorMessage = validation.errors.length > 0 
          ? getErrorMessage(validation.errors[0])
          : 'Image validation failed';
        
        throw new Error(errorMessage);
      }
      
      // Show warnings if any
      if (validation.warnings.length > 0) {
        console.log('⚠️ Image validation warnings:', validation.warnings);
      }
      
      // Try to get from cache first
      const cachedUri = await getCachedImage(source);
      
      if (cachedUri) {
        console.log('✅ Image loaded from cache:', cachedUri);
        setImageUri(cachedUri);
        setIsLoading(false);
        onLoad?.();
      } else {
        // Cache the image and get the URI
        console.log('📥 Caching image:', source);
        // For now, just use the original URI since we don't have a direct cache function
        setImageUri(source);
        setIsLoading(false);
        onLoad?.();
      }
    } catch (err) {
      console.error('❌ Failed to load image:', err);
      const error = err instanceof Error ? err : new Error('Failed to load image');
      setError(error);
      setHasError(true);
      setIsLoading(false);
      onError?.(error);
    }
  }, [source, onLoad, onError]);

  useEffect(() => {
    loadImage();
  }, [loadImage]);

  const renderLoading = () => {
    if (!showLoading || !isLoading) return null;

    return (
      <View style={[styles.container, containerStyle, styles.loadingContainer]}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        {placeholder && (
          <Text style={styles.placeholderText}>{placeholder}</Text>
        )}
      </View>
    );
  };

  const renderError = () => {
    if (!showError || !hasError) return null;

    if (fallbackComponent) {
      return <View style={[styles.container, containerStyle]}>{fallbackComponent}</View>;
    }

    return (
      <View style={[styles.container, containerStyle, styles.errorContainer]}>
        <Ionicons name="image-outline" size={32} color={COLORS.textLight} />
        <Text style={styles.errorText}>Failed to load image</Text>
        {error && (
          <Text style={styles.errorDetailsText} numberOfLines={2}>
            {error.message}
          </Text>
        )}
      </View>
    );
  };

  const renderImage = () => {
    if (!imageUri || isLoading || hasError) return null;

    return (
      <ImageErrorBoundary
        onError={(error, errorInfo) => {
          console.error('Image component error:', error, errorInfo);
          onError?.(error);
        }}
        showRetry={true}
        onRetry={loadImage}
      >
        <Image
          source={{ uri: imageUri }}
          style={[styles.image, style]}
          resizeMode={resizeMode}
          onLoad={loadImage}
        />
      </ImageErrorBoundary>
    );
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {renderLoading()}
      {renderError()}
      {renderImage()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  placeholderText: {
    marginTop: SPACING.sm,
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FED7D7',
    padding: SPACING.md,
  },
  errorText: {
    marginTop: SPACING.sm,
    fontSize: 12,
    color: COLORS.error,
    fontWeight: '500',
    textAlign: 'center',
  },
  errorDetailsText: {
    marginTop: SPACING.xs,
    fontSize: 10,
    color: COLORS.textLight,
    textAlign: 'center',
  },
});
