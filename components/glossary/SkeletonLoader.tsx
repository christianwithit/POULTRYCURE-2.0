import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';

interface SkeletonLoaderProps {
  count?: number;
  showHeader?: boolean;
}

export default function SkeletonLoader({ count = 3, showHeader = true }: SkeletonLoaderProps) {
  const shimmerAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    shimmerAnimation.start();
    return () => shimmerAnimation.stop();
  }, [shimmerAnim]);

  const shimmerColors = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.background, '#f0f0f0'],
  });

  const renderSkeletonCard = () => (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonHeader}>
        <Animated.View 
          style={[
            styles.skeletonCategory,
            { backgroundColor: shimmerColors }
          ]} 
        />
        <Animated.View 
          style={[
            styles.skeletonSeverity,
            { backgroundColor: shimmerColors }
          ]} 
        />
      </View>
      <Animated.View 
        style={[
          styles.skeletonTitle,
          { backgroundColor: shimmerColors }
        ]} 
      />
      <Animated.View 
        style={[
          styles.skeletonDescription,
          { backgroundColor: shimmerColors }
        ]} 
      />
      <View style={styles.skeletonSymptoms}>
        <Animated.View 
          style={[
            styles.skeletonSymptom,
            { backgroundColor: shimmerColors }
          ]} 
        />
        <Animated.View 
          style={[
            styles.skeletonSymptom,
            { backgroundColor: shimmerColors }
          ]} 
        />
        <Animated.View 
          style={[
            styles.skeletonSymptom,
            { backgroundColor: shimmerColors }
          ]} 
        />
      </View>
      <View style={styles.skeletonFooter}>
        <View style={styles.skeletonActions}>
          <Animated.View 
            style={[
              styles.skeletonButton,
              { backgroundColor: shimmerColors }
            ]} 
          />
          <Animated.View 
            style={[
              styles.skeletonButton,
              { backgroundColor: shimmerColors }
            ]} 
          />
        </View>
        <Animated.View 
          style={[
            styles.skeletonSpecies,
            { backgroundColor: shimmerColors }
          ]} 
        />
      </View>
    </View>
  );

  const renderSkeletonHeader = () => (
    <View style={styles.skeletonPageHeader}>
      <Animated.View 
        style={[
          styles.skeletonPageTitle,
          { backgroundColor: shimmerColors }
        ]} 
      />
      <Animated.View 
        style={[
          styles.skeletonPageSubtitle,
          { backgroundColor: shimmerColors }
        ]} 
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {showHeader && renderSkeletonHeader()}
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={styles.skeletonWrapper}>
          {renderSkeletonCard()}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.md,
  },
  skeletonWrapper: {
    marginBottom: SPACING.md,
  },
  skeletonCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  skeletonCategory: {
    width: 80,
    height: 24,
    borderRadius: BORDER_RADIUS.sm,
  },
  skeletonSeverity: {
    width: 60,
    height: 24,
    borderRadius: BORDER_RADIUS.sm,
  },
  skeletonTitle: {
    width: '70%',
    height: 24,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  skeletonDescription: {
    width: '100%',
    height: 16,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  skeletonSymptoms: {
    marginBottom: SPACING.sm,
  },
  skeletonSymptom: {
    width: '100%',
    height: 14,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.xs,
  },
  skeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  skeletonButton: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.sm,
  },
  skeletonSpecies: {
    width: 100,
    height: 20,
    borderRadius: BORDER_RADIUS.sm,
  },
  skeletonPageHeader: {
    marginBottom: SPACING.lg,
  },
  skeletonPageTitle: {
    width: '50%',
    height: 28,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  skeletonPageSubtitle: {
    width: '70%',
    height: 16,
    borderRadius: BORDER_RADIUS.sm,
  },
});
