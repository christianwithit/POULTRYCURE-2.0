// app/(tabs)/history.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import SafeAreaContainer from '../../components/SafeAreaContainer';
import { BORDER_RADIUS, COLORS, FONT_SIZES, LINE_HEIGHT, SHADOWS, SPACING } from '../../constants/theme';
import { useDiagnosis } from '../../contexts/DiagnosisContext';
import { DiagnosisResult } from '../../types/types';

export default function History() {
  const { history, clearHistory, deleteDiagnosis, refreshHistory, syncError, clearSyncError, clearPendingQueue } = useDiagnosis();
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshHistory();
    setRefreshing(false);
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to delete all diagnosis records? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearHistory();
              Alert.alert('Success', 'All history has been cleared.');
            } catch {
              Alert.alert('Error', 'Failed to clear history. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleClearPendingQueue = () => {
    Alert.alert(
      'Clear Pending Sync',
      'Clear all pending sync operations? This will remove items that failed to sync.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Pending',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearPendingQueue();
              Alert.alert('Success', 'Pending sync queue has been cleared.');
            } catch {
              Alert.alert('Error', 'Failed to clear pending queue. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteItem = (id: string, diagnosis: string) => {
    Alert.alert(
      'Delete Record',
      `Delete diagnosis record for "${diagnosis}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDiagnosis(id);
            } catch {
              Alert.alert('Error', 'Failed to delete record. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleViewDetails = (id: string) => {
    router.push({
      pathname: '/diagnosis/result',
      params: { diagnosisId: id },
    });
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
        return COLORS.textMuted;
    }
  };

  const renderHistoryItem = ({ item }: { item: DiagnosisResult }) => {
    const severityColor = getSeverityColor(item.severity);
    const date = new Date(item.date);
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const formattedTime = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <TouchableOpacity
        style={styles.historyCard}
        onPress={() => handleViewDetails(item.id)}
        activeOpacity={0.7}
      >
        {item.imageUri && (
          <Image source={{ uri: item.imageUri }} style={styles.thumbnail} resizeMode="cover" />
        )}
        
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.typeIndicator}>
              <Ionicons
                name={item.type === 'symptom' ? 'pulse' : 'camera'}
                size={16}
                color={COLORS.white}
              />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.diagnosisName} numberOfLines={1}>
                {item.diagnosis}
              </Text>
              <Text style={styles.dateText}>
                {formattedDate} • {formattedTime}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteItem(item.id, item.diagnosis)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="trash-outline" size={20} color={COLORS.error} />
            </TouchableOpacity>
          </View>

          <Text style={styles.symptomsPreview} numberOfLines={2}>
            {item.input}
          </Text>

          <View style={styles.cardFooter}>
            <View style={[styles.severityBadge, { backgroundColor: `${severityColor}20` }]}>
              <Ionicons name="alert-circle" size={14} color={severityColor} />
              <Text style={[styles.severityText, { color: severityColor }]}>
                {item.severity.toUpperCase()}
              </Text>
            </View>
            
            <View style={styles.confidenceBadge}>
              <Ionicons name="speedometer-outline" size={14} color={COLORS.primary} />
              <Text style={styles.confidenceText}>{item.confidence}%</Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="document-text-outline" size={80} color={COLORS.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>No Diagnosis History</Text>
      <Text style={styles.emptyText}>
        Your diagnosis records will appear here once you start using the app.
      </Text>
      
      {/* Temporary button to clear pending queue */}
      <TouchableOpacity
        style={[styles.startButton, { backgroundColor: COLORS.warning, marginTop: SPACING.md }]}
        onPress={handleClearPendingQueue}
        activeOpacity={0.8}
      >
        <Ionicons name="refresh-circle-outline" size={22} color={COLORS.white} />
        <Text style={styles.startButtonText}>Clear Pending Sync</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.startButton}
        onPress={() => (router as any).push('/(tabs)')}
        activeOpacity={0.8}
      >
        <Ionicons name="add-circle-outline" size={22} color={COLORS.white} />
        <Text style={styles.startButtonText}>Start New Diagnosis</Text>
      </TouchableOpacity>
    </View>
  );

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  recordCount: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '600',
    lineHeight: FONT_SIZES.md * LINE_HEIGHT.sm,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
  },
  clearButtonText: {
    marginLeft: SPACING.xs,
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    fontWeight: '500',
    lineHeight: FONT_SIZES.sm * LINE_HEIGHT.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  clearPendingButton: {
    backgroundColor: `${COLORS.warning}20`,
  },
  listContent: {
    padding: SPACING.lg,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  historyCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  thumbnail: {
    width: '100%',
    height: 150,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.md,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  typeIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  headerText: {
    flex: 1,
  },
  diagnosisName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
    lineHeight: FONT_SIZES.md * LINE_HEIGHT.sm,
  },
  dateText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    lineHeight: FONT_SIZES.sm * LINE_HEIGHT.sm,
  },
  deleteButton: {
    padding: SPACING.xs,
  },
  symptomsPreview: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    marginBottom: SPACING.md,
    lineHeight: FONT_SIZES.sm * LINE_HEIGHT.md,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  severityText: {
    marginLeft: SPACING.xs,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    lineHeight: FONT_SIZES.xs * LINE_HEIGHT.sm,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceText: {
    marginLeft: SPACING.xs,
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: '500',
    lineHeight: FONT_SIZES.xs * LINE_HEIGHT.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyIconContainer: {
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
    lineHeight: FONT_SIZES.lg * LINE_HEIGHT.sm,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: FONT_SIZES.md * LINE_HEIGHT.md,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.small,
  },
  startButtonText: {
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    fontWeight: '600',
    lineHeight: FONT_SIZES.md * LINE_HEIGHT.sm,
  },
});

  return (
    <SafeAreaContainer edges={['top', 'left', 'right']} backgroundColor={COLORS.background}>
      <Animated.View 
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        {history.length > 0 && (
          <View style={styles.actionsBar}>
            <Text style={styles.recordCount}>
              {history.length} {history.length === 1 ? 'record' : 'records'}
            </Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.clearButton, styles.clearPendingButton]}
                onPress={handleClearPendingQueue}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh-circle-outline" size={18} color={COLORS.warning} />
                <Text style={[styles.clearButtonText, { color: COLORS.warning }]}>Clear Sync</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearHistory}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <FlatList
          data={history}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            history.length === 0 && styles.emptyListContent,
          ]}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
        />
      </Animated.View>
    </SafeAreaContainer>
  );
}