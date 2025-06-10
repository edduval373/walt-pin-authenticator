import { Pool } from 'pg';
import { 
  type User, type Pin, type Analysis, type UserFeedback,
  type InsertUser, type InsertPin, type InsertAnalysis, type InsertUserFeedback
} from "@shared/schema";
import { IStorage } from "./storage";
import { log } from "./vite";

// Database storage implementation using PostgreSQL
export class DatabaseStorage implements IStorage {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    // Initialize database tables
    this.initializeTables();
  }

  private async initializeTables() {
    try {
      // Create users table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL
        )
      `);

      // Create pins table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS pins (
          id SERIAL PRIMARY KEY,
          pin_id VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          series VARCHAR(255) NOT NULL,
          release_year INTEGER NOT NULL,
          image_url VARCHAR(500) NOT NULL,
          dominant_colors JSONB NOT NULL,
          similar_pins JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        )
      `);

      // Create analyses table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS analyses (
          id SERIAL PRIMARY KEY,
          image_blob TEXT NOT NULL,
          pin_id VARCHAR(255) NOT NULL,
          confidence INTEGER NOT NULL,
          factors JSONB NOT NULL,
          color_match_percentage INTEGER NOT NULL,
          database_match_count INTEGER NOT NULL,
          image_quality_score INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        )
      `);

      // Create user_feedback table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS user_feedback (
          id SERIAL PRIMARY KEY,
          analysis_id INTEGER NOT NULL,
          pin_id VARCHAR(255) NOT NULL,
          user_agreement VARCHAR(10) NOT NULL CHECK (user_agreement IN ('agree', 'disagree')),
          feedback_comment TEXT,
          submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      log('Database tables initialized successfully', 'database');
    } catch (error: any) {
      log(`Error initializing database tables: ${error.message}`, 'database');
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const result = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
      return result.rows[0] || undefined;
    } catch (error: any) {
      log(`Error getting user: ${error.message}`, 'database');
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await this.pool.query('SELECT * FROM users WHERE username = $1', [username]);
      return result.rows[0] || undefined;
    } catch (error: any) {
      log(`Error getting user by username: ${error.message}`, 'database');
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const result = await this.pool.query(
        'INSERT INTO users (username, email) VALUES ($1, $2) RETURNING *',
        [user.username, user.email]
      );
      return result.rows[0];
    } catch (error: any) {
      log(`Error creating user: ${error.message}`, 'database');
      throw error;
    }
  }

  // Pin methods
  async getAllPins(): Promise<Pin[]> {
    try {
      const result = await this.pool.query('SELECT * FROM pins ORDER BY created_at DESC');
      return result.rows;
    } catch (error: any) {
      log(`Error getting all pins: ${error.message}`, 'database');
      return [];
    }
  }

  async getPinById(pinId: string): Promise<Pin | undefined> {
    try {
      const result = await this.pool.query('SELECT * FROM pins WHERE id = $1', [pinId]);
      return result.rows[0] || undefined;
    } catch (error: any) {
      log(`Error getting pin: ${error.message}`, 'database');
      return undefined;
    }
  }

  async createPin(pin: InsertPin): Promise<Pin> {
    try {
      const result = await this.pool.query(
        'INSERT INTO pins (id, name, description) VALUES ($1, $2, $3) RETURNING *',
        [pin.id, pin.name, pin.description]
      );
      return result.rows[0];
    } catch (error: any) {
      log(`Error creating pin: ${error.message}`, 'database');
      throw error;
    }
  }

  // Analysis methods
  async analyzePin(imageData: string): Promise<Analysis> {
    try {
      const result = await this.pool.query(
        'INSERT INTO analyses (pin_id, image_data, analysis_result, authenticity_rating) VALUES ($1, $2, $3, $4) RETURNING *',
        ['unknown', imageData, 'Analysis completed', 4]
      );
      return result.rows[0];
    } catch (error: any) {
      log(`Error analyzing pin: ${error.message}`, 'database');
      throw error;
    }
  }

  async getAllAnalyses(): Promise<Analysis[]> {
    try {
      const result = await this.pool.query('SELECT * FROM analyses ORDER BY created_at DESC');
      return result.rows;
    } catch (error: any) {
      log(`Error getting all analyses: ${error.message}`, 'database');
      return [];
    }
  }

  async getAnalysisById(id: number): Promise<Analysis | undefined> {
    try {
      const result = await this.pool.query('SELECT * FROM analyses WHERE id = $1', [id]);
      return result.rows[0] || undefined;
    } catch (error: any) {
      log(`Error getting analysis: ${error.message}`, 'database');
      return undefined;
    }
  }

  async createAnalysis(analysis: InsertAnalysis): Promise<Analysis> {
    try {
      const result = await this.pool.query(
        'INSERT INTO analyses (pin_id, image_data, analysis_result, authenticity_rating) VALUES ($1, $2, $3, $4) RETURNING *',
        [analysis.pinId, analysis.imageData, analysis.analysisResult, analysis.authenticityRating]
      );
      return result.rows[0];
    } catch (error: any) {
      log(`Error creating analysis: ${error.message}`, 'database');
      throw error;
    }
  }

  // User Feedback methods - The critical ones for persistent storage
  async createUserFeedback(feedback: InsertUserFeedback): Promise<UserFeedback> {
    try {
      const result = await this.pool.query(
        'INSERT INTO user_feedback (analysis_id, pin_id, user_agreement, feedback_comment) VALUES ($1, $2, $3, $4) RETURNING *',
        [feedback.analysisId, feedback.pinId, feedback.userAgreement, feedback.feedbackComment]
      );
      
      const savedFeedback = result.rows[0];
      log(`Feedback saved to database: ${savedFeedback.user_agreement} for analysis ${savedFeedback.analysis_id}`, 'database');
      
      return {
        id: savedFeedback.id,
        analysisId: savedFeedback.analysis_id,
        pinId: savedFeedback.pin_id,
        userAgreement: savedFeedback.user_agreement,
        feedbackComment: savedFeedback.feedback_comment,
        submittedAt: savedFeedback.submitted_at
      };
    } catch (error: any) {
      log(`Error creating user feedback: ${error.message}`, 'database');
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
      log(`Error getting feedback by analysis ID: ${error.message}`, 'database');
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
      
      log(`Retrieved ${feedback.length} feedback records from database`, 'database');
      return feedback;
    } catch (error: any) {
      log(`Error getting all user feedback: ${error.message}`, 'database');
      return [];
    }
  }

  // Cleanup method
  async close() {
    await this.pool.end();
  }
}