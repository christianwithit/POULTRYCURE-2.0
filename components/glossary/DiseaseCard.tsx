import { useAccessibility, useAccessibleTextStyles } from '@/hooks/useAccessibility';
import { useComponentPerformance } from '@/hooks/usePerformanceOptimization';
import { formatListForScreenReader, getCategoryAccessibilityLabel, getDiseaseActionHint, getSeverityAccessibilityLabel } from '@/utils/accessibility';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Animated,
    Share,
} from 'react-native';
import { BORDER_RADIUS, COLORS, FONT_SIZES, SHADOWS, SPACING } from '../../constants/theme';
import { ExtendedDiseaseInfo } from '../../types/types';
import AccessibleText from './AccessibleText';
import ShareButton from './ShareButton';

interface DiseaseCardProps {
  disease: ExtendedDiseaseInfo;
  onPress: () => void;
  isBookmarked?: boolean;
  onBookmarkToggle?: () => void;
  showShareButton?: boolean;
  onShareComplete?: (success: boolean) => void;
}

const DiseaseCard = React.memo(function DiseaseCard({
  disease,
  onPress,
  isBookmarked = false,
  onBookmarkToggle,
  showShareButton = false,
  onShareComplete,
}: DiseaseCardProps) {
  const { renderCount } = useComponentPerformance('DiseaseCard');
  const [scaleAnim] = useState(new Animated.Value(1));
  const [bookmarkScaleAnim] = useState(new Animated.Value(1));
  const [shareScaleAnim] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 3,
      tension: 40,
    }).start();
  };

  const handleBookmarkPressIn = () => {
    Animated.spring(bookmarkScaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  const handleBookmarkPressOut = () => {
    Animated.spring(bookmarkScaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 3,
      tension: 40,
    }).start();
  };

  const handleSharePressIn = () => {
    Animated.spring(shareScaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  const handleSharePressOut = () => {
    Animated.spring(shareScaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 3,
      tension: 40,
    }).start();
  };

  const handleBookmarkToggle = () => {
    if (onBookmarkToggle) {
      onBookmarkToggle();
    }
  };

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: `${disease.name}\n\n${disease.description}\n\nSymptoms: ${disease.symptoms.slice(0, 3).join(', ')}\n\nLearn more about poultry diseases with PoultryCure.`,
        title: disease.name,
      });
      
      if (onShareComplete) {
        onShareComplete(result.action === Share.sharedAction);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      if (onShareComplete) {
        onShareComplete(false);
      }
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'low':
        return COLORS.success;
      case 'moderate':
        return COLORS.warning;
      case 'high':
        return COLORS.error;
      default:
        return COLORS.textMuted;
    }
  };

  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case 'viral':
        return 'bug';
      case 'bacterial':
        return 'cellular';
      case 'parasitic':
        return 'eye';
      case 'nutritional':
        return 'nutrition';
      case 'fungal':
        return 'leaf';
      case 'environmental':
        return 'home';
      default:
        return 'medical';
    }
  };

  const getTransmissionIcon = (contagiousness: string): string => {
    switch (contagiousness) {
      case 'high':
        return 'warning';
      case 'moderate':
        return 'alert-circle';
      case 'low':
        return 'checkmark-circle';
      default:
        return 'information-circle';
    }
  };

  const getTransmissionColor = (contagiousness: string): string => {
    switch (contagiousness) {
      case 'high':
        return COLORS.error;
      case 'moderate':
        return COLORS.warning;
      case 'low':
        return COLORS.success;
      default:
        return COLORS.textMuted;
    }
  };

  const getAccessibilityLabel = () => {
    const categoryText = getCategoryAccessibilityLabel(disease.category);
    const severityText = getSeverityAccessibilityLabel(disease.severity);
    const speciesText = `Common in ${formatListForScreenReader(disease.commonIn)}`;
    const symptomsText = `Symptoms include ${formatListForScreenReader(disease.symptoms.slice(0, 3))}`;
    const transmissionText = `${disease.transmission.contagiousness} contagiousness risk`;
    
    return `${disease.name}. ${categoryText}. ${severityText}. ${speciesText}. ${symptomsText}. ${transmissionText}`;
  };

  const getAccessibilityHint = () => {
    return getDiseaseActionHint('view', disease.name);
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={[
          styles.diseaseCard,
          disease.severity === 'high' && styles.diseaseCardHighSeverity,
          disease.severity === 'moderate' && styles.diseaseCardModerateSeverity,
          disease.severity === 'low' && styles.diseaseCardLowSeverity,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={getAccessibilityLabel()}
        accessibilityHint={getAccessibilityHint()}
      >
        <View style={styles.diseaseHeader}>
          <View style={styles.diseaseInfo}>
            <View style={styles.titleRow}>
              <AccessibleText 
                variant="subheader"
                style={styles.diseaseName}
                numberOfLines={1}
                semanticRole="header"
                highContrastColor={COLORS.text}
                scalable={true}
              >
                {disease.name}
              </AccessibleText>
              <View 
                style={styles.actionButtons}
                accessible={false}
              >
                {showShareButton && (
                  <ShareButton
                    disease={disease}
                    variant="icon"
                    size="small"
                    showLabel={false}
                    quickShare={true}
                    onShareComplete={onShareComplete}
                  />
                )}
                {onBookmarkToggle && (
                  <Animated.View style={{ transform: [{ scale: bookmarkScaleAnim }] }}>
                    <TouchableOpacity
                      style={styles.bookmarkButton}
                      onPress={handleBookmarkToggle}
                      onPressIn={handleBookmarkPressIn}
                      onPressOut={handleBookmarkPressOut}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={isBookmarked ? `Remove ${disease.name} from bookmarks` : `Add ${disease.name} to bookmarks`}
                      accessibilityHint={isBookmarked ? 'Remove this disease from your saved list' : 'Save this disease for quick access later'}
                    >
                      <Ionicons
                        name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                        size={20}
                        color={isBookmarked ? COLORS.primary : COLORS.textMuted}
                        accessible={false}
                      />
                    </TouchableOpacity>
                  </Animated.View>
                )}
              </View>
            </View>
            <View 
              style={styles.categoryRow}
              accessible={false}
            >
              <Ionicons
                name={getCategoryIcon(disease.category) as any}
                size={14}
                color={COLORS.primary}
                accessible={false}
              />
              <Text 
                style={styles.diseaseCategory}
                accessible={false}
              >
                {disease.category.charAt(0).toUpperCase() + disease.category.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        <View 
          style={styles.severityRow}
          accessible={false}
        >
          <View style={styles.severityContainer}>
            <View
              style={[
                styles.severityIndicator,
                { backgroundColor: getSeverityColor(disease.severity) },
              ]}
              accessible={false}
            />
            <Text 
              style={styles.severityText}
              accessible={false}
            >
              {disease.severity.charAt(0).toUpperCase() + disease.severity.slice(1)} Severity
            </Text>
          </View>
          <View 
            style={styles.transmissionBadge}
            accessible={false}
          >
            <Ionicons
              name={getTransmissionIcon(disease.transmission.contagiousness) as any}
              size={12}
              color={getTransmissionColor(disease.transmission.contagiousness)}
              style={styles.transmissionIcon}
              accessible={false}
            />
            <Text 
              style={styles.transmissionText}
              accessible={false}
            >
              {disease.transmission.contagiousness.charAt(0).toUpperCase() + 
               disease.transmission.contagiousness.slice(1)} Risk
            </Text>
          </View>
        </View>

        <Text 
          style={styles.diseaseDescription} 
          numberOfLines={2}
          accessible={false}
        >
          {disease.description}
        </Text>

        <View 
          style={styles.symptomsPreview}
          accessible={false}
        >
          <Text 
            style={styles.symptomsLabel}
            accessible={false}
          >
            Common Symptoms:
          </Text>
          <View style={styles.symptomsList}>
            {disease.symptoms.slice(0, 4).map((symptom, index) => (
              <Text key={index} style={styles.symptomItem}>
                • {symptom}
              </Text>
            ))}
            {disease.symptoms.length > 4 && (
              <Text style={styles.moreSymptomsText}>
                +{disease.symptoms.length - 4} more symptoms
              </Text>
            )}
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.cardActions}>
            {showShareButton && (
              <ShareButton
                disease={disease}
                variant="icon"
                size="small"
                showLabel={false}
                quickShare={true}
                onShareComplete={onShareComplete}
              />
            )}
            {onBookmarkToggle && (
              <Animated.View style={{ transform: [{ scale: bookmarkScaleAnim }] }}>
                <TouchableOpacity
                  style={styles.bookmarkButton}
                  onPress={handleBookmarkToggle}
                  onPressIn={handleBookmarkPressIn}
                  onPressOut={handleBookmarkPressOut}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={isBookmarked ? `Remove ${disease.name} from bookmarks` : `Add ${disease.name} to bookmarks`}
                  accessibilityHint={isBookmarked ? 'Remove this disease from your saved list' : 'Save this disease for quick access later'}
                >
                  <Ionicons
                    name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                    size={20}
                    color={isBookmarked ? COLORS.primary : COLORS.textMuted}
                    accessible={false}
                  />
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
          
          <View 
            style={styles.transmissionBadge}
            accessible={false}
          >
            <Ionicons
              name={getTransmissionIcon(disease.transmission.contagiousness) as any}
              size={12}
              color={getTransmissionColor(disease.transmission.contagiousness)}
              style={styles.transmissionIcon}
              accessible={false}
            />
            <Text 
              style={styles.transmissionText}
              accessible={false}
            >
              {disease.transmission.contagiousness.charAt(0).toUpperCase() + 
               disease.transmission.contagiousness.slice(1)} Risk
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  diseaseCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  diseaseCardHighSeverity: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  diseaseCardModerateSeverity: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  diseaseCardLowSeverity: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  diseaseHeader: {
    marginBottom: SPACING.sm,
  },
  diseaseInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  diseaseName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
    marginRight: SPACING.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  bookmarkButton: {
    padding: SPACING.xs,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  diseaseCategory: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  severityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  severityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  severityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  severityText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: '600',
  },
  transmissionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  transmissionIcon: {
    marginRight: 2,
  },
  transmissionText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  diseaseDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  symptomsPreview: {
    marginBottom: SPACING.sm,
  },
  symptomsLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  symptomsList: {
    gap: 2,
  },
  symptomItem: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  moreSymptomsText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: SPACING.xs,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
});

export default DiseaseCard;
