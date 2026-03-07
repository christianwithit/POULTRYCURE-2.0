// app/diagnosis/symptom-input.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { BORDER_RADIUS, COLORS, FONT_SIZES, SHADOWS, SPACING } from '../../constants/theme';
import { useDiagnosis } from '../../contexts/DiagnosisContext';
import { DiagnosisAPI } from '../../services/api';

const MIN_SYMPTOM_LENGTH = 10;

const COMMON_SYMPTOMS = [
  'Coughing',
  'Diarrhea',
  'Loss of appetite',
  'Lethargy',
  'Swelling',
  'Nasal discharge',
  'Difficulty breathing',
  'Weight loss',
];

export default function SymptomInput() {
  const [symptoms, setSymptoms] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { addDiagnosis, diagnoseWithEdgeFunction } = useDiagnosis();

  const addSymptomTag = (symptom: string) => {
    const currentText = symptoms.trim();
    if (currentText && !currentText.endsWith(',')) {
      setSymptoms(currentText + ', ' + symptom.toLowerCase());
    } else {
      setSymptoms(currentText + symptom.toLowerCase());
    }
  };

  const diagnose = async () => {
    const trimmedSymptoms = symptoms.trim();

    if (!trimmedSymptoms) {
      Alert.alert('Input Required', 'Please enter some symptoms to analyze.');
      return;
    }

    if (trimmedSymptoms.length < MIN_SYMPTOM_LENGTH) {
      Alert.alert(
        'More Details Needed',
        `Please describe the symptoms in more detail (at least ${MIN_SYMPTOM_LENGTH} characters).`
      );
      return;
    }

    setIsLoading(true);

    try {
      // Use edge function for diagnosis
      const edgeResult = await diagnoseWithEdgeFunction(
        'text',
        trimmedSymptoms,
        trimmedSymptoms.split(',').map(s => s.trim()).filter(s => s)
      );

      if (!edgeResult) {
        throw new Error('Edge function diagnosis failed');
      }

      // The edge function already saves the diagnosis, so we just need to navigate
      Alert.alert(
        '✅ Analysis Complete',
        `Diagnosis: ${edgeResult.disease}\nConfidence: ${edgeResult.confidence}%\n\nView full details?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'View Details', 
            onPress: () => router.push('/diagnosis/result')
          }
        ]
      );
    } catch (error) {
      console.error('Diagnosis error:', error);
      Alert.alert(
        '❌ Analysis Failed',
        error instanceof Error ? error.message : 'Failed to analyze symptoms. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearSymptoms = () => {
    setSymptoms('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="clipboard-outline" size={40} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>🧪 Symptom Diagnosis</Text>
          <Text style={styles.subtitle}>
            Describe the symptoms your bird is showing. Be as detailed as possible.
          </Text>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>Symptoms Description *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Bird is coughing frequently, has watery eyes, loss of appetite, and greenish diarrhea for 2 days..."
            placeholderTextColor={COLORS.textMuted}
            value={symptoms}
            onChangeText={setSymptoms}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            editable={!isLoading}
          />
          <View style={styles.characterCount}>
            <Text
              style={[
                styles.characterCountText,
                symptoms.length >= MIN_SYMPTOM_LENGTH && styles.characterCountValid,
              ]}
            >
              {symptoms.length} / {MIN_SYMPTOM_LENGTH} characters minimum
            </Text>
          </View>

          {symptoms.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearSymptoms}
              disabled={isLoading}
            >
              <Ionicons name="close-circle" size={20} color={COLORS.error} />
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.quickSelectSection}>
          <Text style={styles.sectionTitle}>Quick Select Common Symptoms</Text>
          <View style={styles.tagsContainer}>
            {COMMON_SYMPTOMS.map((symptom, index) => (
              <TouchableOpacity
                key={index}
                style={styles.tag}
                onPress={() => addSymptomTag(symptom)}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle-outline" size={16} color={COLORS.primary} />
                <Text style={styles.tagText}>{symptom}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>💡 Tips for Better Results</Text>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
            <Text style={styles.tipText}>Include duration of symptoms</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
            <Text style={styles.tipText}>Describe physical changes</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
            <Text style={styles.tipText}>Note behavioral changes</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
            <Text style={styles.tipText}>Mention appetite and water intake</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.analyzeButton,
            isLoading && styles.analyzeButtonDisabled,
            symptoms.length < MIN_SYMPTOM_LENGTH && styles.analyzeButtonDisabled,
          ]}
          onPress={diagnose}
          disabled={isLoading || symptoms.length < MIN_SYMPTOM_LENGTH}
          activeOpacity={0.8}
          accessible={true}
          accessibilityLabel="Analyze symptoms"
          accessibilityHint="Analyzes the entered symptoms to provide a diagnosis"
        >
          {isLoading ? (
            <>
              <ActivityIndicator size="small" color={COLORS.white} />
              <Text style={styles.analyzeButtonText}>Analyzing...</Text>
            </>
          ) : (
            <>
              <Ionicons name="search" size={22} color={COLORS.white} />
              <Text style={styles.analyzeButtonText}>Analyze Symptoms</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  title: {
    fontSize: FONT_SIZES.title,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
    lineHeight: 20,
  },
  inputSection: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    fontSize: FONT_SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 120,
    color: COLORS.text,
    ...SHADOWS.small,
  },
  characterCount: {
    alignItems: 'flex-end',
    marginTop: SPACING.xs,
  },
  characterCountText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  characterCountValid: {
    color: COLORS.success,
    fontWeight: '600',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: SPACING.sm,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  clearButtonText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.sm,
    marginLeft: SPACING.xs,
  },
  quickSelectSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
    ...SHADOWS.small,
  },
  tagText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    marginLeft: SPACING.xs,
    fontWeight: '500',
  },
  tipsSection: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.xl,
    ...SHADOWS.small,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  tipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  analyzeButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
  analyzeButtonDisabled: {
    backgroundColor: COLORS.textMuted,
    opacity: 0.6,
  },
  analyzeButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
});