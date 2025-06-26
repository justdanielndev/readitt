import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const story_id = searchParams.get('story_id');
    const chapter_number = searchParams.get('chapter_number');
    if (!story_id || !chapter_number) {
      return NextResponse.json(
        { error: 'Story ID and chapter number are required' },
        { status: 400 }
      );
    }
    const { data: translations, error } = await supabase
      .from('translations')
      .select('target_language, translated_title, quality_score, created_at')
      .eq('story_id', story_id)
      .eq('chapter_number', parseInt(chapter_number))
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching translations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch translations' },
        { status: 500 }
      );
    }
    return NextResponse.json({
      translations: translations || []
    });
  } catch (error) {
    console.error('Error in translations API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}