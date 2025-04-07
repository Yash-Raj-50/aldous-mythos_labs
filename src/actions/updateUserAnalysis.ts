'use server'

import { MongoClient } from 'mongodb';
import Anthropic from '@anthropic-ai/sdk';
import { fetchUserDetails } from './fetchUserDetails';

// Constants from the Python script
const BOT_ID = "4b5ab6c4-2c39-4237-a457-b6ffc358fe19";
const MODEL = "claude-3-7-sonnet-20250219";

const prompt_alethia = `You are tasked with analyzing a chat conversation between a user and Alethia (a deradicalization AI) to generate structured data for our risk assessment dashboard. 

Analyze the complete conversation history provided and extract the following data points in a structured JSON format. Your analysis must be evidence-based using direct quotes from the conversation. Do not include subjective interpretations without supporting evidence.

## Required Output Format

// Add this to your prompt
Return only a valid JSON object with the exact structure shown below. Do not add explanatory text, comments, descriptions, or any content outside of the JSON structure. Ensure all property names have double quotes and all string values have double quotes. Follow standard JSON syntax precisely:
{
  "lastUpdated": "[Current date in MM.DD.YYYY format]",
  "conversationCount": [Number of conversations],
  
  "executiveSummary": {
    "summary": "[A concise 2-3 sentence summary of the user's radicalization profile]",
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
    "emotionalValidation": {
      "score": [0-100],
      "assessment": "[NEGATIVE/MIXED/MODERATELY POSITIVE/POSITIVE]"
    },
    "alternativeNarratives": {
      "score": [0-100],
      "assessment": "[NEGATIVE/MIXED/MODERATELY POSITIVE/POSITIVE]"
    },
    "directChallenges": {
      "score": [0-100],
      "assessment": "[NEGATIVE/MIXED/MODERATELY POSITIVE/POSITIVE]",
      "isAvoid": [true/false]
    },
    "engagementTrend": {
      "dataPoints": [
        {
          "timestamp": "[MM/DD/YYYY HH:MM format]",
          "level": "[LOW/MEDIUM/HIGH]",
          "event": "[Brief description]"
        }
      ]
    }
  },
  
  "inflectionPoints": [
    {
      "timestamp": "[MM/DD/YYYY HH:MM format]",
      "quote": "[Direct quote from user]",
      "significance": "[Brief analysis]",
      "type": "[INITIAL_INTENT/EMOTIONAL_DRIVER/JUSTIFICATION/REJECTION]"
    }
  ],
  
  "psychologicalNeeds": [
    {
      "need": "[JUSTICE_REVENGE/IDENTITY_BELONGING/AGENCY_POWER/PURPOSE_MEANING]",
      "quote": "[Supporting quote]",
      "size": "[LARGE/MEDIUM]",
      "color": "[RED/ORANGE/BLUE/TEAL]"
    }
  ],
  
  "emotionalState": [
    {
      "emotion": "[ANGER/FRUSTRATION/DEFENSIVENESS/etc.]",
      "strength": "[HIGH/MEDIUM/LOW]",
      "underlyingDrivers": ["List of 2-3 underlying psychological drivers"]
    }
  ],
  
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

Conversation history to analyze:
[]

`;
// This is the prompt that will be sent to the Claude API for analysis


// Format conversation messages to match the expected input format
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// Fix the formatConversation function to properly handle MongoDB objects
const formatConversation = (conversationList: any[]) => {
  let formattedConversation = "";

  try {
    for (const message of conversationList) {
      // Format timestamp - ensure it's a string
      let timestamp = "";
      if (typeof message.timestamp === 'object' && message.timestamp instanceof Date) {
        // If it's a Date object, format it
        timestamp = message.timestamp.toLocaleString();
      } else if (message.timestamp) {
        // Otherwise use the timestamp as is if it exists
        timestamp = String(message.timestamp);
      } else {
        // Fallback if no timestamp
        timestamp = new Date().toLocaleString();
      }

      // Format content - ensure it's a string
      let content = "";
      if (typeof message.content === 'object') {
        // If content is an object, try to stringify it or extract text
        if (message.content.text) {
          content = String(message.content.text);
        } else {
          try {
            content = JSON.stringify(message.content);
          } catch (e) {
            content = "[Complex content]";
          }
        }
      } else if (message.content) {
        // Use content directly if it's not an object
        content = String(message.content);
      } else if (message.text) {
        // Try the 'text' property as fallback
        content = String(message.text);
      } else {
        // If we still can't find content
        content = "[No content]";
      }

      // Add to formatted conversation based on role
      if (message.role === 'user') {
        formattedConversation += `${timestamp}: User: ${content}\n`;
      } else if (message.role === 'assistant') {
        formattedConversation += `${timestamp}: Agent: ${content}\n`;
      }
    }

    // Debug log - first 500 chars of conversation
    console.log(`Formatted conversation sample: ${formattedConversation.substring(0, 500)}...`);

    return formattedConversation;
  } catch (error) {
    console.error("Error formatting conversation:", error);
    return "Error: Unable to format conversation properly.";
  }
};

export async function updateUserAnalysis(userId: string) {
  // console.log(`Starting analysis update for user: ${userId}`);

  // Initialize Anthropic client
  const anthropic = new Anthropic({
    apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY!
  });

  let ctbotClient: MongoClient | null = null;
  let sagoClient: MongoClient | null = null;

  try {
    // Connect to the CTBot MongoDB (user dashboard data)
    const ctbotConnString = `mongodb+srv://${process.env.NEXT_PUBLIC_MONGODB_USERNAME}:${process.env.NEXT_PUBLIC_MONGODB_PASSWORD}@ctbot.5vx6h.mongodb.net/?retryWrites=true&w=majority&appName=CTBot`;
    ctbotClient = new MongoClient(ctbotConnString);
    await ctbotClient.connect();
    const userCollection = ctbotClient.db("user-chat").collection("users_simulated");

    // Connect to the Sago MongoDB (chat data)
    const sagoConnString = `mongodb+srv://${process.env.NEXT_PUBLIC_MONGODB_USERNAME}:${process.env.NEXT_PUBLIC_MONGODB_PASSWORD}@clusteraustraliaflex.fycsf67.mongodb.net/`;
    sagoClient = new MongoClient(sagoConnString);
    await sagoClient.connect();
    const chatCollection = sagoClient.db("sago_db").collection("chat");

    // Fetch conversations for the user
    const conversationRecords = await chatCollection.find({
      user_id: userId,
      bot_id: BOT_ID
    }).toArray();

    console.log(`Found ${conversationRecords.length} conversation messages for user ${userId}`);

    if (conversationRecords.length === 0) {
      return {
        error: true,
        message: 'No conversations found for this user'
      };
    }

    // Format the conversation
    const conversation = formatConversation(conversationRecords);

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

    console.log(`Claude API response: ${message}`);

    // Process the response - updated to extract JSON
    let responseText = '';
    if (message.content[0].type === 'text') {
      responseText = message.content[0].text;

      // Remove backticks and "json" word
      responseText = responseText.replace(/`/g, '').replace(/json/g, "");

      // Try to extract JSON content (looking for object between curly braces)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        responseText = jsonMatch[0];
        // console.log('Extracted JSON:', responseText);

        try {
          // Log a small sample of the extracted JSON for debugging
          console.log(`JSON sample (first 100 chars): ${responseText.substring(0, 100)}...`);
          
          // Parse the JSON response
          const userData = JSON.parse(responseText);
          
          // Rest of your code for processing the userData...
          
        } catch (parseError) {
          console.error('Original JSON parsing error:', parseError);
          
          // Log the position where parsing failed
          if (parseError instanceof SyntaxError) {
            const errorMatch = parseError.message.match(/position (\d+)/);
            const position = errorMatch ? parseInt(errorMatch[1]) : -1;
            
            if (position > 0) {
              // Show the problematic part of the JSON (20 chars before and after the error position)
              const start = Math.max(0, position - 20);
              const end = Math.min(responseText.length, position + 20);
              console.error(`JSON error near: ...${responseText.substring(start, position)}[ERROR HERE]${responseText.substring(position, end)}...`);
            }
          }
          
          // Try applying some common JSON fixes
          try {
            let fixedJson = responseText.replace(/'/g, '"');
  
            // Fix 2: Try fixing trailing commas before closing brackets
            fixedJson = fixedJson.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
            
            // Fix 3: Try fixing missing quotes around property names
            fixedJson = fixedJson.replace(/(\{|\,)\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
            
            // Fix 4: Handle nested quotes in string values
            // This regex looks for quotes between other quotes and escapes them
            fixedJson = fixedJson.replace(/"([^"]*)"([^"]*)"([^"]*)"/g, function(match, p1, p2, p3) {
              return '"' + p1 + '\\"' + p2 + '\\"' + p3 + '"';
            });
            
            // Fix 5: Replace problematic emojis with their description
            // This is a simple approach - emoji replacement
            fixedJson = fixedJson.replace(/[\u{1F600}-\u{1F64F}]/gu, "[emoji]");  // emotion emojis
            fixedJson = fixedJson.replace(/[\u{1F300}-\u{1F5FF}]/gu, "[symbol]"); // symbols & pictographs
            fixedJson = fixedJson.replace(/[\u{1F680}-\u{1F6FF}]/gu, "[transport]"); // transport & map symbols
            fixedJson = fixedJson.replace(/[\u{2600}-\u{26FF}]/gu, "[misc]"); // misc symbols
            fixedJson = fixedJson.replace(/[\u{2700}-\u{27BF}]/gu, "[dingbats]"); // dingbats
            
            console.log("Attempting to parse fixed JSON...");
            const userData = JSON.parse(fixedJson);
            
            console.log("Successfully parsed JSON after applying fixes");
            
            // Remove userID from Claude's response to avoid conflicts
            delete userData.userID;
            
            // Continue with the fixed userData
            // Remove userID from Claude's response to avoid conflicts
            delete userData.userID;
            
            // Rest of your processing code...
            
          } catch (fixError) {
            // If all fixes fail, return the error
            console.error('Failed to fix JSON parsing issues:', fixError);
            return {
              error: true,
              message: 'Invalid JSON format received from analysis service'
            };
          }
        }

      } else {
        console.error('No valid JSON object found in response');
        console.log('Response content:', responseText);
        return {
          error: true,
          message: 'Invalid format received from analysis service'
        };
      }
    }

    try {
      // Parse the JSON response
      const userData = JSON.parse(responseText);
      
      // Remove userID from Claude's response to avoid conflicts
      delete userData.userID;
      
      // Create the object with Claude data first, then override specific fields
      const userDataToSave = {
        ...userData,  // Put Claude data first
        userID: userId,  // Then override with correct values
        lastUpdated: formattedDate,
        conversationCount: conversationRecords.length
      };
      
      // console.log(`Final userID before database update: ${userDataToSave.userID}`);
      
      // Simplify the update operation - remove $setOnInsert
      const result = await userCollection.updateOne(
        { userID: userId },  // Filter by the correct userID
        { $set: userDataToSave },  // Just use $set without $setOnInsert
        { upsert: true }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`Updated existing user: ${userId}`);
      } else if (result.upsertedCount > 0) {
        console.log(`Inserted new user: ${userId}`);
      }

      // Fetch the updated user details to return
      const timestamp = new Date().getTime(); // Add timestamp for cache busting
      const updatedUserData = await fetchUserDetails(userId, true); // Add a forceRefresh parameter
      
      if (!updatedUserData) {
        console.error('Updated user data could not be retrieved');
        return {
          error: true,
          message: 'User data was updated but could not be retrieved'
        };
      }
      
      console.log('Successfully retrieved updated user data');
      
      return {
        success: true,
        data: updatedUserData,
        timestamp: timestamp // Add timestamp to response
      };
    } catch (parseError) {
      console.error('Error parsing Claude API response:', parseError);
      return {
        error: true,
        message: 'Failed to process analysis results'
      };
    }

  } catch (error) {
    console.error('Error updating user analysis:', error);
    return {
      error: true,
      message: 'Failed to update user analysis'
    };
  } finally {
    // Close MongoDB connections
    if (ctbotClient) await ctbotClient.close();
    if (sagoClient) await sagoClient.close();
  }
}