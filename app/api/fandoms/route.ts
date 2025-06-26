import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
export async function GET() {
  try {
    const { data: fandoms, error } = await supabase
      .from('fandoms')
      .select('*')
      .order('usage_count', { ascending: false });
    if (error) {
      console.error('Error fetching fandoms:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch fandoms' },
        { status: 500 }
      );
    }
    return NextResponse.json({
      success: true,
      fandoms: fandoms || []
    });
  } catch (error) {
    console.error('Error in fandoms API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export async function POST(request: Request) {
  try {
    const { name, description, category } = await request.json();
    if (!name || !category) {
      return NextResponse.json(
        { success: false, error: 'Name and category are required' },
        { status: 400 }
      );
    }
    const { data: fandom, error } = await supabase
      .from('fandoms')
      .insert({
        name,
        description: description || `Stories set in the ${name} universe`,
        category,
        is_custom: true,
        usage_count: 1
      })
      .select()
      .single();
    if (error) {
      if (error.code === '23505') { 
        return NextResponse.json(
          { success: false, error: 'Fandom already exists' },
          { status: 409 }
        );
      }
      console.error('Error creating fandom:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create fandom' },
        { status: 500 }
      );
    }
    return NextResponse.json({
      success: true,
      fandom
    });
  } catch (error) {
    console.error('Error in create fandom API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}