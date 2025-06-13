'use server'

import { MongoClient, ObjectId } from 'mongodb';
import { revalidatePath } from 'next/cache';

export async function deleteProfile(profileId: string): Promise<{ success: boolean; error?: string }> {
  let client: MongoClient | null = null;

  try {
    // Get MongoDB credentials from environment variables
    const MONGODB_USERNAME = process.env.NEXT_PUBLIC_MONGODB_USERNAME;
    const MONGODB_PASSWORD = process.env.NEXT_PUBLIC_MONGODB_PASSWORD;
    
    if (!MONGODB_USERNAME || !MONGODB_PASSWORD) {
      throw new Error('MongoDB credentials missing in environment variables');
    }
    
    // Connect to aldous_db database
    const uri = `mongodb+srv://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@clusteraustraliaflex.fycsf67.mongodb.net/?retryWrites=true&w=majority&appName=ClusterAustraliaFlex`;
    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db("aldous_db");
    
    // Validate profileId format
    let profileObjectId: ObjectId;
    try {
      profileObjectId = new ObjectId(profileId);
    } catch {
      return { 
        success: false, 
        error: `Invalid profile ID format: ${profileId}` 
      };
    }
    
    // Check if profile exists
    const profilesCollection = db.collection("profiles");
    const profile = await profilesCollection.findOne({ _id: profileObjectId });
    
    if (!profile) {
      return { 
        success: false, 
        error: `Profile with ID ${profileId} not found` 
      };
    }
    
    // Get the assigned agent ID before deletion (for cleanup)
    const assignedAgentId = profile.assignedAgentID;
    
    // Delete related analyses
    const analysesCollection = db.collection("analyses");
    await analysesCollection.deleteMany({ 
      $or: [
        { subjectID: profileId }, // String format
        { subjectID: profileObjectId } // ObjectId format
      ]
    });
    
    // Delete related chat sessions
    const chatSessionsCollection = db.collection("chatsessions");
    await chatSessionsCollection.deleteMany({ 
      $or: [
        { subjectID: profileId }, // String format
        { subjectID: profileObjectId } // ObjectId format
      ]
    });
    
    // Remove profile reference from assigned agent's profiles array
    if (assignedAgentId) {
      try {
        const agentsCollection = db.collection("agents");
        await agentsCollection.updateOne(
          { _id: new ObjectId(assignedAgentId) },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { $pull: { profiles: profileObjectId } as any }
        );
      } catch (error) {
        console.warn('Failed to remove profile reference from agent:', error);
        // Continue with profile deletion even if agent update fails
      }
    }
    
    // Delete the profile document
    const deleteResult = await profilesCollection.deleteOne({ _id: profileObjectId });
    
    if (deleteResult.deletedCount === 0) {
      return { 
        success: false, 
        error: 'Failed to delete profile' 
      };
    }
    
    // Revalidate the homepage to refresh the profile list
    revalidatePath('/');
    
    return { success: true };
    
  } catch (error) {
    console.error('Error deleting profile:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred while deleting profile' 
    };
  } finally {
    if (client) {
      await client.close().catch(() => {});
    }
  }
}
