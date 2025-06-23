import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ProgressSteps from '../components/ProgressSteps';

const { width } = Dimensions.get('window');

export default function OverviewScreen({ navigation }) {
  const handleStartPhotos = () => {
    navigation.navigate('Camera');
  };

  return (
    <LinearGradient
      colors={['#eef2ff', '#e0e7ff']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <ProgressSteps currentStep={1} />

          <View style={styles.cardContainer}>
            <Text style={styles.title}>Disney Pin Checker</Text>
            <Text style={styles.subtitle}>Authenticate your Disney pins with AI</Text>

            <View style={styles.stepsContainer}>
              <View style={styles.stepItem}>
                <Text style={styles.stepIcon}>📸</Text>
                <Text style={styles.stepText}>1. Take clear photos of your pin</Text>
              </View>
              
              <View style={styles.stepItem}>
                <Text style={styles.stepIcon}>🔍</Text>
                <Text style={styles.stepText}>2. AI analyzes authenticity</Text>
              </View>
              
              <View style={styles.stepItem}>
                <Text style={styles.stepIcon}>📊</Text>
                <Text style={styles.stepText}>3. Get detailed results</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartPhotos}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>🚀 Start Taking Photos!</Text>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 30,
  },
  stepsContainer: {
    alignSelf: 'stretch',
    marginBottom: 30,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingLeft: 8,
  },
  stepIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  stepText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  startButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});