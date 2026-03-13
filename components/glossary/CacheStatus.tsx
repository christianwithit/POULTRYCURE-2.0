import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { cacheManager } from '../../services/cacheManager';
import { diseaseService } from '../../services/diseaseService';

interface CacheStatusProps {
  onCacheCleared?: () => void;
}

export const CacheStatus: React.FC<CacheStatusProps> = ({ onCacheCleared }) => {
  const [cacheInfo, setCacheInfo] = useState({
    lastUpdate: null as Date | null,
    diseaseCount: 0,
    isOffline: false,
    cacheSize: 0,
  });
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    loadCacheInfo();
    
    // Listen for connectivity changes
    const unsubscribe = cacheManager.addConnectivityListener(() => {
      loadCacheInfo();
    });

    return unsubscribe;
  }, []);

  const loadCacheInfo = async () => {
    try {
      const info = await diseaseService.getCacheInfo();
      setCacheInfo(info);
    } catch (error) {
      console.error('Error loading cache info:', error);
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will remove all cached disease data. You will need an internet connection to reload the data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearCache },
      ]
    );
  };

  const clearCache = async () => {
    setIsClearing(true);
    try {
      await cacheManager.clearCache();
      await loadCacheInfo();
      if (onCacheCleared) {
        onCacheCleared();
      }
      Alert.alert('Success', 'Cache cleared successfully');
    } catch (error) {
      console.error('Error clearing cache:', error);
      Alert.alert('Error', 'Failed to clear cache');
    } finally {
      setIsClearing(false);
    }
  };

  const formatCacheSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatLastUpdate = (date: Date | null): string => {
    if (!date) return 'Never';
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="server-outline" size={20} color="#666" />
        <Text style={styles.title}>Cache Status</Text>
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Status</Text>
          <View style={styles.statusRow}>
            <Ionicons 
              name={cacheInfo.isOffline ? 'cloud-offline-outline' : 'cloud-done-outline'} 
              size={16} 
              color={cacheInfo.isOffline ? '#ff6b6b' : '#51cf66'} 
            />
            <Text style={[
              styles.infoValue, 
              cacheInfo.isOffline ? styles.offlineText : styles.onlineText
            ]}>
              {cacheInfo.isOffline ? 'Offline' : 'Online'}
            </Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Diseases Cached</Text>
          <Text style={styles.infoValue}>{cacheInfo.diseaseCount}</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Cache Size</Text>
          <Text style={styles.infoValue}>{formatCacheSize(cacheInfo.cacheSize)}</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Last Updated</Text>
          <Text style={styles.infoValue}>{formatLastUpdate(cacheInfo.lastUpdate)}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.clearButton, isClearing && styles.clearButtonDisabled]}
        onPress={handleClearCache}
        disabled={isClearing}
      >
        <Ionicons 
          name={isClearing ? 'hourglass-outline' : 'trash-outline'} 
          size={16} 
          color={isClearing ? '#999' : '#dc2626'} 
        />
        <Text style={[styles.clearButtonText, isClearing && styles.clearButtonTextDisabled]}>
          {isClearing ? 'Clearing...' : 'Clear Cache'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'right',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  offlineText: {
    color: '#dc2626',
  },
  onlineText: {
    color: '#16a34a',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  clearButtonDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e5e5e5',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#dc2626',
    marginLeft: 8,
  },
  clearButtonTextDisabled: {
    color: '#999',
  },
});