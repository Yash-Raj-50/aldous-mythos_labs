'use server'

import { MongoClient } from 'mongodb';

// Helper function to safely serialize MongoDB objects
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    
    console.log(`Attempting to connect to MongoDB for user ${userID}`); // Add this line
    
    if (!MONGODB_USERNAME || !MONGODB_PASSWORD) {
      console.error('MongoDB credentials missing in environment variables');
      throw new Error('MongoDB credentials missing in environment variables');
    }
    
    // Connect to MongoDB
    const uri = `mongodb+srv://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@ctbot.5vx6h.mongodb.net/?retryWrites=true&w=majority&appName=CTBot`;
    const client = new MongoClient(uri);
    
    try {
      await client.connect();
      console.log(`Connected to MongoDB successfully for user ${userID}`);
      
      const db = client.db("user-chat");
      const collection = db.collection("users_simulated");
      
      // Fetch the specific user with all details
      const user = await collection.findOne({ userID: userID });
      
      if (!user) {
        console.error(`User with ID ${userID} not found in database`);
        return null;
      }
      
      console.log(`Found user data for ${userID}`);
      // Serialize the user object
      const serializedUser = serializeMongoObject(user);
      // Format the conversation data
      serializedUser.conversation = formatConversationData(serializedUser.conversation);
      // Format the last updated date
      serializedUser.lastUpdated = serializedUser.lastUpdated 
        ? new Date(serializedUser.lastUpdated).toLocaleDateString() 
        : new Date().toLocaleDateString();

      // Format the created date
      serializedUser.created = serializedUser.created
        ? new Date(serializedUser.created).toLocaleDateString()
        : new Date().toLocaleDateString();

      return serializedUser;
      
      // Rest of your function remains the same...
    } catch (dbError: unknown) {
      console.error(`MongoDB connection or query error: ${dbError instanceof Error ? dbError.message : String(dbError)}`);
      throw dbError;
    } finally {
      await client.close();
    }
    
    // Rest of your function...
  } catch (error) {
    console.error(`Error in fetchUserDetails for user ${userID}:`, error);
    // Return a more informative error object instead of null
    return { 
      error: true, 
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      userID 
    };
  }
}