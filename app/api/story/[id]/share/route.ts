import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { data: story, error } = await supabase
      .from('stories')
      .select('id, title, share_token, is_private')
      .eq('id', id)
      .single();
    if (error || !story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }
    const shareUrl = `https://readitt.pluraldan.link/story/${story.share_token}`;
    return NextResponse.json({
      shareUrl,
      shareToken: story.share_token,
      title: story.title,
      isPrivate: story.is_private
    });
  } catch (error) {
    console.error('Error getting share link:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}