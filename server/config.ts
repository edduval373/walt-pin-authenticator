import { log } from "./vite";

// API configuration with environment-specific settings
interface ApiEnvironmentConfig {
  baseUrl: string;
  apiKey: string;
  fallbackUrls?: string[];
}

// Updated API URLs for Railway production hosting  
const FORCE_API_URL = "https://master.pinauth.com/mobile-upload";
const FORCE_HEALTH_URL = "https://master.pinauth.com/health";
const FORCE_API_KEY = process.env.PIM_STANDARD_API_KEY || "pim_mobile_2505271605_7f8d9e2a1b4c6d8f9e0a1b2c3d4e5f6g";

// Override environment variables programmatically to ensure correct URLs
process.env.PIM_API_URL = "https://master.pinauth.com";
process.env.HEALTH_CHECK_URL = "https://master.pinauth.com/health";

// Force override for all API configurations
const FORCED_PIM_API_URL = "https://master.pinauth.com";
const FORCED_HEALTH_CHECK_URL = "https://master.pinauth.com/health";

// Configuration for different environments - all use forced values
const API_ENVIRONMENTS: Record<string, ApiEnvironmentConfig> = {
  development: {
    baseUrl: FORCED_PIM_API_URL,
    apiKey: FORCE_API_KEY,
    fallbackUrls: []
  },
  production: {
    baseUrl: FORCED_PIM_API_URL,
    apiKey: FORCE_API_KEY,
    fallbackUrls: []
  },
  testing: {
    baseUrl: FORCED_PIM_API_URL,
    apiKey: FORCE_API_KEY
  }
};

// Select the environment based on NODE_ENV or default to development
const currentEnv = (process.env.API_ENVIRONMENT || process.env.NODE_ENV || 'development');
const apiConfig = API_ENVIRONMENTS[currentEnv] || API_ENVIRONMENTS.development;

// Log which environment we're using
log(`Using PIM API environment: ${currentEnv}`, 'express');
log(`API base URL: ${apiConfig.baseUrl}`, 'express');
if (apiConfig.fallbackUrls?.length) {
  log(`Fallback URLs: ${apiConfig.fallbackUrls.join(', ')}`, 'express');
}

// Export configuration values
export const API_BASE_URL = apiConfig.baseUrl;
export const API_KEY = apiConfig.apiKey;
export const FALLBACK_URLS = apiConfig.fallbackUrls || [];
export const HEALTH_CHECK_URL = FORCED_HEALTH_CHECK_URL; // Always use the forced health URL

// Export API endpoint URLs - Updated for Railway production hosting
export const API_ENDPOINTS = {
  directVerify: "https://master.pinauth.com/mobile-upload", // Mobile upload endpoint
  health: "https://master.pinauth.com/health", // Health check endpoint
  status: "https://master.pinauth.com/status"
};

// Export fallback endpoint URLs
export const FALLBACK_ENDPOINTS = FALLBACK_URLS.map(url => ({
  directVerify: `${url}/mobile-upload`, // Use the correct mobile-upload path
  status: `${url}/status`,
  health: `${url}/health`
}));

// Export API key status
export const API_KEY_CONFIGURED = !!API_KEY;

// Helper functions
export const isDevelopment = () => currentEnv === 'development';
export const isProduction = () => currentEnv === 'production';
export const isTesting = () => currentEnv === 'testing';