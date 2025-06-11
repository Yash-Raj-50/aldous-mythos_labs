'use server';

import { getCurrentUser } from '@/actions/auth';
import { MongoClient, ObjectId } from 'mongodb';
import { Profile, Analysis, ChatSession } from '@/types/databaseTypes';

// Helper function to serialize MongoDB objects
function serializeMongoObject(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  
  if (obj instanceof ObjectId) return obj.toString();
  
  if (Array.isArray(obj)) {
    return obj.map(serializeMongoObject);
  }
  
  if (typeof obj === 'object' && obj.constructor === Object) {
    const serialized: Record<string, unknown> = {};
    for (const key in obj as Record<string, unknown>) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = (obj as Record<string, unknown>)[key];
        if (key === '_id' && value instanceof ObjectId) {
          serialized[key] = value.toString();
          serialized['id'] = value.toString(); // Add id field
        } else {
          serialized[key] = serializeMongoObject(value);
        }
      }
    }
    return serialized;
  }
  
  return obj;
}

// For the final structure passed to the frontend
export interface AgentWithProfileCount {
  id: string;
  name: string;
  phone: string;
  socialID?: string;
  icon?: string;
  activeStatus?: boolean;
  profileCount: number;
}

export interface HomepageData {
  agents: AgentWithProfileCount[];
  profiles: Profile[];
  analyses: Record<string, Analysis | null>;
  chatSessions: Record<string, ChatSession[]>;
  currentUser: {
    username: string;
    userClass: string;
    userId: string;
    profilePic?: string;
    agents?: string[]; // Add agent IDs array
  } | null;
  userDetails: Record<string, { profilePic?: string, name: string }>;
}

export async function fetchHomepageData(): Promise<HomepageData | null> {
  const currentUserData = await getCurrentUser();
  
  if (!currentUserData) {
    return null;
  }

  const { userId, userClass, username } = currentUserData;
  
  // Get MongoDB credentials from environment variables
  const MONGODB_USERNAME = process.env.NEXT_PUBLIC_MONGODB_USERNAME;
  const MONGODB_PASSWORD = process.env.NEXT_PUBLIC_MONGODB_PASSWORD;
  
  if (!MONGODB_USERNAME || !MONGODB_PASSWORD) {
    return null;
  }
  
  // Connect to aldous_db database
  const uri = `mongodb+srv://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@clusteraustraliaflex.fycsf67.mongodb.net/?retryWrites=true&w=majority&appName=ClusterAustraliaFlex`;
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('aldous_db');
    
    const agentsCollection = db.collection('agents');
    const profilesCollection = db.collection('profiles');
    const analysesCollection = db.collection('analyses');
    const chatSessionsCollection = db.collection('chatsessions');
    const usersCollection = db.collection('users');
    
    // Fetch all agents
    const agents = await agentsCollection.find({}).toArray();
    
    // Get current user's agent IDs
    let currentUserAgents: string[] = [];
    if (userId) {
      const currentUserDoc = await usersCollection.findOne({ _id: new ObjectId(userId) });
      if (currentUserDoc?.agents) {
        currentUserAgents = currentUserDoc.agents.map((agentId: any) => agentId.toString());
      }
    }
    
    // Fetch all profiles
    const allProfiles = await profilesCollection.find({}).toArray();
    
    // Filter profiles based on user's assigned agents
    const profiles = allProfiles.filter(profile => {
      // If user is superuser, show all profiles
      if (userClass === 'superuser') {
        return true;
      }
      
      // For regular users, only show profiles assigned to their agents
      if (profile.assignedAgentID) {
        return currentUserAgents.includes(profile.assignedAgentID.toString());
      }
      
      return false;
    });
    
    // Create agents with profile counts
    const agentsWithProfileCount: AgentWithProfileCount[] = agents.map(agent => {
      const profileCount = profiles.filter(profile => 
        profile.assignedAgentID?.toString() === agent._id.toString()
      ).length;
      
      return {
        id: agent._id.toString(),
        name: agent.name || 'Unknown Agent',
        phone: agent.phone || '',
        socialID: agent.socialID,
        icon: agent.icon,
        activeStatus: agent.activeStatus || false,
        profileCount
      };
    });
    
    // Fetch analyses for all profiles
    const analyses: Record<string, Analysis | null> = {};
    for (const profile of profiles) {
      const analysis = await analysesCollection.findOne({
        $or: [
          { subjectID: profile._id.toString() },
          { subjectID: profile._id }
        ]
      });
      analyses[profile._id.toString()] = analysis ? serializeMongoObject(analysis) as Analysis : null;
    }
    
    // Fetch chat sessions for all profiles
    const chatSessions: Record<string, ChatSession[]> = {};
    for (const profile of profiles) {
      const sessions = await chatSessionsCollection.find({
        $or: [
          { subjectID: profile._id.toString() },
          { subjectID: profile._id }
        ]
      }).toArray();
      chatSessions[profile._id.toString()] = sessions.map(session => serializeMongoObject(session) as ChatSession);
    }
    
    // Get user details for profiles
    const userDetails: Record<string, { profilePic?: string, name: string }> = {};
    const userIds = profiles
      .map(profile => profile.assignedUserID)
      .filter(id => id)
      .map(id => typeof id === 'string' ? new ObjectId(id) : id);
    
    if (userIds.length > 0) {
      const users = await usersCollection.find({
        _id: { $in: userIds }
      }).toArray();
      
      users.forEach(user => {
        userDetails[user._id.toString()] = {
          name: user.name || user.username || 'Unknown User',
          profilePic: user.profilePic
        };
      });
    }
    
    // Get current user's profile pic and agents
    let currentUserProfilePic: string | undefined;
    if (userId) {
      const currentUserDoc = await usersCollection.findOne({ _id: new ObjectId(userId) });
      currentUserProfilePic = currentUserDoc?.profilePic;
      // currentUserAgents is already fetched above
    }
    
    const serializedProfiles = profiles.map(profile => serializeMongoObject(profile) as Profile);
    
    return {
      agents: agentsWithProfileCount,
      profiles: serializedProfiles,
      analyses,
      chatSessions,
      currentUser: {
        username,
        userClass,
        userId,
        profilePic: currentUserProfilePic,
        agents: currentUserAgents
      },
      userDetails
    };
    
  } catch {
    return null;
  } finally {
    await client.close();
  }
}