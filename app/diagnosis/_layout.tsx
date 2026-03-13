// app/diagnosis/_layout.tsx
import { Stack } from 'expo-router';
import { COLORS } from '../../constants/theme';

export default function DiagnosisLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen
        name="symptom-input"
        options={{
          title: 'Symptom Analysis',
        }}
      />
      <Stack.Screen
        name="image-diagnosis"
        options={{
          title: 'Image Analysis',
        }}
      />
      <Stack.Screen
        name="result"
        options={{
          title: 'Diagnosis Result',
        }}
      />
    </Stack>
  );
}