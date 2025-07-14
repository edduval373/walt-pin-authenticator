import { pgTable, text, serial, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model (kept from original)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Disney Pin model
export const pins = pgTable("pins", {
  id: serial("id").primaryKey(), // ID used by master app for tracking
  pinId: text("pin_id").notNull().unique(),
  name: text("name").notNull(),
  series: text("series").notNull(),
  releaseYear: integer("release_year").notNull(),
  imageUrl: text("image_url").notNull(),
  dominantColors: jsonb("dominant_colors").notNull(),
  similarPins: jsonb("similar_pins").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  userAgreement: text("user_agreement"), // "agree" or "disagree"
  feedbackComment: text("feedback_comment"), // optional user comment
  feedbackSubmittedAt: timestamp("feedback_submitted_at"), // when feedback was submitted
});

export const insertPinSchema = createInsertSchema(pins)
  .omit({ id: true, createdAt: true, feedbackSubmittedAt: true });

export type InsertPin = z.infer<typeof insertPinSchema>;
export type Pin = typeof pins.$inferSelect;

// Analysis Result model
export const analyses = pgTable("analyses", {
  id: serial("id").primaryKey(),
  imageBlob: text("image_blob").notNull(),
  pinId: text("pin_id").notNull(),
  confidence: integer("confidence").notNull(),
  factors: jsonb("factors").notNull(),
  colorMatchPercentage: integer("color_match_percentage").notNull(),
  databaseMatchCount: integer("database_match_count").notNull(),
  imageQualityScore: integer("image_quality_score").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAnalysisSchema = createInsertSchema(analyses)
  .omit({ id: true, createdAt: true });

export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analyses.$inferSelect;

// User Feedback model for storing agreement/disagreement with AI results
export const userFeedback = pgTable("user_feedback", {
  id: serial("id").primaryKey(),
  analysisId: integer("analysis_id").references(() => analyses.id).notNull(),
  pinId: text("pin_id").notNull(),
  userAgreement: text("user_agreement").notNull(), // "agree" or "disagree"
  feedbackComment: text("feedback_comment"), // optional user comment
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

export const insertUserFeedbackSchema = createInsertSchema(userFeedback)
  .omit({ id: true, submittedAt: true });

export type InsertUserFeedback = z.infer<typeof insertUserFeedbackSchema>;
export type UserFeedback = typeof userFeedback.$inferSelect;

// Mobile App API Log model for tracking interactions
export const mobileAppApiLog = pgTable("mobile_app_api_log", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  requestType: text("request_type").notNull(), // "verify-pin" or "confirm-pin"
  requestBody: jsonb("request_body").notNull(),
  responseBody: jsonb("response_body"),
  responseStatus: integer("response_status"),
  hostApiCalled: boolean("host_api_called").default(false),
  hostApiResponse: jsonb("host_api_response"),
  hostApiStatus: integer("host_api_status"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMobileAppApiLogSchema = createInsertSchema(mobileAppApiLog)
  .omit({ id: true, createdAt: true });

export type InsertMobileAppApiLog = z.infer<typeof insertMobileAppApiLogSchema>;
export type MobileAppApiLog = typeof mobileAppApiLog.$inferSelect;
