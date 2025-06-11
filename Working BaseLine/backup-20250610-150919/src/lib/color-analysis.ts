// Color analysis utilities for pin authentication

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

// Extract dominant colors from an image
export async function extractDominantColors(
  img: HTMLImageElement,
  numColors: number = 4
): Promise<RgbColor[]> {
  // For a real implementation, this would use a more sophisticated algorithm
  // like k-means clustering to extract dominant colors
  
  // Create a canvas to analyze the image
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context for color analysis');
  }
  
  // Resize the image to speed up processing
  const maxDimension = 100;
  const scaleFactor = Math.min(maxDimension / img.width, maxDimension / img.height);
  const width = Math.floor(img.width * scaleFactor);
  const height = Math.floor(img.height * scaleFactor);
  
  canvas.width = width;
  canvas.height = height;
  
  // Draw the image on the canvas
  ctx.drawImage(img, 0, 0, width, height);
  
  // Get pixel data
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;
  
  // Simplified color quantization
  // Group similar colors by dividing RGB color space
  const colorBuckets: Record<string, { count: number, r: number, g: number, b: number }> = {};
  
  // Process every pixel (each pixel has 4 values: R, G, B, and Alpha)
  for (let i = 0; i < pixels.length; i += 4) {
    // Get RGB values
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    
    // Simplify color by rounding to nearest 20
    const roundedR = Math.round(r / 20) * 20;
    const roundedG = Math.round(g / 20) * 20;
    const roundedB = Math.round(b / 20) * 20;
    
    // Create a key for this color
    const key = `${roundedR}-${roundedG}-${roundedB}`;
    
    // Add to or create a bucket for this color
    if (key in colorBuckets) {
      colorBuckets[key].count++;
    } else {
      colorBuckets[key] = { count: 1, r: roundedR, g: roundedG, b: roundedB };
    }
  }
  
  // Convert buckets to array and sort by count
  const colorArray = Object.values(colorBuckets).sort((a, b) => b.count - a.count);
  
  // Return the most dominant colors, excluding near-black and near-white if possible
  const filteredColors = colorArray.filter(color => {
    // Skip near-black colors (very dark)
    if (color.r < 30 && color.g < 30 && color.b < 30) return false;
    
    // Skip near-white colors
    if (color.r > 230 && color.g > 230 && color.b > 230) return false;
    
    return true;
  });
  
  // If we have enough filtered colors, use those, otherwise fall back to unfiltered
  const dominantColors = (filteredColors.length >= numColors ? filteredColors : colorArray)
    .slice(0, numColors)
    .map(color => ({ r: color.r, g: color.g, b: color.b }));
  
  return dominantColors;
}

// Calculate color similarity between two sets of colors
export function compareColors(colorsA: RgbColor[], colorsB: RgbColor[]): number {
  if (colorsA.length === 0 || colorsB.length === 0) {
    return 0;
  }
  
  // Calculate the minimum distance from each color in A to any color in B
  let totalSimilarity = 0;
  
  colorsA.forEach(colorA => {
    let minDistance = Infinity;
    
    colorsB.forEach(colorB => {
      // Calculate Euclidean distance in RGB space
      const distance = Math.sqrt(
        Math.pow(colorA.r - colorB.r, 2) +
        Math.pow(colorA.g - colorB.g, 2) +
        Math.pow(colorA.b - colorB.b, 2)
      );
      
      // Update minimum distance
      minDistance = Math.min(minDistance, distance);
    });
    
    // Convert distance to similarity (0-1 range)
    // 450 is max possible distance in RGB space (√(255² + 255² + 255²))
    const similarity = 1 - (minDistance / 450);
    totalSimilarity += similarity;
  });
  
  // Return average similarity
  return totalSimilarity / colorsA.length;
}
