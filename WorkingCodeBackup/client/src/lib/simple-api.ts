interface SimplePinAnalysis {
  frontImage: string;
  backImage?: string;
  angledImage?: string;
}

interface SimplePinResult {
  success: boolean;
  message: string;
  pinId?: string;
  sessionId?: string;
  authentic?: boolean;
  authenticityRating?: number;
  analysis?: string;
  identification?: string;
  pricing?: string;
}

export async function analyzePin(images: SimplePinAnalysis): Promise<SimplePinResult> {
  try {
    console.log('[SIMPLE-API] Sending analysis request');
    
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(images)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Server error: ${response.status}`);
    }

    const result = await response.json();
    console.log('[SIMPLE-API] Analysis complete:', result.success);
    
    return result;
  } catch (error) {
    console.error('[SIMPLE-API] Error:', error);
    throw error;
  }
}