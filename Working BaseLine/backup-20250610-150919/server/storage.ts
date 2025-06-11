import { 
  type User, type Pin, type Analysis, type UserFeedback,
  type InsertUser, type InsertPin, type InsertAnalysis, type InsertUserFeedback
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
  
  // Analysis methods
  analyzePin(imageData: string): Promise<Analysis>;
  getAllAnalyses(): Promise<Analysis[]>;
  getAnalysisById(id: number): Promise<Analysis | undefined>;
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  
  // User Feedback methods
  createUserFeedback(feedback: InsertUserFeedback): Promise<UserFeedback>;
  getFeedbackByAnalysisId(analysisId: number): Promise<UserFeedback[]>;
  getAllUserFeedback(): Promise<UserFeedback[]>;
}

// Use Railway production database exclusively
export const storage = new RailwayStorage();