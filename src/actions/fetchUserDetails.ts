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

// Format conversation data from new cluster format
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatNewClusterMessages(messages: any[] | undefined) {
  if (!messages || !Array.isArray(messages)) {
    return [];
  }
  
  return messages.map(msg => {
    // Extract content text from the content array
    let contentText = '';
    if (Array.isArray(msg.content) && msg.content.length > 0) {
      // Define the content item structure
      interface ContentItem {
        type: string;
        text?: string;
      }
      
      const textContent = msg.content.find((item: ContentItem) => item.type === 'text');
      contentText = textContent ? textContent.text : '';
    }
    
    // Convert timestamp to ISO string
    let timestamp = new Date().toISOString();
    if (msg.timestamp && msg.timestamp.$date && msg.timestamp.$date.$numberLong) {
      // Convert MongoDB timestamp format to ISO string
      const timestampMs = parseInt(msg.timestamp.$date.$numberLong, 10);
      if (!isNaN(timestampMs)) {
        timestamp = new Date(timestampMs).toISOString();
      }
    }
    
    return {
      role: msg.role || 'user',
      content: contentText || '',
      timestamp: timestamp
    };
  }).sort((a, b) => {
    // Sort by timestamp (oldest first)
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });
}

export async function fetchUserDetails(userID: string) {
  try {
    // Get MongoDB credentials from environment variables
    const MONGODB_USERNAME = process.env.NEXT_PUBLIC_MONGODB_USERNAME;
    const MONGODB_PASSWORD = process.env.NEXT_PUBLIC_MONGODB_PASSWORD;
    
    console.log(`Attempting to connect to MongoDB for user ${userID}`);
    
    if (!MONGODB_USERNAME || !MONGODB_PASSWORD) {
      console.error('MongoDB credentials missing in environment variables');
      throw new Error('MongoDB credentials missing in environment variables');
    }
    
    // Connect to primary MongoDB (ctbot cluster)
    const uri = `mongodb+srv://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@ctbot.5vx6h.mongodb.net/?retryWrites=true&w=majority&appName=CTBot`;
    const client = new MongoClient(uri);
    
    // Connect to chat MongoDB (clusteraustraliaflex)
    const chatUri = `mongodb+srv://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@clusteraustraliaflex.fycsf67.mongodb.net/`;
    const chatClient = new MongoClient(chatUri);
    
    try {
      // Connect to both clusters
      await Promise.all([client.connect(), chatClient.connect()]);
      console.log(`Connected to MongoDB successfully for user ${userID}`);
      
      // Fetch user data from primary cluster
      const db = client.db("user-chat");
      const collection = db.collection("users_simulated");
      const user = await collection.findOne({ userID: userID });
      
      if (!user) {
        console.error(`User with ID ${userID} not found in database`);
        return null;
      }
      
      console.log(`Found user data for ${userID}`);
      // Serialize the user object
      const serializedUser = serializeMongoObject(user);
      
      // Now fetch conversation messages from clusteraustraliaflex
      const chatDb = chatClient.db("sago_db");
      const chatCollection = chatDb.collection("chat");
      
      // Query chat messages for this user - use the exact same userID without modification
      const chatMessages = await chatCollection.find({ 
        user_id: userID  // No prefix, match exactly as stored
      }).toArray();
      
      console.log(`Fetched ${chatMessages.length} chat messages from clusteraustraliaflex for user ${userID}`);
      
      // Format chat messages to match our conversation format
      const formattedMessages = formatNewClusterMessages(chatMessages);
      
      // Replace the conversation field with new messages
      serializedUser.conversation = formattedMessages;
      
      // Format dates
      serializedUser.lastUpdated = serializedUser.lastUpdated 
        ? new Date(serializedUser.lastUpdated).toLocaleDateString() 
        : new Date().toLocaleDateString();

      serializedUser.created = serializedUser.created
        ? new Date(serializedUser.created).toLocaleDateString()
        : new Date().toLocaleDateString();

      return serializedUser;
      
    } catch (dbError: unknown) {
      console.error(`MongoDB connection or query error: ${dbError instanceof Error ? dbError.message : String(dbError)}`);
      throw dbError;
    } finally {
      // Close both connections
      await Promise.all([
        client.close().catch(() => {}),
        chatClient.close().catch(() => {})
      ]);
    }
    
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