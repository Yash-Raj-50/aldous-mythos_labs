import mongoose, { Schema, Document } from 'mongoose';
import { User, Agent, Profile, ChatSession, Analysis, Message } from '@/types/databaseTypes';

const MessageSchema = new Schema<Message>({
  timestamp: { type: Date, required: true },
  role: { type: String, enum: ['user', 'agent', 'system'], required: true },
  contentType: { type: String, enum: ['text', 'image', 'video', 'audio'], required: true },
  content: { type: String, required: true },
}, { _id: false });

const UserSchema = new Schema<User & Document>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Assuming password is required for User model
  userClass: { type: String, required: true },
  profilePic: { type: String }, // New field
  agents: [{ type: Schema.Types.ObjectId, ref: 'Agent' }],
}, { timestamps: true }); // Added timestamps for UserID (auto) via _id and potential lastUpdated

const AgentSchema = new Schema<Agent & Document>({
  name: { type: String, required: true },
  aiModel: { type: String, required: true },
  prompt: { type: String },
  phone: { type: String },
  socialID: { type: String },
  activeStatus: { type: Boolean, default: true}, // New field
  icon: { type: String }, // New field
  assignedClients: [{ type: Schema.Types.ObjectId, ref: 'User' }], // New field
  profiles: [{ type: Schema.Types.ObjectId, ref: 'Profile' }],
}, { timestamps: true }); // Added timestamps for AgentID (auto) via _id

const ProfileSchema = new Schema<Profile & Document>({
  name: { type: String, required: true },
  country: { type: String },
  phone: { type: String },
  socialIDs: [{ type: String }],
  analysis: { type: Schema.Types.ObjectId, ref: 'Analysis' }, // Changed to ObjectId
  assignedAgentID: { type: Schema.Types.ObjectId, ref: 'Agent' }, // New field
  chatSessions: [{ type: Schema.Types.ObjectId, ref: 'ChatSession' }],
}, { timestamps: true }); // Added timestamps for SubjectID (auto) via _id

const ChatSessionSchema = new Schema<ChatSession & Document>({
  sessionID: { type: String, unique: true, sparse: true }, // Add unique sessionID field
  subjectID: { type: Schema.Types.ObjectId, ref: 'Profile', required: true }, // Changed to ObjectId
  assignedAgentID: { type: Schema.Types.ObjectId, ref: 'Agent', required: true }, // Changed to ObjectId
  agentPlatform: { type: String }, // Optional
  agentPlatformID: { type: String }, // Optional
  language: { type: String, required: true }, // Corrected spelling from langugage
  sessionDate: { type: Date, required: true },
  metadata: {
    location: { type: String },
    device: { type: String },
    confidence: { type: Number },
  },
  messages: [MessageSchema],
}, { timestamps: true }); // Added timestamps for ConversationID (auto) via _id

const AnalysisSchema = new Schema<Analysis & Document>({
  subjectID: { type: Schema.Types.ObjectId, ref: 'Profile', required: true }, // Changed to ObjectId
  lastUpdated: { type: Date, default: Date.now }, // New field
  completeAnalysis: { type: Schema.Types.Mixed, required: false }, 
}, { timestamps: true }); // Added timestamps for AnalysisID (auto) via _id and updates lastUpdated

// When re-registering models, especially with HMR, ensure Mongoose handles it gracefully.
// The typical pattern is `mongoose.models.ModelName || mongoose.model('ModelName', schema)`.
// If you need specific options like `overwriteModels`, it's usually handled at the connection level
// or by ensuring models are not recompiled unnecessarily.

export const UserModel = mongoose.models.User || mongoose.model<User & Document>('User', UserSchema);
export const AgentModel = mongoose.models.Agent || mongoose.model<Agent & Document>('Agent', AgentSchema);
export const ProfileModel = mongoose.models.Profile || mongoose.model<Profile & Document>('Profile', ProfileSchema);
export const ChatSessionModel = mongoose.models.ChatSession || mongoose.model<ChatSession & Document>('ChatSession', ChatSessionSchema);
export const AnalysisModel = mongoose.models.Analysis || mongoose.model<Analysis & Document>('Analysis', AnalysisSchema);
