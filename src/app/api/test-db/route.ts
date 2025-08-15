import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    // Test Supabase connection
    const { data, error } = await supabase
      .from('messages_log')
      .select('count(*)')
      .limit(1);

    if (error) {
      console.error("Supabase connection test error:", error);
      return NextResponse.json(
        { 
          message: 'Failed to connect to Supabase or read data.', 
          error: error.message,
          details: "Ensure your Supabase project is set up, environment variables are correct in .env.local, and RLS policies are configured properly."
        }, 
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Successfully connected to Supabase!',
      timestamp: new Date().toISOString(),
      data: data
    });

  } catch (error: any) {
    console.error("Supabase connection test error:", error);
    return NextResponse.json(
      { 
        message: 'Failed to connect to Supabase or read data.', 
        error: error.message,
        details: "Ensure your Supabase project is set up, environment variables are correct in .env.local, and RLS policies are configured properly."
      }, 
      { status: 500 }
    );
  }
}