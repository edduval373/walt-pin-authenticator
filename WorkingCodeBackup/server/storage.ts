import { 
  type User, type Pin, type Analysis, type UserFeedback, type MobileAppApiLog,
  type InsertUser, type InsertPin, type InsertAnalysis, type InsertUserFeedback, type InsertMobileAppApiLog
} from "@shared/schema";
import { RailwayStorage } from "./railway-storage";

// Interface for all storage operations
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Pin methods
  getAllPins(): Promise<Pin[]>;
  getPinById(pinId: string): Promise<Pin | undefined>;
  createPin(pin: InsertPin): Promise<Pin>;
  updatePinFeedback(pinId: string, userAgreement: string, feedbackComment?: string): Promise<Pin | undefined>;
  updatePinFeedbackById(id: number, userAgreement: string, feedbackComment?: string): Promise<Pin | undefined>;
  
  // Analysis methods - removed, using pins table only
  
  // User Feedback methods
  createUserFeedback(feedback: InsertUserFeedback): Promise<UserFeedback>;
  getFeedbackByAnalysisId(analysisId: number): Promise<UserFeedback[]>;
  getAllUserFeedback(): Promise<UserFeedback[]>;
  
  // Mobile App API Log methods
  createMobileAppLog(logEntry: InsertMobileAppApiLog): Promise<MobileAppApiLog>;
  getMobileAppLogsBySession(sessionId: string): Promise<MobileAppApiLog[]>;
  getAllMobileAppLogs(): Promise<MobileAppApiLog[]>;
}

// Use Railway production database exclusively
export const storage = new RailwayStorage();