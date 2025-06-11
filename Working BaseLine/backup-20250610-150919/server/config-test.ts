// Simple configuration for API endpoints
export const API_KEY = process.env.PIM_STANDARD_API_KEY || "pim_0w3nfrt5ahgc";
export const PRIMARY_API_URL = "https://master.pinauth.com";
export const FALLBACK_API_URL = "https://api.pinmaster.railway.app";

// Full endpoints
export const PRIMARY_VERIFY_ENDPOINT = `${PRIMARY_API_URL}/mobile-upload`;
export const FALLBACK_VERIFY_ENDPOINT = `${FALLBACK_API_URL}/mobile-upload`;