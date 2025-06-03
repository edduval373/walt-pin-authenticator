/**
 * Remove white background from images and make it transparent
 */

/**
 * Automatically crop image to focus on the main subject (pin)
 */
export function cropImageToContent(imageSrc: string, padding: number = 20): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Create temporary canvas for analysis
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) {
        reject(new Error('Could not get temp canvas context'));
        return;
      }
      
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      tempCtx.drawImage(img, 0, 0);
      
      const imageData = tempCtx.getImageData(0, 0, img.width, img.height);
      const data = imageData.data;
      
      // Find content boundaries
      let minX = img.width, maxX = 0, minY = img.height, maxY = 0;
      let foundContent = false;
      
      for (let y = 0; y < img.height; y++) {
        for (let x = 0; x < img.width; x++) {
          const i = (y * img.width + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Check if pixel is not background (not pure white/light)
          const isBackground = (r > 240 && g > 240 && b > 240) ||
                              (r > 220 && g > 220 && b > 220 && 
                               Math.abs(r - g) < 15 && 
                               Math.abs(g - b) < 15);
          
          if (!isBackground) {
            foundContent = true;
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
          }
        }
      }
      
      if (!foundContent) {
        // If no content found, return original
        resolve(imageSrc);
        return;
      }
      
      // Add padding and ensure bounds
      minX = Math.max(0, minX - padding);
      minY = Math.max(0, minY - padding);
      maxX = Math.min(img.width - 1, maxX + padding);
      maxY = Math.min(img.height - 1, maxY + padding);
      
      const cropWidth = maxX - minX;
      const cropHeight = maxY - minY;
      
      // Set canvas to cropped size
      canvas.width = cropWidth;
      canvas.height = cropHeight;
      
      // Draw cropped image
      ctx.drawImage(img, minX, minY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
      
      resolve(canvas.toDataURL('image/png'));
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageSrc;
  });
}

export function removeWhiteBackground(imageSrc: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw the image
      ctx.drawImage(img, 0, 0);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Remove white background (make transparent)
      for (let i = 0; i < data.length; i += 4) {
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];
        
        // Check if pixel is close to white
        const threshold = 240; // Adjust this value to be more/less aggressive
        if (red > threshold && green > threshold && blue > threshold) {
          // Make this pixel transparent
          data[i + 3] = 0; // Set alpha to 0
        }
      }
      
      // Put the modified image data back
      ctx.putImageData(imageData, 0, 0);
      
      // Convert to base64
      resolve(canvas.toDataURL('image/png'));
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageSrc;
  });
}

export function removeWhiteBackgroundAdvanced(imageSrc: string, tolerance: number = 30): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw the image
      ctx.drawImage(img, 0, 0);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Sample corner pixels to detect background color
      const cornerSamples = [
        { r: data[0], g: data[1], b: data[2] }, // top-left
        { r: data[(canvas.width - 1) * 4], g: data[(canvas.width - 1) * 4 + 1], b: data[(canvas.width - 1) * 4 + 2] }, // top-right
        { r: data[(canvas.height - 1) * canvas.width * 4], g: data[(canvas.height - 1) * canvas.width * 4 + 1], b: data[(canvas.height - 1) * canvas.width * 4 + 2] }, // bottom-left
        { r: data[((canvas.height - 1) * canvas.width + canvas.width - 1) * 4], g: data[((canvas.height - 1) * canvas.width + canvas.width - 1) * 4 + 1], b: data[((canvas.height - 1) * canvas.width + canvas.width - 1) * 4 + 2] } // bottom-right
      ];
      
      // Calculate average background color from corners
      const bgColor = {
        r: Math.round(cornerSamples.reduce((sum, sample) => sum + sample.r, 0) / cornerSamples.length),
        g: Math.round(cornerSamples.reduce((sum, sample) => sum + sample.g, 0) / cornerSamples.length),
        b: Math.round(cornerSamples.reduce((sum, sample) => sum + sample.b, 0) / cornerSamples.length)
      };
      
      // Remove background with adaptive color matching
      for (let i = 0; i < data.length; i += 4) {
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];
        
        // Check if pixel matches background color within tolerance
        const colorDistance = Math.sqrt(
          Math.pow(red - bgColor.r, 2) + 
          Math.pow(green - bgColor.g, 2) + 
          Math.pow(blue - bgColor.b, 2)
        );
        
        // Also check for generic white/light backgrounds
        const isWhiteOrLight = (
          // Pure white
          (red > 240 && green > 240 && blue > 240) ||
          // Light gray
          (red > 220 && green > 220 && blue > 220 && 
           Math.abs(red - green) < 20 && 
           Math.abs(green - blue) < 20 && 
           Math.abs(red - blue) < 20)
        );
        
        if (colorDistance < tolerance || isWhiteOrLight) {
          // Make this pixel transparent
          data[i + 3] = 0; // Set alpha to 0
        }
      }
      
      // Put the modified image data back
      ctx.putImageData(imageData, 0, 0);
      
      // Convert to base64
      resolve(canvas.toDataURL('image/png'));
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageSrc;
  });
}