import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
export async function GET(request: NextRequest) {
  try {
    const { data: languages, error } = await supabase
      .from('supported_languages')
      .select('*')
      .eq('is_active', true)
      .order('name');
    if (error) {
      console.error('Error fetching supported languages:', error);
      return NextResponse.json(
        { error: 'Failed to fetch supported languages' },
        { status: 500 }
      );
    }
    return NextResponse.json({
      languages: languages || []
    });
  } catch (error) {
    console.error('Error in languages API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}