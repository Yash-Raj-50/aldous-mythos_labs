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
    
    // Connect to aldous_db instead of old database
    const uri = `mongodb+srv://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@clusteraustraliaflex.fycsf67.mongodb.net/?retryWrites=true&w=majority&appName=ClusterAustraliaFlex`;
    const client = new MongoClient(uri);
    
    await client.connect();
    
    const db = client.db("aldous_db");
    const collection = db.collection("profiles");
    
    // Fetch all profiles from aldous_db
    const profiles = await collection.find({}).project({
      _id: 1,
      name: 1,
      country: 1,
      createdAt: 1,
      updatedAt: 1
    }).toArray();
    
    // Close the connection
    await client.close();
    
    // Format the profile data for the list view
    const formattedUsers = profiles.map(profile => ({
      userID: profile._id.toString(),
      name: profile.name || 'Unknown Profile',
      riskLevel: 'LOW' as const, // Default risk level since we don't have analysis here
      lastActive: formatDate(profile.updatedAt || profile.createdAt || new Date())
    }));
    
    return { data: formattedUsers };
  } catch {
    // Return empty data in case of error
    return { data: [] };
  }
}