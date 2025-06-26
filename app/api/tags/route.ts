import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
export async function GET() {
  try {
    const { data: tags, error } = await supabase
      .from('tags')
      .select('*')
      .order('usage_count', { ascending: false })
      .limit(50);
    if (error) {
      console.error('Error fetching tags:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch tags' },
        { status: 500 }
      );
    }
    return NextResponse.json({
      success: true,
      tags: tags || []
    });
  } catch (error) {
    console.error('Error in tags API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}