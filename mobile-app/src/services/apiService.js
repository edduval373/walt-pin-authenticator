import * as FileSystem from 'expo-file-system';

export const submitToAPI = async (capturedImages) => {
  try {
    // Create FormData for API submission
    const formData = new FormData();
    
    // Process front image (required)
    if (capturedImages.front) {
      const frontImageInfo = await FileSystem.getInfoAsync(capturedImages.front);
      const frontBlob = {
        uri: capturedImages.front,
        type: 'image/jpeg',
        name: 'front.jpg'
      };
      formData.append('front_image', frontBlob);
    }
    
    // Process back image (optional)
    if (capturedImages.back) {
      const backBlob = {
        uri: capturedImages.back,
        type: 'image/jpeg',
        name: 'back.jpg'
      };
      formData.append('back_image', backBlob);
    }
    
    // Process angled image (optional)
    if (capturedImages.angled) {
      const angledBlob = {
        uri: capturedImages.angled,
        type: 'image/jpeg',
        name: 'angled.jpg'
      };
      formData.append('angled_image', angledBlob);
    }

    // Submit to master.pinauth.com/mobile-upload
    const response = await fetch('https://master.pinauth.com/mobile-upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
        'X-API-Key': 'pim_0w3nfrt5ahgc'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
    
  } catch (error) {
    console.error('API submission error:', error);
    throw new Error('Failed to analyze pin images. Please check your connection and try again.');
  }
};