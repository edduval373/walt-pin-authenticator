// Transmission logging system for Disney pin authentication
export interface TransmissionLog {
  id: string;
  imageNumber: number;
  timestamp: string;
  type: 'health_check' | 'image_upload';
  status: 'success' | 'failed';
  details: string;
  endpoint?: string;
  imageTitle?: string;
  errorMessage?: string;
  responseData?: any;
  apiKey?: string;
  sessionId?: string;
  headers?: Record<string, string>;
  rawRequest?: string;
  rawResponse?: string;
}

class TransmissionLogger {
  private logs: TransmissionLog[] = [];
  private currentImageNumber = 1;

  // Initialize from localStorage
  constructor() {
    this.loadLogs();
  }

  private loadLogs() {
    try {
      const stored = localStorage.getItem('transmission_logs');
      if (stored) {
        this.logs = JSON.parse(stored);
        
        // Clean up and migrate any logs with old data structure
        this.logs = this.logs.map(log => {
          // Ensure all required fields exist
          if (!log.endpoint) {
            log.endpoint = log.type === 'health_check' 
              ? 'https://pim-master-library.replit.app/health'
              : 'https://pim-master-library.replit.app/mobile-upload';
          }
          
          // Convert any object responseData to string
          if (log.responseData && typeof log.responseData === 'object' && typeof log.responseData !== 'string') {
            log.responseData = JSON.stringify(log.responseData);
          }
          
          return log;
        }).filter(log => log.id && log.timestamp); // Remove any completely invalid logs
        
        // Get the highest image number to continue sequence
        const maxImageNumber = Math.max(0, ...this.logs.map(log => log.imageNumber || 0));
        this.currentImageNumber = maxImageNumber + 1;
      }
    } catch (error) {
      console.error('Failed to load transmission logs:', error);
      this.logs = [];
      localStorage.removeItem('transmission_logs'); // Clear corrupted data
    }
  }

  private saveLogs() {
    try {
      localStorage.setItem('transmission_logs', JSON.stringify(this.logs));
    } catch (error) {
      console.error('Failed to save transmission logs:', error);
    }
  }

  // Log health check attempt
  logHealthCheck(status: 'success' | 'failed', details: string, endpoint?: string, errorMessage?: string) {
    const log: TransmissionLog = {
      id: this.generateId(),
      imageNumber: 0, // Health checks don't have image numbers
      timestamp: new Date().toISOString(),
      type: 'health_check',
      status,
      details,
      endpoint,
      errorMessage
    };

    this.logs.push(log);
    this.saveLogs();
    console.log('Health check logged:', log);
  }

  // Log image upload attempt
  logImageUpload(status: 'success' | 'failed', details: string, endpoint?: string, errorMessage?: string, responseData?: any, apiKey?: string, sessionId?: string, headers?: Record<string, string>, rawRequest?: string, rawResponse?: string) {
    const imageTitle = `Image #${this.currentImageNumber}`;
    
    const log: TransmissionLog = {
      id: this.generateId(),
      imageNumber: this.currentImageNumber,
      timestamp: new Date().toISOString(),
      type: 'image_upload',
      status,
      details,
      endpoint,
      imageTitle,
      errorMessage,
      responseData,
      apiKey,
      sessionId,
      headers,
      rawRequest,
      rawResponse
    };

    this.logs.push(log);
    this.currentImageNumber++;
    this.saveLogs();
    console.log('Image upload logged:', log);
    
    return imageTitle;
  }

  // Get all logs
  getAllLogs(): TransmissionLog[] {
    return [...this.logs].reverse(); // Most recent first
  }

  // Get logs for current session (today)
  getTodaysLogs(): TransmissionLog[] {
    const today = new Date().toDateString();
    return this.logs.filter(log => 
      new Date(log.timestamp).toDateString() === today
    ).reverse();
  }

  // Clear all logs
  clearLogs() {
    this.logs = [];
    this.currentImageNumber = 1;
    localStorage.removeItem('transmission_logs');
    console.log('All transmission logs cleared');
  }

  // Get the next image number for naming
  getNextImageNumber(): number {
    return this.currentImageNumber;
  }

  // Get summary stats
  getStats() {
    const total = this.logs.length;
    const successful = this.logs.filter(log => log.status === 'success').length;
    const failed = this.logs.filter(log => log.status === 'failed').length;
    const healthChecks = this.logs.filter(log => log.type === 'health_check').length;
    const imageUploads = this.logs.filter(log => log.type === 'image_upload').length;

    return {
      total,
      successful,
      failed,
      healthChecks,
      imageUploads,
      successRate: total > 0 ? Math.round((successful / total) * 100) : 0
    };
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

// Create singleton instance
export const transmissionLogger = new TransmissionLogger();