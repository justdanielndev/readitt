import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    const { data: existing, error: checkError } = await supabase
      .from('user_ids')
      .select('user_id')
      .eq('user_id', userId)
      .single();
    if (checkError && checkError.code !== 'PGRST116') { 
      console.error('Error checking user ID:', checkError);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }
    if (existing) {
      return NextResponse.json({
        success: true,
        exists: true,
        message: 'User ID already registered'
      });
    }
    const { error: insertError } = await supabase
      .from('user_ids')
      .insert([{ user_id: userId }]);
    if (insertError) {
      console.error('Error registering user ID:', insertError);
      return NextResponse.json(
        { error: 'Failed to register user ID' },
        { status: 500 }
      );
    }
    return NextResponse.json({
      success: true,
      exists: false,
      message: 'User ID registered successfully'
    });
  } catch (error) {
    console.error('Error in register-user-id API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}