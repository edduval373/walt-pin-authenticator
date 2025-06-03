import { pgTable, text, serial, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model (kept from original)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Disney Pin model
export const pins = pgTable("pins", {
  id: serial("id").primaryKey(),
  pinId: text("pin_id").notNull().unique(),
  name: text("name").notNull(),
  series: text("series").notNull(),
  releaseYear: integer("release_year").notNull(),
  imageUrl: text("image_url").notNull(),
  dominantColors: jsonb("dominant_colors").notNull(),
  similarPins: jsonb("similar_pins").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPinSchema = createInsertSchema(pins)
  .omit({ id: true, createdAt: true });

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
  .pick({ analysisId: true, pinId: true, userAgreement: true, feedbackComment: true });

export type InsertUserFeedback = z.infer<typeof insertUserFeedbackSchema>;
export type UserFeedback = typeof userFeedback.$inferSelect;
