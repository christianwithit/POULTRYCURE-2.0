import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { BORDER_RADIUS, COLORS, FONT_SIZES, SPACING } from '../../constants/theme';
import { ShareOptions, shareService } from '../../services/shareService';
import { ExtendedDiseaseInfo } from '../../types/types';
import ShareModal from './ShareModal';

interface ShareButtonProps {
  disease: ExtendedDiseaseInfo;
  variant?: 'icon' | 'button' | 'card';
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  onShareComplete?: (success: boolean) => void;
  quickShare?: boolean;
  shareOptions?: ShareOptions;
}

const ShareButton = React.memo(function ShareButton({
  disease,
  variant = 'button',
  size = 'medium',
  showLabel = true,
  onShareComplete,
  quickShare = false,
  shareOptions = {}
}: ShareButtonProps) {
  const [showShareModal, setShowShareModal] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const handlePress = async () => {
    if (quickShare) {
      await handleQuickShare();
    } else {
      setShowShareModal(true);
    }
  };

  const handleQuickShare = async () => {
    try {
      setIsSharing(true);
      
      const defaultOptions: ShareOptions = {
        shareFormat: 'basic',
        includeDisclaimer: true,
        ...shareOptions
      };

      const success = await shareService.shareDiseaseInfo(disease, defaultOptions);
      
      if (success) {
        Alert.alert('Success', 'Disease information shared successfully!');
        onShareComplete?.(true);
      } else {
        onShareComplete?.(false);
      }
    } catch (error) {
      console.error('Error sharing disease:', error);
      Alert.alert('Error', 'Failed to share disease information. Please try again.');
      onShareComplete?.(false);
    } finally {
      setIsSharing(false);
    }
  };

  const handleShareComplete = (success: boolean) => {
    onShareComplete?.(success);
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 16;
      case 'large':
        return 28;
      case 'medium':
      default:
        return 20;
    }
  };

  const getButtonStyle = () => {
    let buttonStyle = { ...styles.button };
    
    switch (variant) {
      case 'icon':
        buttonStyle = { ...buttonStyle, ...styles.iconButton };
        break;
      case 'card':
        buttonStyle = { ...buttonStyle, ...styles.cardButton };
        break;
      case 'button':
      default:
        buttonStyle = { ...buttonStyle, ...styles.defaultButton };
        break;
    }

    switch (size) {
      case 'small':
        buttonStyle = { ...buttonStyle, ...styles.smallButton };
        break;
      case 'large':
        buttonStyle = { ...buttonStyle, ...styles.largeButton };
        break;
      case 'medium':
      default:
        buttonStyle = { ...buttonStyle, ...styles.mediumButton };
        break;
    }

    if (isSharing) {
      buttonStyle = { ...buttonStyle, ...styles.disabledButton };
    }

    return buttonStyle;
  };

  const getTextStyle = () => {
    if (variant === 'icon') {
      return {}; // No text for icon variant
    }

    let textStyle = { ...styles.buttonText };
    
    switch (variant) {
      case 'card':
        textStyle = { ...textStyle, ...styles.cardButtonText };
        break;
      case 'button':
      default:
        textStyle = { ...textStyle, ...styles.defaultButtonText };
        break;
    }

    switch (size) {
      case 'small':
        textStyle = { ...textStyle, fontSize: FONT_SIZES.sm };
        break;
      case 'large':
        textStyle = { ...textStyle, fontSize: FONT_SIZES.lg };
        break;
    }

    return textStyle;
  };

  const renderButton = () => {
    const iconColor = variant === 'card' ? COLORS.primary : COLORS.white;
    const iconName = quickShare ? 'share-social' : 'share-outline';

    return (
      <TouchableOpacity
        style={getButtonStyle()}
        onPress={handlePress}
        disabled={isSharing}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={quickShare ? `Share ${disease.name} information` : `Open sharing options for ${disease.name}`}
        accessibilityHint={quickShare ? 'Share disease information using your device\'s sharing options' : 'Open detailed sharing options with customization'}
        accessibilityState={{ disabled: isSharing }}
      >
        <Ionicons
          name={iconName as any}
          size={getIconSize()}
          color={iconColor}
          accessible={false}
        />
        {showLabel && variant !== 'icon' && (
          <Text 
            style={getTextStyle()}
            accessible={false}
          >
            {isSharing ? 'Sharing...' : quickShare ? 'Share' : 'Share Options'}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View>
      {renderButton()}
      
      <ShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        disease={disease}
        onShareComplete={handleShareComplete}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.md,
  },
  defaultButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  iconButton: {
    backgroundColor: 'transparent',
    padding: SPACING.xs,
  },
  cardButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  smallButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  mediumButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  largeButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    fontWeight: '600',
    fontSize: FONT_SIZES.md,
  },
  defaultButtonText: {
    color: COLORS.white,
  },
  cardButtonText: {
    color: COLORS.primary,
  },
});

export default ShareButton;