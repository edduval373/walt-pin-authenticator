import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ProgressSteps from '../components/ProgressSteps';

const { width } = Dimensions.get('window');

export default function ResultsScreen({ navigation, route }) {
  const { result, error, capturedImages } = route.params;

  const handleAnalyzeAnother = () => {
    navigation.navigate('Camera');
  };

  const handleBackToHome = () => {
    navigation.navigate('Overview');
  };

  const renderResultContent = () => {
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#dc2626" />
          <Text style={styles.errorTitle}>Processing Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
        </View>
      );
    }

    if (result && result.success) {
      return (
        <View style={styles.successContainer}>
          <Ionicons name="checkmark-circle" size={64} color="#10b981" />
          <Text style={styles.successTitle}>Analysis Complete</Text>
          
          <View style={styles.resultDetails}>
            <Text style={styles.resultLabel}>Message:</Text>
            <Text style={styles.resultValue}>
              {result.message || 'Analysis completed successfully'}
            </Text>
            
            {result.sessionId && (
              <>
                <Text style={styles.resultLabel}>Session ID:</Text>
                <Text style={styles.resultValue}>{result.sessionId}</Text>
              </>
            )}
            
            {result.analysis && (
              <>
                <Text style={styles.resultLabel}>Analysis:</Text>
                <Text style={styles.resultValue}>{result.analysis}</Text>
              </>
            )}
            
            {result.identification && (
              <>
                <Text style={styles.resultLabel}>Identification:</Text>
                <Text style={styles.resultValue}>{result.identification}</Text>
              </>
            )}
            
            {result.pricing && (
              <>
                <Text style={styles.resultLabel}>Pricing:</Text>
                <Text style={styles.resultValue}>{result.pricing}</Text>
              </>
            )}
          </View>
        </View>
      );
    }

    return (
      <View style={styles.unknownContainer}>
        <Ionicons name="help-circle" size={64} color="#6b7280" />
        <Text style={styles.unknownTitle}>Analysis Unavailable</Text>
        <Text style={styles.unknownMessage}>
          Unable to complete the analysis. Please try again.
        </Text>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={['#eef2ff', '#e0e7ff']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ProgressSteps currentStep={4} />

          <View style={styles.cardContainer}>
            {renderResultContent()}

            {/* Show captured images */}
            {capturedImages && (
              <View style={styles.imagesContainer}>
                <Text style={styles.imagesTitle}>Analyzed Images:</Text>
                <View style={styles.imageGrid}>
                  {capturedImages.front && (
                    <View style={styles.imageItem}>
                      <Image source={{ uri: capturedImages.front }} style={styles.thumbnail} />
                      <Text style={styles.imageLabel}>Front</Text>
                    </View>
                  )}
                  {capturedImages.back && (
                    <View style={styles.imageItem}>
                      <Image source={{ uri: capturedImages.back }} style={styles.thumbnail} />
                      <Text style={styles.imageLabel}>Back</Text>
                    </View>
                  )}
                  {capturedImages.angled && (
                    <View style={styles.imageItem}>
                      <Image source={{ uri: capturedImages.angled }} style={styles.thumbnail} />
                      <Text style={styles.imageLabel}>Angled</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleAnalyzeAnother}
            >
              <Text style={styles.buttonText}>Analyze Another Pin</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleBackToHome}
            >
              <Text style={styles.secondaryButtonText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  cardContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    maxWidth: 400,
    width: '100%',
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 20,
  },
  errorContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc2626',
    marginTop: 16,
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  unknownContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  unknownTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 12,
  },
  unknownMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  resultDetails: {
    alignSelf: 'stretch',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  imagesContainer: {
    alignSelf: 'stretch',
    marginBottom: 20,
  },
  imagesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  imageGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  imageItem: {
    alignItems: 'center',
    margin: 8,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginBottom: 4,
  },
  imageLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#6b7280',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});