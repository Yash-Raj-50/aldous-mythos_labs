'use server'

import { MongoClient, ObjectId } from 'mongodb';
import { Message } from '@/types/databaseTypes';

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
      } else {
        serialized[key] = serializeMongoObject(value);
      }
    }
    
    return serialized;
  }
  
  // Return primitive values as is
  return obj;
}

export async function fetchUserDetails(profileID: string, forceRefresh = false) {
  // Create a unique client instance for each request when forceRefresh is true
  const clientOptions = forceRefresh ? { connectTimeoutMS: 5000 } : {};
  
  try {
    // Get MongoDB credentials from environment variables
    const MONGODB_USERNAME = process.env.NEXT_PUBLIC_MONGODB_USERNAME;
    const MONGODB_PASSWORD = process.env.NEXT_PUBLIC_MONGODB_PASSWORD;
    
    if (!MONGODB_USERNAME || !MONGODB_PASSWORD) {
      throw new Error('MongoDB credentials missing in environment variables');
    }
    
    // Connect to aldous_db database
    const uri = `mongodb+srv://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@clusteraustraliaflex.fycsf67.mongodb.net/?retryWrites=true&w=majority&appName=ClusterAustraliaFlex`;
    const client = new MongoClient(uri, clientOptions);
    
    try {
      await client.connect();
      
      const db = client.db("aldous_db");
      
      // Fetch profile data
      const profilesCollection = db.collection("profiles");
      
      // Validate and create ObjectId
      let profileObjectId;
      try {
        profileObjectId = new ObjectId(profileID);
      } catch {
        return { 
          error: true, 
          message: `Invalid profile ID format: ${profileID}`,
          profileID 
        };
      }
      
      const profile = await profilesCollection.findOne({ _id: profileObjectId });
      
      if (!profile) {
        return { 
          error: true, 
          message: `Profile with ID ${profileID} not found`,
          profileID 
        };
      }
      
      // Fetch analysis data for this profile
      const analysesCollection = db.collection("analyses");
      const analysis = await analysesCollection.findOne({ 
        $or: [
          { subjectID: profileID }, // String format
          { subjectID: new ObjectId(profileID) } // ObjectId format
        ]
      });
      
      // Fetch chat sessions for this profile
      const chatSessionsCollection = db.collection("chatsessions");
      const chatSessions = await chatSessionsCollection.find({ 
        $or: [
          { subjectID: profileID }, // String format
          { subjectID: new ObjectId(profileID) } // ObjectId format
        ]
      }).sort({ sessionDate: 1 }).toArray();
      
      // Serialize all data
      const serializedProfile = serializeMongoObject(profile);
      const serializedAnalysis = analysis ? serializeMongoObject(analysis) : null;
      const serializedChatSessions = chatSessions.map(session => serializeMongoObject(session));
      
      // Extract all messages from chat sessions and flatten them
      const allMessages: Message[] = [];
      serializedChatSessions.forEach(session => {
        if (session.messages && Array.isArray(session.messages)) {
          session.messages.forEach((msg: Message) => {
            allMessages.push({
              timestamp: msg.timestamp,
              role: msg.role,
              contentType: msg.contentType,
              content: msg.content
            });
          });
        }
      });
      
      // Sort messages by timestamp
      allMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      // Extract complete analysis data for easier access
      const completeAnalysis = serializedAnalysis?.completeAnalysis;
      
      // Helper function to map new analysis structure to old expected format
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapAnalysisData = (analysis: any) => {
        if (!analysis) return null;
        
        // Map psychological needs from new structure to old array format
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapPsychologicalNeeds = (needs: any) => {
          if (!needs) return [];
          
          // If needs is already an array, return it directly
          if (Array.isArray(needs)) {
            return needs;
          }
          
          // Otherwise, treat it as an object and convert to array
          const needsArray = [];
          if (needs.identity) {
            needsArray.push({
              need: "IDENTITY_BELONGING",
              quote: needs.identity.evidence || "No evidence provided",
              size: needs.identity.score > 70 ? "LARGE" : "MEDIUM",
              color: "BLUE"
            });
          }
          if (needs.belonging) {
            needsArray.push({
              need: "IDENTITY_BELONGING", 
              quote: needs.belonging.evidence || "No evidence provided",
              size: needs.belonging.score > 70 ? "LARGE" : "MEDIUM",
              color: "TEAL"
            });
          }
          if (needs.purpose) {
            needsArray.push({
              need: "PURPOSE_MEANING",
              quote: needs.purpose.evidence || "No evidence provided", 
              size: needs.purpose.score > 70 ? "LARGE" : "MEDIUM",
              color: "ORANGE"
            });
          }
          if (needs.significance) {
            needsArray.push({
              need: "AGENCY_POWER",
              quote: needs.significance.evidence || "No evidence provided",
              size: needs.significance.score > 70 ? "LARGE" : "MEDIUM", 
              color: "RED"
            });
          }
          return needsArray;
        };

        // Map emotional state from new structure to old array format
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapEmotionalState = (emotional: any) => {
          if (!emotional) return [];
          
          // If emotional is already an array, return it directly
          if (Array.isArray(emotional)) {
            return emotional;
          }
          
          // Otherwise, treat it as an object and convert to array
          const emotions = emotional.primaryEmotions || [];
          return emotions.map((emotion: string, index: number) => ({
            emotion: emotion.toUpperCase(),
            strength: index === 0 ? "HIGH" : "MEDIUM", // First emotion is strongest
            underlyingDrivers: emotional.emotionalTriggers?.slice(0, 3) || ["Unspecified drivers"]
          }));
        };

        // Map intervention effectiveness to match expected structure
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapInterventionEffectiveness = (intervention: any) => {
          if (!intervention) {
            return {
              openQuestions: { score: 50, assessment: "MIXED" },
              addressingGrievances: { score: 50, assessment: "MIXED" },
              emotionalValidation: { score: 50, assessment: "MIXED" },
              alternativeNarratives: { score: 50, assessment: "MIXED" },
              directChallenges: { score: 50, assessment: "MIXED" },
              engagementTrend: { dataPoints: [] }
            };
          }

          return {
            openQuestions: {
              score: intervention.openQuestions?.score || 50,
              assessment: intervention.openQuestions?.assessment || "MIXED"
            },
            addressingGrievances: {
              score: intervention.addressingGrievances?.score || 50,
              assessment: intervention.addressingGrievances?.assessment || "MIXED",
              isFocus: intervention.addressingGrievances?.isFocus || false
            },
            emotionalValidation: {
              score: intervention.emotionalValidation?.score || intervention.buildingRapport?.score || 50,
              assessment: intervention.emotionalValidation?.assessment || intervention.buildingRapport?.assessment || "MIXED"
            },
            alternativeNarratives: {
              score: intervention.alternativeNarratives?.score || intervention.challengingBeliefs?.score || 50,
              assessment: intervention.alternativeNarratives?.assessment || intervention.challengingBeliefs?.assessment || "MIXED"
            },
            directChallenges: {
              score: intervention.directChallenges?.score || intervention.challengingBeliefs?.score || 50,
              assessment: intervention.directChallenges?.assessment || intervention.challengingBeliefs?.assessment || "MIXED",
              isAvoid: intervention.directChallenges?.isAvoid || intervention.challengingBeliefs?.isFocus === false
            },
            engagementTrend: {
              dataPoints: intervention.engagementTrend?.dataPoints || []
            }
          };
        };

        return {
          executiveSummary: analysis.executiveSummary || {
            summary: "No analysis available",
            riskLevel: "LOW"
          },
          radicalizationStage: {
            stage: analysis.radicalizationStage?.stage || "CURIOSITY",
            evidence: analysis.radicalizationStage?.evidence || [],
            explanation: Array.isArray(analysis.radicalizationStage?.explanation) 
              ? analysis.radicalizationStage.explanation 
              : (analysis.radicalizationStage?.explanation 
                ? [analysis.radicalizationStage.explanation] 
                : ["No evidence available"])
          },
          riskFactors: analysis.riskFactors || [],
          interventionEffectiveness: mapInterventionEffectiveness(analysis.interventionEffectiveness),
          inflectionPoints: analysis.inflectionPoints || [],
          psychologicalNeeds: mapPsychologicalNeeds(analysis.psychologicalNeeds),
          emotionalState: mapEmotionalState(analysis.emotionalState),
          recommendedApproaches: analysis.recommendedApproaches || {
            primaryStrategy: ["No recommendations available"],
            specificTactics: ["No tactics available"],
            approachesToAvoid: ["No approaches to avoid specified"]
          }
        };
      };

      // Map the analysis data
      const mappedAnalysis = mapAnalysisData(completeAnalysis);

      // Prepare the user data object
      const userData = {
        id: serializedProfile.id,
        name: serializedProfile.name,
        country: serializedProfile.country,
        phone: serializedProfile.phone,
        profilePic: serializedProfile.profilePic,
        socialIDs: serializedProfile.socialIDs || [],
        assignedAgentID: serializedProfile.assignedAgentID,
        lastUpdated: serializedAnalysis?.lastUpdated || serializedProfile.updatedAt || new Date().toISOString(),
        createdAt: serializedProfile.createdAt || new Date().toISOString(),
        
        // Analysis data - use mapped analysis if available, fallback to defaults
        analysis: serializedAnalysis,
        completeAnalysis: completeAnalysis,
        
        // Dashboard component data - mapped from new analysis structure
        ...(mappedAnalysis || {}),
        
        // Chat data
        chatSessions: serializedChatSessions,
        conversation: allMessages, // For backward compatibility
        conversationCount: allMessages.length,
        
        // Formatted dates for display
        lastUpdatedFormatted: serializedAnalysis?.lastUpdated 
          ? new Date(serializedAnalysis.lastUpdated).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            })
          : 'N/A',
        createdFormatted: serializedProfile.createdAt
          ? new Date(serializedProfile.createdAt).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            })
          : 'N/A',
      };

      return userData;
      
    } catch (dbError: unknown) {
      throw dbError;
    } finally {
      await client.close().catch(() => {});
    }
    
  } catch (error) {
    return { 
      error: true, 
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      profileID 
    };
  }
}