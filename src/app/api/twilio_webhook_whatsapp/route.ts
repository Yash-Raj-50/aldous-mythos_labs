import { NextRequest, NextResponse } from 'next/server';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand } from '@aws-sdk/client-transcribe';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { RekognitionClient, DetectLabelsCommand, DetectTextCommand } from '@aws-sdk/client-rekognition';
import twilio from 'twilio';
import dbConnect from '@/lib/dbConnect';
import { AgentModel, ProfileModel, AnalysisModel, ChatSessionModel } from '@/models/databaseSchemas';
import { Profile, Analysis, ChatSession, Message } from '@/types/databaseTypes';
import { getCountryNameFromPhone } from '@/utils/phoneCountryUtils';
import { deleteFileFromS3 } from '@/services/s3Service';

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

// Initialize Twilio client lazily to avoid build-time errors
function getTwilioClient() {
  return twilio(
    process.env.NEXT_PUBLIC_TWILIO_ACCOUNT_SID!,
    process.env.NEXT_PUBLIC_TWILIO_AUTH_TOKEN!
  );
}

// Media handling constants
const MAX_MEDIA_SIZE_MB = 8; // 8MB limit for WhatsApp media
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const SUPPORTED_AUDIO_TYPES = ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/mp4'];
const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/3gpp', 'video/quicktime'];
const SUPPORTED_DOCUMENT_TYPES = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

// Default values
const DEFAULT_PHONE_NUMBER = '+12766639185';
const CLAUDE_SONNET_4_INFERENCE_PROFILE = 'arn:aws:bedrock:us-east-1:544718082615:inference-profile/us.anthropic.claude-sonnet-4-20250514-v1:0';
const FALLBACK_MODEL_ID = 'anthropic.claude-3-sonnet-20240229-v1:0'; // Fallback to Claude 3 Sonnet
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
  return Math.random() < 0.03; // Reduced to 3% chance (was 5%)
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
  // Reduced to 5% chance to use contextual response (was 10%)
  if (Math.random() > 0.05) return null;
  
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
  // Random chance for multiple short delays (like stopping and starting to type)
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

// Model mapping with inference profile for Claude Sonnet 4
const getModelId = (aiModel: string): { modelId: string; useInferenceProfile: boolean } => {
  switch (aiModel) {
    case 'gpt-4o':
      return { modelId: 'gpt-4o', useInferenceProfile: false }; // Note: This would need OpenAI integration
    case 'gpt-o1':
      return { modelId: 'gpt-o1', useInferenceProfile: false }; // Note: This would need OpenAI integration
    case 'claude-3.7-sonnet':
    case 'claude-3.5-sonnet':
    case 'claude-sonnet-4': // Use Claude Sonnet 4 inference profile
      return { modelId: CLAUDE_SONNET_4_INFERENCE_PROFILE, useInferenceProfile: true };
    case 'claude-3-haiku':
      return { modelId: 'anthropic.claude-3-haiku-20240307-v1:0', useInferenceProfile: false };
    default:
      return { modelId: CLAUDE_SONNET_4_INFERENCE_PROFILE, useInferenceProfile: true }; // Default to Claude Sonnet 4 inference profile
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
    s3Key = key; // Store key for cleanup
    
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
    
    // Poll for completion (simplified - in production, use SQS/SNS)
    let completed = false;
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max wait
    let transcriptResult: string | null = null;
    
    while (!completed && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const result = await transcribeClient.send(new GetTranscriptionJobCommand({
        TranscriptionJobName: jobName,
      }));
      
      if (result.TranscriptionJob?.TranscriptionJobStatus === 'COMPLETED') {
        const transcriptUri = result.TranscriptionJob.Transcript?.TranscriptFileUri;
        if (transcriptUri) {
          const response = await fetch(transcriptUri);
          const data = await response.json();
          transcriptResult = data.results?.transcripts?.[0]?.transcript || null;
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
    // Clean up S3 file regardless of success or failure
    if (s3Key) {
      try {
        const deleteResult = await deleteFileFromS3(s3Key);
        if (deleteResult.success) {
          console.log(`Successfully cleaned up S3 file: ${s3Key}`);
        } else {
          console.warn(`Failed to clean up S3 file ${s3Key}:`, deleteResult.error);
        }
      } catch (cleanupError) {
        console.warn(`Error during S3 cleanup for ${s3Key}:`, cleanupError);
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
  mediaInfo?: {
    url: string;
    contentType: string;
    size: number;
    data?: string;
    buffer?: Buffer;
  }
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

    // Add conversation history (last 10 messages for context, but not too much)
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
        // For images, use Claude's vision capabilities with enhanced analysis
        let imagePrompt = userMessage || "I've sent you an image. Please analyze what you see and provide a thoughtful response about the content, context, or any questions I might have about this image.";
        
        // Add Rekognition analysis for additional context
        if (mediaInfo.buffer) {
          const rekognitionAnalysis = await analyzeImageWithRekognition(mediaInfo.buffer);
          imagePrompt += ` [Additional context from automated analysis: ${rekognitionAnalysis}]`;
        }
        
        if (mediaInfo.data) {
          // Use Claude's multimodal capabilities
          currentMessageContent = [
            {
              type: "text",
              text: imagePrompt
            },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaInfo.contentType,
                data: mediaInfo.data
              }
            }
          ];
        } else {
          currentMessageContent = imagePrompt;
        }
      } else if (SUPPORTED_AUDIO_TYPES.includes(mediaInfo.contentType)) {
        // For audio files, transcribe using AWS Transcribe
        let audioTranscript = null;
        if (mediaInfo.buffer) {
          console.log('Attempting to transcribe audio...');
          audioTranscript = await transcribeAudio(mediaInfo.buffer, mediaInfo.contentType);
        }
        
        if (audioTranscript) {
          const audioPrompt = userMessage 
            ? `${userMessage} [I also sent an audio message that says: "${audioTranscript}"]`
            : `I sent you an audio message that says: "${audioTranscript}". Please respond to what I said in the audio.`;
          currentMessageContent = audioPrompt;
        } else {
          // Fallback if transcription fails
          const audioPrompt = userMessage 
            ? `${userMessage} [Note: I also sent an audio file (${mediaInfo.contentType}, ${(mediaInfo.size / 1024).toFixed(1)}KB) but it couldn't be processed. Please respond to my text message.]`
            : `I sent you an audio message (${mediaInfo.contentType}, ${(mediaInfo.size / 1024).toFixed(1)}KB). The audio couldn't be processed, but please acknowledge that you received it and ask me to describe what I said if you'd like to help.`;
          currentMessageContent = audioPrompt;
        }
      } else if (SUPPORTED_VIDEO_TYPES.includes(mediaInfo.contentType)) {
        // Skip video files as requested - just acknowledge
        const videoPrompt = userMessage 
          ? `${userMessage} [Note: I also sent a video file, but I'm skipping video processing as requested.]`
          : `I sent you a video file. I'm currently not processing videos, but if you describe what's in the video or what you'd like help with regarding it, I'd be happy to assist.`;
        currentMessageContent = videoPrompt;
      } else {
        // For other file types, provide context
        const filePrompt = userMessage 
          ? `${userMessage} [Note: I also sent a file (${mediaInfo.contentType}, ${(mediaInfo.size / 1024).toFixed(1)}KB). Please respond to my text message and let me know if you need me to describe the file content.]`
          : `I sent you a file (${mediaInfo.contentType}, ${(mediaInfo.size / 1024).toFixed(1)}KB). Please let me know what you'd like to do with this file or if you need me to describe its content.`;
        currentMessageContent = filePrompt;
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
    
    // Ensure messages alternate properly - if we have multiple user messages, combine them
    const processedMessages = [];
    let lastRole = '';
    let combinedContent: string | Array<{type: string; text?: string; source?: {type: string; media_type: string; data: string}}> = '';
    
    for (const msg of messages) {
      if (msg.role === lastRole) {
        // Same role as previous, combine the content
        if (typeof combinedContent === 'string' && typeof msg.content === 'string') {
          combinedContent += '\n' + msg.content;
        } else {
          // For multimodal content, keep the latest message structure
          combinedContent = msg.content;
        }
      } else {
        // Different role, push previous message if exists and start new one
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
        system: prompt, // Use proper system message format for Claude
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
        console.warn('Claude Sonnet 4 inference profile failed, falling back to Claude 3:', inferenceError);
        
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
        const fallbackBody = JSON.parse(new TextDecoder().decode(fallbackResponse.body));
        return fallbackBody.content[0].text || getRandomResponse(FALLBACK_RESPONSES);
      }
      throw inferenceError; // Re-throw if not using inference profile
    }
  } catch (error) {
    console.error('Error generating Bedrock response:', error);
    return getRandomResponse(ERROR_RESPONSES);
  }
}

// Extract phone number from WhatsApp format
function extractPhoneNumber(whatsappNumber: string): string {
  // WhatsApp numbers come in format "whatsapp:+1234567890"
  return whatsappNumber.replace('whatsapp:', '');
}

// Validate Twilio webhook signature for security
function validateTwilioSignature(request: NextRequest, body: string): boolean {
  try {
    const signature = request.headers.get('x-twilio-signature');
    if (!signature) {
      console.warn('No Twilio signature header found');
      return false;
    }

    // Handle AWS Amplify URL construction
    const host = request.headers.get('host');
    const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
    const originalUrl = request.headers.get('x-forwarded-uri') || '/api/twilio_webhook_whatsapp';
    
    let url: string;
    if (host && !host.includes('localhost')) {
      // For AWS Amplify deployment, construct the correct URL
      url = `${forwardedProto}://${host}${originalUrl}`;
    } else {
      // For local development, use the request URL
      url = request.url;
    }
    
    console.log('Signature validation URL:', url);
    console.log('Request headers:', {
      host: request.headers.get('host'),
      'x-forwarded-proto': request.headers.get('x-forwarded-proto'),
      'x-forwarded-uri': request.headers.get('x-forwarded-uri'),
      'x-twilio-signature': signature
    });
    
    const authToken = process.env.NEXT_PUBLIC_TWILIO_AUTH_TOKEN!;
    
    // Convert URLSearchParams body to object for validation
    const params = new URLSearchParams(body);
    const bodyObject: Record<string, string> = {};
    for (const [key, value] of params.entries()) {
      bodyObject[key] = value;
    }
    
    const isValid = twilio.validateRequest(authToken, signature, url, bodyObject);
    console.log('Signature validation result:', isValid);
    
    return isValid;
  } catch (error) {
    console.error('Error validating Twilio signature:', error);
    return false;
  }
}

// Download and process media from Twilio with enhanced support
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

    // Download media using authenticated fetch
    const media = await fetch(mediaUrl, {
      headers: {
        'Authorization': `Basic ${Buffer.from(
          `${process.env.NEXT_PUBLIC_TWILIO_ACCOUNT_SID}:${process.env.NEXT_PUBLIC_TWILIO_AUTH_TOKEN}`
        ).toString('base64')}`
      }
    });

    if (!media.ok) {
      return {
        success: false,
        error: 'Failed to download media from Twilio'
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
      error: 'Failed to process media'
    };
  }
}

// Send WhatsApp message via Twilio
async function sendWhatsAppMessage(to: string, message: string): Promise<boolean> {
  try {
    // Check if Twilio credentials are configured
    if (!process.env.NEXT_PUBLIC_TWILIO_ACCOUNT_SID || 
        !process.env.NEXT_PUBLIC_TWILIO_AUTH_TOKEN ||
        process.env.NEXT_PUBLIC_TWILIO_ACCOUNT_SID.includes('your_') ||
        process.env.NEXT_PUBLIC_TWILIO_AUTH_TOKEN.includes('your_')) {
      console.warn('Twilio credentials not configured, message would be sent to:', to);
      console.log('Message content:', message);
      return true; // Return true in development mode
    }

    const client = getTwilioClient();
    await client.messages.create({
      from: 'whatsapp:' + DEFAULT_PHONE_NUMBER,
      to: 'whatsapp:' + to,
      body: message
    });
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
}

// Check if a new session should be created
function shouldCreateNewSession(lastMessageTime: Date): boolean {
  const now = new Date();
  const timeDiff = now.getTime() - lastMessageTime.getTime();
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  return hoursDiff > SESSION_TIMEOUT_HOURS;
}

// Create a new profile
async function createNewProfile(phone: string, name: string): Promise<Profile> {
  const country = getCountryNameFromPhone(phone);

  const newProfile = new ProfileModel({
    name: name || 'Unknown User',
    phone,
    country,
    socialIDs: [],
    chatSessions: [],
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
  mediaInfo?: {
    url: string;
    contentType: string;
    size: number;
    data?: string;
  }
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
    agentPlatform: 'WhatsApp',
    agentPlatformID: DEFAULT_PHONE_NUMBER,
    language: 'auto', // Will be detected from message content
    sessionDate: new Date(),
    messages,
    metadata: {
      location: 'Unknown',
      device: 'WhatsApp',
      confidence: 0.95,
    },
    // Ensure unique sessionID to avoid duplicate key error
    sessionID: `whatsapp_${profileId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  });

  return await newChatSession.save();
}

// Update existing chat session
async function updateChatSession(
  sessionId: string, 
  userMessage: string, 
  agentResponse: string,
  mediaInfo?: {
    url: string;
    contentType: string;
    size: number;
    data?: string;
  }
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

export async function POST(request: NextRequest) {
  let body: string = '';
  let params: URLSearchParams | null = null;
  
  try {
    // Parse the incoming webhook data first
    body = await request.text();
    params = new URLSearchParams(body);
    
    // Validate Twilio webhook signature for security (in production)
    if (process.env.NODE_ENV === 'production') {
      const isValidSignature = validateTwilioSignature(request, body);
      if (!isValidSignature) {
        console.error('Invalid Twilio webhook signature');
        return new NextResponse('Forbidden', { status: 403 });
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

    // Extract message data from Twilio webhook
    const fromNumber = extractPhoneNumber(params?.get('From') || '');
    const toNumber = extractPhoneNumber(params?.get('To') || DEFAULT_PHONE_NUMBER);
    const messageBody = params?.get('Body') || '';
    const profileName = params?.get('ProfileName') || 'Unknown User';

    // Enhanced media handling with video file skipping
    const numMedia = parseInt(params?.get('NumMedia') || '0');
    let messageContent = messageBody;
    let mediaInfo: MediaInfo | null = null;
    
    if (numMedia > 0) {
      const mediaUrl = params?.get('MediaUrl0');
      const contentType = params?.get('MediaContentType0');
      
      if (mediaUrl && contentType) {
        // Skip video files as requested
        if (SUPPORTED_VIDEO_TYPES.includes(contentType)) {
          const videoSkipMessage = getRandomResponse([
            "can't handle videos right now",
            "video files are too much for me atm",
            "skip videos for now",
            "not doing videos today",
            "videos are a no-go rn"
          ]);
          await sendWhatsAppMessage(fromNumber, videoSkipMessage);
          
          return new NextResponse('Video file skipped', {
            status: 200,
            headers: { 'Content-Type': 'text/plain' },
          });
        }
        
        // Process media with size limits and validation for supported types
        const mediaResult = await processMediaMessage(mediaUrl, contentType);
        
        if (mediaResult.success && mediaResult.size !== undefined) {
          mediaInfo = {
            url: mediaUrl,
            contentType,
            size: mediaResult.size,
            data: mediaResult.base64, // Use base64 for images with Claude
            buffer: mediaResult.data  // Keep buffer for AWS services
          };
          
          // Generate appropriate content description based on media type
          if (SUPPORTED_IMAGE_TYPES.includes(contentType)) {
            messageContent = messageBody || '[Image received]';
          } else if (SUPPORTED_AUDIO_TYPES.includes(contentType)) {
            messageContent = messageBody || '[Audio message received]';
          } else if (SUPPORTED_DOCUMENT_TYPES.includes(contentType)) {
            messageContent = messageBody || '[Document received]';
          }
        } else {
          // Media processing failed, inform user
          const errorMessage = getRandomResponse(MEDIA_ERROR_RESPONSES);
          await sendWhatsAppMessage(fromNumber, errorMessage);
          
          return new NextResponse('Media processing error handled', {
            status: 200,
            headers: { 'Content-Type': 'text/plain' },
          });
        }
      }
    }

    // Find the agent by phone number (the number the user messaged)
    let agent = await AgentModel.findOne({ phone: toNumber });
    
    if (!agent) {
      // Use default agent if no specific agent found
      agent = await AgentModel.findOne({ phone: DEFAULT_PHONE_NUMBER });
      if (!agent) {
        // Create a default agent if none exists
        agent = new AgentModel({
          name: 'Default Agent',
          aiModel: 'claude-sonnet-4', // Use the default model as specified in instructions
          prompt: 'You are a helpful AI assistant. Respond to user messages in a friendly and professional manner.',
          phone: DEFAULT_PHONE_NUMBER,
          activeStatus: true,
          profiles: [],
        });
        await agent.save();
      }
    }

    // Check if the agent is active
    if (!agent.activeStatus) {
      // Agent is inactive, send the unavailable message
      await sendWhatsAppMessage(fromNumber, 'Not Available... Talk Later');
      
      return new NextResponse('', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Check if profile exists
    let profile = await ProfileModel.findOne({ phone: fromNumber });
    let isNewProfile = false;
    
    if (!profile) {
      // Create new profile
      profile = await createNewProfile(fromNumber, profileName);
      isNewProfile = true;
      
      // Create new analysis
      const analysis = await createNewAnalysis(profile._id!.toString());
      
      // Update profile with analysis ID
      profile.analysis = analysis._id;
      profile.assignedAgentID = agent._id;
      await profile.save();
      
      // Add profile to agent's profiles array
      await AgentModel.findByIdAndUpdate(
        agent._id,
        { $push: { profiles: profile._id } }
      );
    }

    // Generate AI response with enhanced context and conversation history
    const modelConfig = getModelId(agent.aiModel);
    let contextualPrompt = agent.prompt || 'You are a helpful AI assistant.';
    
    // Add media context to prompt if present
    if (mediaInfo) {
      if (SUPPORTED_IMAGE_TYPES.includes(mediaInfo.contentType)) {
        contextualPrompt += `\n\nNote: The user has sent an image (${mediaInfo.contentType}). Use your vision capabilities to analyze the image and provide relevant insights or answers about what you see.`;
      } else if (SUPPORTED_AUDIO_TYPES.includes(mediaInfo.contentType)) {
        contextualPrompt += `\n\nNote: The user has sent an audio file (${mediaInfo.contentType}). While you cannot directly process audio, acknowledge receipt and respond helpfully to any accompanying text or ask for clarification about the audio content.`;
      } else {
        contextualPrompt += `\n\nNote: The user has sent a file (${mediaInfo.contentType}). Respond appropriately to any accompanying text and offer assistance with the file if relevant.`;
      }
    }
    
    // Get conversation history for context
    let conversationHistory: Message[] = [];
    if (!isNewProfile && profile.chatSessions && profile.chatSessions.length > 0) {
      const lastSessionId = profile.chatSessions[profile.chatSessions.length - 1];
      const lastSession = await ChatSessionModel.findById(lastSessionId);
      if (lastSession && lastSession.messages) {
        conversationHistory = lastSession.messages;
      }
    }
    
    const aiResponse = await generateBedrockResponse(
      contextualPrompt,
      messageContent,
      modelConfig,
      conversationHistory,
      mediaInfo || undefined // Pass media info for direct Bedrock processing
    );

    // Add natural typing pattern instead of simple delay
    await addTypingPattern();

    // Enhanced response selection with contextual awareness
    const messageType = detectMessageType(messageContent);
    const contextualResponse = getContextualResponse(messageType);
    
    let finalResponse: string;
    
    // Use contextual response if available (5% chance)
    if (contextualResponse) {
      finalResponse = contextualResponse;
    }
    // Use quick responses for very short messages (3% chance on short messages)
    else if (shouldUseRandomResponse() && messageContent.length < 20) {
      finalResponse = getRandomResponse(QUICK_RESPONSES);
    }
    // Add slight chance for AI response to be truncated with a casual ending (6% chance)
    else if (Math.random() < 0.06 && aiResponse.length > 100) {
      const sentences = aiResponse.split(/[.!?]+/).filter(s => s.trim().length > 0);
      if (sentences.length > 1) {
        finalResponse = sentences[0].trim() + '... ' + getRandomResponse(['anyway', 'but yeah', 'you know']);
      } else {
        finalResponse = casualizeResponse(aiResponse);
      }
    }
    // Occasionally casualize the AI response (15% chance, reduced from 20%)
    else if (Math.random() < 0.15) {
      finalResponse = casualizeResponse(aiResponse);
    }
    // Use the AI response as-is (71% chance - majority of responses!)
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
      // Get the most recent chat session
      const lastSessionId = profile.chatSessions[profile.chatSessions.length - 1];
      existingSession = await ChatSessionModel.findById(lastSessionId);
      
      if (existingSession && existingSession.messages.length > 0) {
        const lastMessage = existingSession.messages[existingSession.messages.length - 1];
        shouldCreateNew = shouldCreateNewSession(lastMessage.timestamp);
      }
    }

    if (shouldCreateNew) {
      // Create new chat session with media support
      const newSession = await createNewChatSession(
        profile._id!.toString(),
        agent._id!.toString(),
        messageContent,
        finalResponse,
        mediaInfo || undefined
      );
      
      // Update profile with new session
      await ProfileModel.findByIdAndUpdate(
        profile._id,
        { $push: { chatSessions: newSession._id } }
      );
    } else if (existingSession) {
      // Update existing session with media support
      await updateChatSession(
        existingSession._id!.toString(),
        messageContent,
        finalResponse,
        mediaInfo || undefined
      );
    }

    // Send response via Twilio (preferred method for reliability)
    const messageSent = await sendWhatsAppMessage(fromNumber, finalResponse);
    
    if (!messageSent) {
      console.error('Failed to send WhatsApp message via Twilio API');
      // Fallback to TwiML response
      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message(finalResponse);
      
      return new NextResponse(twiml.toString(), {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    // Return success response
    return new NextResponse('', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });

  } catch (error: unknown) {
    console.error('Error processing webhook:', error);
    
    // Try to send error message to user if possible
    try {
      // Use already parsed params instead of reading body again
      if (params) {
        const fromNumber = extractPhoneNumber(params.get('From') || '');
        
        if (fromNumber) {
          await sendWhatsAppMessage(
            fromNumber, 
            getRandomResponse(GENERAL_ERROR_RESPONSES)
          );
        }
      }
    } catch (fallbackError) {
      console.error('Failed to send error message to user:', fallbackError);
    }
    
    // Return error response
    return new NextResponse('Internal Server Error', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'Twilio WhatsApp webhook is active',
    timestamp: new Date().toISOString()
  });
}