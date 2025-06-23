import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  const handleAcknowledge = () => {
    navigation.navigate('Overview');
  };

  return (
    <LinearGradient
      colors={['#eef2ff', '#e0e7ff']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.contentContainer}>
            <Text style={styles.title}>Disney Pin Authenticator</Text>
            <Text style={styles.subtitle}>W.A.L.T. - We Authenticate Legitimate Treasures</Text>

            <View style={styles.legalContainer}>
              <View style={styles.legalHeader}>
                <Text style={styles.warningIcon}>⚠️</Text>
                <Text style={styles.legalTitle}>LEGAL NOTICE</Text>
              </View>
              
              <Text style={styles.legalMainText}>FOR ENTERTAINMENT PURPOSES ONLY.</Text>
              
              <Text style={styles.legalDisclaimer}>
                This AI application is unreliable and should not be used for financial decisions. 
                Always consult professional appraisers for valuable items.
              </Text>

              <Text style={styles.legalDetails}>
                Do not use this application for making financial decisions, investment choices, 
                or determining actual value of collectibles. Professional consultation is required 
                for authentic authentication services.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.acknowledgeButton}
              onPress={handleAcknowledge}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>I Acknowledge</Text>
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
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: width * 0.5,
    height: width * 0.5,
    maxWidth: 200,
    maxHeight: 200,
  },
  contentContainer: {
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
    marginBottom: 20,
  },
  legalContainer: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  legalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  warningIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  legalTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  legalMainText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4f46e5',
    marginBottom: 8,
  },
  legalDisclaimer: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
    marginBottom: 8,
  },
  legalDetails: {
    fontSize: 11,
    color: '#6b7280',
    lineHeight: 15,
  },
  acknowledgeButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});