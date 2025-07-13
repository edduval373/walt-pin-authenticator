/**
 * Simple script to create database tables for Railway deployment
 * This fixes the "relation 'pins' does not exist" error
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createTables() {
  console.log('Creating database tables...');
  
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      )
    `);
    
    // Create pins table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pins (
        id SERIAL PRIMARY KEY,
        pin_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        series TEXT NOT NULL,
        release_year INTEGER NOT NULL,
        image_url TEXT NOT NULL,
        dominant_colors JSONB NOT NULL,
        similar_pins JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        user_agreement TEXT CHECK (user_agreement IN ('agree', 'disagree')),
        feedback_comment TEXT,
        feedback_submitted_at TIMESTAMP
      )
    `);
    
    // Create analyses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS analyses (
        id SERIAL PRIMARY KEY,
        image_blob TEXT NOT NULL,
        pin_id TEXT NOT NULL,
        confidence INTEGER NOT NULL,
        factors JSONB NOT NULL,
        color_match_percentage INTEGER NOT NULL,
        database_match_count INTEGER NOT NULL,
        image_quality_score INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    
    // Create user_feedback table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_feedback (
        id SERIAL PRIMARY KEY,
        analysis_id INTEGER REFERENCES analyses(id) NOT NULL,
        pin_id TEXT NOT NULL,
        user_agreement TEXT NOT NULL,
        feedback_comment TEXT,
        submitted_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    
    // Create mobile_app_api_log table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS mobile_app_api_log (
        id SERIAL PRIMARY KEY,
        session_id TEXT NOT NULL,
        request_type TEXT NOT NULL,
        request_data JSONB,
        response_data JSONB,
        success BOOLEAN NOT NULL,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    
    console.log('✅ Database tables created successfully');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

createTables().catch(console.error);