import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Animated,
    LayoutAnimation,
    Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ErrorDisplay } from '../../components/ErrorDisplay';
import ImageGallery from '../../components/glossary/ImageGallery';
import { OfflineIndicator } from '../../components/glossary/OfflineIndicator';
import ShareModal from '../../components/glossary/ShareModal';
import { BORDER_RADIUS, COLORS, FONT_SIZES, SPACING } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { bookmarkService } from '../../services/bookmarkService';
import { diseaseService } from '../../services/diseaseService';
import { ExtendedDiseaseInfo } from '../../types/types';
import { AppError, ErrorHandler } from '../../utils/errorHandling';

type TabType = 'overview' | 'images' | 'symptoms' | 'treatment' | 'prevention';

export default function DiseaseDetailScreen() {
  const { diseaseId } = useLocalSearchParams<{ diseaseId: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  const [disease, setDisease] = useState<ExtendedDiseaseInfo | null>(null);
  const [relatedDiseases, setRelatedDiseases] = useState<ExtendedDiseaseInfo[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showShareModal, setShowShareModal] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  const tabs = [
    { key: 'overview' as TabType, label: 'Overview', icon: 'information-circle' },
    { key: 'images' as TabType, label: 'Images', icon: 'image' },
    { key: 'symptoms' as TabType, label: 'Symptoms', icon: 'medical' },
    { key: 'treatment' as TabType, label: 'Treatment', icon: 'medical-kit' },
    { key: 'prevention' as TabType, label: 'Prevention', icon: 'shield-checkmark' },
  ];

  const loadDiseaseDetails = useCallback(async () => {
    if (!diseaseId) return;

    try {
      setLoading(true);
      setError(null);
      
      const diseaseData = await diseaseService.getDiseaseById(diseaseId as string);
      const relatedData = await diseaseService.getRelatedDiseases(diseaseId as string);
      
      setDisease(diseaseData);
      setRelatedDiseases(relatedData);

      // Check bookmark status if user is logged in
      if (user) {
        const bookmarked = await bookmarkService.isBookmarked(user.id, diseaseId as string);
        setIsBookmarked(bookmarked);
      }
    } catch (err) {
      const appError = ErrorHandler.mapError(err);
      ErrorHandler.logError(appError, 'DiseaseDetailScreen.loadDiseaseDetails');
      setError(appError);
      console.error('Error loading disease details:', err);
    } finally {
      setLoading(false);
    }
  }, [diseaseId, user]);

  useEffect(() => {
    loadDiseaseDetails();
  }, [loadDiseaseDetails]);

  const handleBookmarkToggle = async () => {
    if (!user || !disease) return;

    try {
      if (isBookmarked) {
        await bookmarkService.removeBookmark(user.id, disease.id);
        setIsBookmarked(false);
        Alert.alert('Bookmark Removed', `${disease.name} has been removed from your bookmarks.`);
      } else {
        await bookmarkService.addBookmark(user.id, disease.id);
        setIsBookmarked(true);
        Alert.alert('Bookmark Added', `${disease.name} has been added to your bookmarks.`);
      }
    } catch (err) {
      const appError = ErrorHandler.mapError(err);
      ErrorHandler.logError(appError, 'DiseaseDetailScreen.handleBookmarkToggle');
      console.error('Error toggling bookmark:', err);
      Alert.alert('Error', 'Failed to update bookmark. Please try again.');
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleShareComplete = (success: boolean) => {
    setShowShareModal(false);
    if (success) {
      Alert.alert('Success', 'Disease information shared successfully!');
    }
  };

  const handleRelatedDiseasePress = (relatedDiseaseId: string) => {
    router.push(`/glossary/${relatedDiseaseId}` as any);
  };

  const handleErrorRetry = () => {
    loadDiseaseDetails();
  };

  const handleHeaderToggle = () => {
    if (Platform.OS === 'ios') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setHeaderCollapsed(!headerCollapsed);
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const currentOffset = event.nativeEvent.contentOffset.y;
        setShowBackToTop(currentOffset > 500);
      },
    }
  );

  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const renderHeader = () => (
    <Animated.View style={[styles.header, { height: headerCollapsed ? 120 : 240 }]}>
      <View style={styles.headerTop}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Return to the disease list"
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          {user && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleBookmarkToggle}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={isBookmarked ? `Remove ${disease?.name} from bookmarks` : `Add ${disease?.name} to bookmarks`}
              accessibilityHint={isBookmarked ? 'Remove this disease from your saved list' : 'Save this disease for quick access later'}
            >
              <Ionicons
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={COLORS.white}
              />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShare}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Share ${disease?.name} information`}
            accessibilityHint="Share this disease information with others"
          >
            <Ionicons name="share-outline" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      {headerCollapsed ? (
        <View style={styles.collapsedHeaderContent}>
          <Text style={styles.collapsedDiseaseName}>{disease?.name}</Text>
          <View style={styles.collapsedHeaderInfo}>
            <Text style={styles.collapsedCategoryText}>{disease?.category}</Text>
            <Text style={styles.collapsedSeverityText}>{disease?.severity} severity</Text>
          </View>
        </View>
      ) : (
        <View style={styles.headerContent}>
          <Text style={styles.diseaseName}>{disease?.name}</Text>
          <Text style={styles.diseaseCategory}>{disease?.category}</Text>
          <Text style={styles.diseaseDescription}>{disease?.description}</Text>
          
          <View style={styles.diseaseMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="warning" size={16} color={getSeverityColor(disease?.severity || '')} />
              <Text style={[styles.metaText, { color: getSeverityColor(disease?.severity || '') }]}>
                {disease?.severity} severity
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="people" size={16} color={COLORS.primary} />
              <Text style={styles.metaText}>
                {disease?.commonIn.length} affected species
              </Text>
            </View>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={styles.collapseButton}
        onPress={handleHeaderToggle}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={headerCollapsed ? 'Expand disease details' : 'Collapse disease details'}
      >
        <Ionicons
          name={headerCollapsed ? 'chevron-down' : 'chevron-up'}
          size={20}
          color={COLORS.white}
        />
      </TouchableOpacity>
    </Animated.View>
  );

  const renderTabBar = () => (
    <Animated.View style={[styles.tabContainer, { position: 'sticky', top: 0, zIndex: 100 }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabScrollContent}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.activeTab,
            ]}
            onPress={() => setActiveTab(tab.key)}
            accessible={true}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab.key }}
            accessibilityLabel={`${tab.label} information`}
            accessibilityHint={`View ${tab.label.toLowerCase()} details for ${disease?.name}`}
          >
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={activeTab === tab.key ? COLORS.white : COLORS.primary}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.activeTabText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );

  const renderTabContent = () => {
    if (!disease) return null;

    switch (activeTab) {
      case 'overview':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <Text style={styles.sectionText}>{disease.description}</Text>
            
            <Text style={styles.sectionTitle}>Common In</Text>
            <View style={styles.speciesList}>
              {disease.commonIn.map((species, index) => (
                <View key={index} style={styles.speciesTag}>
                  <Text style={styles.speciesText}>{species}</Text>
                </View>
              ))}
            </View>
          </View>
        );
      
      case 'images':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Images</Text>
            <ImageGallery images={disease.images || []} diseaseName={disease.name} />
          </View>
        );
      
      case 'symptoms':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Symptoms</Text>
            {disease.symptoms.map((symptom, index) => (
              <View key={index} style={styles.symptomItem}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                <Text style={styles.symptomText}>{symptom}</Text>
              </View>
            ))}
          </View>
        );
      
      case 'treatment':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Treatment</Text>
            <Text style={styles.sectionText}>{disease.treatment}</Text>
          </View>
        );
      
      case 'prevention':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Prevention</Text>
            <Text style={styles.sectionText}>{disease.prevention}</Text>
          </View>
        );
      
      default:
        return null;
    }
  };

  const renderRelatedDiseases = () => {
    if (relatedDiseases.length === 0) return null;

    return (
      <View style={styles.relatedSection}>
        <Text style={styles.sectionTitle}>Related Diseases</Text>
        {relatedDiseases.map((relatedDisease) => (
          <TouchableOpacity
            key={relatedDisease.id}
            style={styles.relatedDiseaseCard}
            onPress={() => handleRelatedDiseasePress(relatedDisease.id)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`View ${relatedDisease.name} details`}
          >
            <Text style={styles.relatedDiseaseName}>{relatedDisease.name}</Text>
            <Text style={styles.relatedDiseaseCategory}>{relatedDisease.category}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
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

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Loading disease information...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <ErrorDisplay
          error={error}
          onRetry={handleErrorRetry}
          context="load"
        />
      </View>
    );
  }

  if (!disease) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>Disease not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {renderHeader()}
      <OfflineIndicator showDetails />
      {renderTabBar()}
      
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {renderTabContent()}
        {renderRelatedDiseases()}
        
        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Last updated: {new Date().toLocaleDateString()}
          </Text>
          <Text style={styles.disclaimerText}>
            This information is for educational purposes only. Always consult with a qualified veterinarian for diagnosis and treatment.
          </Text>
        </View>
      </ScrollView>
      
      {/* Back to Top Button */}
      {showBackToTop && (
        <TouchableOpacity
          style={styles.backToTopButton}
          onPress={scrollToTop}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Back to top"
          accessibilityHint="Scroll to the top of the disease information"
        >
          <Ionicons 
            name="arrow-up" 
            size={20} 
            color={COLORS.white}
            accessible={false}
          />
        </TouchableOpacity>
      )}
      
      {/* Share Modal */}
      {disease && (
        <ShareModal
          visible={showShareModal}
          onClose={() => setShowShareModal(false)}
          disease={disease}
          onShareComplete={handleShareComplete}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  errorText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    textAlign: 'center',
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  collapsedHeaderContent: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  collapsedDiseaseName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  collapsedHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  collapsedCategoryText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  collapsedSeverityText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  collapseButton: {
    position: 'absolute',
    bottom: SPACING.sm,
    right: SPACING.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.xs,
  },
  backToTopButton: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.lg,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  backButton: {
    padding: SPACING.sm,
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    padding: SPACING.sm,
  },
  headerContent: {
    flex: 1,
  },
  diseaseName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  diseaseCategory: {
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    opacity: 0.8,
    marginBottom: SPACING.sm,
  },
  diseaseDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    opacity: 0.9,
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  diseaseMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  metaText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    fontWeight: '600',
  },
  tabContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabScrollContent: {
    paddingHorizontal: SPACING.md,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  activeTabText: {
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  tabContent: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  sectionText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  speciesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  speciesTag: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  speciesText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    fontWeight: '600',
  },
  symptomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  symptomText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 22,
    flex: 1,
  },
  relatedSection: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  relatedDiseaseCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  relatedDiseaseName: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  relatedDiseaseCategory: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  footer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  disclaimerText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
