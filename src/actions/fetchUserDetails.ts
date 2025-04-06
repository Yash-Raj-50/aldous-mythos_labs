'use server'

import { MongoClient } from 'mongodb';

// Helper function to safely serialize MongoDB objects
function serializeMongoObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  // Handle Date objects
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  
  // Handle MongoDB ObjectId
  if (obj._bsontype === 'ObjectID' || (obj.toString && typeof obj.toString === 'function' && obj.constructor.name === 'ObjectId')) {
    return obj.toString();
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => serializeMongoObject(item));
  }
  
  // Handle objects (recursively)
  if (typeof obj === 'object') {
    const serialized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Skip the internal _id field or convert it to string
      if (key === '_id') {
        serialized.id = String(value);
      } 
      // Special handling for conversation data to ensure proper format
      else if (key === 'conversation' && Array.isArray(value)) {
        serialized[key] = value.map(msg => ({
          role: msg.role || 'user',
          content: msg.content || '',
          timestamp: msg.timestamp 
            ? typeof msg.timestamp === 'string' 
              ? msg.timestamp 
              : msg.timestamp instanceof Date 
                ? msg.timestamp.toISOString() 
                : new Date().toISOString()
            : new Date().toISOString()
        }));
      } 
      else {
        serialized[key] = serializeMongoObject(value);
      }
    }
    
    return serialized;
  }
  
  // Return primitive values as is
  return obj;
}

// Format conversation data for display
function formatConversationData(conversation: any[] | undefined) {
  if (!conversation || !Array.isArray(conversation)) {
    return [];
  }
  
  return conversation.map(msg => ({
    role: msg.role || 'user',
    content: msg.content || '',
    timestamp: msg.timestamp || new Date().toISOString()
  }));
}

export async function fetchUserDetails(userID: string) {
  try {
    // Get MongoDB credentials from environment variables
    const MONGODB_USERNAME = process.env.MONGODB_USERNAME;
    const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD;
    
    if (!MONGODB_USERNAME || !MONGODB_PASSWORD) {
      throw new Error('MongoDB credentials missing in environment variables');
    }
    
    // Connect to MongoDB
    const uri = `mongodb+srv://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@ctbot.5vx6h.mongodb.net/?retryWrites=true&w=majority&appName=CTBot`;
    const client = new MongoClient(uri);
    
    await client.connect();
    console.log(`Connected to MongoDB for user ${userID}`);
    
    const db = client.db("user-chat");
    const collection = db.collection("users_simulated");
    
    // Fetch the specific user with all details
    const user = await collection.findOne({ userID: userID });
    
    // Close the connection
    await client.close();
    
    if (!user) {
      console.error(`User with ID ${userID} not found`);
      return null;
    }
    
    // Serialize the MongoDB object to a plain JavaScript object
    const serializedUser = serializeMongoObject(user);
    
    // Ensure conversation data is properly formatted, even if missing in the original data
    serializedUser.conversation = formatConversationData(serializedUser.conversation);
    
    // Ensure other expected fields exist with default values if they don't
    const ensuredUser = {
      userID: serializedUser.userID || userID,
      name: serializedUser.name || `User ${userID}`,
      riskLevel: serializedUser.riskLevel || 'MEDIUM',
      lastActive: serializedUser.lastActive || new Date().toISOString(),
      lastUpdated: serializedUser.lastUpdated || new Date().toISOString(),
      conversationCount: serializedUser.conversationCount || serializedUser.conversation?.length || 0,
      executiveSummary: serializedUser.executiveSummary || { riskLevel: 'MEDIUM', summary: 'No summary available' },
      radicalizationStage: serializedUser.radicalizationStage || { stage: 'UNKNOWN', details: [] },
      riskFactors: serializedUser.riskFactors || [],
      interventionEffectiveness: serializedUser.interventionEffectiveness || { effectiveness: 'UNKNOWN' },
      inflectionPoints: serializedUser.inflectionPoints || [],
      psychologicalNeeds: serializedUser.psychologicalNeeds || [],
      emotionalState: serializedUser.emotionalState || { surface: [], underlying: [] },
      recommendedApproaches: serializedUser.recommendedApproaches || [],
      conversation: serializedUser.conversation || [],
      ...serializedUser // Keep any other fields not explicitly listed
    };
    
    console.log(`Fetched details for user ${userID}: ${ensuredUser.conversationCount} conversations`);
    
    return ensuredUser;
  } catch (error) {
    console.error(`Error fetching details for user ${userID}:`, error);
    return null;
  }
}