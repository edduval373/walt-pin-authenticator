// Graceful fetch that never throws unhandled promise rejections
export async function gracefulFetch(url: string, options: RequestInit = {}): Promise<Response | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    // Log error without throwing
    console.log('Network request failed:', error instanceof Error ? error.message : String(error));
    return null;
  }
}