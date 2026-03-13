/**
 * Performance Monitoring Dashboard
 * Displays real-time performance metrics for the glossary
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { COLORS, FONT_SIZES, SPACING } from '../../constants/theme';
import { imageCacheService } from '../../services/imageCacheService';
import { memoryMonitor } from '../../utils/memoryMonitor';
import { performanceMonitor } from '../../utils/performanceMonitor';
import { searchOptimizer } from '../../utils/searchOptimization';

interface PerformanceDashboardProps {
  visible: boolean;
  onClose: () => void;
}

export default function PerformanceDashboard({ visible, onClose }: PerformanceDashboardProps) {
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [memoryData, setMemoryData] = useState<any>(null);
  const [cacheData, setCacheData] = useState<any>(null);
  const [searchData, setSearchData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (visible) {
      loadPerformanceData();
      const interval = setInterval(loadPerformanceData, 2000); // Update every 2 seconds
      return () => clearInterval(interval);
    }
  }, [visible]);

  const loadPerformanceData = async () => {
    try {
      setRefreshing(true);
      
      // Get performance metrics
      const perfMetrics = performanceMonitor.getAllMetrics();
      const searchStats = performanceMonitor.getSearchStats();
      
      // Get memory stats
      const memStats = memoryMonitor.getMemoryStats();
      
      // Get cache stats
      const imgCacheStats = imageCacheService.getCacheStats();
      
      // Get search optimization stats
      const searchOptStats = searchOptimizer.getSearchStats();
      
      setPerformanceData({
        totalMetrics: perfMetrics.length,
        averageTime: perfMetrics.length > 0 
          ? perfMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / perfMetrics.length 
          : 0,
        slowestOperation: perfMetrics.length > 0 
          ? perfMetrics.reduce((slowest, current) => 
              (current.duration || 0) > (slowest.duration || 0) ? current : slowest
            )
          : { name: 'None', startTime: 0, duration: 0 },
        searchStats,
      });
      
      setMemoryData(memStats);
      setCacheData(imgCacheStats);
      setSearchData(searchOptStats);
      
    } catch (error) {
      console.error('Error loading performance data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await imageCacheService.clearCache();
            performanceMonitor.clearMetrics();
            searchOptimizer.clearCache();
            memoryMonitor.clearData();
            loadPerformanceData();
          },
        },
      ]
    );
  };

  const handleMemoryCleanup = () => {
    memoryMonitor.triggerCleanup();
    loadPerformanceData();
  };

  const generateReport = () => {
    const perfReport = performanceMonitor.generateReport();
    const memReport = memoryMonitor.generateReport();
    
    Alert.alert(
      'Performance Report',
      `${perfReport}\n\n${memReport}`,
      [{ text: 'OK' }]
    );
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getPerformanceColor = (value: number, thresholds: { good: number; warning: number }): string => {
    if (value <= thresholds.good) return COLORS.success;
    if (value <= thresholds.warning) return COLORS.warning;
    return COLORS.error;
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Performance Dashboard</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Performance Metrics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance Metrics</Text>
            {performanceData && (
              <View style={styles.metricsGrid}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{performanceData.totalMetrics}</Text>
                  <Text style={styles.metricLabel}>Total Operations</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={[
                    styles.metricValue,
                    { color: getPerformanceColor(performanceData.averageTime, { good: 50, warning: 100 }) }
                  ]}>
                    {formatTime(performanceData.averageTime)}
                  </Text>
                  <Text style={styles.metricLabel}>Average Time</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={[
                    styles.metricValue,
                    { color: getPerformanceColor(performanceData.slowestOperation.duration || 0, { good: 100, warning: 500 }) }
                  ]}>
                    {formatTime(performanceData.slowestOperation.duration || 0)}
                  </Text>
                  <Text style={styles.metricLabel}>Slowest Operation</Text>
                </View>
              </View>
            )}
          </View>

          {/* Search Performance */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Search Performance</Text>
            {performanceData?.searchStats && (
              <View style={styles.metricsGrid}>
                <View style={styles.metricCard}>
                  <Text style={[
                    styles.metricValue,
                    { color: getPerformanceColor(performanceData.searchStats.averageSearchTime, { good: 50, warning: 200 }) }
                  ]}>
                    {formatTime(performanceData.searchStats.averageSearchTime)}
                  </Text>
                  <Text style={styles.metricLabel}>Avg Search Time</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{searchData?.indexSize || 0}</Text>
                  <Text style={styles.metricLabel}>Index Size</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{searchData?.cacheSize || 0}</Text>
                  <Text style={styles.metricLabel}>Cached Queries</Text>
                </View>
              </View>
            )}
          </View>

          {/* Memory Usage */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Memory Usage</Text>
            {memoryData && (
              <View style={styles.metricsGrid}>
                <View style={styles.metricCard}>
                  <Text style={[
                    styles.metricValue,
                    { color: getPerformanceColor(
                      (memoryData.current.jsHeapSizeUsed / memoryData.current.jsHeapSizeLimit) * 100,
                      { good: 50, warning: 75 }
                    )}
                  ]}>
                    {formatBytes(memoryData.current.jsHeapSizeUsed)}
                  </Text>
                  <Text style={styles.metricLabel}>Current Usage</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{formatBytes(memoryData.peak.jsHeapSizeUsed)}</Text>
                  <Text style={styles.metricLabel}>Peak Usage</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{memoryData.current.componentCount}</Text>
                  <Text style={styles.metricLabel}>Components</Text>
                </View>
              </View>
            )}
            
            {memoryData?.trend && (
              <View style={styles.trendContainer}>
                <Ionicons 
                  name={
                    memoryData.trend === 'increasing' ? 'trending-up' :
                    memoryData.trend === 'decreasing' ? 'trending-down' : 'remove'
                  }
                  size={20}
                  color={
                    memoryData.trend === 'increasing' ? COLORS.error :
                    memoryData.trend === 'decreasing' ? COLORS.success : COLORS.textMuted
                  }
                />
                <Text style={[styles.trendText, {
                  color: memoryData.trend === 'increasing' ? COLORS.error :
                         memoryData.trend === 'decreasing' ? COLORS.success : COLORS.textMuted
                }]}>
                  Memory trend: {memoryData.trend}
                </Text>
              </View>
            )}
          </View>

          {/* Cache Statistics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cache Statistics</Text>
            {cacheData && (
              <View style={styles.metricsGrid}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{cacheData.totalItems}</Text>
                  <Text style={styles.metricLabel}>Cached Items</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{formatBytes(cacheData.totalSize)}</Text>
                  <Text style={styles.metricLabel}>Cache Size</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={[
                    styles.metricValue,
                    { color: getPerformanceColor(
                      (cacheData.totalSize / cacheData.maxSize) * 100,
                      { good: 50, warning: 80 }
                    )}
                  ]}>
                    {((cacheData.totalSize / cacheData.maxSize) * 100).toFixed(1)}%
                  </Text>
                  <Text style={styles.metricLabel}>Usage</Text>
                </View>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsSection}>
            <TouchableOpacity style={styles.actionButton} onPress={handleMemoryCleanup}>
              <Ionicons name="refresh" size={20} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Memory Cleanup</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionButton, styles.warningButton]} onPress={handleClearCache}>
              <Ionicons name="trash" size={20} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Clear Cache</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionButton, styles.infoButton]} onPress={generateReport}>
              <Ionicons name="document-text" size={20} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Generate Report</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  closeButton: {
    padding: SPACING.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  section: {
    marginVertical: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    minWidth: '30%',
    alignItems: 'center',
  },
  metricValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  metricLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  trendText: {
    fontSize: FONT_SIZES.sm,
    marginLeft: SPACING.sm,
    fontWeight: '500',
  },
  actionsSection: {
    marginVertical: SPACING.xl,
    gap: SPACING.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    gap: SPACING.sm,
  },
  warningButton: {
    backgroundColor: COLORS.warning,
  },
  infoButton: {
    backgroundColor: COLORS.info,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
});