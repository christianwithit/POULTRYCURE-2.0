// components/diagnosis/DiagnosisCard.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DiagnosisResult } from '../../types/types';
import { BORDER_RADIUS, COLORS, FONT_SIZES, LINE_HEIGHT, SPACING, SHADOWS } from '../../constants/theme';
import { CachedImage } from '../images/CachedImage';

interface DiagnosisCardProps {
  diagnosis: DiagnosisResult;
  onPress?: (diagnosis: DiagnosisResult) => void;
  onDelete?: (diagnosisId: string) => void;
  showImage?: boolean;
  compact?: boolean;
}

export const DiagnosisCard: React.FC<DiagnosisCardProps> = ({
  diagnosis,
  onPress,
  onDelete,
  showImage = true,
  compact = false,
}) => {
  const handleDelete = () => {
    if (onDelete) {
      Alert.alert(
        'Delete Diagnosis',
        'Are you sure you want to delete this diagnosis? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => onDelete(diagnosis.id),
          },
        ]
      );
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return COLORS.error;
      case 'moderate':
        return COLORS.warning;
      case 'low':
        return COLORS.success;
      default:
        return COLORS.textLight;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const CardContent = () => (
    <View style={[styles.card, compact && styles.cardCompact]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.typeIndicator, diagnosis.type === 'image' && styles.imageIndicator]}>
            <Ionicons
              name={diagnosis.type === 'image' ? 'camera' : 'chatbubble'}
              size={16}
              color={COLORS.white}
            />
          </View>
          <Text style={styles.date}>{formatDate(diagnosis.date)}</Text>
        </View>
        
        <View style={styles.headerRight}>
          <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(diagnosis.severity) }]}>
            <Text style={styles.severityText}>{diagnosis.severity.toUpperCase()}</Text>
          </View>
          
          {onDelete && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="trash-outline" size={20} color={COLORS.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Image Display */}
      {showImage && diagnosis.type === 'image' && (diagnosis.imageUrl || (diagnosis as any).image_url) && (
        <View style={styles.imageContainer}>
          <CachedImage
            source={diagnosis.imageUrl || (diagnosis as any).image_url}
            style={styles.image}
            cacheKey={`diagnosis-${diagnosis.id}`}
            showLoading={true}
            showError={true}
            placeholder="Loading diagnosis image..."
          />
          {diagnosis.imageMetadata && (
            <View style={styles.imageInfo}>
              <Text style={styles.imageInfoText}>
                {diagnosis.imageMetadata.dimensions.width} × {diagnosis.imageMetadata.dimensions.height}
                {diagnosis.imageMetadata.compressedSize && 
                  ` • ${Math.round(diagnosis.imageMetadata.compressedSize / 1024)}KB`
                }
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Diagnosis Content */}
      <View style={styles.content}>
        <Text style={styles.diagnosis} numberOfLines={compact ? 2 : 0}>
          {diagnosis.diagnosis}
        </Text>
        
        {!compact && diagnosis.recommendations && diagnosis.recommendations.length > 0 && (
          <View style={styles.recommendations}>
            <Text style={styles.recommendationsTitle}>Recommendations:</Text>
            {diagnosis.recommendations.slice(0, 3).map((recommendation, index) => (
              <Text key={index} style={styles.recommendation}>
                • {recommendation}
              </Text>
            ))}
            {diagnosis.recommendations.length > 3 && (
              <Text style={styles.moreText}>
                +{diagnosis.recommendations.length - 3} more...
              </Text>
            )}
          </View>
        )}

        {diagnosis.confidence && (
          <View style={styles.confidenceContainer}>
            <Text style={styles.confidenceLabel}>Confidence:</Text>
            <View style={styles.confidenceBar}>
              <View
                style={[
                  styles.confidenceFill,
                  { width: `${Math.min(diagnosis.confidence * 100, 100)}%` }
                ]}
              />
            </View>
            <Text style={styles.confidenceText}>
              {Math.round(diagnosis.confidence * 100)}%
            </Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Ionicons name="time-outline" size={14} color={COLORS.textLight} />
          <Text style={styles.footerText}>
            {new Date(diagnosis.date).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </Text>
        </View>
        
        {diagnosis.type === 'symptom' && (
          <View style={styles.footerItem}>
            <Ionicons name="chatbubble-outline" size={14} color={COLORS.textLight} />
            <Text style={styles.footerText}>
              {diagnosis.input.length > 30 
                ? `${diagnosis.input.substring(0, 30)}...`
                : diagnosis.input
              }
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={() => onPress(diagnosis)} activeOpacity={0.7}>
        <CardContent />
      </TouchableOpacity>
    );
  }

  return <CardContent />;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  cardCompact: {
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  imageIndicator: {
    backgroundColor: COLORS.success,
  },
  date: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  severityBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.sm,
  },
  severityText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.white,
  },
  deleteButton: {
    padding: SPACING.xs,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  imageInfo: {
    position: 'absolute',
    bottom: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  imageInfoText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
    fontWeight: '500',
  },
  content: {
    padding: SPACING.md,
  },
  diagnosis: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    lineHeight: FONT_SIZES.md * LINE_HEIGHT.sm,
  },
  recommendations: {
    marginTop: SPACING.sm,
  },
  recommendationsTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  recommendation: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
    lineHeight: FONT_SIZES.sm * LINE_HEIGHT.sm,
  },
  moreText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.secondary,
    fontStyle: 'italic',
    marginTop: SPACING.xs,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  confidenceLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    marginRight: SPACING.sm,
    minWidth: 70,
  },
  confidenceBar: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.background,
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: 3,
  },
  confidenceText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: '600',
    marginLeft: SPACING.sm,
    minWidth: 35,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  footerText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
    marginLeft: SPACING.xs,
    flex: 1,
  },
});
