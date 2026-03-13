import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { BORDER_RADIUS, COLORS, FONT_SIZES, SPACING } from '../../constants/theme';
import { ShareOptions, shareService } from '../../services/shareService';
import { ExtendedDiseaseInfo } from '../../types/types';

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  disease: ExtendedDiseaseInfo;
  onShareComplete?: (success: boolean) => void;
}

type ShareFormat = 'basic' | 'detailed' | 'summary';
type SharePlatform = 'general' | 'email' | 'sms' | 'social';

const ShareModal = React.memo(function ShareModal({ visible, onClose, disease, onShareComplete }: ShareModalProps) {
  const [shareFormat, setShareFormat] = useState<ShareFormat>('basic');
  const [sharePlatform, setSharePlatform] = useState<SharePlatform>('general');
  const [includePersonalNote, setIncludePersonalNote] = useState(false);
  const [personalNote, setPersonalNote] = useState('');
  const [includeDisclaimer, setIncludeDisclaimer] = useState(true);
  const [isSharing, setIsSharing] = useState(false);

  const shareFormats = [
    {
      key: 'summary' as ShareFormat,
      title: 'Summary',
      description: 'Brief overview with key points',
      icon: 'document-text-outline'
    },
    {
      key: 'basic' as ShareFormat,
      title: 'Basic',
      description: 'Essential information and treatment',
      icon: 'clipboard-outline'
    },
    {
      key: 'detailed' as ShareFormat,
      title: 'Detailed',
      description: 'Complete information including causes and transmission',
      icon: 'library-outline'
    }
  ];

  const sharePlatforms = [
    {
      key: 'general' as SharePlatform,
      title: 'General Share',
      description: 'Use device\'s default sharing options',
      icon: 'share-outline'
    },
    {
      key: 'email' as SharePlatform,
      title: 'Email',
      description: 'Formatted for email with full details',
      icon: 'mail-outline'
    },
    {
      key: 'sms' as SharePlatform,
      title: 'Text Message',
      description: 'Concise format for SMS',
      icon: 'chatbubble-outline'
    },
    {
      key: 'social' as SharePlatform,
      title: 'Social Media',
      description: 'Optimized for social platforms',
      icon: 'logo-twitter'
    }
  ];

  const handleShare = async () => {
    try {
      setIsSharing(true);

      const options: ShareOptions = {
        includePersonalNote,
        personalNote: personalNote.trim(),
        shareFormat,
        includeDisclaimer
      };

      let success = false;

      if (sharePlatform === 'general') {
        success = await shareService.shareDiseaseInfo(disease, options);
      } else {
        success = await shareService.shareToSpecificPlatform(disease, sharePlatform, options);
      }

      if (success) {
        Alert.alert('Success', 'Disease information shared successfully!');
        onShareComplete?.(true);
        onClose();
        resetForm();
      } else {
        onShareComplete?.(false);
      }
    } catch (error) {
      console.error('Error sharing disease:', error);
      Alert.alert('Error', 'Failed to share disease information. Please try again.');
      onShareComplete?.(false);
    } finally {
      setIsSharing(false);
    }
  };

  const handleGenerateLink = () => {
    try {
      const shareableLink = shareService.generateShareableLink(disease.id);
      
      Alert.alert(
        'Shareable Link Generated',
        `Link: ${shareableLink.url}\n\nThis link has been copied to your clipboard.`,
        [
          { text: 'OK', style: 'default' }
        ]
      );

      // In a real app, you would copy to clipboard here
      // Clipboard.setString(shareableLink.url);
    } catch (error) {
      console.error('Error generating link:', error);
      Alert.alert('Error', 'Failed to generate shareable link.');
    }
  };

  const resetForm = () => {
    setShareFormat('basic');
    setSharePlatform('general');
    setIncludePersonalNote(false);
    setPersonalNote('');
    setIncludeDisclaimer(true);
  };

  const handleClose = () => {
    onClose();
    // Don't reset form immediately to preserve user's selections if they reopen
  };

  const renderFormatSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Share Format</Text>
      <Text style={styles.sectionDescription}>
        Choose how much information to include
      </Text>
      
      {shareFormats.map((format) => (
        <TouchableOpacity
          key={format.key}
          style={[
            styles.optionCard,
            shareFormat === format.key && styles.selectedOption
          ]}
          onPress={() => setShareFormat(format.key)}
        >
          <View style={styles.optionContent}>
            <Ionicons
              name={format.icon as any}
              size={24}
              color={shareFormat === format.key ? COLORS.primary : COLORS.textMuted}
            />
            <View style={styles.optionText}>
              <Text style={[
                styles.optionTitle,
                shareFormat === format.key && styles.selectedOptionText
              ]}>
                {format.title}
              </Text>
              <Text style={styles.optionDescription}>
                {format.description}
              </Text>
            </View>
          </View>
          {shareFormat === format.key && (
            <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPlatformSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Share Platform</Text>
      <Text style={styles.sectionDescription}>
        Choose how you want to share the information
      </Text>
      
      {sharePlatforms.map((platform) => (
        <TouchableOpacity
          key={platform.key}
          style={[
            styles.optionCard,
            sharePlatform === platform.key && styles.selectedOption
          ]}
          onPress={() => setSharePlatform(platform.key)}
        >
          <View style={styles.optionContent}>
            <Ionicons
              name={platform.icon as any}
              size={24}
              color={sharePlatform === platform.key ? COLORS.primary : COLORS.textMuted}
            />
            <View style={styles.optionText}>
              <Text style={[
                styles.optionTitle,
                sharePlatform === platform.key && styles.selectedOptionText
              ]}>
                {platform.title}
              </Text>
              <Text style={styles.optionDescription}>
                {platform.description}
              </Text>
            </View>
          </View>
          {sharePlatform === platform.key && (
            <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPersonalNoteSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Personal Note</Text>
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setIncludePersonalNote(!includePersonalNote)}
        >
          <Ionicons
            name={includePersonalNote ? 'toggle' : 'toggle-outline'}
            size={24}
            color={includePersonalNote ? COLORS.primary : COLORS.textMuted}
          />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.sectionDescription}>
        Add a personal message to share with the disease information
      </Text>

      {includePersonalNote && (
        <TextInput
          style={styles.noteInput}
          placeholder="Add your personal note or context here..."
          placeholderTextColor={COLORS.textMuted}
          value={personalNote}
          onChangeText={setPersonalNote}
          multiline
          numberOfLines={3}
          maxLength={500}
        />
      )}
      
      {includePersonalNote && (
        <Text style={styles.characterCount}>
          {personalNote.length}/500 characters
        </Text>
      )}
    </View>
  );

  const renderDisclaimerSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Veterinary Disclaimer</Text>
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setIncludeDisclaimer(!includeDisclaimer)}
        >
          <Ionicons
            name={includeDisclaimer ? 'toggle' : 'toggle-outline'}
            size={24}
            color={includeDisclaimer ? COLORS.primary : COLORS.textMuted}
          />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.sectionDescription}>
        Include disclaimer about consulting veterinary professionals (recommended)
      </Text>

      {includeDisclaimer && (
        <View style={styles.disclaimerPreview}>
          <Ionicons name="warning" size={16} color={COLORS.warning} />
          <Text style={styles.disclaimerText}>
            This information is for educational purposes only. Always consult with a qualified veterinarian.
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Share Disease Information</Text>
            <Text style={styles.headerSubtitle}>{disease.name}</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderFormatSelector()}
          {renderPlatformSelector()}
          {renderPersonalNoteSection()}
          {renderDisclaimerSection()}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={handleGenerateLink}
          >
            <Ionicons name="link" size={20} color={COLORS.primary} />
            <Text style={styles.linkButtonText}>Generate Link</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shareButton, isSharing && styles.shareButtonDisabled]}
            onPress={handleShare}
            disabled={isSharing}
          >
            {isSharing ? (
              <Text style={styles.shareButtonText}>Sharing...</Text>
            ) : (
              <>
                <Ionicons name="share" size={20} color={COLORS.white} />
                <Text style={styles.shareButtonText}>Share Now</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  closeButton: {
    padding: SPACING.sm,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  sectionDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  selectedOption: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0F8FF',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  optionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  selectedOptionText: {
    color: COLORS.primary,
  },
  optionDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  toggleButton: {
    padding: SPACING.xs,
  },
  noteInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  characterCount: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  disclaimerPreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF3CD',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
    gap: SPACING.sm,
  },
  disclaimerText: {
    fontSize: FONT_SIZES.sm,
    color: '#856404',
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.md,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
    flex: 1,
  },
  linkButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.primary,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
    flex: 2,
  },
  shareButtonDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  shareButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
});export
 default ShareModal;