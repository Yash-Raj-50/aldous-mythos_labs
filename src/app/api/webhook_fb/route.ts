import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import {
  TranscribeClient,
  StartTranscriptionJobCommand,
  GetTranscriptionJobCommand,
} from '@aws-sdk/client-transcribe';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import {
  RekognitionClient,
  DetectLabelsCommand,
  DetectTextCommand,
} from '@aws-sdk/client-rekognition';
import dbConnect from '@/lib/dbConnect';
import {
  ProfileModel,
  AgentModel,
  ChatSessionModel,
  AnalysisModel,
} from '@/models/databaseSchemas';
import { Profile, ChatSession, Analysis, Message } from '@/types/databaseTypes';

// Facebook Messenger API types
interface FacebookEntry {
  id: string;
  time: number;
  messaging?: FacebookMessaging[];
}

interface FacebookMessaging {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid: string;
    text?: string;
    attachments?: FacebookAttachment[];
  };
  postback?: {
    title: string;
    payload: string;
  };
}

interface FacebookAttachment {
  type: 'image' | 'video' | 'audio' | 'file';
  payload: {
    url: string;
  };
}

interface FacebookWebhookPayload {
  object: string;
  entry: FacebookEntry[];
}

// Interface for media info
interface MediaInfo {
  url: string;
  contentType: string;
  size: number;
  data?: string;
  buffer?: Buffer;
}

// Initialize AWS clients lazily to avoid build-time errors
function getBedrockClient() {
  return new BedrockRuntimeClient({
    region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
    },
  });
}

function getTranscribeClient() {
  return new TranscribeClient({
    region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
    },
  });
}

function getS3Client() {
  return new S3Client({
    region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
    },
  });
}

function getRekognitionClient() {
  return new RekognitionClient({
    region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
    },
  });
}

// Media handling constants
const MAX_MEDIA_SIZE_MB = 8; // 8MB limit for Facebook Messenger media
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const SUPPORTED_AUDIO_TYPES = ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/mp4'];
const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/3gpp', 'video/quicktime'];
const SUPPORTED_DOCUMENT_TYPES = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

// Default values
const CLAUDE_SONNET_4_INFERENCE_PROFILE = 'arn:aws:bedrock:us-east-1:544718082615:inference-profile/us.anthropic.claude-sonnet-4-20250514-v1:0';
const FALLBACK_MODEL_ID = 'anthropic.claude-3-sonnet-20240229-v1:0';
const SESSION_TIMEOUT_HOURS = 1;

// Random response arrays for human-like variation
const FALLBACK_RESPONSES = [
  'got it, give me a sec',
  'hold on',
  'one moment',
  'let me check that',
  'I will think about that',
  'just a sec'
];

const ERROR_RESPONSES = [
  'remind me later',
  'something\'s buggy',
  'give me a minute',
  'let me get back to you',
  'hold up',
  'busy right now'
];

const MEDIA_ERROR_RESPONSES = [
  'can\'t open that file now',
  'will look at that file later',
  'busy atm, try later',
  'can\'t check that right now',
  'swamped, will get to it',
  'send again later'
];

const GENERAL_ERROR_RESPONSES = [
  'busy right now',
  'can\'t respond properly atm',
  'swamped with stuff',
  'tied up at the moment',
  'running around, ttyl',
  'crazy busy rn',
  'in meetings all day',
  'overwhelmed today',
  'will get back to you',
  'caught up in something'
];

// Casual conversation starters/fillers
const CASUAL_STARTERS = [
  'btw',
  'oh',
  'hmm',
  'well',
  'actually',
  'honestly',
  'so',
  'basically'
];

const CASUAL_ENDINGS = [
  'anyway',
  'but yeah',
  'you know',
  'if that makes sense',
  'hope that helps',
  'lmk if you need more'
];

const QUICK_RESPONSES = [
  'k',
  'got it',
  'yep',
  'sure',
  'ok',
  'right',
  'mm',
  'yeah',
  'uh huh',
  'mhm',
  'gotcha',
  'cool'
];

// Contextual response arrays for different message types
const GREETING_RESPONSES = [
  'hey there',
  'what\'s up',
  'hey',
  'hi',
  'hello',
  'how\'s it going'
];

const QUESTION_RESPONSES = [
  'let me think about that',
  'good question',
  'hmm',
  'interesting',
  'let me see',
  'that\'s a tough one'
];

const THANKS_RESPONSES = [
  'no problem',
  'sure thing',
  'anytime',
  'you bet',
  'of course',
  'glad to help'
];

// Random response helper
function getRandomResponse(responses: string[]): string {
  const randomIndex = Math.floor(Math.random() * responses.length);
  return responses[randomIndex];
}

// Add random delay to simulate human typing
async function addRandomDelay(): Promise<void> {
  const delay = Math.floor(Math.random() * 2000) + 500; // 500ms to 2.5s delay
  await new Promise(resolve => setTimeout(resolve, delay));
}

// Sometimes return random short responses to seem more human
function shouldUseRandomResponse(): boolean {
  return Math.random() < 0.03; // 3% chance
}

// Contextual response detection
function detectMessageType(message: string): 'greeting' | 'question' | 'thanks' | 'other' {
  const lower = message.toLowerCase();
  
  if (lower.match(/^(hi|hey|hello|sup|what's up|good morning|good afternoon|good evening)/)) {
    return 'greeting';
  }
  if (lower.includes('?') || lower.match(/^(what|how|when|where|why|who|can you|could you|do you)/)) {
    return 'question';
  }
  if (lower.match(/(thank|thanks|thx|ty|appreciate)/)) {
    return 'thanks';
  }
  return 'other';
}

// Get contextual response based on message type
function getContextualResponse(messageType: 'greeting' | 'question' | 'thanks' | 'other'): string | null {
  if (Math.random() > 0.05) return null; // 5% chance
  
  switch (messageType) {
    case 'greeting':
      return getRandomResponse(GREETING_RESPONSES);
    case 'question':
      return getRandomResponse(QUESTION_RESPONSES);
    case 'thanks':
      return getRandomResponse(THANKS_RESPONSES);
    default:
      return null;
  }
}

// Add typing indicators and natural pauses
async function addTypingPattern(): Promise<void> {
  if (Math.random() < 0.3) {
    const pauses = Math.floor(Math.random() * 3) + 1; // 1-3 pauses
    for (let i = 0; i < pauses; i++) {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 800 + 200)); // 200-1000ms pauses
    }
  } else {
    await addRandomDelay();
  }
}

// Make AI responses more casual and human-like
function casualizeResponse(response: string): string {
  // 15% chance to add casual starter
  if (Math.random() < 0.15) {
    response = getRandomResponse(CASUAL_STARTERS) + ', ' + response.toLowerCase();
  }
  
  // 10% chance to add casual ending
  if (Math.random() < 0.1) {
    response = response + ' - ' + getRandomResponse(CASUAL_ENDINGS);
  }
  
  // 5% chance to add a typo correction simulation
  if (Math.random() < 0.05) {
    response = response + ' *' + response.split(' ').pop(); // simulate fixing last word
  }
  
  return response;
}

// Time-based response modifications
function addTimeBasedVariation(response: string): string {
  const hour = new Date().getHours();
  
  // Late night responses (11 PM - 5 AM) - 20% chance
  if ((hour >= 23 || hour <= 5) && Math.random() < 0.2) {
    const lateResponses = ['sorry for the late reply', 'up late too?', 'quick response'];
    return getRandomResponse(lateResponses) + ' - ' + response;
  }
  
  // Early morning responses (6 AM - 9 AM) - 15% chance  
  if (hour >= 6 && hour <= 9 && Math.random() < 0.15) {
    const morningResponses = ['morning!', 'early bird', 'good morning'];
    return getRandomResponse(morningResponses) + ' ' + response;
  }
  
  // Lunch time responses (11 AM - 2 PM) - 10% chance
  if (hour >= 11 && hour <= 14 && Math.random() < 0.1) {
    const lunchResponses = ['quick break', 'lunch time response', 'between meetings'];
    return getRandomResponse(lunchResponses) + ' - ' + response;
  }
  
  return response;
}

// Model mapping with inference profile for Claude Sonnet 4
const getModelId = (aiModel: string): { modelId: string; useInferenceProfile: boolean } => {
  switch (aiModel) {
    case 'gpt-4o':
      return { modelId: 'gpt-4o', useInferenceProfile: false };
    case 'gpt-o1':
      return { modelId: 'gpt-o1', useInferenceProfile: false };
    case 'claude-3.7-sonnet':
    case 'claude-3.5-sonnet':
    case 'claude-sonnet-4':
      return { modelId: CLAUDE_SONNET_4_INFERENCE_PROFILE, useInferenceProfile: true };
    case 'claude-3-haiku':
      return { modelId: 'anthropic.claude-3-haiku-20240307-v1:0', useInferenceProfile: false };
    default:
      return { modelId: CLAUDE_SONNET_4_INFERENCE_PROFILE, useInferenceProfile: true };
  }
};

// Transcribe audio using AWS Transcribe
async function transcribeAudio(audioBuffer: Buffer, contentType: string): Promise<string | null> {
  let s3Key: string | null = null;
  
  try {
    const s3Client = getS3Client();
    const transcribeClient = getTranscribeClient();
    
    // Upload audio to S3 first
    const bucketName = process.env.NEXT_PUBLIC_AWS_S3_BUCKET;
    const key = `audio/${Date.now()}-${Math.random().toString(36).substring(7)}.${contentType.split('/')[1]}`;
    s3Key = key;
    
    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: audioBuffer,
      ContentType: contentType,
    }));
    
    const s3Uri = `s3://${bucketName}/${key}`;
    const jobName = `transcribe-job-${Date.now()}`;
    
    // Start transcription job
    await transcribeClient.send(new StartTranscriptionJobCommand({
      TranscriptionJobName: jobName,
      Media: { MediaFileUri: s3Uri },
      MediaFormat: contentType.includes('mp3') ? 'mp3' : contentType.includes('wav') ? 'wav' : 'mp4',
      LanguageCode: 'en-US',
    }));
    
    // Poll for completion
    let completed = false;
    let attempts = 0;
    const maxAttempts = 30;
    let transcriptResult: string | null = null;
    
    while (!completed && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const result = await transcribeClient.send(new GetTranscriptionJobCommand({
        TranscriptionJobName: jobName,
      }));
      
      if (result.TranscriptionJob?.TranscriptionJobStatus === 'COMPLETED') {
        const transcriptUri = result.TranscriptionJob.Transcript?.TranscriptFileUri;
        if (transcriptUri) {
          const transcriptResponse = await fetch(transcriptUri);
          const transcriptData = await transcriptResponse.json();
          transcriptResult = transcriptData.results?.transcripts?.[0]?.transcript || null;
        }
        completed = true;
      } else if (result.TranscriptionJob?.TranscriptionJobStatus === 'FAILED') {
        console.error('Transcription failed:', result.TranscriptionJob.FailureReason);
        break;
      }
      
      attempts++;
    }
    
    return transcriptResult;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return null;
  } finally {
    // Clean up S3 file
    if (s3Key) {
      try {
        const s3Client = getS3Client();
        await s3Client.send(new DeleteObjectCommand({
          Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET,
          Key: s3Key,
        }));
      } catch (cleanupError) {
        console.error('Error cleaning up S3 file:', cleanupError);
      }
    }
  }
}

// Analyze image using AWS Rekognition for additional context
async function analyzeImageWithRekognition(imageBuffer: Buffer): Promise<string> {
  try {
    const rekognitionClient = getRekognitionClient();
    
    // Detect labels and text in image
    const [labelsResult, textResult] = await Promise.all([
      rekognitionClient.send(new DetectLabelsCommand({
        Image: { Bytes: imageBuffer },
        MaxLabels: 10,
        MinConfidence: 70,
      })),
      rekognitionClient.send(new DetectTextCommand({
        Image: { Bytes: imageBuffer },
      })),
    ]);
    
    const labels = labelsResult.Labels?.map(label => label.Name).filter(Boolean) || [];
    const textDetections = textResult.TextDetections
      ?.filter(detection => detection.Type === 'LINE')
      ?.map(detection => detection.DetectedText)
      .filter(Boolean) || [];
    
    let analysis = '';
    if (labels.length > 0) {
      analysis += `Objects/scenes detected: ${labels.join(', ')}. `;
    }
    if (textDetections.length > 0) {
      analysis += `Text found in image: "${textDetections.join(' ')}"`;
    }
    
    return analysis || 'No specific objects or text detected in the image.';
  } catch (error) {
    console.error('Error analyzing image with Rekognition:', error);
    return 'Could not analyze image content automatically.';
  }
}

// Generate response using AWS Bedrock with conversation history and enhanced multimodal support
async function generateBedrockResponse(
  prompt: string, 
  userMessage: string, 
  modelConfig: { modelId: string; useInferenceProfile: boolean }, 
  conversationHistory: Message[] = [],
  mediaInfo?: MediaInfo
): Promise<string> {
  try {
    // Check if AWS credentials are configured
    if (!process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || 
        !process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY ||
        process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID.includes('DUMMY') ||
        process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY.includes('dummy')) {
      console.warn('AWS credentials not configured, using fallback response');
      return getRandomResponse(FALLBACK_RESPONSES);
    }

    const bedrockClient = getBedrockClient();
    
    // Build conversation messages with history
    const messages = [];

    // Add conversation history (last 10 messages for context)
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    }
    
    // Build current user message with enhanced multimodal support
    let currentMessageContent;
    
    if (mediaInfo) {
      if (SUPPORTED_IMAGE_TYPES.includes(mediaInfo.contentType)) {
        // Image with vision capabilities
        const rekognitionAnalysis = mediaInfo.buffer ? await analyzeImageWithRekognition(mediaInfo.buffer) : '';
        
        currentMessageContent = [
          {
            type: "text",
            text: `${userMessage}\n\nImage analysis: ${rekognitionAnalysis}`
          },
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaInfo.contentType,
              data: mediaInfo.data || mediaInfo.buffer?.toString('base64') || ''
            }
          }
        ];
      } else if (SUPPORTED_AUDIO_TYPES.includes(mediaInfo.contentType)) {
        // Audio transcription
        const transcription = mediaInfo.buffer ? await transcribeAudio(mediaInfo.buffer, mediaInfo.contentType) : null;
        currentMessageContent = transcription 
          ? `${userMessage}\n\nAudio transcription: "${transcription}"`
          : `${userMessage}\n\n[Audio file received but could not be transcribed]`;
      } else if (SUPPORTED_VIDEO_TYPES.includes(mediaInfo.contentType)) {
        // Video file - extract first frame or provide description
        currentMessageContent = `${userMessage}\n\n[Video file received: ${mediaInfo.url}]`;
      } else {
        // Other file types
        currentMessageContent = `${userMessage}\n\n[File received: ${mediaInfo.url}]`;
      }
    } else {
      // Text-only message
      currentMessageContent = userMessage;
    }
    
    // Add current user message
    messages.push({
      role: "user",
      content: currentMessageContent
    });
    
    // Ensure messages alternate properly
    const processedMessages = [];
    let lastRole = '';
    let combinedContent: string | Array<{type: string; text?: string; source?: {type: string; media_type: string; data: string}}> = '';
    
    for (const msg of messages) {
      if (msg.role === lastRole) {
        // Combine with previous message
        if (typeof combinedContent === 'string' && typeof msg.content === 'string') {
          combinedContent += '\n' + msg.content;
        }
      } else {
        // Push previous message if exists
        if (lastRole && combinedContent) {
          processedMessages.push({
            role: lastRole,
            content: combinedContent
          });
        }
        lastRole = msg.role;
        combinedContent = msg.content;
      }
    }
    
    // Push the last message
    if (lastRole && combinedContent) {
      processedMessages.push({
        role: lastRole,
        content: combinedContent
      });
    }

    // Try Claude Sonnet 4 inference profile first, fallback to Claude 3
    let command = new InvokeModelCommand({
      modelId: modelConfig.modelId,
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 1000,
        system: prompt,
        messages: processedMessages
      }),
      contentType: 'application/json',
      accept: 'application/json',
    });

    try {
      const response = await bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      return responseBody.content[0].text || getRandomResponse(FALLBACK_RESPONSES);
    } catch (inferenceError) {
      // If inference profile fails and we were using it, fallback to Claude 3
      if (modelConfig.useInferenceProfile) {
        console.warn('Inference profile failed, falling back to Claude 3 Sonnet');
        command = new InvokeModelCommand({
          modelId: FALLBACK_MODEL_ID,
          body: JSON.stringify({
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: 1000,
            system: prompt,
            messages: processedMessages
          }),
          contentType: 'application/json',
          accept: 'application/json',
        });
        
        const fallbackResponse = await bedrockClient.send(command);
        const fallbackResponseBody = JSON.parse(new TextDecoder().decode(fallbackResponse.body));
        return fallbackResponseBody.content[0].text || getRandomResponse(FALLBACK_RESPONSES);
      }
      throw inferenceError;
    }
  } catch (error) {
    console.error('Error generating Bedrock response:', error);
    return getRandomResponse(ERROR_RESPONSES);
  }
}

// Validate Facebook webhook signature for security
function validateFacebookSignature(request: NextRequest, body: string): boolean {
  try {
    const signature = request.headers.get('x-hub-signature-256');
    if (!signature) {
      console.warn('No Facebook signature header found');
      return false;
    }

    const appSecret = process.env.NEXT_PUBLIC_FACEBOOK_APP_SECRET;
    if (!appSecret) {
      console.warn('Facebook app secret not configured');
      return false;
    }

    const expectedSignature = 'sha256=' + crypto
      .createHmac('sha256', appSecret)
      .update(body)
      .digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    console.log('Facebook signature validation result:', isValid);
    return isValid;
  } catch (error) {
    console.error('Error validating Facebook signature:', error);
    return false;
  }
}

// Download and process media from Facebook with enhanced support
async function processMediaMessage(mediaUrl: string, contentType: string): Promise<{
  success: boolean;
  data?: Buffer;
  base64?: string;
  size?: number;
  error?: string;
}> {
  try {
    // Check if content type is supported
    const allSupportedTypes = [
      ...SUPPORTED_IMAGE_TYPES,
      ...SUPPORTED_AUDIO_TYPES,
      ...SUPPORTED_VIDEO_TYPES,
      ...SUPPORTED_DOCUMENT_TYPES
    ];

    if (!allSupportedTypes.includes(contentType)) {
      return {
        success: false,
        error: `Unsupported media type: ${contentType}`
      };
    }

    // Get Facebook Page Access Token
    const accessToken = process.env.NEXT_PUBLIC_FACEBOOK_PAGE_ACCESS_TOKEN;
    if (!accessToken) {
      return {
        success: false,
        error: 'Facebook Page Access Token not configured'
      };
    }

    // Facebook media URLs might already include access token or need special handling
    let downloadUrl = mediaUrl;
    
    // If the URL doesn't already contain an access token, add it
    if (!mediaUrl.includes('access_token=')) {
      const separator = mediaUrl.includes('?') ? '&' : '?';
      downloadUrl = `${mediaUrl}${separator}access_token=${accessToken}`;
    }

    console.log('Attempting to download media from:', downloadUrl.replace(accessToken, 'HIDDEN_TOKEN'));

    // Download media with proper headers
    const media = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FacebookBot/1.0)',
        'Accept': '*/*',
      },
    });

    if (!media.ok) {
      return {
        success: false,
        error: `Failed to download media from Facebook: ${media.status} ${media.statusText}`
      };
    }

    const mediaBuffer = Buffer.from(await media.arrayBuffer());
    const mediaSizeMB = mediaBuffer.length / (1024 * 1024);

    // Check size limit
    if (mediaSizeMB > MAX_MEDIA_SIZE_MB) {
      return {
        success: false,
        error: `Media size ${mediaSizeMB.toFixed(2)}MB exceeds limit of ${MAX_MEDIA_SIZE_MB}MB`
      };
    }

    // Convert to base64 for images (Claude needs base64 for vision)
    let base64Data = undefined;
    if (SUPPORTED_IMAGE_TYPES.includes(contentType)) {
      base64Data = mediaBuffer.toString('base64');
    }

    return {
      success: true,
      data: mediaBuffer,
      base64: base64Data,
      size: mediaBuffer.length
    };

  } catch (error) {
    console.error('Error processing media:', error);
    return {
      success: false,
      error: `Failed to process media: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Alternative Facebook media download function
// async function downloadFacebookMedia(mediaUrl: string): Promise<{
//   success: boolean;
//   data?: Buffer;
//   contentType?: string;
//   error?: string;
// }> {
//   try {
//     const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    
//     // Method 1: Try direct download with access token
//     try {
//       const response = await fetch(`${mediaUrl}?access_token=${accessToken}`, {
//         headers: {
//           'User-Agent': 'facebookexternalhit/1.1'
//         }
//       });
      
//       if (response.ok) {
//         const data = Buffer.from(await response.arrayBuffer());
//         const contentType = response.headers.get('content-type') || 'application/octet-stream';
//         return { success: true, data, contentType };
//       }
//     } catch (e) {
//       console.log('Method 1 failed, trying method 2', e);
//     }
    
//     // Method 2: Try using Graph API to get the media
//     const graphResponse = await fetch(`https://graph.facebook.com/v18.0/${mediaUrl}?access_token=${accessToken}`);
//     if (graphResponse.ok) {
//       const mediaData = await graphResponse.json();
//       if (mediaData.url) {
//         const finalResponse = await fetch(mediaData.url);
//         if (finalResponse.ok) {
//           const data = Buffer.from(await finalResponse.arrayBuffer());
//           const contentType = finalResponse.headers.get('content-type') || 'application/octet-stream';
//           return { success: true, data, contentType };
//         }
//       }
//     }
    
//     return { success: false, error: 'All download methods failed' };
    
//   } catch (error) {
//     console.error('Facebook media download error:', error);
//     return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
//   }
// }

// Send Facebook Messenger message
async function sendFacebookMessage(recipientId: string, message: string): Promise<boolean> {
  try {
    // Check if Facebook credentials are configured
    const pageAccessToken = process.env.NEXT_PUBLIC_FACEBOOK_PAGE_ACCESS_TOKEN;
    if (!pageAccessToken || pageAccessToken.includes('your_')) {
      console.warn('Facebook page access token not configured, message would be sent to:', recipientId);
      console.log('Message content:', message);
      return true; // Return true in development mode
    }

    const response = await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${pageAccessToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: message },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Facebook API error:', errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending Facebook message:', error);
    return false;
  }
}

// Extract Facebook Page ID from URL or use direct ID
function extractPageId(pageIdentifier: string): string {
  // Handle profile.php?id= format
  const profileMatch = pageIdentifier.match(/profile\.php\?id=(\d+)/);
  if (profileMatch) {
    return profileMatch[1];
  }
  
  // Handle people/Name/ID format
  const peopleMatch = pageIdentifier.match(/facebook\.com\/people\/[^\/]+\/(\d+)/);
  if (peopleMatch) {
    return peopleMatch[1];
  }
  
  // Handle other Facebook URL formats
  const urlMatch = pageIdentifier.match(/facebook\.com\/[^\/]+\/(\d+)/);
  if (urlMatch) {
    return urlMatch[1];
  }
  
  // If it's already an ID, return it
  return pageIdentifier;
}

// Check if URLs match (comparing extracted IDs)
function urlsMatch(url1: string, url2: string): boolean {
  const id1 = extractPageId(url1);
  const id2 = extractPageId(url2);
  return id1 === id2;
}

// Check if a new session should be created
function shouldCreateNewSession(lastMessageTime: Date): boolean {
  const now = new Date();
  const timeDiff = now.getTime() - lastMessageTime.getTime();
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  return hoursDiff > SESSION_TIMEOUT_HOURS;
}

// Fetch user information from Facebook Graph API
async function fetchFacebookUserInfo(facebookId: string): Promise<{
  name: string;
  locale?: string;
  timezone?: number;
}> {
  try {
    const accessToken = process.env.NEXT_PUBLIC_FACEBOOK_PAGE_ACCESS_TOKEN;
    if (!accessToken) {
      return { name: 'Facebook User' };
    }

    // Fetch user information from Facebook Graph API
    const userInfoUrl = `https://graph.facebook.com/v18.0/${facebookId}?fields=first_name,last_name,locale,timezone&access_token=${accessToken}`;
    
    const response = await fetch(userInfoUrl);
    
    if (!response.ok) {
      return { name: 'Facebook User' };
    }

    const userData = await response.json();

    // Construct full name
    const firstName = userData.first_name || '';
    const lastName = userData.last_name || '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Facebook User';

    return {
      name: fullName,
      locale: userData.locale,
      timezone: userData.timezone
    };

  } catch (error) {
    console.error('Error fetching Facebook user info:', error);
    return { name: 'Facebook User' };
  }
}

// Extract country from Facebook locale
function extractCountryFromLocale(locale?: string): string {
  if (!locale) return 'Unknown';
  
  // Facebook locale format is usually language_COUNTRY (e.g., en_US, fr_FR, es_MX)
  const parts = locale.split('_');
  if (parts.length === 2) {
    const countryCode = parts[1];
    
    // Map common country codes to country names
    const countryMap: { [key: string]: string } = {
      // North America
      'US': 'United States',
      'CA': 'Canada',
      'MX': 'Mexico',
      'GT': 'Guatemala',
      'BZ': 'Belize',
      'SV': 'El Salvador',
      'HN': 'Honduras',
      'NI': 'Nicaragua',
      'CR': 'Costa Rica',
      'PA': 'Panama',
      'CU': 'Cuba',
      'JM': 'Jamaica',
      'HT': 'Haiti',
      'DO': 'Dominican Republic',
      'PR': 'Puerto Rico',
      'TT': 'Trinidad and Tobago',
      'BB': 'Barbados',
      
      // South America
      'BR': 'Brazil',
      'AR': 'Argentina',
      'CL': 'Chile',
      'PE': 'Peru',
      'CO': 'Colombia',
      'VE': 'Venezuela',
      'EC': 'Ecuador',
      'BO': 'Bolivia',
      'PY': 'Paraguay',
      'UY': 'Uruguay',
      'GY': 'Guyana',
      'SR': 'Suriname',
      'GF': 'French Guiana',
      
      // Europe
      'GB': 'United Kingdom',
      'IE': 'Ireland',
      'FR': 'France',
      'ES': 'Spain',
      'PT': 'Portugal',
      'IT': 'Italy',
      'DE': 'Germany',
      'AT': 'Austria',
      'CH': 'Switzerland',
      'NL': 'Netherlands',
      'BE': 'Belgium',
      'LU': 'Luxembourg',
      'DK': 'Denmark',
      'SE': 'Sweden',
      'NO': 'Norway',
      'FI': 'Finland',
      'IS': 'Iceland',
      'PL': 'Poland',
      'CZ': 'Czech Republic',
      'SK': 'Slovakia',
      'HU': 'Hungary',
      'RO': 'Romania',
      'BG': 'Bulgaria',
      'GR': 'Greece',
      'CY': 'Cyprus',
      'MT': 'Malta',
      'HR': 'Croatia',
      'SI': 'Slovenia',
      'BA': 'Bosnia and Herzegovina',
      'RS': 'Serbia',
      'ME': 'Montenegro',
      'MK': 'North Macedonia',
      'AL': 'Albania',
      'EE': 'Estonia',
      'LV': 'Latvia',
      'LT': 'Lithuania',
      'BY': 'Belarus',
      'UA': 'Ukraine',
      'MD': 'Moldova',
      'RU': 'Russia',
      
      // Asia
      'CN': 'China',
      'JP': 'Japan',
      'KR': 'South Korea',
      'KP': 'North Korea',
      'MN': 'Mongolia',
      'IN': 'India',
      'PK': 'Pakistan',
      'BD': 'Bangladesh',
      'LK': 'Sri Lanka',
      'NP': 'Nepal',
      'BT': 'Bhutan',
      'MV': 'Maldives',
      'MM': 'Myanmar',
      'TH': 'Thailand',
      'VN': 'Vietnam',
      'LA': 'Laos',
      'KH': 'Cambodia',
      'MY': 'Malaysia',
      'SG': 'Singapore',
      'ID': 'Indonesia',
      'PH': 'Philippines',
      'BN': 'Brunei',
      'TL': 'East Timor',
      'AF': 'Afghanistan',
      'IR': 'Iran',
      'IQ': 'Iraq',
      'SA': 'Saudi Arabia',
      'AE': 'United Arab Emirates',
      'QA': 'Qatar',
      'BH': 'Bahrain',
      'KW': 'Kuwait',
      'OM': 'Oman',
      'YE': 'Yemen',
      'JO': 'Jordan',
      'SY': 'Syria',
      'LB': 'Lebanon',
      'IL': 'Israel',
      'PS': 'Palestine',
      'TR': 'Turkey',
      'GE': 'Georgia',
      'AM': 'Armenia',
      'AZ': 'Azerbaijan',
      'KZ': 'Kazakhstan',
      'UZ': 'Uzbekistan',
      'TM': 'Turkmenistan',
      'KG': 'Kyrgyzstan',
      'TJ': 'Tajikistan',
      
      // Africa
      'EG': 'Egypt',
      'LY': 'Libya',
      'TN': 'Tunisia',
      'DZ': 'Algeria',
      'MA': 'Morocco',
      'SD': 'Sudan',
      'SS': 'South Sudan',
      'ET': 'Ethiopia',
      'ER': 'Eritrea',
      'DJ': 'Djibouti',
      'SO': 'Somalia',
      'KE': 'Kenya',
      'UG': 'Uganda',
      'TZ': 'Tanzania',
      'RW': 'Rwanda',
      'BI': 'Burundi',
      'ZA': 'South Africa',
      'NA': 'Namibia',
      'BW': 'Botswana',
      'ZW': 'Zimbabwe',
      'ZM': 'Zambia',
      'MW': 'Malawi',
      'MZ': 'Mozambique',
      'SZ': 'Eswatini',
      'LS': 'Lesotho',
      'MG': 'Madagascar',
      'MU': 'Mauritius',
      'SC': 'Seychelles',
      'AO': 'Angola',
      'CD': 'Democratic Republic of Congo',
      'CG': 'Republic of Congo',
      'CF': 'Central African Republic',
      'TD': 'Chad',
      'CM': 'Cameroon',
      'GQ': 'Equatorial Guinea',
      'GA': 'Gabon',
      'ST': 'São Tomé and Príncipe',
      'NG': 'Nigeria',
      'NE': 'Niger',
      'BF': 'Burkina Faso',
      'ML': 'Mali',
      'SN': 'Senegal',
      'MR': 'Mauritania',
      'GN': 'Guinea',
      'GW': 'Guinea-Bissau',
      'SL': 'Sierra Leone',
      'LR': 'Liberia',
      'CI': 'Ivory Coast',
      'GH': 'Ghana',
      'TG': 'Togo',
      'BJ': 'Benin',
      
      // Oceania
      'AU': 'Australia',
      'NZ': 'New Zealand',
      'PG': 'Papua New Guinea',
      'FJ': 'Fiji',
      'SB': 'Solomon Islands',
      'VU': 'Vanuatu',
      'NC': 'New Caledonia',
      'PF': 'French Polynesia',
      'WS': 'Samoa',
      'TO': 'Tonga',
      'KI': 'Kiribati',
      'TV': 'Tuvalu',
      'NR': 'Nauru',
      'PW': 'Palau',
      'FM': 'Micronesia',
      'MH': 'Marshall Islands'
    };
    
    return countryMap[countryCode] || countryCode;
  }
  
  return 'Unknown';
}

// Create a new profile for Facebook user with enhanced user information
async function createNewProfile(facebookId: string, fallbackName: string = 'Facebook User'): Promise<Profile> {
  // Fetch user information from Facebook
  const userInfo = await fetchFacebookUserInfo(facebookId);
  const country = extractCountryFromLocale(userInfo.locale);

  const newProfile = new ProfileModel({
    name: userInfo.name || fallbackName,
    phone: `facebook:${facebookId}`, // Use Facebook ID as identifier
    country: country,
    socialID: facebookId, // Store Facebook ID in single socialID field
    chatSessions: [],
    metadata: {
      facebookLocale: userInfo.locale,
      facebookTimezone: userInfo.timezone,
      createdAt: new Date(),
      platform: 'Facebook Messenger'
    }
  });
  
  return await newProfile.save();
}

// Create a new analysis
async function createNewAnalysis(profileId: string): Promise<Analysis> {
  const newAnalysis = new AnalysisModel({
    subjectID: profileId,
    completeAnalysis: {},
  });
  
  return await newAnalysis.save();
}

// Create a new chat session
async function createNewChatSession(
  profileId: string, 
  agentId: string, 
  userMessage: string, 
  agentResponse: string,
  mediaInfo?: MediaInfo
): Promise<ChatSession> {
  const messages: Message[] = [
    {
      timestamp: new Date(),
      role: 'user',
      contentType: mediaInfo ? (
        SUPPORTED_IMAGE_TYPES.includes(mediaInfo.contentType) ? 'image' :
        SUPPORTED_VIDEO_TYPES.includes(mediaInfo.contentType) ? 'video' :
        SUPPORTED_AUDIO_TYPES.includes(mediaInfo.contentType) ? 'audio' : 'text'
      ) : 'text',
      content: mediaInfo ? `${userMessage}\n[Media: ${mediaInfo.url}]` : userMessage,
    },
    {
      timestamp: new Date(),
      role: 'agent',
      contentType: 'text',
      content: agentResponse,
    },
  ];

  const newChatSession = new ChatSessionModel({
    subjectID: profileId,
    assignedAgentID: agentId,
    agentPlatform: 'Facebook',
    agentPlatformID: agentId, // Use agent ID as platform ID
    language: 'auto',
    sessionDate: new Date(),
    messages,
    metadata: {
      location: 'Unknown',
      device: 'Facebook Messenger',
      confidence: 0.95,
    },
    sessionID: `facebook_${profileId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  });

  return await newChatSession.save();
}

// Update existing chat session
async function updateChatSession(
  sessionId: string, 
  userMessage: string, 
  agentResponse: string,
  mediaInfo?: MediaInfo
): Promise<void> {
  const newMessages: Message[] = [
    {
      timestamp: new Date(),
      role: 'user',
      contentType: mediaInfo ? (
        SUPPORTED_IMAGE_TYPES.includes(mediaInfo.contentType) ? 'image' :
        SUPPORTED_VIDEO_TYPES.includes(mediaInfo.contentType) ? 'video' :
        SUPPORTED_AUDIO_TYPES.includes(mediaInfo.contentType) ? 'audio' : 'text'
      ) : 'text',
      content: mediaInfo ? `${userMessage}\n[Media: ${mediaInfo.url}]` : userMessage,
    },
    {
      timestamp: new Date(),
      role: 'agent',
      contentType: 'text',
      content: agentResponse,
    },
  ];

  await ChatSessionModel.findByIdAndUpdate(
    sessionId,
    { $push: { messages: { $each: newMessages } } }
  );
}

// Message deduplication cache to prevent processing the same message multiple times
const processedMessages = new Set<string>();

// Rate limiting - track recent messages per user
const userMessageTimestamps = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 5000; // 5 seconds
const MAX_MESSAGES_PER_WINDOW = 3;

// Clean up old processed messages every 10 minutes
setInterval(() => {
  processedMessages.clear();
  userMessageTimestamps.clear();
}, 10 * 60 * 1000);

// Facebook webhook verification (GET request)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const verifyToken = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Use server-side only environment variable (remove NEXT_PUBLIC_)
  const expectedToken = process.env.NEXT_PUBLIC_FACEBOOK_VERIFY_TOKEN;
  // Debug logging for CloudWatch (using console.error to ensure visibility)
  console.log('Facebook webhook verification attempt:');
  console.log('- Mode:', mode);
  console.log('- Received verify token:', verifyToken);
  console.log('- Expected verify token:', expectedToken);
  console.log('- Challenge:', challenge);
  console.log('- Tokens match:', verifyToken === expectedToken);
  console.log('- Expected token exists:', !!expectedToken);
  console.log('- Received token exists:', !!verifyToken);

  // Check if mode and token are valid
  if (mode === 'subscribe' && verifyToken === expectedToken) {
    console.log('Verification successful - returning challenge');
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  console.error('Verification failed - token mismatch');
  return new NextResponse(`Verification token mismatch, Received Token = ${verifyToken}`, {
    status: 403,
    headers: { 'Content-Type': 'text/plain' },
  });
}

// Facebook webhook message handling (POST request)
export async function POST(request: NextRequest) {
  let body: string = '';
  let payload: FacebookWebhookPayload | null = null;
  
  try {
    // Parse the incoming webhook data
    body = await request.text();
    payload = JSON.parse(body);
    
    // Validate payload exists
    if (!payload) {
      console.error('Invalid payload received');
      return new NextResponse('Invalid payload', {
        status: 400,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
    
    // Validate Facebook webhook signature for security (in production)
    if (process.env.NODE_ENV === 'production') {
      const isValidSignature = validateFacebookSignature(request, body);
      if (!isValidSignature) {
        console.error('Invalid Facebook webhook signature');
        return new NextResponse('Unauthorized', {
          status: 401,
          headers: { 'Content-Type': 'text/plain' },
        });
      }
    }

    // Connect to database with error handling
    try {
      await dbConnect();
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return new NextResponse('Database connection failed', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Process messages synchronously but with improved deduplication
    await processWebhookMessages(payload);

    // Return success response
    return new NextResponse('EVENT_RECEIVED', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });

  } catch (error: unknown) {
    console.error('Error processing Facebook webhook:', error);

    // Try to send error message to user if possible
    if (payload && payload.entry && payload.entry.length > 0 && payload.entry[0].messaging && payload.entry[0].messaging.length > 0) {
      const senderId = payload.entry[0].messaging[0].sender.id;
      await sendFacebookMessage(senderId, getRandomResponse(GENERAL_ERROR_RESPONSES));
    }
    
    // Return error response
    return new NextResponse('Internal Server Error', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

// Process webhook messages
async function processWebhookMessages(payload: FacebookWebhookPayload) {
  try {
    for (const entry of payload.entry || []) {
      const pageId = entry.id; // This is the Facebook Page ID
      
      // Process each messaging event
      for (const event of entry.messaging || []) {
        const senderId = event.sender.id; // Facebook User ID
        const recipientId = event.recipient.id; // Should be the Page ID
        const messageData = event.message;
        
        if (!messageData) continue; // Skip non-message events

        // Check if this message has already been processed (deduplication)
        const messageId = messageData.mid;
        if (processedMessages.has(messageId)) {
          continue;
        }
        processedMessages.add(messageId);

        // Rate limiting check
        const now = Date.now();
        const userTimestamps = userMessageTimestamps.get(senderId) || [];
        const recentMessages = userTimestamps.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
        
        if (recentMessages.length >= MAX_MESSAGES_PER_WINDOW) {
          continue;
        }
        
        // Update user timestamps
        recentMessages.push(now);
        userMessageTimestamps.set(senderId, recentMessages);

        // Find the agent by Facebook Page ID using socialID field
        let agent = await AgentModel.findOne({ socialID: pageId });
        
        if (!agent) {
          // Try to find by URL matching - get all agents and compare URLs
          const allAgents = await AgentModel.find({ socialID: { $exists: true, $ne: null } });
          for (const candidateAgent of allAgents) {
            if (candidateAgent.socialID && urlsMatch(candidateAgent.socialID, pageId)) {
              agent = candidateAgent;
              break;
            }
          }
        }
        
        if (!agent) {
          // Try with recipient ID as well
          const allAgents = await AgentModel.find({ socialID: { $exists: true, $ne: null } });
          for (const candidateAgent of allAgents) {
            if (candidateAgent.socialID && urlsMatch(candidateAgent.socialID, recipientId)) {
              agent = candidateAgent;
              break;
            }
          }
        }
        
        if (!agent) {
          continue;
        }

        // Check if the agent is active
        if (!agent.activeStatus) {
          await sendFacebookMessage(senderId, 'Not Available... Talk Later');
          continue;
        }

        // Extract message content and media
        const messageText = messageData.text || '';
        let messageContent = messageText;
        let mediaInfo: MediaInfo | null = null;
        
        // Handle media attachments
        if (messageData.attachments && messageData.attachments.length > 0) {
          for (const attachment of messageData.attachments) {
            if (attachment.payload?.url) {
              // Determine content type based on attachment type
              let contentType = '';
              switch (attachment.type) {
                case 'image':
                  contentType = 'image/jpeg'; // Default for Facebook images
                  break;
                case 'video':
                  contentType = 'video/mp4'; // Default for Facebook videos
                  break;
                case 'audio':
                  contentType = 'audio/mpeg'; // Default for Facebook audio
                  break;
                case 'file':
                  contentType = 'application/octet-stream'; // Generic file type
                  break;
              }

              // Process the media
              const mediaResult = await processMediaMessage(attachment.payload.url, contentType);
              
              if (mediaResult.success && mediaResult.data) {
                mediaInfo = {
                  url: attachment.payload.url,
                  contentType,
                  size: mediaResult.size || 0,
                  data: mediaResult.base64,
                  buffer: mediaResult.data,
                };
                
                // Update message content
                if (!messageText) {
                  messageContent = `[${attachment.type} file shared]`;
                }
              } else {
                await sendFacebookMessage(senderId, getRandomResponse(MEDIA_ERROR_RESPONSES));
                continue;
              }
              
              break; // Process only the first attachment for now
            }
          }
        }

        // Skip if no text and no processable media
        if (!messageContent.trim() && !mediaInfo) {
          continue;
        }

        // Check if profile exists (using Facebook ID as identifier)
        let profile = await ProfileModel.findOne({ 
          $or: [
            { phone: `facebook:${senderId}` },
            { socialID: senderId }
          ]
        });
        let isNewProfile = false;
        
        if (!profile) {
          // Create new profile
          profile = await createNewProfile(senderId, 'Facebook User');
          isNewProfile = true;
          
          // Create new analysis
          const analysis = await createNewAnalysis(profile._id!.toString());
          
          // Update profile with analysis ID
          profile.analysis = analysis._id;
          profile.assignedAgentID = agent._id;
          await profile.save();
        }

        // Generate AI response with enhanced context and conversation history
        const modelConfig = getModelId(agent.aiModel);
        let contextualPrompt = agent.prompt || 'You are a helpful AI assistant.';
        
        // Add media context to prompt if present
        if (mediaInfo) {
          if (SUPPORTED_IMAGE_TYPES.includes(mediaInfo.contentType)) {
            contextualPrompt += '\n\nThe user has shared an image. Please analyze and respond to both the text and visual content.';
          } else if (SUPPORTED_AUDIO_TYPES.includes(mediaInfo.contentType)) {
            contextualPrompt += '\n\nThe user has shared an audio message. The audio has been transcribed for you.';
          } else if (SUPPORTED_VIDEO_TYPES.includes(mediaInfo.contentType)) {
            contextualPrompt += '\n\nThe user has shared a video. Please acknowledge the video content in your response.';
          }
        }
        
        // Get conversation history for context
        let conversationHistory: Message[] = [];
        if (!isNewProfile && profile.chatSessions && profile.chatSessions.length > 0) {
          const lastSessionId = profile.chatSessions[profile.chatSessions.length - 1];
          const lastSession = await ChatSessionModel.findById(lastSessionId);
          if (lastSession) {
            conversationHistory = lastSession.messages || [];
          }
        }
        
        const aiResponse = await generateBedrockResponse(
          contextualPrompt,
          messageContent,
          modelConfig,
          conversationHistory,
          mediaInfo || undefined
        );

        // Add natural typing pattern
        await addTypingPattern();

        // Enhanced response selection with contextual awareness
        const messageType = detectMessageType(messageContent);
        const contextualResponse = getContextualResponse(messageType);
        
        let finalResponse: string;
        
        // Use contextual response if available (5% chance)
        if (contextualResponse) {
          finalResponse = contextualResponse;
        }
        else if (shouldUseRandomResponse() && messageContent.length < 20) {
          finalResponse = getRandomResponse(QUICK_RESPONSES);
        }
        else if (Math.random() < 0.06 && aiResponse.length > 100) {
          // 6% chance for short response to long AI response
          finalResponse = getRandomResponse(FALLBACK_RESPONSES);
        }
        else if (Math.random() < 0.15) {
          // 15% chance to casualize the AI response
          finalResponse = casualizeResponse(aiResponse);
        }
        else {
          finalResponse = aiResponse;
        }
        
        // Apply time-based variations if not using quick/contextual responses
        if (!contextualResponse && !(shouldUseRandomResponse() && messageContent.length < 20)) {
          finalResponse = addTimeBasedVariation(finalResponse);
        }

        // Handle chat sessions with enhanced message storage
        let shouldCreateNew = true;
        let existingSession = null;

        if (!isNewProfile && profile.chatSessions && profile.chatSessions.length > 0) {
          const lastSessionId = profile.chatSessions[profile.chatSessions.length - 1];
          existingSession = await ChatSessionModel.findById(lastSessionId);
          
          if (existingSession && existingSession.messages.length > 0) {
            const lastMessage = existingSession.messages[existingSession.messages.length - 1];
            shouldCreateNew = shouldCreateNewSession(lastMessage.timestamp);
          }
        }

        if (shouldCreateNew) {
          const newSession = await createNewChatSession(
            profile._id!.toString(),
            agent._id!.toString(),
            messageContent,
            finalResponse,
            mediaInfo || undefined
          );
          
          // Add session to profile
          profile.chatSessions.push(newSession._id!);
          await profile.save();
        } else if (existingSession) {
          await updateChatSession(
            existingSession._id!.toString(),
            messageContent,
            finalResponse,
            mediaInfo || undefined
          );
        }

        // Send response via Facebook Messenger
        const messageSent = await sendFacebookMessage(senderId, finalResponse);
        
        if (!messageSent) {
          console.error('Failed to send Facebook message');
        }
      }
    }

  } catch (error: unknown) {
    console.error('Error processing Facebook webhook:', error);
  }
}
