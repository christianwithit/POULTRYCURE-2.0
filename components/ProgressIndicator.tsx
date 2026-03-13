import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT_SIZES, SPACING } from '../constants/theme';

interface Step {
  id: string;
  title: string;
  description?: string;
}

interface ProgressIndicatorProps {
  steps: Step[];
  currentStep: number;
  style?: any;
}

export function ProgressIndicator({ steps, currentStep, style }: ProgressIndicatorProps) {
  const getStepStatus = (index: number) => {
    if (index < currentStep) return 'completed';
    if (index === currentStep) return 'current';
    return 'upcoming';
  };

  const getStepIcon = (index: number, status: string) => {
    switch (status) {
      case 'completed':
        return <Ionicons name="checkmark" size={16} color={COLORS.white} />;
      case 'current':
        return <Text style={styles.stepNumber}>{index + 1}</Text>;
      case 'upcoming':
        return <Text style={styles.stepNumberUpcoming}>{index + 1}</Text>;
      default:
        return <Text style={styles.stepNumber}>{index + 1}</Text>;
    }
  };

  const getStepCircleStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return [styles.stepCircle, styles.stepCircleCompleted];
      case 'current':
        return [styles.stepCircle, styles.stepCircleCurrent];
      case 'upcoming':
        return [styles.stepCircle, styles.stepCircleUpcoming];
      default:
        return [styles.stepCircle];
    }
  };

  const getConnectorStyle = (index: number) => {
    const status = getStepStatus(index);
    return [
      styles.connector,
      status === 'completed' ? styles.connectorCompleted : styles.connectorUpcoming,
    ];
  };

  return (
    <View style={[styles.container, style]}>
      {steps.map((step, index) => {
        const status = getStepStatus(index);
        const isLast = index === steps.length - 1;

        return (
          <View key={step.id} style={styles.stepContainer}>
            <View style={styles.stepIndicator}>
              <View style={getStepCircleStyle(status)}>
                {getStepIcon(index, status)}
              </View>
              {!isLast && <View style={getConnectorStyle(index)} />}
            </View>
            
            <View style={styles.stepContent}>
              <Text style={[
                styles.stepTitle,
                status === 'current' && styles.stepTitleCurrent,
                status === 'upcoming' && styles.stepTitleUpcoming,
              ]}>
                {step.title}
              </Text>
              {step.description && (
                <Text style={[
                  styles.stepDescription,
                  status === 'upcoming' && styles.stepDescriptionUpcoming,
                ]}>
                  {step.description}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.md,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  stepIndicator: {
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  stepCircleCompleted: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  stepCircleCurrent: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  stepCircleUpcoming: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
  },
  stepNumber: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.white,
  },
  stepNumberUpcoming: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  connector: {
    width: 2,
    height: 24,
    marginTop: SPACING.xs,
  },
  connectorCompleted: {
    backgroundColor: COLORS.success,
  },
  connectorUpcoming: {
    backgroundColor: COLORS.border,
  },
  stepContent: {
    flex: 1,
    paddingTop: SPACING.xs,
  },
  stepTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  stepTitleCurrent: {
    color: COLORS.primary,
  },
  stepTitleUpcoming: {
    color: COLORS.textMuted,
  },
  stepDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    lineHeight: 18,
  },
  stepDescriptionUpcoming: {
    color: COLORS.textMuted,
  },
});