import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Animated,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ProgressSteps from '../components/ProgressSteps';
import { submitToAPI } from '../services/apiService';

const { width } = Dimensions.get('window');

export default function ProcessingScreen({ navigation, route }) {
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Starting analysis...');
  const [animatedProgress] = useState(new Animated.Value(0));
  const { capturedImages } = route.params;

  useEffect(() => {
    startProcessing();
  }, []);

  const startProcessing = async () => {
    try {
      // Animate progress bar
      Animated.timing(animatedProgress, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: false,
      }).start();

      // Update status messages
      const messages = [
        'Uploading images...',
        'Analyzing pin authenticity...',
        'Processing AI verification...',
        'Generating results...'
      ];

      for (let i = 0; i < messages.length; i++) {
        setTimeout(() => {
          setStatusMessage(messages[i]);
          setProgress((i + 1) * 25);
        }, i * 750);
      }

      // Submit to API after 3 seconds
      setTimeout(async () => {
        try {
          const result = await submitToAPI(capturedImages);
          navigation.navigate('Results', { result, capturedImages });
        } catch (error) {
          navigation.navigate('Results', { 
            error: error.message, 
            capturedImages 
          });
        }
      }, 3000);

    } catch (error) {
      console.error('Processing error:', error);
      navigation.navigate('Results', { 
        error: 'Processing failed. Please try again.', 
        capturedImages 
      });
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <LinearGradient
      colors={['#eef2ff', '#e0e7ff']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <ProgressSteps currentStep={3} />

          <View style={styles.cardContainer}>
            <View style={styles.spinnerContainer}>
              <ActivityIndicator size="large" color="#4f46e5" />
            </View>

            <Text style={styles.title}>Analyzing Your Pin</Text>
            <Text style={styles.statusMessage}>{statusMessage}</Text>

            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: animatedProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>{progress}%</Text>
            </View>

            <Text style={styles.apiInfo}>
              Submitting to master.pinauth.com/mobile-upload
            </Text>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cardContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 40,
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
  spinnerContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  statusMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 20,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4f46e5',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  apiInfo: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 30,
    fontStyle: 'italic',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#6b7280',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});