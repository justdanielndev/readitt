import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
export async function POST(request: NextRequest) {
  try {
    const { comment_id, reason, description } = await request.json();
    if (!comment_id || !reason) {
      return NextResponse.json(
        { error: 'Comment ID and reason are required' },
        { status: 400 }
      );
    }
    const validReasons = ['spam', 'harassment', 'inappropriate', 'spoiler', 'off_topic', 'other'];
    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { error: 'Invalid flag reason' },
        { status: 400 }
      );
    }
    const userSessionId = request.headers.get('x-session-id') || 
                         request.ip || 
                         `anonymous-${Date.now()}-${Math.random()}`;
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('id')
      .eq('id', comment_id)
      .eq('is_deleted', false)
      .single();
    if (commentError || !comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }
    const { data: existingFlag, error: flagCheckError } = await supabase
      .from('comment_flags')
      .select('id')
      .eq('comment_id', comment_id)
      .eq('flagger_session_id', userSessionId)
      .single();
    if (flagCheckError && flagCheckError.code !== 'PGRST116') {
      console.error('Error checking existing flag:', flagCheckError);
      return NextResponse.json(
        { error: 'Failed to check existing flag' },
        { status: 500 }
      );
    }
    if (existingFlag) {
      return NextResponse.json(
        { error: 'You have already flagged this comment' },
        { status: 400 }
      );
    }
    const { error: insertError } = await supabase
      .from('comment_flags')
      .insert([
        {
          comment_id,
          flagger_session_id: userSessionId,
          reason,
          description: description || null
        }
      ]);
    if (insertError) {
      console.error('Error creating flag:', insertError);
      return NextResponse.json(
        { error: 'Failed to flag comment' },
        { status: 500 }
      );
    }
    return NextResponse.json({ 
      success: true,
      message: 'Comment flagged successfully' 
    });
  } catch (error) {
    console.error('Error in comment flag API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}