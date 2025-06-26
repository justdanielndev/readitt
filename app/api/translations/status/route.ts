import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const { searchParams } = url;
    const story_id = searchParams.get('story_id');
    const chapter_number = searchParams.get('chapter_number');
    const target_language = searchParams.get('target_language');
    if (!story_id || !chapter_number || !target_language) {
      return NextResponse.json(
        { error: 'Story ID, chapter number, and target language are required' },
        { status: 400 }
      );
    }
    const { data: translation, error: translationError } = await supabase
      .from('translations')
      .select('id')
      .eq('story_id', story_id)
      .eq('chapter_number', parseInt(chapter_number))
      .eq('target_language', target_language)
      .single();
    if (translation) {
      return NextResponse.json({
        status: 'completed',
        translation_id: translation.id
      });
    }
    const { data: translationRequest, error: requestError } = await supabase
      .from('translation_requests')
      .select('status, error_message, created_at, processing_started_at, completed_at')
      .eq('story_id', story_id)
      .eq('chapter_number', parseInt(chapter_number))
      .eq('target_language', target_language)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (requestError && requestError.code !== 'PGRST116') {
      console.error('Error checking translation request:', requestError);
      return NextResponse.json(
        { error: 'Failed to check translation status' },
        { status: 500 }
      );
    }
    if (!translationRequest) {
      return NextResponse.json({
        status: 'not_requested'
      });
    }
    return NextResponse.json({
      status: translationRequest.status,
      error: translationRequest.error_message,
      timestamps: {
        created_at: translationRequest.created_at,
        processing_started_at: translationRequest.processing_started_at,
        completed_at: translationRequest.completed_at
      }
    });
  } catch (error) {
    console.error('Error in translation status API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}