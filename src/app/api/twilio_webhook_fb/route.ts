import {NextResponse } from 'next/server';

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'Twilio FB webhook is active',
    timestamp: new Date().toISOString()
  });
}