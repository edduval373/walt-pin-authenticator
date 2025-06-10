import { 
  users, pins, analyses, userFeedback,
  type User, type Pin, type Analysis, type UserFeedback,
  type InsertUser, type InsertPin, type InsertAnalysis, type InsertUserFeedback
} from "@shared/schema";
import { pinDatabase } from "@/lib/pin-database";
import { DatabaseStorage } from "./db-storage";

// Interface for all storage operations
export interface IStorage {
  // User methods (from original)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Pin methods
  getAllPins(): Promise<Pin[]>;
  getPinById(pinId: string): Promise<Pin | undefined>;
  createPin(pin: InsertPin): Promise<Pin>;
  
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

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private pins: Map<string, Pin>;
  private analyses: Map<number, Analysis>;
  private userFeedbacks: Map<number, UserFeedback>;
  private currentUserId: number;
  private currentPinId: number;
  private currentAnalysisId: number;
  private currentFeedbackId: number;
  
  constructor() {
    this.users = new Map();
    this.pins = new Map();
    this.analyses = new Map();
    this.userFeedbacks = new Map();
    this.currentUserId = 1;
    this.currentPinId = 1;
    this.currentAnalysisId = 1;
    this.currentFeedbackId = 1;
    
    // Initialize with sample pin data
    this.initializePins();
  }
  
  // Initialize the pins from our database
  private initializePins(): void {
    pinDatabase.forEach(pin => {
      const newPin: Pin = {
        id: this.currentPinId++,
        pinId: pin.pinId,
        name: pin.name,
        series: pin.series,
        releaseYear: pin.releaseYear,
        imageUrl: pin.imageUrl,
        dominantColors: pin.dominantColors,
        similarPins: pin.similarPins,
        createdAt: new Date()
      };
      
      this.pins.set(pin.pinId, newPin);
    });
  }
  
  // User methods (from original)
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Pin methods
  async getAllPins(): Promise<Pin[]> {
    return Array.from(this.pins.values());
  }
  
  async getPinById(pinId: string): Promise<Pin | undefined> {
    return this.pins.get(pinId);
  }
  
  async createPin(insertPin: InsertPin): Promise<Pin> {
    const id = this.currentPinId++;
    const pin: Pin = { 
      ...insertPin, 
      id, 
      createdAt: new Date() 
    };
    this.pins.set(insertPin.pinId, pin);
    return pin;
  }
  
  // Analysis methods
  async analyzePin(imageData: string): Promise<Analysis> {
    // In a real application, this would do some actual image analysis
    // For now, we'll generate a simulated analysis result
    const pinId = this.getRandomPinId();
    
    // Generate a random confidence score between 60 and 95
    const confidence = Math.floor(Math.random() * 36) + 60;
    
    // Create factors based on confidence
    const factors = [
      {
        name: 'Color Accuracy',
        description: confidence >= 80
          ? 'Official Disney color patterns match our reference data'
          : 'Color patterns show some variance from official Disney colors',
        confidence: confidence + Math.floor(Math.random() * 10) - 5
      },
      {
        name: 'Detail Quality',
        description: confidence >= 80
          ? 'Fine details are crisp and well-defined'
          : 'Some details are present but lacking precision',
        confidence: confidence + Math.floor(Math.random() * 10) - 5
      },
      {
        name: 'Back Stamp',
        description: 'Unable to verify - please submit back of pin for complete analysis',
        confidence: 60
      }
    ];
    
    const colorMatchPercentage = confidence;
    const databaseMatchCount = Math.floor(Math.random() * 3) + 1;
    const imageQualityScore = Math.floor(Math.random() * 3) + 6; // 6-8
    
    // Create the analysis record
    const analysis: InsertAnalysis = {
      imageBlob: imageData,
      pinId,
      confidence,
      factors,
      colorMatchPercentage,
      databaseMatchCount,
      imageQualityScore
    };
    
    return this.createAnalysis(analysis);
  }
  
  async getAllAnalyses(): Promise<Analysis[]> {
    return Array.from(this.analyses.values());
  }
  
  async getAnalysisById(id: number): Promise<Analysis | undefined> {
    return this.analyses.get(id);
  }
  
  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    const id = this.currentAnalysisId++;
    const analysis: Analysis = { 
      ...insertAnalysis, 
      id, 
      createdAt: new Date() 
    };
    this.analyses.set(id, analysis);
    return analysis;
  }
  
  // User Feedback methods
  async createUserFeedback(insertFeedback: InsertUserFeedback): Promise<UserFeedback> {
    const id = this.currentFeedbackId++;
    const feedback: UserFeedback = {
      id,
      analysisId: insertFeedback.analysisId,
      pinId: insertFeedback.pinId,
      userAgreement: insertFeedback.userAgreement,
      feedbackComment: insertFeedback.feedbackComment || null,
      submittedAt: new Date()
    };
    this.userFeedbacks.set(id, feedback);
    return feedback;
  }

  async getFeedbackByAnalysisId(analysisId: number): Promise<UserFeedback[]> {
    return Array.from(this.userFeedbacks.values())
      .filter(feedback => feedback.analysisId === analysisId);
  }

  async getAllUserFeedback(): Promise<UserFeedback[]> {
    return Array.from(this.userFeedbacks.values());
  }

  // Helper method to get a random pin ID
  private getRandomPinId(): string {
    const pinIds = Array.from(this.pins.keys());
    return pinIds[Math.floor(Math.random() * pinIds.length)];
  }
}

// Use database storage for persistent data when DATABASE_URL is available
export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();
