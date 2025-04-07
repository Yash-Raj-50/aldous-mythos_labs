import anthropic
from pymongo import MongoClient, ASCENDING
from dotenv import load_dotenv
import os, time, json
from datetime import datetime


# Load environment variables
load_dotenv()
ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')
MONGODB_USERNAME = os.getenv('MONGODB_USERNAME')
MONGODB_PASSWORD = os.getenv('MONGODB_PASSWORD')
bot_id = "4b5ab6c4-2c39-4237-a457-b6ffc358fe19"  #ID of the Alethia agent whose conversations we want to analyze from the chat_collection (its called bot_id in the database)


# Connect to MongoDB were user dashborad data sits
conn_link = f"mongodb+srv://{MONGODB_USERNAME}:{MONGODB_PASSWORD}@ctbot.5vx6h.mongodb.net/?retryWrites=true&w=majority&appName=CTBot"
client = MongoClient(conn_link)
db = client["user-chat"]
user_collection = db["users"]

#Connect to MongoDB for Sago where the chats sit
conn_link_sago = f"mongodb+srv://{MONGODB_USERNAME}:{MONGODB_PASSWORD}@clusteraustraliaflex.fycsf67.mongodb.net/"
client_sago = MongoClient(conn_link_sago)
db_sago = client_sago["sago_db"]
chat_collection = db_sago["chat"]

model="claude-3-7-sonnet-20250219"
claude = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)  #Connection    to the Anthropic API, I call him claude


#Prompt for the alethia agent to analyze the conversation
prompt_alethia = """You are tasked with analyzing a chat conversation between a user and Alethia (a deradicalization AI) to generate structured data for our risk assessment dashboard. 

Analyze the complete conversation history provided and extract the following data points in a structured JSON format. Your analysis must be evidence-based using direct quotes from the conversation. Do not include subjective interpretations without supporting evidence.

## Required Output Format

Return only a JSON object with the following structure, and nothing else:

{
  "userID": "[ID of the user]",
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

"""



def format_conversation(conversation_list):
    formatted_conversation = ""
    for message in conversation_list:
        t = message['timestamp']
        if message['role'] == 'user':
            formatted_conversation += f"{t}: User: {message['content']}\n"   
        elif message['role'] == 'assistant':
            formatted_conversation+= f"{t}: Agent: {message['content']}\n"
    return formatted_conversation


def compute_analysis(user_id:str):
# Extract unique user_ids
    conversation_record = chat_collection.find({"user_id": user_id, "bot_id": bot_id})  #make sure to only get conversations with Alethia agent that has the right bot_id
    conversation_list = [record for record in conversation_record ]
    #print(f"Conversation list: {conversation_list}")
    try:
        conversation = format_conversation(conversation_list)
        #print(f"Formatted conversation: {conversation}")
        message = claude.messages.create(
                            model=model,
                            max_tokens=8192,
                            system = prompt_alethia,
                            messages=[
                                {"role": "user", "content": conversation}
                                ]
                        )
        response = message.content[0].text
        response = response.replace("`", '').replace('json',"")  # Replace those annoyging backticks and the word json, so we can parse the json
        user_data = json.loads(response)
        user_data['userID'] = user_id
        user_data["conversationCount"] = len(conversation_list)

        try:
            user_collection.insert_one(user_data)
            print(f"Inserted user: {user_data['userID']}")
            return user_data
        except Exception as e:
            print(f"Error inserting user {user_data['userID']}: {e}")
            return None

    except Exception as e:
        print(f"Error processing user {user_id}: {e}")
        return None
    


#Test code
user_id = "8b84c8ba-9b38-4922-a4f8-5db4dcf2a4df"  # Example user ID alread in chat database
response_json = compute_analysis(user_id)
print(response_json)