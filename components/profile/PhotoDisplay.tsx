// components/profile/PhotoDisplay.tsx
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BORDER_RADIUS, COLORS, FONT_SIZES, SPACING, SHADOWS } from '../../constants/theme';
import { CachedImage } from '../images/CachedImage';

interface PhotoDisplayProps {
  photoUrl?: string;
  name?: string;
  size?: 'small' | 'medium' | 'large';
  showStatus?: boolean;
  status?: 'online' | 'offline' | 'away';
  fallbackToInitials?: boolean;
}

export const PhotoDisplay: React.FC<PhotoDisplayProps> = ({
  photoUrl,
  name = 'User',
  size = 'medium',
  showStatus = false,
  status = 'offline',
  fallbackToInitials = true,
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: { width: 32, height: 32 },
          image: { width: 32, height: 32 },
          initials: { fontSize: FONT_SIZES.sm },
          status: { width: 8, height: 8, bottom: 0, right: 0 },
        };
      case 'large':
        return {
          container: { width: 100, height: 100 },
          image: { width: 100, height: 100 },
          initials: { fontSize: FONT_SIZES.title },
          status: { width: 20, height: 20, bottom: 2, right: 2 },
        };
      default: // medium
        return {
          container: { width: 48, height: 48 },
          image: { width: 48, height: 48 },
          initials: { fontSize: FONT_SIZES.lg },
          status: { width: 12, height: 12, bottom: 0, right: 0 },
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return COLORS.success;
      case 'away':
        return COLORS.warning;
      default:
        return COLORS.textLight;
    }
  };

  const renderContent = () => {
    if (photoUrl) {
      return (
        <CachedImage
          source={photoUrl}
          style={{
            width: sizeStyles.image.width,
            height: sizeStyles.image.height,
            borderRadius: 999,
          }}
          cacheKey={`profile-${name}`}
          showLoading={false}
          showError={false}
        />
      );
    }

    if (fallbackToInitials) {
      return (
        <View style={[styles.initialsContainer, sizeStyles.container]}>
          <Text style={[styles.initials, sizeStyles.initials]}>
            {getInitials(name)}
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.placeholderContainer, sizeStyles.container]}>
        <Ionicons name="person" size={size === 'large' ? 40 : size === 'medium' ? 24 : 16} color={COLORS.textLight} />
      </View>
    );
  };

  return (
    <View style={[styles.container, sizeStyles.container]}>
      {renderContent()}
      
      {showStatus && (
        <View style={[styles.statusIndicator, sizeStyles.status, { backgroundColor: getStatusColor() }]} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: 999, // Circular
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  photo: {
    borderRadius: 999,
  },
  initialsContainer: {
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999,
  },
  initials: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  placeholderContainer: {
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusIndicator: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
});
