import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    ImageProps,
    ImageStyle,
    StyleSheet,
    Text,
    View,
    ViewStyle
} from 'react-native';
import { COLORS, FONT_SIZES, SPACING } from '../../constants/theme';

interface ProgressiveImageProps extends Omit<ImageProps, 'source'> {
  source: { uri: string };
  style?: ImageStyle | ImageStyle[];
  containerStyle?: ViewStyle;
  placeholderStyle?: ViewStyle;
  showLoadingIndicator?: boolean;
  loadingSize?: 'small' | 'large';
  errorComponent?: React.ReactNode;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: () => void;
  fallbackText?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

interface ImageCacheEntry {
  uri: string;
  timestamp: number;
  loaded: boolean;
}

class ImageCache {
  private static instance: ImageCache;
  private cache: Map<string, ImageCacheEntry> = new Map();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  public static getInstance(): ImageCache {
    if (!ImageCache.instance) {
      ImageCache.instance = new ImageCache();
    }
    return ImageCache.instance;
  }

  public isImageCached(uri: string): boolean {
    const entry = this.cache.get(uri);
    if (!entry) return false;

    const isExpired = Date.now() - entry.timestamp > this.CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(uri);
      return false;
    }

    return entry.loaded;
  }

  public markImageAsLoaded(uri: string): void {
    this.cache.set(uri, {
      uri,
      timestamp: Date.now(),
      loaded: true
    });
  }

  public markImageAsError(uri: string): void {
    this.cache.set(uri, {
      uri,
      timestamp: Date.now(),
      loaded: false
    });
  }

  public clearExpiredEntries(): void {
    const now = Date.now();
    for (const [uri, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_DURATION) {
        this.cache.delete(uri);
      }
    }
  }

  public getCacheSize(): number {
    return this.cache.size;
  }

  public clearCache(): void {
    this.cache.clear();
  }
}

const imageCache = ImageCache.getInstance();

const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  source,
  style,
  containerStyle,
  placeholderStyle,
  showLoadingIndicator = true,
  loadingSize = 'small',
  errorComponent,
  onLoadStart,
  onLoadEnd,
  onError,
  fallbackText = 'Image not available',
  accessibilityLabel,
  accessibilityHint,
  ...imageProps
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    // Check if image is already cached
    if (imageCache.isImageCached(source.uri)) {
      setLoading(false);
      setImageLoaded(true);
      setError(false);
    } else {
      setLoading(true);
      setImageLoaded(false);
      setError(false);
    }
  }, [source.uri]);

  const handleLoadStart = () => {
    setLoading(true);
    setError(false);
    onLoadStart?.();
  };

  const handleLoadEnd = () => {
    setLoading(false);
    onLoadEnd?.();
  };

  const handleLoad = () => {
    setImageLoaded(true);
    setError(false);
    imageCache.markImageAsLoaded(source.uri);
    handleLoadEnd();
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
    setImageLoaded(false);
    imageCache.markImageAsError(source.uri);
    onError?.();
  };

  const renderPlaceholder = () => (
    <View 
      style={[styles.placeholder, placeholderStyle]}
      accessible={true}
      accessibilityRole={loading ? "progressbar" : error ? "text" : "none"}
      accessibilityLabel={
        loading 
          ? "Loading image" 
          : error 
            ? `Image failed to load: ${fallbackText}` 
            : undefined
      }
    >
      {showLoadingIndicator && loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator 
            size={loadingSize} 
            color={COLORS.primary}
            accessible={false}
          />
          <Text 
            style={styles.loadingText}
            accessible={false}
          >
            Loading...
          </Text>
        </View>
      )}
      
      {error && (
        <View style={styles.errorContainer}>
          {errorComponent || (
            <>
              <Ionicons 
                name="image-outline" 
                size={32} 
                color={COLORS.textMuted}
                accessible={false}
              />
              <Text 
                style={styles.errorText}
                accessible={false}
              >
                {fallbackText}
              </Text>
            </>
          )}
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, containerStyle]}>
      {!imageLoaded && renderPlaceholder()}
      
      <Image
        {...imageProps}
        source={source}
        style={[
          style,
          !imageLoaded && styles.hiddenImage
        ]}
        onLoadStart={handleLoadStart}
        onLoad={handleLoad}
        onError={handleError}
        accessible={imageLoaded && !error}
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel || fallbackText}
        accessibilityHint={accessibilityHint}
      />
    </View>
  );
};

// Hook for managing image cache
export const useImageCache = () => {
  const clearCache = () => {
    imageCache.clearCache();
  };

  const clearExpiredEntries = () => {
    imageCache.clearExpiredEntries();
  };

  const getCacheSize = () => {
    return imageCache.getCacheSize();
  };

  const isImageCached = (uri: string) => {
    return imageCache.isImageCached(uri);
  };

  return {
    clearCache,
    clearExpiredEntries,
    getCacheSize,
    isImageCached
  };
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  placeholder: {
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
  hiddenImage: {
    opacity: 0,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  errorContainer: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  errorText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});

export default ProgressiveImage;