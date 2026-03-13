import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BORDER_RADIUS, COLORS, FONT_SIZES, SPACING } from '../constants/theme';
import { AppError, ErrorHandler, ErrorType } from '../utils/errorHandling';

interface ErrorDisplayProps {
  error: AppError | Error | string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  style?: any;
  context?: 'search' | 'filter' | 'bookmark' | 'load' | 'share' | 'general';
  partialData?: {
    available: boolean;
    count?: number;
    type?: string;
  };
}

export function ErrorDisplay({ error, onRetry, onDismiss, style, context = 'general', partialData }: ErrorDisplayProps) {
  if (!error) return null;

  const appError = typeof error === 'string' || error instanceof Error 
    ? ErrorHandler.mapError(error) 
    : error;

  const getErrorIcon = () => {
    switch (appError.type) {
      case ErrorType.NETWORK:
        return 'wifi-outline';
      case ErrorType.AUTHENTICATION:
        return 'lock-closed-outline';
      case ErrorType.VALIDATION:
        return 'alert-circle-outline';
      case ErrorType.STORAGE:
        return 'save-outline';
      case ErrorType.PERMISSION:
        return 'shield-outline';
      default:
        return 'warning-outline';
    }
  };

  const getErrorColor = () => {
    switch (appError.type) {
      case ErrorType.NETWORK:
        return COLORS.warning;
      case ErrorType.VALIDATION:
        return COLORS.warning;
      default:
        return COLORS.error;
    }
  };

  const getContextSpecificMessage = () => {
    const baseMessage = ErrorHandler.getUserMessage(appError);
    
    switch (context) {
      case 'search':
        return `${baseMessage} Search results may be incomplete.`;
      case 'filter':
        return `${baseMessage} Filters may not be applied correctly.`;
      case 'bookmark':
        return `${baseMessage} Your bookmark changes may not be saved.`;
      case 'load':
        return `${baseMessage} Some disease information may not be available.`;
      case 'share':
        return `${baseMessage} Unable to share disease information.`;
      default:
        return baseMessage;
    }
  };

  const getContextSpecificHint = () => {
    switch (context) {
      case 'search':
        return 'Try checking your internet connection or search again.';
      case 'filter':
        return 'Try adjusting your filters or check your connection.';
      case 'bookmark':
        return 'Try saving the bookmark again or check your login status.';
      case 'load':
        return 'Pull to refresh or check your internet connection.';
      case 'share':
        return 'Try sharing again or use a different method.';
      default:
        return 'Try again or contact support if the problem persists.';
    }
  };

  return (
    <View style={[styles.container, { borderColor: getErrorColor() }, style]}>
      <View style={styles.header}>
        <Ionicons 
          name={getErrorIcon()} 
          size={20} 
          color={getErrorColor()} 
          style={styles.icon}
        />
        <View style={styles.messageContainer}>
          <Text style={[styles.message, { color: getErrorColor() }]}>
            {getContextSpecificMessage()}
          </Text>
          <Text style={styles.hint}>
            {getContextSpecificHint()}
          </Text>
          {partialData?.available && (
            <Text style={styles.partialDataText}>
              {partialData.count} {partialData.type || 'items'} still available
            </Text>
          )}
        </View>
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
            <Ionicons name="close" size={16} color={getErrorColor()} />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.actions}>
        {ErrorHandler.isRetryable(appError) && onRetry && (
          <TouchableOpacity 
            style={[styles.retryButton, { borderColor: getErrorColor() }]} 
            onPress={onRetry}
          >
            <Ionicons name="refresh" size={16} color={getErrorColor()} />
            <Text style={[styles.retryText, { color: getErrorColor() }]}>
              Try Again
            </Text>
          </TouchableOpacity>
        )}
        
        {context === 'search' && (
          <TouchableOpacity 
            style={[styles.secondaryButton, { borderColor: getErrorColor() }]} 
            onPress={() => {/* Navigate to browse */}}
          >
            <Ionicons name="list" size={16} color={getErrorColor()} />
            <Text style={[styles.secondaryText, { color: getErrorColor() }]}>
              Browse All
            </Text>
          </TouchableOpacity>
        )}
        
        {context === 'filter' && (
          <TouchableOpacity 
            style={[styles.secondaryButton, { borderColor: getErrorColor() }]} 
            onPress={() => {/* Clear filters */}}
          >
            <Ionicons name="filter-outline" size={16} color={getErrorColor()} />
            <Text style={[styles.secondaryText, { color: getErrorColor() }]}>
              Clear Filters
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginVertical: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  messageContainer: {
    flex: 1,
  },
  message: {
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
    marginBottom: SPACING.xs,
  },
  hint: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    lineHeight: 16,
  },
  partialDataText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.success,
    fontWeight: '600',
    marginTop: SPACING.xs,
  },
  dismissButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    flex: 1,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    flex: 1,
    backgroundColor: COLORS.background,
  },
  retryText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  secondaryText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    marginLeft: SPACING.xs,
  },
});