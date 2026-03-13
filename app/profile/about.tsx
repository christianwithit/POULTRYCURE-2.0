// app/profile/about.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT_SIZES, SHADOWS, SPACING } from '../../constants/theme';

export default function AboutScreen() {
  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="medical" size={60} color={COLORS.white} />
          </View>
          <Text style={styles.appName}>PoultryCure</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.text}>
            PoultryCure is dedicated to revolutionizing poultry health management through 
            cutting-edge AI technology. We empower poultry farmers, veterinarians, and 
            agricultural professionals with instant, accurate disease diagnosis and 
            comprehensive disease information.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What We Offer</Text>
          
          <View style={styles.featureItem}>
            <Ionicons name="camera" size={24} color={COLORS.primary} />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>AI-Powered Diagnosis</Text>
              <Text style={styles.text}>
                Upload images of your poultry to receive instant disease diagnosis 
                powered by advanced machine learning algorithms.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="book" size={24} color={COLORS.primary} />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Comprehensive Disease Glossary</Text>
              <Text style={styles.text}>
                Access detailed information about various poultry diseases, including 
                symptoms, treatments, and prevention strategies.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="time" size={24} color={COLORS.primary} />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Diagnosis History</Text>
              <Text style={styles.text}>
                Track all your previous diagnoses and monitor the health trends 
                of your poultry over time.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="bookmark" size={24} color={COLORS.primary} />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Bookmarks & Offline Access</Text>
              <Text style={styles.text}>
                Save important disease information for quick reference and access 
                critical data even without an internet connection.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Technology</Text>
          <Text style={styles.text}>
            PoultryCure utilizes state-of-the-art computer vision and deep learning 
            models trained on thousands of poultry disease images. Our AI continuously 
            learns and improves to provide you with the most accurate diagnoses possible.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Commitment</Text>
          <Text style={styles.text}>
            We are committed to supporting the poultry industry by providing accessible, 
            reliable, and innovative health solutions. Your feedback helps us improve 
            and expand our services to better serve the agricultural community.
          </Text>
        </View>

        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Get in Touch</Text>
          <View style={styles.contactItem}>
            <Ionicons name="mail" size={20} color={COLORS.primary} />
            <Text style={styles.contactText}>support@poultrycure.com</Text>
          </View>
          <View style={styles.contactItem}>
            <Ionicons name="globe" size={20} color={COLORS.primary} />
            <Text style={styles.contactText}>www.poultrycure.com</Text>
          </View>
        </View>

        <Text style={styles.copyright}>
          © 2024 PoultryCure. All rights reserved.
        </Text>
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
  logoContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    backgroundColor: COLORS.white,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  appName: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  version: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
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
  featureItem: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
  },
  featureText: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  featureTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  contactSection: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  contactText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  copyright: {
    textAlign: 'center',
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    paddingHorizontal: SPACING.lg,
  },
});
