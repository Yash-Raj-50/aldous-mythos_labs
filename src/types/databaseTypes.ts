import { Types } from 'mongoose';

export interface User {
  _id?: string | Types.ObjectId; // UserID (auto)
  id?: string; 
  username: string;
  password?: string; 
  userClass: string;
  profilePic?: string; // New field
  agents?: (string | Types.ObjectId | Agent)[]; // Array of AgentIDs or Agent objects
}

export interface Agent {
  _id?: string | Types.ObjectId; // AgentID (auto)
  id?: string; 
  name: string;
  aiModel: string;
  prompt: string;
  phone?: string;
  socialID?: string; // Optional
  activeStatus: boolean; // New field
  icon?: string; // New field
  assignedClients?: (string | Types.ObjectId | User)[]; // New field - Array of UserIDs or User objects
  profiles?: (string | Types.ObjectId | Profile)[]; // Array of ProfileIDs or Profile objects
}

export interface Profile {
  _id?: string | Types.ObjectId; // SubjectID (auto)
  id?: string; 
  name: string;
  country: string;
  phone: string;
  profilePic?: string; // Keep profilePic
  socialIDs?: string[];
  analysis?: string | Types.ObjectId | Analysis;
  assignedAgentID?: string | Types.ObjectId | Agent;
  chatSessions?: (string | Types.ObjectId | ChatSession)[];
  createdAt?: Date; // Keep createdAt
  updatedAt?: Date; // Keep updatedAt
  // Removed platform, status, notes
}

export interface Message {
  timestamp: Date;
  role: 'user' | 'agent' | 'system';
  contentType: 'text' | 'image' | 'video' | 'audio'; // Added 'system' to role
  content: string;
}

export interface ChatSession {
  _id?: string | Types.ObjectId; // ConversationID (auto)
  id?: string; 
  sessionID?: string; // Unique session identifier
  subjectID: string | Types.ObjectId | Profile; // ProfileID or Profile object
  assignedAgentID: string | Types.ObjectId | Agent; // AgentID or Agent object - ensure consistency
  agentPlatform?: string; // Optional
  agentPlatformID?: string; // Optional
  language: string; // Changed from langugage to language
  sessionDate: Date; 
  metadata?: { // Optional
    location?: string;
    device?: string;
    confidence?: number;
  };
  messages: Message[];
}

export interface Analysis {
  _id?: string | Types.ObjectId; // AnalysisID (auto)
  id?: string; 
  subjectID: string | Types.ObjectId | Profile; // ProfileID or Profile object
  lastUpdated: Date; // New field
  completeAnalysis: Record<string, unknown>; 
}
