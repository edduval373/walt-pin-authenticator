import { Request, Response } from 'express';
import fetch from 'node-fetch';

const MOBILE_API_KEY = process.env.MOBILE_API_KEY || "pim_0w3nfrt5ahgc";
const MASTER_URL = "https://master.pinauth.com/mobile-upload";

export interface SimplePinRequest {
  frontImage: string;
  backImage?: string;
  angledImage?: string;
}

export interface SimplePinResponse {
  success: boolean;
  message: string;
  authentic?: boolean;
  authenticityRating?: number;
  analysis?: string;
  identification?: string;
  pricing?: string;
  sessionId?: string;
}

export async function analyzePin(req: Request, res: Response) {
  try {
    const { frontImage, backImage, angledImage } = req.body as SimplePinRequest;
    
    if (!frontImage) {
      return res.status(400).json({
        success: false,
        message: "Front image is required"
      });
    }

    console.log(`[SIMPLE-API] Starting pin analysis`);
    console.log(`[SIMPLE-API] Images: front=${!!frontImage}, back=${!!backImage}, angled=${!!angledImage}`);
    
    const payload = {
      frontImage,
      backImage: backImage || null,
      angledImage: angledImage || null
    };

    const response = await fetch(MASTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': MOBILE_API_KEY
      },
      body: JSON.stringify(payload)
    });

    console.log(`[SIMPLE-API] Master server response: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`[SIMPLE-API] Error: ${errorText}`);
      return res.status(500).json({
        success: false,
        message: `Analysis failed: ${response.status}`,
        error: errorText
      });
    }

    const result = await response.json() as any;
    console.log(`[SIMPLE-API] Success: ${result.success}`);

    const simplifiedResponse: SimplePinResponse = {
      success: result.success || false,
      message: result.message || "Analysis complete",
      authentic: result.authentic,
      authenticityRating: result.authenticityRating,
      analysis: result.analysis,
      identification: result.identification,
      pricing: result.pricing,
      sessionId: result.sessionId
    };

    res.json(simplifiedResponse);

  } catch (error) {
    console.error(`[SIMPLE-API] Exception:`, error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}