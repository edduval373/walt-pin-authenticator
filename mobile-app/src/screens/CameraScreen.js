import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Alert,
  ScrollView,
  Dimensions
} from 'react-native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ProgressSteps from '../components/ProgressSteps';

const { width } = Dimensions.get('window');

export default function CameraScreen({ navigation }) {
  const [capturedImages, setCapturedImages] = useState({
    front: null,
    back: null,
    angled: null
  });
  const [currentView, setCurrentView] = useState('front');
  const [hasPermission, setHasPermission] = useState(null);

  useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      const imagePickerStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasPermission(cameraStatus.status === 'granted' && imagePickerStatus.status === 'granted');
    })();
  }, []);

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setCapturedImages(prev => ({
          ...prev,
          [currentView]: result.assets[0].uri
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      let result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setCapturedImages(prev => ({
          ...prev,
          [currentView]: result.assets[0].uri
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleProcess = () => {
    if (!capturedImages.front) {
      Alert.alert('Front Image Required', 'Please capture at least the front view of your pin.');
      return;
    }
    navigation.navigate('Processing', { capturedImages });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const retakeImage = () => {
    setCapturedImages(prev => ({
      ...prev,
      [currentView]: null
    }));
  };

  if (hasPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <Text>Requesting permissions...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Camera and photo library access is required</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={() => {
          Alert.alert('Permissions Required', 'Please enable camera and photo library permissions in your device settings.');
        }}>
          <Text style={styles.buttonText}>Grant Permissions</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#eef2ff', '#e0e7ff']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ProgressSteps currentStep={2} />

          <View style={styles.cardContainer}>
            <Text style={styles.title}>Take Photos of Your Pin</Text>

            {/* View Selector */}
            <View style={styles.viewSelector}>
              {['front', 'back', 'angled'].map((view) => (
                <TouchableOpacity
                  key={view}
                  style={[
                    styles.viewTab,
                    currentView === view && styles.activeViewTab
                  ]}
                  onPress={() => setCurrentView(view)}
                >
                  <Text style={[
                    styles.viewTabText,
                    currentView === view && styles.activeViewTabText
                  ]}>
                    {view.charAt(0).toUpperCase() + view.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Image Preview or Capture Area */}
            <View style={styles.imageContainer}>
              {capturedImages[currentView] ? (
                <View style={styles.imagePreviewContainer}>
                  <Image
                    source={{ uri: capturedImages[currentView] }}
                    style={styles.imagePreview}
                  />
                  <TouchableOpacity
                    style={styles.retakeButton}
                    onPress={retakeImage}
                  >
                    <Text style={styles.retakeButtonText}>Retake</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.captureArea}>
                  <Ionicons name="camera" size={64} color="#9ca3af" />
                  <Text style={styles.captureText}>
                    {currentView === 'front' ? 'Required' : 'Optional'}
                  </Text>
                  <Text style={styles.captureSubtext}>
                    Tap to capture {currentView} view
                  </Text>
                </View>
              )}
            </View>

            {/* Camera Controls */}
            <View style={styles.controlsContainer}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={takePhoto}
              >
                <Ionicons name="camera" size={24} color="#4f46e5" />
                <Text style={styles.controlButtonText}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.controlButton}
                onPress={pickImage}
              >
                <Ionicons name="images" size={24} color="#4f46e5" />
                <Text style={styles.controlButtonText}>Gallery</Text>
              </TouchableOpacity>
            </View>

            {/* Progress Indicators */}
            <View style={styles.progressIndicators}>
              {['front', 'back', 'angled'].map((view) => (
                <View
                  key={view}
                  style={[
                    styles.progressDot,
                    capturedImages[view] && styles.progressDotActive
                  ]}
                />
              ))}
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              style={[
                styles.processButton,
                !capturedImages.front && styles.processButtonDisabled
              ]}
              onPress={handleProcess}
              disabled={!capturedImages.front}
            >
              <Text style={[
                styles.buttonText,
                !capturedImages.front && styles.buttonTextDisabled
              ]}>
                {capturedImages.front ? 'Process Images' : 'Front Image Required'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
            >
              <Text style={styles.backButtonText}>← Back to Overview</Text>
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
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#6b7280',
  },
  permissionButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  cardContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  viewSelector: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
    width: '100%',
  },
  viewTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeViewTab: {
    backgroundColor: '#4f46e5',
  },
  viewTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeViewTabText: {
    color: 'white',
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  imagePreviewContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreview: {
    width: '90%',
    height: '70%',
    borderRadius: 8,
    resizeMode: 'contain',
  },
  retakeButton: {
    backgroundColor: '#6b7280',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  retakeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  captureArea: {
    alignItems: 'center',
  },
  captureText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
  },
  captureSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  controlButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: 'white',
    minWidth: 80,
  },
  controlButtonText: {
    fontSize: 12,
    color: '#4f46e5',
    marginTop: 4,
    fontWeight: '500',
  },
  progressIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  progressDot: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: '#10b981',
  },
  processButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  processButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextDisabled: {
    color: '#9ca3af',
  },
  backButton: {
    paddingVertical: 8,
  },
  backButtonText: {
    color: '#4f46e5',
    fontSize: 14,
    fontWeight: '500',
  },
});