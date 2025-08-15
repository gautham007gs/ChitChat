
import { NextRequest, NextResponse } from 'next/server';
import { AI_CONFIG, getCachedResponse, setCachedResponse } from '@/config/ai';
import { supabase } from '@/lib/supabaseClient';

// Rate limiting storage
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(ip);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 }); // 1 minute window
    return true;
  }
  
  if (userLimit.count >= AI_CONFIG.rateLimiting.maxRequestsPerMinute) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.ip || 'unknown';
    
    // Check rate limiting
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before sending another message.' },
        { status: 429 }
      );
    }

    const { message, userId } = await request.json();

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Check cache first for cost optimization
    const cachedResponse = getCachedResponse(message.toLowerCase().trim());
    if (cachedResponse) {
      return NextResponse.json({ 
        response: cachedResponse,
        cached: true 
      });
    }

    // Log user message to Supabase
    await supabase.from('messages_log').insert({
      user_id: userId || 'anonymous',
      message: message,
      sender: 'user',
      timestamp: new Date().toISOString()
    });

    // Simulate AI response (replace with actual Vertex AI call)
    const aiResponse = generateSimulatedResponse(message);
    
    // Cache the response
    setCachedResponse(message.toLowerCase().trim(), aiResponse);

    // Log AI response to Supabase
    await supabase.from('messages_log').insert({
      user_id: userId || 'anonymous',
      message: aiResponse,
      sender: 'ai',
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ 
      response: aiResponse,
      cached: false 
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Temporary simulation function - replace with Vertex AI
function generateSimulatedResponse(message: string): string {
  const responses = [
    "That's really interesting! Tell me more about that.",
    "I understand what you're saying. How does that make you feel?",
    "That's a great point! I'd love to explore that further with you.",
    "I appreciate you sharing that with me. What would you like to know?",
    "Thanks for that insight! Is there anything specific you'd like help with?"
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}
