import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CacheStatus } from '../../components/glossary/CacheStatus';
import { BORDER_RADIUS, COLORS, FONT_SIZES, SPACING } from '../../constants/theme';
import { cacheManager } from '../../services/cacheManager';
import { diseaseService } from '../../services/diseaseService';

export default function CacheSettingsScreen() {
  const insets = useSafeAreaInsets();
  const [offlineStatus, setOfflineStatus] = useState({
    isOffline: false,
    lastSync: null as Date | null,
    cachedDiseaseCount: 0,
    prioritizedDiseaseCount: 0,
  });
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoSync, setAutoSync] = useState(true);

  useEffect(() => {
    loadCacheData();
    
    // Listen for connectivity changes
    const unsubscribe = cacheManager.addConnectivityListener(() => {
      loadCacheData();
    });

    return unsubscribe;
  }, []);

  const loadCacheData = async () => {
    try {
      const status = await diseaseService.getOfflineStatus();
      setOfflineStatus(status);

      const recent = await diseaseService.getRecentlyViewedDiseases(10);
      setRecentlyViewed(recent);
    } catch (error) {
      console.error('Error loading cache data:', error);
    }
  };

  const handleRefreshCache = async () => {
    if (offlineStatus.isOffline) {
      Alert.alert('Offline', 'Cannot refresh cache while offline. Please check your internet connection.');
      return;
    }

    setIsRefreshing(true);
    try {
      const success = await diseaseService.refreshCache();
      if (success) {
        await loadCacheData();
        Alert.alert('Success', 'Cache refreshed successfully');
      } else {
        Alert.alert('Error', 'Failed to refresh cache');
      }
    } catch (error) {
      console.error('Error refreshing cache:', error);
      Alert.alert('Error', 'Failed to refresh cache');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClearViewHistory = () => {
    Alert.alert(
      'Clear View History',
      'This will remove your recently viewed diseases history. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearViewHistory },
      ]
    );
  };

  const clearViewHistory = async () => {
    try {
      // Clear viewed diseases from cache manager
      await cacheManager.clearCache();
      await loadCacheData();
      Alert.alert('Success', 'View history cleared successfully');
    } catch (error) {
      console.error('Error clearing view history:', error);
      Alert.alert('Error', 'Failed to clear view history');
    }
  };

  const formatLastSync = (date: Date | null): string => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cache Settings</Text>
        <View style={styles.placeholder} />
      </View>
      <Text style={styles.headerSubtitle}>
        Manage offline data and cache settings
      </Text>
    </View>
  );

  const renderOfflineStatus = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Offline Status</Text>
      
      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <Ionicons 
            name={offlineStatus.isOffline ? 'cloud-offline-outline' : 'cloud-done-outline'} 
            size={24} 
            color={offlineStatus.isOffline ? COLORS.error : COLORS.success} 
          />
          <View style={styles.statusInfo}>
            <Text style={styles.statusText}>
              {offlineStatus.isOffline ? 'Offline Mode' : 'Online'}
            </Text>
            <Text style={styles.statusSubtext}>
              Last sync: {formatLastSync(offlineStatus.lastSync)}
            </Text>
          </View>
          {!offlineStatus.isOffline && (
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={handleRefreshCache}
              disabled={isRefreshing}
            >
              <Ionicons 
                name={isRefreshing ? 'hourglass-outline' : 'refresh-outline'} 
                size={20} 
                color={COLORS.primary} 
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{offlineStatus.cachedDiseaseCount}</Text>
          <Text style={styles.statLabel}>Cached Diseases</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{offlineStatus.prioritizedDiseaseCount}</Text>
          <Text style={styles.statLabel}>Priority Cached</Text>
        </View>
      </View>
    </View>
  );

  const renderSettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Settings</Text>
      
      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Auto-sync when online</Text>
          <Text style={styles.settingDescription}>
            Automatically update cache when internet connection is available
          </Text>
        </View>
        <Switch
          value={autoSync}
          onValueChange={setAutoSync}
          trackColor={{ false: COLORS.border, true: COLORS.primary }}
          thumbColor={COLORS.white}
        />
      </View>
    </View>
  );

  const renderRecentlyViewed = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recently Viewed</Text>
        <TouchableOpacity onPress={handleClearViewHistory}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>
      
      {recentlyViewed.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="eye-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>No recently viewed diseases</Text>
        </View>
      ) : (
        <View style={styles.recentList}>
          {recentlyViewed.slice(0, 5).map((disease, index) => (
            <TouchableOpacity
              key={disease.id}
              style={styles.recentItem}
              onPress={() => router.push(`/glossary/${disease.id}` as any)}
            >
              <View style={styles.recentInfo}>
                <Text style={styles.recentName}>{disease.name}</Text>
                <Text style={styles.recentCategory}>
                  {disease.category.charAt(0).toUpperCase() + disease.category.slice(1)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {renderHeader()}
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderOfflineStatus()}
        
        <CacheStatus onCacheCleared={loadCacheData} />
        
        {renderSettings()}
        {renderRecentlyViewed()}
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Cache helps you access disease information even when offline. 
            Bookmarked and recently viewed diseases are prioritized for offline access.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  backButton: {
    padding: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONT_SIZES.title,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  placeholder: {
    width: 40,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: COLORS.white,
    margin: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  clearText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.error,
    fontWeight: '600',
  },
  statusCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  statusText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  statusSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  refreshButton: {
    padding: SPACING.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  statItem: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  settingDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },
  recentList: {
    gap: SPACING.xs,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.sm,
  },
  recentInfo: {
    flex: 1,
  },
  recentName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  recentCategory: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    textTransform: 'capitalize',
  },
  footer: {
    margin: SPACING.md,
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
  },
  footerText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    lineHeight: 20,
    textAlign: 'center',
  },
});