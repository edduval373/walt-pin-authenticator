import { log } from "./vite";

// Force override environment variables before any configuration
process.env.PIM_API_URL = "https://master.pinauth.com/mobile-upload";
process.env.VITE_PIM_API_URL = "https://master.pinauth.com/mobile-upload";
process.env.HEALTH_CHECK_URL = "https://master.pinauth.com/health";

// API configuration with environment-specific settings
interface ApiEnvironmentConfig {
  baseUrl: string;
  apiKey: string;
  fallbackUrls?: string[];
}

// Get API configuration from environment variables
const API_URL_FROM_ENV = process.env.PIM_API_URL || "https://master.pinauth.com/mobile-upload";
const HEALTH_URL_FROM_ENV = process.env.HEALTH_CHECK_URL || "https://master.pinauth.com/health";
const API_KEY_FROM_ENV = process.env.MOBILE_API_KEY || "pim_mobile_2505271605_7f8d9e2a1b4c6d8f9e0a1b2c3d4e5f6g";

// Configuration for different environments - all use environment variables
const API_ENVIRONMENTS: Record<string, ApiEnvironmentConfig> = {
  development: {
    baseUrl: API_URL_FROM_ENV,
    apiKey: API_KEY_FROM_ENV,
    fallbackUrls: []
  },
  production: {
    baseUrl: API_URL_FROM_ENV,
    apiKey: API_KEY_FROM_ENV,
    fallbackUrls: []
  },
  testing: {
    baseUrl: API_URL_FROM_ENV,
    apiKey: API_KEY_FROM_ENV
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
export const HEALTH_CHECK_URL = HEALTH_URL_FROM_ENV;

// Export API endpoint URLs - Using environment variables
export const API_ENDPOINTS = {
  directVerify: API_URL_FROM_ENV, // Mobile upload endpoint
  health: HEALTH_URL_FROM_ENV, // Health check endpoint
  status: `${API_URL_FROM_ENV.replace('/mobile-upload', '')}/status`
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