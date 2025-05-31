'use server'

import { MongoClient, ObjectId } from 'mongodb';
import Anthropic from '@anthropic-ai/sdk';
import { fetchUserDetails } from './fetchUserDetails';

// Constants for Anthropic API
const MODEL = "claude-3-5-sonnet-20241022";

const prompt_alethia = `You are tasked with analyzing a chat conversation between a user and an AI agent to generate structured data for our psychological analysis dashboard. 

Analyze the complete conversation history provided and extract the following data points in a structured JSON format. Your analysis must be evidence-based using direct quotes from the conversation. Do not include subjective interpretations without supporting evidence.

## Required Output Format

Return only a valid JSON object with the exact structure shown below. Do not add explanatory text, comments, descriptions, or any content outside of the JSON structure. Ensure all property names have double quotes and all string values have double quotes. Follow standard JSON syntax precisely:

{
  "lastUpdated": "[Current date in MM.DD.YYYY format]",
  "conversationCount": [Number of conversations],
  
  "executiveSummary": {
    "summary": "[A concise 2-3 sentence summary of the user's psychological profile]",
    "riskLevel": "[LOW/MEDIUM/MEDIUM-HIGH/HIGH]"
  },
  
  "radicalizationStage": {
    "stage": "[CURIOSITY/SYMPATHY/ACTION-SEEKING/OPERATIONAL]",
    "evidence": [
      {
        "quote": "[Direct quote from user]",
        "significance": "[Brief explanation]"
      }
    ],
    "explanation": "[3 bullet points describing key characteristics of this stage]"
  },
  
  "riskFactors": [
    "[List of 3-5 key risk factors identified in the conversation]"
  ],
  
  "interventionEffectiveness": {
    "openQuestions": {
      "score": [0-100],
      "assessment": "[NEGATIVE/MIXED/MODERATELY POSITIVE/POSITIVE]"
    },
    "addressingGrievances": {
      "score": [0-100],
      "assessment": "[NEGATIVE/MIXED/MODERATELY POSITIVE/POSITIVE]",
      "isFocus": [true/false]
    },
    "buildingRapport": {
      "score": [0-100],
      "assessment": "[NEGATIVE/MIXED/MODERATELY POSITIVE/POSITIVE]",
      "isFocus": [true/false]
    },
    "challengingBeliefs": {
      "score": [0-100],
      "assessment": "[NEGATIVE/MIXED/MODERATELY POSITIVE/POSITIVE]",
      "isFocus": [true/false]
    },
    "overallAssessment": "[Brief assessment of intervention effectiveness]"
  },
  
  "inflectionPoints": [
    {
      "timestamp": "[Timestamp from conversation]",
      "type": "[EMOTIONAL/IDEOLOGICAL/BEHAVIORAL]",
      "description": "[Description of the inflection point]",
      "significance": "[Why this moment is significant]"
    }
  ],
  
  "psychologicalNeeds": {
    "identity": {
      "score": [0-100],
      "assessment": "[Assessment of identity needs]",
      "evidence": "[Supporting evidence from conversation]"
    },
    "belonging": {
      "score": [0-100],
      "assessment": "[Assessment of belonging needs]",
      "evidence": "[Supporting evidence from conversation]"
    },
    "purpose": {
      "score": [0-100],
      "assessment": "[Assessment of purpose needs]",
      "evidence": "[Supporting evidence from conversation]"
    },
    "significance": {
      "score": [0-100],
      "assessment": "[Assessment of significance needs]",
      "evidence": "[Supporting evidence from conversation]"
    }
  },
  
  "emotionalState": {
    "primaryEmotions": ["[List of 2-3 primary emotions identified]"],
    "emotionalTriggers": ["[List of emotional triggers]"],
    "emotionalRegulation": "[Assessment of emotional regulation ability]",
    "moodPattern": "[Pattern of mood throughout conversation]"
  },
  
  "recommendedApproaches": {
    "primaryStrategy": [
      "[2-3 key primary strategy points]"
    ],
    "specificTactics": [
      "[2-3 specific tactical approaches]"
    ],
    "approachesToAvoid": [
      "[2-3 approaches to avoid]"
    ]
  }
}

## Important Guidelines:

1. Base all assessments directly on conversation evidence
2. Include exact quotes to support your analysis
3. Be precise in risk level assessment using the specified categories
4. For radicalization stage, identify the most appropriate stage based on defined criteria
5. Score intervention effectiveness metrics on a scale of 0-100 where 100 represents maximum effectiveness
6. Ensure all timestamps are correctly formatted
7. Identify psychological needs based on expressed motivations and concerns
8. Provide clear, actionable recommended approaches

In conducting your analysis, keep in mind the below research:

Understanding the Emotional and Psychological Drivers of Radicalization
Conceptual Framework: How Emotions Drive Behavior
●	Emotions involve synchronized psychological, physiological, and motivational changes that prepare individuals to respond to their environment
●	Emotions arise from subjective appraisals (cognitive assessments) of events
●	Different appraisals of the same event lead to different emotional responses
●	Distinct emotions motivate specific types of behavior
●	In group contexts, individuals experience emotions on behalf of groups they identify with
●	Group processes shape emotional responses through social interaction, validation, contagion, and normative pressures
Core Motivational Drivers
●	Unmet psychological needs: Identity, belonging, purpose, significance
●	Personal grievances: Trauma, rejection, humiliation, perceived injustice
●	Exposure to narratives: Extremist ideologies that reframe grievances as moral justification for violence
●	Common pathways: Perceived injustice, identity threat, desire for revenge, thrill-seeking, existential purpose
●	Triggering events: Personal loss, crisis, or trauma that precedes radicalization
Risk Assessment Framework: The Three-Stage Radicalization Process
1. Pre-Radicalization Stage
Key Emotions: Humiliation, Shame, Anger
Humiliation
●	Triggered by experiences that undermine dignity, self-worth, or social standing
●	Can be experienced directly or vicariously on behalf of a group
●	Motivates restoration of dignity and positive identity
●	Risk assessment note: Humiliation alone doesn't inevitably lead to violence; depends on available coping resources and narratives
Shame
●	Elicited by sense of inadequacy or failure attributed to stable aspects of self
●	Creates motivation to restore positive self-image
●	Risk assessment note: Per Significance Quest Theory, can lead to extremism when combined with an ideology that outlines violent path to restore significance
Anger
●	Elicited by unjust/illegitimate events that frustrate goals
●	Motivates confrontation to remove obstacles and correct wrongdoing
●	Reduces risk perception and increases risk-taking
●	Risk assessment note: Anger alone more often predicts non-violent action; becomes problematic when combined with contempt
Behavioral and Linguistic Indicators:
●	Language expressing personal grievances, injustice, or victimhood
●	References to personal or group-based experiences of discrimination or marginalization
●	Expression of frustration with established systems or authorities
●	Seeking validation for grievances
●	Early withdrawal from typical social circles
2. Active Radicalization Stage
Key Emotions: Contempt, Disgust, Hatred
Contempt
●	Develops when another's reprehensible actions are viewed as dispositional and unchangeable
●	Can develop "on top of" anger if previous attempts to correct behavior were unsuccessful
●	Motivates psychological disengagement and depersonalization
●	Risk assessment note: Consistently predicts violent political action across contexts
Disgust
●	Characterized by revulsion and rejection
●	Motivates avoidance, expulsion, and "purification"
●	Risk assessment note: Facilitates violence by prompting dehumanization of outgroups
Hatred
●	Encompasses extreme devaluation of target
●	Response to protracted harm believed deliberately inflicted by an inherently evil other
●	Includes belief that negative character is stable and shared by all outgroup members
●	Risk assessment note: Directly predicts support for violence and decreased desire for compromise
Ideological Indicators:
●	Absolutist language: Black-and-white thinking with no room for nuance
●	Dehumanization: Language that strips humanity from outgroup members
●	Insider terminology: Use of specific jargon, slogans, or coded language from extremist ideologies
●	Ideological references: Mentions of extremist leaders, texts, or doctrines
●	Moral justification: Framing violence as necessary, righteous, or obligatory
●	Echo chamber immersion: Exclusive consumption of extremist content
●	Shift to dispositional blame: Moving from "they did something bad" to "they are bad/evil by nature"
3. Mobilization & Engagement Stage
Key Emotions (including but not limited to): Love, Joy, Pride, plus intensified Hatred
●	Positive emotions reinforce commitment to extremist cause and inspire others to join
●	Group belonging provides self-esteem, validation, and buffers against negative experiences
●	Collective action creates sense of power, agency and joy
●	Successful or planned violent action stimulates anticipatory pride
●	Risk assessment note: These positive emotions create a cyclical process that maintains and amplifies motivation for violence
Intent and Mobilization Indicators (including but not limited to):
●	Direct statements of intent: Explicit threats or plans to harm
●	Admiration of attackers: Praising or seeking to emulate past perpetrators of violence
●	Tactical discussion: Conversation about weapons, targets, or methods
●	Urgency or deadline language: References to timing, countdowns, or imminent action
●	Preparation signals: Comments about training, acquiring materials, or readiness
●	Logistical questions: Inquiries about travel, weapons access, or attack execution
●	Farewell behavior: Communications that suggest finality or closure
●	Operational security: Increased concern about privacy or surveillance
Behavioral Cues (including but not limited to):
●	Significant withdrawal from normal life activities
●	Lifestyle changes (preparation behaviors, dress, rhetoric)
●	Decreased engagement with non-extremist perspectives
●	Hostility toward counter-narratives
●	Evasive or secretive communication patterns
●	Expressions of willingness to sacrifice or die for the cause
Protective Factors and Deradicalization Indicators
Emotional Shifts (including but not limited to):
●	Expressions of doubt about extremist ideology
●	Emergence of moral conflict or cognitive dissonance
●	Development of empathy toward outgroups
●	Feelings of regret or questioning past beliefs
Behavioral Indicators (including but not limited to):
●	Reengagement with non-extremist social connections
●	Return to conventional goals (education, career, family)
●	Reduced consumption of extremist content
●	Increased openness to dialogue and alternative perspectives
●	Humanization of previously dehumanized groups
●	Willingness to acknowledge complexity and nuance
●	Decreased use of absolutist language 

Please analyze the conversation and return the structured JSON response.`;

// Function to format conversation data for analysis
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatConversation = (messages: any[]) => {
  try {
    let formattedConversation = "";

    for (const message of messages) {
      // Handle timestamp
      let timestamp;
      if (message.timestamp) {
        if (typeof message.timestamp === 'string') {
          timestamp = new Date(message.timestamp).toLocaleString();
        } else if (message.timestamp instanceof Date) {
          timestamp = message.timestamp.toLocaleString();
        } else {
          timestamp = new Date().toLocaleString();
        }
      } else {
        timestamp = new Date().toLocaleString();
      }

      // Format content - ensure it's a string
      let content = "";
      if (typeof message.content === 'string') {
        content = message.content;
      } else if (typeof message.content === 'object' && message.content?.text) {
        content = message.content.text;
      } else {
        content = String(message.content || '[No content]');
      }

      // Add to formatted conversation based on role
      if (message.role === 'user') {
        formattedConversation += `${timestamp}: User: ${content}\n`;
      } else if (message.role === 'agent' || message.role === 'assistant') {
        formattedConversation += `${timestamp}: Agent: ${content}\n`;
      }
    }

    return formattedConversation;
  } catch {
    return "Error: Unable to format conversation properly.";
  }
};

export async function updateUserAnalysis(profileID: string) {
  // Initialize Anthropic client
  const anthropic = new Anthropic({
    apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY!
  });

  let client: MongoClient | null = null;

  try {
    // Connect to the aldous_db MongoDB
    const connString = `mongodb+srv://${process.env.NEXT_PUBLIC_MONGODB_USERNAME}:${process.env.NEXT_PUBLIC_MONGODB_PASSWORD}@clusteraustraliaflex.fycsf67.mongodb.net/?retryWrites=true&w=majority&appName=ClusterAustraliaFlex`;
    client = new MongoClient(connString);
    await client.connect();
    
    const db = client.db("aldous_db");
    const chatSessionsCollection = db.collection("chatsessions");
    const analysesCollection = db.collection("analyses");

    // Fetch all chat sessions for this profile
    const chatSessions = await chatSessionsCollection.find({
      subjectID: new ObjectId(profileID)
    }).sort({ sessionDate: 1 }).toArray();

    if (chatSessions.length === 0) {
      return {
        error: true,
        message: 'No chat sessions found for this profile'
      };
    }

    // Extract all messages from chat sessions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allMessages: any[] = [];
    chatSessions.forEach(session => {
      if (session.messages && Array.isArray(session.messages)) {
        session.messages.forEach(msg => {
          allMessages.push({
            timestamp: msg.timestamp,
            role: msg.role,
            content: msg.content,
            contentType: msg.contentType
          });
        });
      }
    });

    // Sort messages by timestamp
    allMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (allMessages.length === 0) {
      return {
        error: true,
        message: 'No messages found in chat sessions'
      };
    }

    // Format the conversation for analysis
    const conversation = formatConversation(allMessages);

    // Generate the current date in the required format (MM.DD.YYYY)
    const today = new Date();
    const formattedDate = `${(today.getMonth() + 1).toString().padStart(2, '0')}.${today.getDate().toString().padStart(2, '0')}.${today.getFullYear()}`;

    // Create the Claude API request
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 8192,
      system: prompt_alethia,
      messages: [
        { role: "user", content: conversation }
      ]
    });

    // Process the response
    let responseText = '';
    if (message.content[0].type === 'text') {
      responseText = message.content[0].text;

      // Remove backticks and "json" word
      responseText = responseText.replace(/`/g, '').replace(/json/g, "");

      // Try to extract JSON content
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        responseText = jsonMatch[0];

        try {
          // Parse the JSON response
          const analysisData = JSON.parse(responseText);
          
          // Create the analysis document
          const analysisDocument = {
            subjectID: new ObjectId(profileID),
            lastUpdated: new Date(),
            completeAnalysis: {
              ...analysisData,
              lastUpdated: formattedDate,
              conversationCount: allMessages.length,
              generatedAt: new Date().toISOString()
            }
          };

          // Update or insert the analysis
          const result = await analysesCollection.updateOne(
            { subjectID: new ObjectId(profileID) },
            { $set: analysisDocument },
            { upsert: true }
          );

          if (result.modifiedCount > 0) {
            // Analysis updated
          } else if (result.upsertedCount > 0) {
            // Analysis created
          }

          // Fetch the updated profile details
          const timestamp = new Date().getTime();
          const updatedProfileData = await fetchUserDetails(profileID, true);

          if (
            !updatedProfileData ||
            (typeof updatedProfileData === 'object' &&
              updatedProfileData !== null &&
              'error' in updatedProfileData &&
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (updatedProfileData as any).error)
          ) {
            return {
              error: true,
              message: 'Analysis was updated but profile data could not be retrieved'
            };
          }

          return {
            success: true,
            data: updatedProfileData,
            timestamp: timestamp
          };

        } catch {
          // Try some basic JSON fixes
          try {
            let fixedJson = responseText.replace(/'/g, '"');
            fixedJson = fixedJson.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
            
            const fixedAnalysisData = JSON.parse(fixedJson);
            
            // Proceed with the fixed data
            const analysisDocument = {
              subjectID: new ObjectId(profileID),
              lastUpdated: new Date(),
              completeAnalysis: {
                ...fixedAnalysisData,
                lastUpdated: formattedDate,
                conversationCount: allMessages.length,
                generatedAt: new Date().toISOString()
              }
            };

            await analysesCollection.updateOne(
              { subjectID: new ObjectId(profileID) },
              { $set: analysisDocument },
              { upsert: true }
            );

            const updatedProfileData = await fetchUserDetails(profileID, true);
            
            return {
              success: true,
              data: updatedProfileData,
              timestamp: new Date().getTime()
            };

          } catch {
            return {
              error: true,
              message: 'Failed to process analysis results'
            };
          }
        }
      } else {
        return {
          error: true,
          message: 'Invalid response format from analysis service'
        };
      }
    }

  } catch {
    return {
      error: true,
      message: 'Failed to update profile analysis'
    };
  } finally {
    // Close MongoDB connection
    if (client) await client.close();
  }
}
