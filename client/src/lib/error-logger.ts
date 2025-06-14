// Production-safe error logging utility
export class ErrorLogger {
  private static instance: ErrorLogger;
  private errors: Array<{ timestamp: string; error: string; stack?: string; url: string }> = [];

  private constructor() {
    // Listen for unhandled errors
    window.addEventListener('error', (event) => {
      this.logError('Unhandled Error', event.error || event.message, window.location.href);
    });

    // Listen for unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError('Unhandled Promise Rejection', event.reason, window.location.href);
    });
  }

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  logError(message: string, error?: any, url?: string): void {
    const timestamp = new Date().toISOString();
    const errorEntry = {
      timestamp,
      error: message,
      stack: error?.stack || String(error),
      url: url || window.location.href
    };

    this.errors.push(errorEntry);
    
    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorLogger:', errorEntry);
    }

    // Keep only last 50 errors to prevent memory issues
    if (this.errors.length > 50) {
      this.errors = this.errors.slice(-50);
    }

    // Send to server in production (optional)
    if (import.meta.env.PROD) {
      this.sendToServer(errorEntry);
    }
  }

  private async sendToServer(errorEntry: any): Promise<void> {
    try {
      await fetch('/api/client-errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorEntry)
      });
    } catch (e) {
      // Silently fail - don't create infinite error loops
    }
  }

  getErrors(): Array<{ timestamp: string; error: string; stack?: string; url: string }> {
    return [...this.errors];
  }

  clearErrors(): void {
    this.errors = [];
  }
}

// Initialize error logger
export const errorLogger = ErrorLogger.getInstance();