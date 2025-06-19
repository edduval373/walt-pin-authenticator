// server/railway-deploy.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/railway-storage.ts
import { Pool } from "pg";

// server/vite.ts
import express from "express";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

// server/railway-storage.ts
var RailwayStorage = class {
  pool;
  constructor() {
    const poolConfig = process.env.DATABASE_URL ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    } : {
      host: process.env.PGHOST,
      port: parseInt(process.env.PGPORT || "5432"),
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      ssl: { rejectUnauthorized: false }
    };
    this.pool = new Pool({
      ...poolConfig,
      connectionTimeoutMillis: 1e4,
      idleTimeoutMillis: 2e4,
      max: 5,
      min: 0
    });
    this.pool.on("error", (err) => {
      log(`Database pool error: ${err.message}`, "railway");
    });
    log("Connecting to Railway production database", "railway");
    this.testConnection().catch((error) => {
      log(`Database connection test failed: ${error.message}`, "railway");
    });
  }
  async testConnection() {
    let client;
    try {
      client = await this.pool.connect();
      await client.query("SELECT NOW()");
      log("Railway database connection successful", "railway");
      await this.initializeFeedbackColumns();
    } catch (error) {
      log(`Railway database connection failed: ${error.message}`, "railway");
      log("Check Railway database status or connection string", "railway");
    } finally {
      if (client) {
        client.release();
      }
    }
  }
  async initializeFeedbackColumns() {
    try {
      const columnsResult = await this.pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'pins' AND column_name IN ('user_agreement', 'feedback_comment', 'feedback_submitted_at')
      `);
      const existingColumns = columnsResult.rows.map((row) => row.column_name);
      if (existingColumns.length < 3) {
        log("Adding feedback columns to Railway pins table...", "railway");
        await this.pool.query(`
          ALTER TABLE pins 
          ADD COLUMN IF NOT EXISTS user_agreement VARCHAR(10) CHECK (user_agreement IN ('agree', 'disagree')),
          ADD COLUMN IF NOT EXISTS feedback_comment TEXT,
          ADD COLUMN IF NOT EXISTS feedback_submitted_at TIMESTAMP
        `);
        log("Railway database feedback columns added successfully", "railway");
      } else {
        log("Railway feedback columns already exist", "railway");
      }
    } catch (error) {
      log(`Railway database initialization error: ${error.message}`, "railway");
    }
  }
  // User methods
  async getUser(id) {
    try {
      const result = await this.pool.query("SELECT * FROM users WHERE id = $1", [id]);
      return result.rows[0] || void 0;
    } catch (error) {
      log(`Railway error getting user: ${error.message}`, "railway");
      return void 0;
    }
  }
  async getUserByUsername(username) {
    try {
      const result = await this.pool.query("SELECT * FROM users WHERE username = $1", [username]);
      return result.rows[0] || void 0;
    } catch (error) {
      log(`Railway error getting user by username: ${error.message}`, "railway");
      return void 0;
    }
  }
  async createUser(user) {
    try {
      const result = await this.pool.query(
        "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *",
        [user.username, user.password]
      );
      return result.rows[0];
    } catch (error) {
      log(`Railway error creating user: ${error.message}`, "railway");
      throw error;
    }
  }
  // Pin methods
  async getAllPins() {
    try {
      const result = await this.pool.query("SELECT * FROM pins ORDER BY created_at DESC");
      return result.rows;
    } catch (error) {
      log(`Railway error getting all pins: ${error.message}`, "railway");
      return [];
    }
  }
  async getPinById(pinId) {
    try {
      const result = await this.pool.query("SELECT * FROM pins WHERE pin_id = $1", [pinId]);
      return result.rows[0] || void 0;
    } catch (error) {
      log(`Railway error getting pin: ${error.message}`, "railway");
      return void 0;
    }
  }
  async createPin(pin) {
    try {
      const result = await this.pool.query(
        "INSERT INTO pins (pin_id, name, series, release_year, image_url, dominant_colors, similar_pins) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
        [pin.pinId, pin.name, pin.series, pin.releaseYear, pin.imageUrl, pin.dominantColors, pin.similarPins]
      );
      return result.rows[0];
    } catch (error) {
      log(`Railway error creating pin: ${error.message}`, "railway");
      throw error;
    }
  }
  async updatePinFeedback(pinId, userAgreement, feedbackComment) {
    try {
      const result = await this.pool.query(
        "UPDATE pins SET user_agreement = $1, feedback_comment = $2, feedback_submitted_at = CURRENT_TIMESTAMP WHERE pin_id = $3 RETURNING *",
        [userAgreement, feedbackComment || null, pinId]
      );
      if (result.rows[0]) {
        log(`Railway pin feedback updated: ${userAgreement} for pin ${pinId}`, "railway");
        return result.rows[0];
      } else {
        log(`Railway pin not found for feedback update: ${pinId}`, "railway");
        return void 0;
      }
    } catch (error) {
      log(`Railway error updating pin feedback: ${error.message}`, "railway");
      throw error;
    }
  }
  async updatePinFeedbackById(id, userAgreement, feedbackComment) {
    try {
      const result = await this.pool.query(
        "UPDATE pins SET user_agreement = $1, feedback_comment = $2, feedback_submitted_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *",
        [userAgreement, feedbackComment || null, id]
      );
      if (result.rows[0]) {
        log(`Railway pin feedback updated: ${userAgreement} for ID ${id}`, "railway");
        return result.rows[0];
      } else {
        log(`Railway pin not found for feedback update: ID ${id}`, "railway");
        return void 0;
      }
    } catch (error) {
      log(`Railway error updating pin feedback by ID: ${error.message}`, "railway");
      throw error;
    }
  }
  // Analysis methods removed - using pins table only
  // User Feedback methods
  async createUserFeedback(feedback) {
    try {
      const result = await this.pool.query(
        "INSERT INTO user_feedback (analysis_id, pin_id, user_agreement, feedback_comment) VALUES ($1, $2, $3, $4) RETURNING *",
        [feedback.analysisId, feedback.pinId, feedback.userAgreement, feedback.feedbackComment]
      );
      const savedFeedback = result.rows[0];
      log(`Railway feedback saved: ${savedFeedback.user_agreement} for analysis ${savedFeedback.analysis_id}`, "railway");
      return {
        id: savedFeedback.id,
        analysisId: savedFeedback.analysis_id,
        pinId: savedFeedback.pin_id,
        userAgreement: savedFeedback.user_agreement,
        feedbackComment: savedFeedback.feedback_comment,
        submittedAt: savedFeedback.submitted_at
      };
    } catch (error) {
      log(`Railway error creating user feedback: ${error.message}`, "railway");
      throw error;
    }
  }
  async getFeedbackByAnalysisId(analysisId) {
    try {
      const result = await this.pool.query(
        "SELECT * FROM user_feedback WHERE analysis_id = $1 ORDER BY submitted_at DESC",
        [analysisId]
      );
      return result.rows.map((row) => ({
        id: row.id,
        analysisId: row.analysis_id,
        pinId: row.pin_id,
        userAgreement: row.user_agreement,
        feedbackComment: row.feedback_comment,
        submittedAt: row.submitted_at
      }));
    } catch (error) {
      log(`Railway error getting feedback by analysis ID: ${error.message}`, "railway");
      return [];
    }
  }
  async getAllUserFeedback() {
    try {
      const result = await this.pool.query(
        "SELECT * FROM user_feedback ORDER BY submitted_at DESC"
      );
      const feedback = result.rows.map((row) => ({
        id: row.id,
        analysisId: row.analysis_id,
        pinId: row.pin_id,
        userAgreement: row.user_agreement,
        feedbackComment: row.feedback_comment,
        submittedAt: row.submitted_at
      }));
      log(`Railway retrieved ${feedback.length} feedback records`, "railway");
      return feedback;
    } catch (error) {
      log(`Railway error getting all user feedback: ${error.message}`, "railway");
      return [];
    }
  }
  // Mobile App API Log methods
  async createMobileAppLog(logEntry) {
    try {
      const result = await this.pool.query(
        "INSERT INTO mobile_app_api_log (session_id, request_type, request_body, response_body, response_status, host_api_called, host_api_response, host_api_status, error_message) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
        [
          logEntry.sessionId,
          logEntry.requestType,
          logEntry.requestBody,
          logEntry.responseBody || null,
          logEntry.responseStatus || null,
          logEntry.hostApiCalled || false,
          logEntry.hostApiResponse || null,
          logEntry.hostApiStatus || null,
          logEntry.errorMessage || null
        ]
      );
      return result.rows[0];
    } catch (error) {
      log(`Railway error creating mobile app log: ${error.message}`, "railway");
      throw error;
    }
  }
  async getMobileAppLogsBySession(sessionId) {
    try {
      const result = await this.pool.query(
        "SELECT * FROM mobile_app_api_log WHERE session_id = $1 ORDER BY created_at DESC",
        [sessionId]
      );
      return result.rows;
    } catch (error) {
      log(`Railway error getting mobile app logs for session ${sessionId}: ${error.message}`, "railway");
      return [];
    }
  }
  async getAllMobileAppLogs() {
    try {
      const result = await this.pool.query("SELECT * FROM mobile_app_api_log ORDER BY created_at DESC LIMIT 100");
      return result.rows;
    } catch (error) {
      log(`Railway error getting all mobile app logs: ${error.message}`, "railway");
      return [];
    }
  }
  async close() {
    await this.pool.end();
  }
};

// server/storage.ts
var storage = new RailwayStorage();

// server/routes.ts
import multer from "multer";
import fetch from "node-fetch";
var storage_multer = multer.memoryStorage();
var upload = multer({
  storage: storage_multer,
  limits: {
    fileSize: 10 * 1024 * 1024
    // 10MB limit
  }
});
var API_ENVIRONMENTS = {
  development: {
    // Use only the working master.pinauth.com endpoint
    baseUrls: [
      "https://master.pinauth.com"
    ],
    apiKey: process.env.MOBILE_API_KEY
  },
  production: {
    baseUrls: [
      process.env.PIM_API_URL || "https://master.pinauth.com"
    ],
    apiKey: process.env.MOBILE_API_KEY
  },
  testing: {
    baseUrls: ["https://master.pinauth.com"],
    apiKey: "pim_test_key"
  }
};
var currentEnv = process.env.API_ENVIRONMENT || process.env.NODE_ENV || "development";
var apiConfig = API_ENVIRONMENTS[currentEnv] || API_ENVIRONMENTS.development;
log(`Using PIM API environment: ${currentEnv}`, "express");
log(`Using single API base URL: ${apiConfig.baseUrls[0]}`, "express");
var PIM_API_BASE_URL = apiConfig.baseUrls[0];
var PIM_STANDARD_API_URL = `${PIM_API_BASE_URL}/mobile-upload`;
var PIM_STANDARD_DEBUG_API_URL = `${PIM_API_BASE_URL}/api/status`;
var PIM_STANDARD_OLD_API_URL = `${PIM_API_BASE_URL}/api/mobile/minimal/verify`;
var MOBILE_API_KEY = process.env.MOBILE_API_KEY || apiConfig.apiKey;
if (MOBILE_API_KEY) {
  log("Mobile API key configured successfully");
} else {
  log("WARNING: Mobile API key not configured");
}
async function analyzeImageForPin(frontImageBase64, backImageBase64, angledImageBase64) {
  if (!MOBILE_API_KEY) {
    log(`ERROR: Mobile API key not configured`);
    throw new Error("Mobile API key not configured");
  }
  const cleanFrontImage = frontImageBase64.replace(/^data:image\/[a-z]+;base64,/, "");
  const now = /* @__PURE__ */ new Date();
  const sessionId = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
  const requestBody = {
    sessionId,
    frontImageData: cleanFrontImage
  };
  if (backImageBase64) {
    requestBody.backImageData = backImageBase64.replace(/^data:image\/[a-z]+;base64,/, "");
  }
  if (angledImageBase64) {
    requestBody.angledImageData = angledImageBase64.replace(/^data:image\/[a-z]+;base64,/, "");
  }
  log(`Image sizes - Front: ${cleanFrontImage.length} chars, Back: ${requestBody.backImageData ? requestBody.backImageData.length : "N/A"} chars, Angled: ${requestBody.angledImageData ? requestBody.angledImageData.length : "N/A"} chars`, "express");
  log(`API Key from secrets: ${MOBILE_API_KEY ? MOBILE_API_KEY.substring(0, 10) + "..." : "NOT FOUND"}`, "express");
  log(`Front image data sample: ${cleanFrontImage.substring(0, 30)}...`, "express");
  log(`Making direct API call to: ${PIM_STANDARD_API_URL}`, "express");
  log(`Session ID being sent: ${sessionId}`, "express");
  log(`Request body: ${JSON.stringify(requestBody).substring(0, 200)}...`, "express");
  try {
    const apiResponse = await fetch(PIM_STANDARD_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": MOBILE_API_KEY
      },
      body: JSON.stringify(requestBody)
    });
    log(`Response status: ${apiResponse.status}`, "express");
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      log(`API Error (${apiResponse.status}): ${errorText}`, "express");
      throw new Error(`API Error: ${apiResponse.status} ${errorText}`);
    }
    const data = await apiResponse.json();
    log(`API Response success: ${data.success}, message: ${data.message}`, "express");
    log(`API Response record fields: recordNumber=${data.recordNumber}, recordId=${data.recordId}, sessionId=${data.sessionId}`, "express");
    log(`Full API Response: ${JSON.stringify(data, null, 2).substring(0, 500)}...`, "express");
    const response = {
      success: data.success,
      message: data.message || "Verification completed",
      sessionId: data.sessionId || sessionId,
      recordNumber: data.recordNumber || data.recordId,
      timestamp: data.timestamp || (/* @__PURE__ */ new Date()).toISOString(),
      authentic: data.authentic,
      authenticityRating: data.authenticityRating,
      analysis: data.analysis || data.characters || "",
      identification: data.identification || "",
      pricing: data.pricing || "",
      analysisReport: data.analysisReport || data.analysis || "",
      pinId: data.pinId || data.sessionId,
      aiFindings: data.aiFindings || data.analysis,
      pinIdHtml: data.pinIdHtml || data.identification,
      pricingHtml: data.pricingHtml || data.pricing
    };
    return response;
  } catch (error) {
    log(`Error in PIM API call: ${error.message || error}`, "express");
    throw error;
  }
}
async function registerRoutes(app2) {
  const httpServer = createServer(app2);
  app2.get("/api/health", (req, res) => {
    res.json({
      status: "healthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      environment: process.env.NODE_ENV
    });
  });
  app2.get("/api/config", (req, res) => {
    res.json({
      environment: process.env.API_ENVIRONMENT || process.env.NODE_ENV || "development",
      baseUrl: PIM_API_BASE_URL,
      endpoints: {
        directVerify: "/mobile-upload",
        status: "/api/status"
      },
      hasApiKey: !!MOBILE_API_KEY
    });
  });
  app2.post("/api/proxy/mobile-upload", async (req, res) => {
    try {
      log(`API Key available: ${!!MOBILE_API_KEY}`, "express");
      log(`Making request to master.pinauth.com/mobile-upload`, "express");
      if (!MOBILE_API_KEY) {
        log(`ERROR: No API key configured for deployment`, "express");
        return res.status(500).json({
          success: false,
          message: "API key not configured",
          error: "MOBILE_API_KEY environment variable not set"
        });
      }
      const response = await fetch("https://master.pinauth.com/mobile-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": MOBILE_API_KEY
        },
        body: JSON.stringify(req.body)
      });
      log(`Master server response status: ${response.status}`, "express");
      if (!response.ok) {
        const errorText = await response.text();
        log(`Master server error: ${response.status} - ${errorText}`, "express");
        return res.status(response.status).json({
          success: false,
          message: `Master server error: ${response.status}`,
          error: errorText
        });
      }
      const data = await response.json();
      log(`Master server response received successfully`, "express");
      res.json(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      log(`Proxy error: ${errorMessage}`, "express");
      res.status(500).json({
        success: false,
        message: "Connection to master server failed",
        error: errorMessage
      });
    }
  });
  app2.get("/api/proxy/health", async (req, res) => {
    try {
      log(`Performing health check to master.pinauth.com/health`, "express");
      const response = await fetch("https://master.pinauth.com/health", {
        method: "GET",
        headers: {
          "User-Agent": "Disney-Pin-Auth-Mobile/1.0"
        }
      });
      log(`Health check response status: ${response.status}`, "express");
      if (!response.ok) {
        const errorText = await response.text();
        log(`Health check failed: ${response.status} - ${errorText}`, "express");
        return res.status(response.status).json({
          success: false,
          message: `Health check failed: ${response.status}`,
          error: errorText,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
      const data = await response.json();
      log(`Health check successful`, "express");
      res.json({
        ...data,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        proxyStatus: "healthy"
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      log(`Health check proxy error: ${errorMessage}`, "express");
      res.status(500).json({
        success: false,
        message: "Cannot connect to master server",
        error: errorMessage,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        suggestion: "Check network connectivity and master server status"
      });
    }
  });
  app2.post("/api/mobile/verify-pin", async (req, res) => {
    try {
      const sessionId = req.headers["x-session-id"] || `session_${Date.now()}`;
      const requestId = `req_${Date.now()}`;
      log(`Processing mobile pin verification - Session: ${sessionId}, Request: ${requestId}`);
      const { frontImageBase64, backImageBase64, angledImageBase64 } = req.body;
      if (!frontImageBase64) {
        return res.status(400).json({
          success: false,
          message: "Front image is required for verification",
          requestId,
          sessionId
        });
      }
      log(`Processing images - Front: ${frontImageBase64.length.toString().substring(0, 6)} chars`);
      const analysisResult = await analyzeImageForPin(
        frontImageBase64,
        backImageBase64,
        angledImageBase64
      );
      const pinId = analysisResult.sessionId || `pin_${Date.now()}`;
      const recordNumber = Date.now();
      await storage.createPin({
        pinId,
        name: `Mobile Analysis ${pinId}`,
        series: "Mobile App Results",
        releaseYear: (/* @__PURE__ */ new Date()).getFullYear(),
        imageUrl: "",
        dominantColors: [],
        similarPins: []
      });
      log(`Created provisional pin record: ${pinId} with record number: ${recordNumber}`);
      return res.json({
        success: true,
        pinId,
        recordNumber,
        sessionId,
        requestId,
        authentic: analysisResult.authentic,
        authenticityRating: analysisResult.authenticityRating,
        analysis: analysisResult.analysis,
        identification: analysisResult.identification,
        pricing: analysisResult.pricing,
        message: "Pin analysis complete - awaiting user confirmation"
      });
    } catch (error) {
      log(`Error in mobile pin verification: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: "Verification failed",
        errorCode: "processing_error"
      });
    }
  });
  app2.post("/api/mobile/confirm-pin", async (req, res) => {
    try {
      const { recordNumber, pinId, userAgreement, feedbackComment } = req.body;
      const sessionId = req.headers["x-session-id"];
      log(`Processing pin confirmation - Record: ${recordNumber}, Pin: ${pinId}, Agreement: ${userAgreement}`);
      if (!recordNumber || !pinId || !userAgreement) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: recordNumber, pinId, and userAgreement are required"
        });
      }
      if (userAgreement !== "agree" && userAgreement !== "disagree") {
        return res.status(400).json({
          success: false,
          message: "userAgreement must be either 'agree' or 'disagree'"
        });
      }
      const updatedPin = await storage.updatePinFeedback(pinId, userAgreement, feedbackComment);
      if (!updatedPin) {
        return res.status(404).json({
          success: false,
          message: "Pin record not found"
        });
      }
      try {
        await storage.createUserFeedback({
          analysisId: recordNumber,
          // Use record number as analysis ID for mobile tracking
          pinId,
          userAgreement,
          feedbackComment: feedbackComment || null
        });
      } catch (feedbackError) {
        log(`Warning: Could not create feedback record for record ${recordNumber}: ${feedbackError}`);
      }
      log(`Mobile user feedback confirmed - Record: ${recordNumber}, Agreement: ${userAgreement}`);
      return res.json({
        success: true,
        message: "Pin confirmation saved successfully",
        recordNumber,
        pinId: updatedPin.pinId,
        userAgreement: updatedPin.userAgreement,
        feedbackComment: updatedPin.feedbackComment,
        timestamp: updatedPin.feedbackSubmittedAt,
        sessionId
      });
    } catch (error) {
      log(`Error saving mobile pin confirmation: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: "Failed to save pin confirmation",
        error: error.message
      });
    }
  });
  app2.get("/api/mobile/provisional-pins", async (req, res) => {
    try {
      const sessionId = req.headers["x-session-id"];
      const allPins = await storage.getAllPins();
      const provisionalPins = allPins.filter((pin) => !pin.userAgreement);
      log(`Retrieved ${provisionalPins.length} provisional pins for session: ${sessionId}`);
      return res.json({
        success: true,
        provisionalPins: provisionalPins.map((pin) => ({
          pinId: pin.pinId,
          recordNumber: pin.id,
          // Use database ID as record number
          name: pin.name,
          createdAt: pin.createdAt,
          sessionId
        })),
        total: provisionalPins.length,
        sessionId
      });
    } catch (error) {
      log(`Error retrieving provisional pins: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve provisional pins",
        error: error.message
      });
    }
  });
  app2.post("/api/analyze", async (req, res) => {
    try {
      const { frontImage, backImage, angledImage } = req.body;
      if (!frontImage) {
        return res.status(400).json({
          success: false,
          message: "Front image is required for analysis"
        });
      }
      log(`Processing pin analysis - Front image: ${frontImage.length} chars`);
      const analysisResult = await analyzeImageForPin(
        frontImage,
        backImage,
        angledImage
      );
      const pinId = analysisResult.sessionId || `pin_${Date.now()}`;
      log(`Analysis complete for pin: ${pinId}`);
      return res.json({
        success: true,
        pinId,
        sessionId: analysisResult.sessionId,
        authentic: analysisResult.authentic,
        authenticityRating: analysisResult.authenticityRating,
        analysis: analysisResult.analysis,
        identification: analysisResult.identification,
        pricing: analysisResult.pricing,
        analysisReport: analysisResult.analysisReport,
        message: analysisResult.message || "Pin analysis complete"
      });
    } catch (error) {
      log(`Error in pin analysis: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: "Analysis failed",
        error: error.message
      });
    }
  });
  app2.post("/api/mobile/direct-verify", async (req, res) => {
    try {
      req.url = "/api/mobile/verify-pin";
      return app2._router.handle(req, res);
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Server error processing verification request",
        errorCode: "server_error"
      });
    }
  });
  app2.post("/mobile-upload", async (req, res) => {
    try {
      const { sessionId, frontImageData, backImageData, angledImageData } = req.body;
      const apiKey = req.headers["x-api-key"];
      if (apiKey !== "pim_mobile_2505271605_7f8d9e2a1b4c6d8f9e0a1b2c3d4e5f6g") {
        return res.status(401).json({
          success: false,
          error: "Invalid API key"
        });
      }
      if (!sessionId || !frontImageData) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: sessionId and frontImageData"
        });
      }
      if (!/^\d{12}$/.test(sessionId)) {
        return res.status(400).json({
          success: false,
          error: "Session ID must be 12-digit format"
        });
      }
      const cleanFrontImage = frontImageData.replace(/^data:image\/[a-z]+;base64,/, "");
      const cleanBackImage = backImageData ? backImageData.replace(/^data:image\/[a-z]+;base64,/, "") : void 0;
      const cleanAngledImage = angledImageData ? angledImageData.replace(/^data:image\/[a-z]+;base64,/, "") : void 0;
      const analysisResult = await analyzeImageForPin(cleanFrontImage, cleanBackImage, cleanAngledImage);
      const pinId = `pin_${sessionId}`;
      const pin = await storage.createPin({
        pinId,
        name: `Mobile Analysis ${sessionId}`,
        series: "Mobile Upload",
        releaseYear: (/* @__PURE__ */ new Date()).getFullYear(),
        imageUrl: "",
        dominantColors: [],
        similarPins: []
      });
      return res.json({
        success: true,
        message: "Pin analysis completed successfully",
        sessionId,
        id: pin.id,
        // Primary database ID
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        authentic: analysisResult.authentic,
        authenticityRating: analysisResult.authenticityRating,
        analysis: analysisResult.analysis,
        identification: analysisResult.identification,
        pricing: analysisResult.pricing
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
  app2.get("/api/test-connection", async (req, res) => {
    try {
      const response = await fetch(PIM_STANDARD_DEBUG_API_URL, {
        headers: {
          "X-API-Key": MOBILE_API_KEY || ""
        }
      });
      if (response.ok) {
        return res.json({
          success: true,
          message: "Successfully connected to PIM Standard API",
          statusCode: response.status,
          endpoint: PIM_STANDARD_DEBUG_API_URL
        });
      } else {
        return res.json({
          success: false,
          message: `Failed to connect to PIM Standard API: ${response.status} ${response.statusText}`,
          statusCode: response.status,
          endpoint: PIM_STANDARD_DEBUG_API_URL
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: `Error testing API connection: ${error.message}`,
        endpoint: PIM_STANDARD_DEBUG_API_URL
      });
    }
  });
  app2.post("/api/feedback", async (req, res) => {
    try {
      const { analysisId, pinId, userAgreement, feedbackComment } = req.body;
      if (!pinId || !userAgreement) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: pinId and userAgreement are required"
        });
      }
      if (userAgreement !== "agree" && userAgreement !== "disagree") {
        return res.status(400).json({
          success: false,
          message: "userAgreement must be either 'agree' or 'disagree'"
        });
      }
      let existingPin = await storage.getPinById(pinId);
      if (!existingPin) {
        const newPin = await storage.createPin({
          pinId,
          name: `Analysis Session ${pinId}`,
          series: "Analysis Results",
          releaseYear: (/* @__PURE__ */ new Date()).getFullYear(),
          imageUrl: "",
          dominantColors: [],
          similarPins: []
        });
        log(`Created new pin record for feedback: ${pinId}`);
        existingPin = newPin;
      }
      const updatedPin = await storage.updatePinFeedback(pinId, userAgreement, feedbackComment);
      if (!updatedPin) {
        return res.status(500).json({
          success: false,
          message: "Failed to update pin with feedback"
        });
      }
      try {
        await storage.createUserFeedback({
          analysisId: parseInt(analysisId) || 0,
          pinId,
          userAgreement,
          feedbackComment: feedbackComment || null
        });
      } catch (feedbackError) {
        log(`Warning: Could not create feedback record: ${feedbackError}`);
      }
      log(`User feedback saved: ${userAgreement} for pin ${pinId}`);
      res.json({
        success: true,
        message: "Feedback saved successfully",
        pinId: updatedPin.pinId,
        userAgreement: updatedPin.userAgreement,
        feedbackComment: updatedPin.feedbackComment,
        timestamp: updatedPin.feedbackSubmittedAt
      });
    } catch (error) {
      log(`Error saving user feedback: ${error.message}`);
      res.status(500).json({
        success: false,
        message: "Failed to save feedback",
        error: error.message
      });
    }
  });
  app2.get("/api/feedback/analysis/:analysisId", async (req, res) => {
    try {
      const analysisId = parseInt(req.params.analysisId);
      const feedback = await storage.getFeedbackByAnalysisId(analysisId);
      res.json({
        success: true,
        feedback,
        count: feedback.length
      });
    } catch (error) {
      log(`Error retrieving feedback: ${error.message}`);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve feedback",
        error: error.message
      });
    }
  });
  app2.get("/api/feedback/all", async (req, res) => {
    try {
      const allFeedback = await storage.getAllUserFeedback();
      res.json({
        success: true,
        feedback: allFeedback,
        total: allFeedback.length,
        agreementStats: {
          agree: allFeedback.filter((f) => f.userAgreement === "agree").length,
          disagree: allFeedback.filter((f) => f.userAgreement === "disagree").length
        }
      });
    } catch (error) {
      log(`Error retrieving all feedback: ${error.message}`);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve feedback",
        error: error.message
      });
    }
  });
  app2.get("/api/pins/all", async (req, res) => {
    try {
      const allPins = await storage.getAllPins();
      res.json({
        success: true,
        pins: allPins,
        total: allPins.length,
        feedbackStats: {
          withFeedback: allPins.filter((p) => p.userAgreement).length,
          agree: allPins.filter((p) => p.userAgreement === "agree").length,
          disagree: allPins.filter((p) => p.userAgreement === "disagree").length
        }
      });
    } catch (error) {
      log(`Error retrieving all pins: ${error.message}`);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve pins",
        error: error.message
      });
    }
  });
  app2.use((err, _req, res, _next) => {
    log(`ERROR: ${err.message}`);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message
    });
  });
  return httpServer;
}

// server/railway-deploy.ts
import path2 from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path2.dirname(__filename);
console.log("Starting Railway deployment server...");
var app = express2();
app.use(express2.json({ limit: "100mb" }));
app.use(express2.urlencoded({ extended: false, limit: "100mb" }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  res.on("finish", () => {
    const responseTime = Date.now() - start;
    const time = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });
    console.log(`${time} [railway] ${req.method} ${path3} ${res.statusCode} ${responseTime}ms`);
  });
  next();
});
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Disney Pin Checker</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; }
        h1 { color: #1e40af; }
        p { margin: 20px 0; }
        .status { background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Disney Pin Checker</h1>
        <p>The mobile application API is running successfully!</p>
        <div class="status">
          <h3>API Status: Active</h3>
          <p>Ready to authenticate Disney pins</p>
          <p>Connected to: https://master.pinauth.com</p>
        </div>
        <p>This service provides pin authentication for the mobile app.</p>
      </div>
    </body>
    </html>
  `);
});
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "disney-pin-authenticator",
    version: "1.0.0",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    port: parseInt(process.env.PORT || "8080", 10),
    environment: process.env.NODE_ENV || "production",
    api: {
      configured: !!process.env.MOBILE_API_KEY,
      endpoint: "https://master.pinauth.com/mobile-upload"
    }
  });
});
registerRoutes(app).then((server) => {
  const port = parseInt(process.env.PORT || "8080", 10);
  server.listen(port, "0.0.0.0", () => {
    console.log(`${(/* @__PURE__ */ new Date()).toLocaleTimeString()} [railway] Disney Pin Checker API serving on port ${port}`);
    console.log(`Connected to PIM service at: https://master.pinauth.com`);
  });
}).catch(console.error);
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error(`[railway] Error ${status}: ${message}`);
  res.status(status).json({ message });
});
