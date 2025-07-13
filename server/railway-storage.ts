import { Pool } from 'pg';
import { 
  type User, type Pin, type Analysis, type UserFeedback, type MobileAppApiLog,
  type InsertUser, type InsertPin, type InsertAnalysis, type InsertUserFeedback, type InsertMobileAppApiLog
} from "@shared/schema";
import { IStorage } from "./storage";
import { log } from "./vite";

// Railway database storage implementation
export class RailwayStorage implements IStorage {
  private pool: Pool;

  constructor() {
    // Use individual PostgreSQL environment variables
    const poolConfig = process.env.DATABASE_URL ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    } : {
      host: process.env.PGHOST,
      port: parseInt(process.env.PGPORT || '5432'),
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      ssl: { rejectUnauthorized: false }
    };

    this.pool = new Pool({
      ...poolConfig,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 20000,
      max: 5,
      min: 0
    });
    
    // Handle pool errors to prevent crashes
    this.pool.on('error', (err) => {
      log(`Database pool error: ${err.message}`, 'railway');
    });
    
    log('Connecting to Railway production database', 'railway');
    // Don't wait for connection test in constructor to avoid blocking
    this.testConnection().catch(error => {
      log(`Database connection test failed: ${error.message}`, 'railway');
    });
  }

  private async testConnection() {
    let client;
    try {
      client = await this.pool.connect();
      await client.query('SELECT NOW()');
      log('Railway database connection successful', 'railway');
      await this.initializeFeedbackColumns();
    } catch (error: any) {
      log(`Railway database connection failed: ${error.message}`, 'railway');
      log('Check Railway database status or connection string', 'railway');
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  private async initializeFeedbackColumns() {
    try {
      // Check if columns already exist
      const columnsResult = await this.pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'pins' AND column_name IN ('user_agreement', 'feedback_comment', 'feedback_submitted_at')
      `);
      
      const existingColumns = columnsResult.rows.map(row => row.column_name);
      
      if (existingColumns.length < 3) {
        log('Adding feedback columns to Railway pins table...', 'railway');
        
        // Add feedback columns to pins table if they don't exist
        await this.pool.query(`
          ALTER TABLE pins 
          ADD COLUMN IF NOT EXISTS user_agreement VARCHAR(10) CHECK (user_agreement IN ('agree', 'disagree')),
          ADD COLUMN IF NOT EXISTS feedback_comment TEXT,
          ADD COLUMN IF NOT EXISTS feedback_submitted_at TIMESTAMP
        `);
        
        log('Railway database feedback columns added successfully', 'railway');
      } else {
        log('Railway feedback columns already exist', 'railway');
      }
    } catch (error: any) {
      log(`Railway database initialization error: ${error.message}`, 'railway');
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const result = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
      return result.rows[0] || undefined;
    } catch (error: any) {
      log(`Railway error getting user: ${error.message}`, 'railway');
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await this.pool.query('SELECT * FROM users WHERE username = $1', [username]);
      return result.rows[0] || undefined;
    } catch (error: any) {
      log(`Railway error getting user by username: ${error.message}`, 'railway');
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const result = await this.pool.query(
        'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *',
        [(user as any).username, (user as any).password]
      );
      return result.rows[0];
    } catch (error: any) {
      log(`Railway error creating user: ${error.message}`, 'railway');
      throw error;
    }
  }

  // Pin methods
  async getAllPins(): Promise<Pin[]> {
    try {
      const result = await this.pool.query('SELECT * FROM pins ORDER BY created_at DESC');
      return result.rows;
    } catch (error: any) {
      log(`Railway error getting all pins: ${error.message}`, 'railway');
      return [];
    }
  }

  async getPinById(pinId: string): Promise<Pin | undefined> {
    try {
      const result = await this.pool.query('SELECT * FROM pins WHERE pin_id = $1', [pinId]);
      return result.rows[0] || undefined;
    } catch (error: any) {
      log(`Railway error getting pin: ${error.message}`, 'railway');
      return undefined;
    }
  }

  async createPin(pin: InsertPin): Promise<Pin> {
    try {
      const result = await this.pool.query(
        'INSERT INTO pins (pin_id, name, series, release_year, image_url, dominant_colors, similar_pins) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [(pin as any).pinId, (pin as any).name, (pin as any).series, (pin as any).releaseYear, (pin as any).imageUrl, (pin as any).dominantColors, (pin as any).similarPins]
      );
      return result.rows[0];
    } catch (error: any) {
      log(`Railway error creating pin: ${error.message}`, 'railway');
      throw error;
    }
  }

  async updatePinFeedback(pinId: string, userAgreement: string, feedbackComment?: string): Promise<Pin | undefined> {
    try {
      const result = await this.pool.query(
        'UPDATE pins SET user_agreement = $1, feedback_comment = $2, feedback_submitted_at = CURRENT_TIMESTAMP WHERE pin_id = $3 RETURNING *',
        [userAgreement, feedbackComment || null, pinId]
      );
      
      if (result.rows[0]) {
        log(`Railway pin feedback updated: ${userAgreement} for pin ${pinId}`, 'railway');
        return result.rows[0];
      } else {
        log(`Railway pin not found for feedback update: ${pinId}`, 'railway');
        return undefined;
      }
    } catch (error: any) {
      log(`Railway error updating pin feedback: ${error.message}`, 'railway');
      throw error;
    }
  }

  async updatePinFeedbackById(id: number, userAgreement: string, feedbackComment?: string): Promise<Pin | undefined> {
    try {
      const result = await this.pool.query(
        'UPDATE pins SET user_agreement = $1, feedback_comment = $2, feedback_submitted_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
        [userAgreement, feedbackComment || null, id]
      );
      
      if (result.rows[0]) {
        log(`Railway pin feedback updated: ${userAgreement} for ID ${id}`, 'railway');
        return result.rows[0];
      } else {
        log(`Railway pin not found for feedback update: ID ${id}`, 'railway');
        return undefined;
      }
    } catch (error: any) {
      log(`Railway error updating pin feedback by ID: ${error.message}`, 'railway');
      throw error;
    }
  }

  // Analysis methods removed - using pins table only

  // User Feedback methods
  async createUserFeedback(feedback: InsertUserFeedback): Promise<UserFeedback> {
    try {
      const result = await this.pool.query(
        'INSERT INTO user_feedback (analysis_id, pin_id, user_agreement, feedback_comment) VALUES ($1, $2, $3, $4) RETURNING *',
        [(feedback as any).analysisId, (feedback as any).pinId, (feedback as any).userAgreement, (feedback as any).feedbackComment]
      );
      
      const savedFeedback = result.rows[0];
      log(`Railway feedback saved: ${savedFeedback.user_agreement} for analysis ${savedFeedback.analysis_id}`, 'railway');
      
      return {
        id: savedFeedback.id,
        analysisId: savedFeedback.analysis_id,
        pinId: savedFeedback.pin_id,
        userAgreement: savedFeedback.user_agreement,
        feedbackComment: savedFeedback.feedback_comment,
        submittedAt: savedFeedback.submitted_at
      };
    } catch (error: any) {
      log(`Railway error creating user feedback: ${error.message}`, 'railway');
      throw error;
    }
  }

  async getFeedbackByAnalysisId(analysisId: number): Promise<UserFeedback[]> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM user_feedback WHERE analysis_id = $1 ORDER BY submitted_at DESC',
        [analysisId]
      );
      
      return result.rows.map(row => ({
        id: row.id,
        analysisId: row.analysis_id,
        pinId: row.pin_id,
        userAgreement: row.user_agreement,
        feedbackComment: row.feedback_comment,
        submittedAt: row.submitted_at
      }));
    } catch (error: any) {
      log(`Railway error getting feedback by analysis ID: ${error.message}`, 'railway');
      return [];
    }
  }

  async getAllUserFeedback(): Promise<UserFeedback[]> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM user_feedback ORDER BY submitted_at DESC'
      );
      
      const feedback = result.rows.map(row => ({
        id: row.id,
        analysisId: row.analysis_id,
        pinId: row.pin_id,
        userAgreement: row.user_agreement,
        feedbackComment: row.feedback_comment,
        submittedAt: row.submitted_at
      }));
      
      log(`Railway retrieved ${feedback.length} feedback records`, 'railway');
      return feedback;
    } catch (error: any) {
      log(`Railway error getting all user feedback: ${error.message}`, 'railway');
      return [];
    }
  }

  // Mobile App API Log methods
  async createMobileAppLog(logEntry: InsertMobileAppApiLog): Promise<MobileAppApiLog> {
    try {
      const result = await this.pool.query(
        'INSERT INTO mobile_app_api_log (session_id, request_type, request_body, response_body, response_status, host_api_called, host_api_response, host_api_status, error_message) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
        [
          (logEntry as any).sessionId,
          (logEntry as any).requestType,
          (logEntry as any).requestBody,
          (logEntry as any).responseBody || null,
          (logEntry as any).responseStatus || null,
          (logEntry as any).hostApiCalled || false,
          (logEntry as any).hostApiResponse || null,
          (logEntry as any).hostApiStatus || null,
          (logEntry as any).errorMessage || null
        ]
      );
      return result.rows[0];
    } catch (error: any) {
      log(`Railway error creating mobile app log: ${error.message}`, 'railway');
      throw error;
    }
  }

  async getMobileAppLogsBySession(sessionId: string): Promise<MobileAppApiLog[]> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM mobile_app_api_log WHERE session_id = $1 ORDER BY created_at DESC',
        [sessionId]
      );
      return result.rows;
    } catch (error: any) {
      log(`Railway error getting mobile app logs for session ${sessionId}: ${error.message}`, 'railway');
      return [];
    }
  }

  async getAllMobileAppLogs(): Promise<MobileAppApiLog[]> {
    try {
      const result = await this.pool.query('SELECT * FROM mobile_app_api_log ORDER BY created_at DESC LIMIT 100');
      return result.rows;
    } catch (error: any) {
      log(`Railway error getting all mobile app logs: ${error.message}`, 'railway');
      return [];
    }
  }

  async close() {
    await this.pool.end();
  }
}