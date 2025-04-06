'use server'

import { MongoClient } from 'mongodb';

// Define your user data type for the list view
export type UserListData = {
  userID: string;
  name: string;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  lastActive: string;
};

// Helper function to format date to human readable format
function formatDate(dateString: string | Date): string {
  if (!dateString) return 'Never';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  // Check if the date is valid
  if (isNaN(date.getTime())) return 'Invalid date';
  
  // Format: "April 25, 2023" or "Today at 2:30 PM" if today
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  // Check if it's yesterday
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  
  if (isYesterday) {
    return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  return date.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

export async function fetchUsers(): Promise<{ data: UserListData[] }> {
  try {
    // Get MongoDB credentials from environment variables
    const MONGODB_USERNAME = process.env.NEXT_PUBLIC_MONGODB_USERNAME;
    const MONGODB_PASSWORD = process.env.NEXT_PUBLIC_MONGODB_PASSWORD;
    
    if (!MONGODB_USERNAME || !MONGODB_PASSWORD) {
      throw new Error('MongoDB credentials missing in environment variables');
    }
    
    // Connect to MongoDB
    const uri = `mongodb+srv://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@ctbot.5vx6h.mongodb.net/?retryWrites=true&w=majority&appName=CTBot`;
    const client = new MongoClient(uri);
    
    await client.connect();
    console.log('Connected to MongoDB successfully');
    
    const db = client.db("user-chat");
    const collection = db.collection("users_simulated");
    
    // Only fetch the fields we need for the list view
    const users = await collection.find({}).project({
      userID: 1,
      name: 1,
      riskLevel: 1,
      lastActive: 1
    }).toArray();
    
    // Close the connection
    await client.close();
    
    // Format the user data for the list view
    const formattedUsers = users.map(user => ({
      userID: user.userID || (user._id ? user._id.toString() : String(Math.random()).substring(2, 8)),
      name: user.name || `User ${user.userID || ''}`,
      riskLevel: user.riskLevel || 'MEDIUM',
      lastActive: formatDate(user.lastActive || new Date())
    }));
    
    console.log(`Fetched ${formattedUsers.length} users for list view`);
    
    return { data: formattedUsers };
  } catch (error) {
    console.error('Error fetching users from MongoDB:', error);
    // Return empty data in case of error
    return { data: [] };
  }
}