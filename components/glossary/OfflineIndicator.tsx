import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { cacheManager } from '../../services/cacheManager';
import { diseaseService } from '../../services/diseaseService';

interface OfflineIndicatorProps {
  onRefresh?: () => void;
  showDetails?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ 
  onRefresh, 
  showDetails = false 
}) => {
  const [isOffline, setIsOffline] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initializeStatus = async () => {
      try {
        // Get initial status
        const status = await diseaseService.getOfflineStatus();
        setIsOffline(status.isOffline);
        setLastSync(status.lastSync);

        // Listen for connectivity changes
        unsubscribe = cacheManager.addConnectivityListener((online) => {
          setIsOffline(!online);
        });
      } catch (error) {
        console.error('Error initializing offline status:', error);
      }
    };

    initializeStatus();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const handleRefresh = async () => {
    if (isOffline || isRefreshing) return;

    setIsRefreshing(true);
    try {
      const success = await diseaseService.refreshCache();
      if (success && onRefresh) {
        onRefresh();
      }
      
      // Update last sync time
      const status = await diseaseService.getOfflineStatus();
      setLastSync(status.lastSync);
    } catch (error) {
      console.error('Error refreshing cache:', error);
    } finally {
      setIsRefreshing(false);
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
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  if (!isOffline && !showDetails) {
    return null;
  }

  return (
    <View style={[styles.container, isOffline ? styles.offline : styles.online]}>
      <View style={styles.content}>
        <Ionicons 
          name={isOffline ? 'cloud-offline-outline' : 'cloud-done-outline'} 
          size={16} 
          color={isOffline ? '#ff6b6b' : '#51cf66'} 
        />
        <Text style={[styles.text, isOffline ? styles.offlineText : styles.onlineText]}>
          {isOffline ? 'Offline Mode' : 'Online'}
        </Text>
        
        {showDetails && (
          <Text style={styles.detailText}>
            Last sync: {formatLastSync(lastSync)}
          </Text>
        )}
      </View>

      {!isOffline && (
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={handleRefresh}
          disabled={isRefreshing}
        >
          <Ionicons 
            name={isRefreshing ? 'hourglass-outline' : 'refresh-outline'} 
            size={16} 
            color="#666" 
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  offline: {
    backgroundColor: '#fff5f5',
    borderColor: '#fecaca',
  },
  online: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  offlineText: {
    color: '#dc2626',
  },
  onlineText: {
    color: '#16a34a',
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  refreshButton: {
    padding: 4,
  },
});