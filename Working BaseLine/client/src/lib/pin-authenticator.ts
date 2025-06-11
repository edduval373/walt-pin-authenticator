import * as tf from '@tensorflow/tfjs';
import { extractDominantColors, compareColors } from './color-analysis';
import { findSimilarPins } from './pin-database';

// Define types for analysis results
export interface AnalysisFactor {
  name: string;
  description: string;
  confidence: number;
}

export interface AnalysisResult {
  pinId: string;
  confidence: number;
  factors: AnalysisFactor[];
  colorMatchPercentage: number;
  databaseMatchCount: number;
  imageQualityScore: number;
  authenticityScore?: number; // Score on scale of 0-100
  pimStandardHtml?: {
    front?: string;
    back?: string;
    angled?: string;
  };
  // Raw analysis report from PIM Standard API (exact, unmodified)
  rawAnalysisReport?: string;
  
  // New properties from PIM Mobile API structure
  result?: {
    title?: string;
    authenticityRating?: number;
    characters?: string;
    aiFindings?: string;
    pinId?: string;
    pricingInfo?: string;
  };
}

// Load TensorFlow.js model (using a lazy-loading approach)
let model: tf.LayersModel | null = null;
const loadModel = async () => {
  if (!model) {
    try {
      // In a production app, we would load a pre-trained model
      // For this MVP, we'll use a simplified approach without a full model
      console.log('Model initialization placeholder');
    } catch (err) {
      console.error('Error loading model:', err);
      throw new Error('Failed to load image analysis model');
    }
  }
  return model;
};

// Main function to analyze pin image
export async function analyzePinImage(imageData: string): Promise<AnalysisResult> {
  try {
    // 1. Load image data
    const img = new Image();
    img.src = imageData;
    await new Promise((resolve) => { img.onload = resolve; });

    // 2. Extract dominant colors from the image
    const dominantColors = await extractDominantColors(img);
    
    // 3. Find similar pins in the database
    const similarPins = findSimilarPins(dominantColors);
    
    // If no similar pins found, return low confidence result
    if (similarPins.length === 0) {
      return {
        pinId: 'unknown',
        confidence: 30,
        factors: [
          {
            name: 'No Match Found',
            description: 'No similar pins found in our database',
            confidence: 30
          }
        ],
        colorMatchPercentage: 30,
        databaseMatchCount: 0,
        imageQualityScore: 5
      };
    }
    
    // 4. Get the best match
    const bestMatch = similarPins[0];
    
    // 5. Calculate color match percentage
    const colorMatchPercentage = Math.round(compareColors(dominantColors, bestMatch.dominantColors) * 100);
    
    // 6. Calculate image quality score (1-10)
    // For MVP, we use a simplified approach - image size and clarity
    const imageQualityScore = calculateImageQuality(img);
    
    // 7. Generate analysis factors
    const factors: AnalysisFactor[] = generateAnalysisFactors(
      bestMatch.pinId, 
      colorMatchPercentage,
      imageQualityScore
    );
    
    // 8. Calculate overall confidence
    const confidence = calculateOverallConfidence(factors);
    
    // Construct and return the result
    return {
      pinId: bestMatch.pinId,
      confidence,
      factors,
      colorMatchPercentage,
      databaseMatchCount: similarPins.length,
      imageQualityScore
    };
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw new Error('Image analysis failed');
  }
}

// Calculate image quality score
function calculateImageQuality(img: HTMLImageElement): number {
  // Simple quality assessment based on image dimensions
  // In a real app, this would be more sophisticated
  const width = img.width;
  const height = img.height;
  const aspectRatio = width / height;
  
  // Check if image is too small
  if (width < 300 || height < 300) {
    return 3; // Poor quality
  }
  
  // Check if aspect ratio is reasonable (not too stretched)
  if (aspectRatio < 0.5 || aspectRatio > 2) {
    return 5; // Mediocre quality
  }
  
  // Check if image is high resolution
  if (width > 1000 && height > 1000) {
    return 9; // Excellent quality
  }
  
  // Default to good quality
  return 7;
}

// Generate analysis factors
function generateAnalysisFactors(
  pinId: string,
  colorMatchPercentage: number,
  imageQualityScore: number
): AnalysisFactor[] {
  const factors: AnalysisFactor[] = [];
  
  // Color accuracy factor
  factors.push({
    name: 'Color Accuracy',
    description: colorMatchPercentage >= 80
      ? 'Official Disney color patterns match our reference data'
      : colorMatchPercentage >= 60
        ? 'Color patterns show some variance from official Disney colors'
        : 'Color patterns differ significantly from official Disney colors',
    confidence: colorMatchPercentage
  });
  
  // Detail quality factor
  const detailConfidence = colorMatchPercentage >= 70 ? 85 : 60;
  factors.push({
    name: 'Detail Quality',
    description: detailConfidence >= 80
      ? 'Fine details are crisp and well-defined'
      : detailConfidence >= 60
        ? 'Some details are present but lacking precision'
        : 'Poor detail quality compared to authentic pins',
    confidence: detailConfidence
  });
  
  // Back stamp factor (always uncertain in this implementation since we only check one side)
  factors.push({
    name: 'Back Stamp',
    description: 'Unable to verify - please submit back of pin for complete analysis',
    confidence: 60
  });
  
  return factors;
}

// Calculate overall confidence based on factors
function calculateOverallConfidence(factors: AnalysisFactor[]): number {
  if (factors.length === 0) return 0;
  
  // Weight the factors differently
  const weights = {
    'Color Accuracy': 0.5,
    'Detail Quality': 0.4,
    'Back Stamp': 0.1
  };
  
  let totalConfidence = 0;
  let totalWeight = 0;
  
  factors.forEach(factor => {
    const weight = weights[factor.name as keyof typeof weights] || 0.33;
    totalConfidence += factor.confidence * weight;
    totalWeight += weight;
  });
  
  // Round to nearest whole number
  return Math.round(totalConfidence / totalWeight);
}

// Export utility functions for color analysis
export const colorAnalysis = {
  extractDominantColors,
  compareColors
};
