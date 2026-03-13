// app/profile/help.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BORDER_RADIUS, COLORS, FONT_SIZES, SHADOWS, SPACING } from '../../constants/theme';

interface FAQItem {
  question: string;
  answer: string;
}

export default function HelpScreen() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: 'How do I diagnose a disease?',
      answer: 'Navigate to the Diagnosis tab, select "Image Diagnosis", take or upload a clear photo of your poultry showing visible symptoms, and our AI will analyze it to provide a diagnosis with confidence levels and recommendations.',
    },
    {
      question: 'How accurate is the AI diagnosis?',
      answer: 'Our AI model has been trained on thousands of poultry disease images and achieves high accuracy rates. However, it should be used as a supplementary tool. For serious cases, always consult with a licensed veterinarian.',
    },
    {
      question: 'Can I use the app offline?',
      answer: 'Yes! You can bookmark disease information for offline access. Go to the Glossary, select a disease, and tap the bookmark icon. Access your bookmarks from the Profile tab under "Bookmarked Diseases".',
    },
    {
      question: 'How do I view my diagnosis history?',
      answer: 'Tap the History tab at the bottom of the screen to view all your previous diagnoses. You can filter by date, disease type, and confidence level.',
    },
    {
      question: 'What should I do if the diagnosis seems incorrect?',
      answer: 'If you believe a diagnosis is incorrect, please consult a veterinarian. You can also provide feedback through the diagnosis result screen to help us improve our AI model.',
    },
    {
      question: 'How do I change my password?',
      answer: 'Go to Profile > Change Password. Enter your current password, then your new password twice to confirm. Your password must be at least 8 characters long.',
    },
    {
      question: 'Can I export my diagnosis history?',
      answer: 'Currently, you can view and filter your diagnosis history within the app. Export functionality will be available in a future update.',
    },
    {
      question: 'What image quality is best for diagnosis?',
      answer: 'Use clear, well-lit photos taken in natural daylight if possible. Ensure the affected area is in focus and fills most of the frame. Avoid blurry or dark images.',
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes, we take data security seriously. All data is encrypted in transit and at rest. We never share your personal information with third parties. See our Privacy Policy for details.',
    },
    {
      question: 'How do I delete my account?',
      answer: 'To delete your account, please contact our support team at support@poultrycure.com. Note that this action is permanent and cannot be undone.',
    },
  ];

  const toggleFAQ = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@poultrycure.com?subject=PoultryCure Support Request');
  };

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
        <View style={styles.welcomeSection}>
          <Ionicons name="help-circle" size={60} color={COLORS.primary} />
          <Text style={styles.welcomeTitle}>How can we help you?</Text>
          <Text style={styles.welcomeText}>
            Find answers to common questions or contact our support team
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Getting Started</Text>
          
          <View style={styles.guideItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.guideText}>
              <Text style={styles.guideTitle}>Create an Account</Text>
              <Text style={styles.text}>
                Sign up with your email to access all features and save your diagnosis history.
              </Text>
            </View>
          </View>

          <View style={styles.guideItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.guideText}>
              <Text style={styles.guideTitle}>Take or Upload Photos</Text>
              <Text style={styles.text}>
                Capture clear images of your poultry showing any symptoms or concerns.
              </Text>
            </View>
          </View>

          <View style={styles.guideItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.guideText}>
              <Text style={styles.guideTitle}>Get Instant Diagnosis</Text>
              <Text style={styles.text}>
                Our AI analyzes the image and provides diagnosis with treatment recommendations.
              </Text>
            </View>
          </View>

          <View style={styles.guideItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <View style={styles.guideText}>
              <Text style={styles.guideTitle}>Learn & Track</Text>
              <Text style={styles.text}>
                Explore the disease glossary and monitor your flock's health over time.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          
          {faqs.map((faq, index) => (
            <TouchableOpacity
              key={index}
              style={styles.faqItem}
              onPress={() => toggleFAQ(index)}
              activeOpacity={0.7}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <Ionicons
                  name={expandedIndex === index ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={COLORS.primary}
                />
              </View>
              {expandedIndex === index && (
                <Text style={styles.faqAnswer}>{faq.answer}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Support</Text>
          <Text style={styles.text}>
            Can't find what you're looking for? Our support team is here to help!
          </Text>

          <TouchableOpacity style={styles.contactButton} onPress={handleEmailSupport}>
            <Ionicons name="mail" size={24} color={COLORS.white} />
            <Text style={styles.contactButtonText}>Email Support</Text>
          </TouchableOpacity>

          <View style={styles.contactInfo}>
            <View style={styles.contactInfoItem}>
              <Ionicons name="time" size={20} color={COLORS.primary} />
              <Text style={styles.contactInfoText}>
                Response time: Within 24 hours
              </Text>
            </View>
            <View style={styles.contactInfoItem}>
              <Ionicons name="mail" size={20} color={COLORS.primary} />
              <Text style={styles.contactInfoText}>
                support@poultrycure.com
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.tipSection}>
          <Ionicons name="bulb" size={24} color={COLORS.warning} />
          <View style={styles.tipText}>
            <Text style={styles.tipTitle}>Pro Tip</Text>
            <Text style={styles.text}>
              For the best results, take photos in natural daylight and ensure the 
              affected area is clearly visible and in focus.
            </Text>
          </View>
        </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flexGrow: 1,
    paddingBottom: SPACING.xl,
  },
  welcomeSection: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  welcomeTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  welcomeText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  section: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  text: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 24,
  },
  guideItem: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  stepNumberText: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  guideText: {
    flex: 1,
  },
  guideTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: SPACING.md,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginRight: SPACING.sm,
  },
  faqAnswer: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 24,
    marginTop: SPACING.sm,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.lg,
    ...SHADOWS.small,
  },
  contactButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: SPACING.sm,
  },
  contactInfo: {
    marginTop: SPACING.lg,
  },
  contactInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  contactInfoText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  tipSection: {
    flexDirection: 'row',
    backgroundColor: '#FFF4E5',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  tipText: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  tipTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
});
