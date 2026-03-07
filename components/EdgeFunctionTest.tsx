import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useDiagnosis } from '../contexts/DiagnosisContext';

interface TestResult {
  type: 'text' | 'image';
  input: string;
  result?: any;
  error?: string;
  timestamp: string;
  responseTime?: number;
}

export const EdgeFunctionTest: React.FC = () => {
  const {
    diagnoseWithEdgeFunction,
    getUsageInfo,
    canMakeDiagnosisRequest,
    isOnline,
  } = useDiagnosis();

  const [testInput, setTestInput] = useState('chicken has respiratory symptoms and sneezing');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [usageInfo, setUsageInfo] = useState<any>(null);
  const [canMakeRequest, setCanMakeRequest] = useState<any>(null);

  useEffect(() => {
    loadUsageInfo();
  }, []);

  const loadUsageInfo = async () => {
    try {
      const usage = await getUsageInfo();
      setUsageInfo(usage);
      
      const canMake = await canMakeDiagnosisRequest();
      setCanMakeRequest(canMake);
    } catch (error) {
      console.error('Error loading usage info:', error);
    }
  };

  const testTextDiagnosis = async () => {
    if (!testInput.trim()) {
      Alert.alert('Error', 'Please enter symptoms to test');
      return;
    }

    setIsLoading(true);
    const startTime = Date.now();

    try {
      const result = await diagnoseWithEdgeFunction(
        'text',
        testInput,
        ['sneezing', 'coughing', 'nasal discharge']
      );

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      const testResult: TestResult = {
        type: 'text',
        input: testInput,
        result: result,
        timestamp: new Date().toISOString(),
        responseTime,
      };

      setTestResults(prev => [testResult, ...prev].slice(0, 5)); // Keep last 5 results
      loadUsageInfo(); // Refresh usage info

      Alert.alert(
        '✅ Success',
        `Diagnosis completed in ${responseTime}ms\n\nDisease: ${result.disease}\nConfidence: ${result.confidence}%`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      const testResult: TestResult = {
        type: 'text',
        input: testInput,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        responseTime,
      };

      setTestResults(prev => [testResult, ...prev].slice(0, 5));

      Alert.alert(
        '❌ Error',
        `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const testRateLimit = async () => {
    setIsLoading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Make 3 rapid requests
      for (let i = 0; i < 3; i++) {
        try {
          await diagnoseWithEdgeFunction(
            'text',
            `rate limit test ${i + 1}`,
            ['test symptom']
          );
          successCount++;
        } catch (error) {
          errorCount++;
        }
      }

      Alert.alert(
        'Rate Limit Test',
        `Completed 3 requests:\n✅ Success: ${successCount}\n❌ Errors: ${errorCount}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Rate Limit Test Error', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
      loadUsageInfo();
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const renderTestResult = (result: TestResult, index: number) => (
    <View key={index} style={styles.resultCard}>
      <View style={styles.resultHeader}>
        <Text style={styles.resultType}>{result.type.toUpperCase()}</Text>
        <Text style={styles.resultTime}>
          {new Date(result.timestamp).toLocaleTimeString()}
          {result.responseTime && ` (${result.responseTime}ms)`}
        </Text>
      </View>
      
      <Text style={styles.resultInput} numberOfLines={2}>
        Input: {result.input}
      </Text>

      {result.result ? (
        <View style={styles.successResult}>
          <Text style={styles.successTitle}>✅ Success</Text>
          <Text style={styles.resultDetail}>
            Disease: {result.result.disease}
          </Text>
          <Text style={styles.resultDetail}>
            Confidence: {result.result.confidence}%
          </Text>
          <Text style={styles.resultDetail}>
            Severity: {result.result.severity}
          </Text>
          <Text style={styles.resultDetail} numberOfLines={2}>
            Recommendations: {result.result.recommendations?.join(', ')}
          </Text>
        </View>
      ) : (
        <View style={styles.errorResult}>
          <Text style={styles.errorTitle}>❌ Error</Text>
          <Text style={styles.errorMessage}>{result.error}</Text>
        </View>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>🧪 Edge Function Test</Text>
      
      {/* Status Section */}
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>🔧 System Status</Text>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Connection:</Text>
          <Text style={[styles.statusValue, { color: isOnline ? '#10b981' : '#ef4444' }]}>
            {isOnline ? '🟢 Online' : '🔴 Offline'}
          </Text>
        </View>
        
        {usageInfo && (
          <>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Usage:</Text>
              <Text style={styles.statusValue}>
                {usageInfo.data?.requestsToday || 0}/{usageInfo.data?.requestsLimit || 50}
              </Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Reset:</Text>
              <Text style={styles.statusValue}>
                {usageInfo.data?.resetTime ? new Date(usageInfo.data.resetTime).toLocaleDateString() : 'N/A'}
              </Text>
            </View>
          </>
        )}
        
        {canMakeRequest && (
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Can Request:</Text>
            <Text style={[styles.statusValue, { color: canMakeRequest.allowed ? '#10b981' : '#ef4444' }]}>
              {canMakeRequest.allowed ? '✅ Yes' : '❌ No'}
            </Text>
          </View>
        )}
      </View>

      {/* Test Input Section */}
      <View style={styles.inputCard}>
        <Text style={styles.inputTitle}>📝 Test Symptoms</Text>
        <TextInput
          style={styles.textInput}
          value={testInput}
          onChangeText={setTestInput}
          placeholder="Enter symptoms to test..."
          multiline
          numberOfLines={3}
        />
        
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton, isLoading && styles.buttonDisabled]}
            onPress={testTextDiagnosis}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>🤖 Test AI Diagnosis</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton, isLoading && styles.buttonDisabled]}
            onPress={testRateLimit}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>⚡ Rate Limit Test</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={clearResults}
        >
          <Text style={styles.buttonText}>🗑️ Clear Results</Text>
        </TouchableOpacity>
      </View>

      {/* Test Results */}
      {testResults.length > 0 && (
        <View style={styles.resultsCard}>
          <Text style={styles.resultsTitle}>📊 Test Results ({testResults.length})</Text>
          {testResults.map(renderTestResult)}
        </View>
      )}

      {/* Info Section */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>ℹ️ Test Information</Text>
        <Text style={styles.infoText}>
          • This tests the deployed Edge Functions on Supabase
        </Text>
        <Text style={styles.infoText}>
          • Uses your Gemini 2.5 API key for AI analysis
        </Text>
        <Text style={styles.infoText}>
          • Rate limited to 50 requests per day per user
        </Text>
        <Text style={styles.infoText}>
          • Results are saved to your diagnosis history
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1f2937',
  },
  statusCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1f2937',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  inputCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inputTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1f2937',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    color: '#1f2937',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  secondaryButton: {
    backgroundColor: '#10b981',
  },
  clearButton: {
    backgroundColor: '#6b7280',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  resultsCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1f2937',
  },
  resultCard: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
  },
  resultTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  resultInput: {
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  successResult: {
    backgroundColor: '#f0fdf4',
    padding: 8,
    borderRadius: 6,
  },
  successTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    marginBottom: 4,
  },
  resultDetail: {
    fontSize: 12,
    color: '#1f2937',
    marginBottom: 2,
  },
  errorResult: {
    backgroundColor: '#fef2f2',
    padding: 8,
    borderRadius: 6,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 12,
    color: '#ef4444',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1f2937',
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
    lineHeight: 20,
  },
});
