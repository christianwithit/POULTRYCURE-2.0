// app/profile/terms.tsx
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONT_SIZES, SHADOWS, SPACING } from '../../constants/theme';

export default function TermsScreen() {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms');

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'terms' && styles.activeTab]}
          onPress={() => setActiveTab('terms')}
        >
          <Text style={[styles.tabText, activeTab === 'terms' && styles.activeTabText]}>
            Terms of Service
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'privacy' && styles.activeTab]}
          onPress={() => setActiveTab('privacy')}
        >
          <Text style={[styles.tabText, activeTab === 'privacy' && styles.activeTabText]}>
            Privacy Policy
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'terms' ? (
          <>
            <View style={styles.section}>
              <Text style={styles.lastUpdated}>Last Updated: November 2024</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
              <Text style={styles.text}>
                By accessing and using PoultryCure ("the App"), you accept and agree to be bound 
                by these Terms of Service. If you do not agree to these terms, please do not use 
                the App.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>2. Description of Service</Text>
              <Text style={styles.text}>
                PoultryCure provides AI-powered poultry disease diagnosis and information services. 
                The App uses machine learning algorithms to analyze images and provide diagnostic 
                suggestions. This service is intended as a supplementary tool and should not replace 
                professional veterinary consultation.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>3. Medical Disclaimer</Text>
              <Text style={styles.text}>
                The information and diagnoses provided by PoultryCure are for informational purposes 
                only and do not constitute professional veterinary advice. Always consult with a 
                licensed veterinarian for serious health concerns. We do not guarantee the accuracy 
                of AI-generated diagnoses.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>4. User Responsibilities</Text>
              <Text style={styles.text}>
                You agree to:
              </Text>
              <Text style={styles.bulletText}>• Provide accurate information when using the App</Text>
              <Text style={styles.bulletText}>• Use the App only for lawful purposes</Text>
              <Text style={styles.bulletText}>• Not attempt to reverse engineer or hack the App</Text>
              <Text style={styles.bulletText}>• Keep your account credentials secure</Text>
              <Text style={styles.bulletText}>• Not share inappropriate or harmful content</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>5. Intellectual Property</Text>
              <Text style={styles.text}>
                All content, features, and functionality of PoultryCure, including but not limited 
                to text, graphics, logos, and software, are the exclusive property of PoultryCure 
                and are protected by international copyright, trademark, and other intellectual 
                property laws.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>6. User Content</Text>
              <Text style={styles.text}>
                By uploading images or content to the App, you grant PoultryCure a non-exclusive, 
                worldwide license to use, store, and process this content solely for the purpose 
                of providing and improving our services. We may use anonymized data to train and 
                improve our AI models.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>7. Limitation of Liability</Text>
              <Text style={styles.text}>
                PoultryCure and its affiliates shall not be liable for any indirect, incidental, 
                special, consequential, or punitive damages resulting from your use of the App. 
                We do not guarantee uninterrupted or error-free service.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>8. Account Termination</Text>
              <Text style={styles.text}>
                We reserve the right to suspend or terminate your account at any time for violation 
                of these terms or for any other reason we deem necessary. You may also delete your 
                account at any time by contacting support.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>9. Changes to Terms</Text>
              <Text style={styles.text}>
                We reserve the right to modify these terms at any time. We will notify users of 
                significant changes via email or in-app notification. Continued use of the App 
                after changes constitutes acceptance of the new terms.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>10. Contact Information</Text>
              <Text style={styles.text}>
                For questions about these Terms of Service, please contact us at:
              </Text>
              <Text style={styles.contactText}>support@poultrycure.com</Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.lastUpdated}>Last Updated: November 2024</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>1. Information We Collect</Text>
              <Text style={styles.text}>
                We collect the following types of information:
              </Text>
              <Text style={styles.bulletText}>
                • <Text style={styles.bold}>Account Information:</Text> Name, email address, password
              </Text>
              <Text style={styles.bulletText}>
                • <Text style={styles.bold}>Diagnostic Data:</Text> Images uploaded for diagnosis, 
                diagnosis results, and history
              </Text>
              <Text style={styles.bulletText}>
                • <Text style={styles.bold}>Usage Data:</Text> App interactions, features used, 
                and timestamps
              </Text>
              <Text style={styles.bulletText}>
                • <Text style={styles.bold}>Device Information:</Text> Device type, operating system, 
                and app version
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
              <Text style={styles.text}>
                We use collected information to:
              </Text>
              <Text style={styles.bulletText}>• Provide and improve our diagnostic services</Text>
              <Text style={styles.bulletText}>• Train and enhance our AI models</Text>
              <Text style={styles.bulletText}>• Maintain and secure your account</Text>
              <Text style={styles.bulletText}>• Send important updates and notifications</Text>
              <Text style={styles.bulletText}>• Analyze usage patterns to improve user experience</Text>
              <Text style={styles.bulletText}>• Respond to support requests</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>3. Data Security</Text>
              <Text style={styles.text}>
                We implement industry-standard security measures to protect your data:
              </Text>
              <Text style={styles.bulletText}>• End-to-end encryption for data transmission</Text>
              <Text style={styles.bulletText}>• Encrypted storage of sensitive information</Text>
              <Text style={styles.bulletText}>• Secure authentication protocols</Text>
              <Text style={styles.bulletText}>• Regular security audits and updates</Text>
              <Text style={styles.bulletText}>• Limited employee access to user data</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>4. Data Sharing</Text>
              <Text style={styles.text}>
                We do not sell your personal information. We may share data only in these circumstances:
              </Text>
              <Text style={styles.bulletText}>
                • <Text style={styles.bold}>Service Providers:</Text> Third-party services that help 
                us operate the App (e.g., cloud hosting)
              </Text>
              <Text style={styles.bulletText}>
                • <Text style={styles.bold}>Legal Requirements:</Text> When required by law or to 
                protect our rights
              </Text>
              <Text style={styles.bulletText}>
                • <Text style={styles.bold}>Anonymized Data:</Text> Aggregated, non-identifiable data 
                for research purposes
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>5. Your Rights</Text>
              <Text style={styles.text}>
                You have the right to:
              </Text>
              <Text style={styles.bulletText}>• Access your personal data</Text>
              <Text style={styles.bulletText}>• Request correction of inaccurate data</Text>
              <Text style={styles.bulletText}>• Request deletion of your account and data</Text>
              <Text style={styles.bulletText}>• Export your diagnosis history</Text>
              <Text style={styles.bulletText}>• Opt out of non-essential communications</Text>
              <Text style={styles.bulletText}>• Withdraw consent for data processing</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>6. Data Retention</Text>
              <Text style={styles.text}>
                We retain your data for as long as your account is active or as needed to provide 
                services. After account deletion, we may retain anonymized data for research and 
                improvement purposes. Diagnostic images may be retained for AI model training.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>7. Children's Privacy</Text>
              <Text style={styles.text}>
                PoultryCure is not intended for users under 13 years of age. We do not knowingly 
                collect personal information from children. If we discover we have collected data 
                from a child, we will delete it promptly.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>8. Cookies and Tracking</Text>
              <Text style={styles.text}>
                We use cookies and similar technologies to enhance user experience, analyze usage 
                patterns, and maintain session information. You can manage cookie preferences in 
                your device settings.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>9. Changes to Privacy Policy</Text>
              <Text style={styles.text}>
                We may update this Privacy Policy periodically. We will notify you of significant 
                changes via email or in-app notification. Please review this policy regularly to 
                stay informed about how we protect your information.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>10. Contact Us</Text>
              <Text style={styles.text}>
                For privacy-related questions or to exercise your rights, contact us at:
              </Text>
              <Text style={styles.contactText}>privacy@poultrycure.com</Text>
              <Text style={styles.contactText}>support@poultrycure.com</Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.xl,
  },
  section: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  lastUpdated: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
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
  bulletText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 24,
    marginTop: SPACING.xs,
    marginLeft: SPACING.md,
  },
  bold: {
    fontWeight: '600',
  },
  contactText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    marginTop: SPACING.xs,
  },
});
