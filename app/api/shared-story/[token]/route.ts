import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select(`
        *,
        chapters (
          id,
          chapter_number,
          title,
          content,
          reading_time,
          upvotes,
          downvotes,
          created_at
        )
      `)
      .eq('share_token', token)
      .single();
    if (storyError || !story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }
    story.chapters?.sort((a: any, b: any) => a.chapter_number - b.chapter_number);
    console.log('📖 Raw story data from DB:', {
      id: story.id,
      title: story.title,
      content_warnings: story.content_warnings,
      age_rating: story.age_rating,
      is_nsfw: story.is_nsfw
    });
    return NextResponse.json({
      id: story.id,
      title: story.title,
      fandom: story.fandom,
      genre: story.genre,
      description: story.description,
      tags: story.tags,
      author: story.author,
      totalChapters: story.total_chapters,
      lastUpdated: story.last_updated,
      isPrivate: story.is_private,
      shareToken: story.share_token,
      contentWarnings: story.content_warnings || [],
      ageRating: story.age_rating || 'all-ages',
      isNsfw: story.is_nsfw || false,
      chapters: story.chapters?.map((chapter: any) => ({
        id: chapter.id,
        number: chapter.chapter_number,
        title: chapter.title,
        content: chapter.content,
        readingTime: chapter.reading_time,
        upvotes: chapter.upvotes,
        downvotes: chapter.downvotes
      })) || []
    });
  } catch (error) {
    console.error('Error fetching story by token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}