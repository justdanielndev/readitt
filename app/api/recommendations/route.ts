import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyAuth, createAuthResponse } from '@/lib/auth-middleware';
export async function POST(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) {
    return createAuthResponse();
  }
  try {
    const { readStories, userPreferences } = await request.json();
    const allow18Plus = userPreferences?.show18PlusContent || false;
    console.log('🔍 [RECOMMENDATIONS] User allows 18+ content:', allow18Plus);
    if (!readStories || readStories.length === 0) {
      let query = supabase
        .from('stories')
        .select(`
          *,
          chapters (*)
        `)
        .eq('is_private', false);
      if (!allow18Plus) {
        query = query
          .neq('age_rating', '18+')
          .eq('is_nsfw', false);
      }
      const { data: stories, error } = await query
        .order('created_at', { ascending: false })
        .limit(6);
      if (error) {
        throw error;
      }
      return NextResponse.json({
        success: true,
        recommendations: stories || []
      });
    }
    const readFandoms = readStories.map((story: any) => story.fandom);
    const readTags = readStories.flatMap((story: any) => story.tags || []);
    const readStoryIds = readStories.map((story: any) => story.id);
    const fandomCounts: { [key: string]: number } = {};
    readFandoms.forEach(fandom => {
      fandomCounts[fandom] = (fandomCounts[fandom] || 0) + 1;
    });
    const tagCounts: { [key: string]: number } = {};
    readTags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
    let allStoriesQuery = supabase
      .from('stories')
      .select(`
        *,
        chapters (*)
      `)
      .not('id', 'in', `(${readStoryIds.join(',')})`)
      .eq('is_private', false);
    if (!allow18Plus) {
      allStoriesQuery = allStoriesQuery
        .neq('age_rating', '18+')
        .eq('is_nsfw', false);
    }
    const { data: allStories, error } = await allStoriesQuery
      .order('created_at', { ascending: false });
    if (error) {
      throw error;
    }
    const storiesWithScores = (allStories || []).map((story: any) => {
      let affinityScore = 0;
      if (fandomCounts[story.fandom]) {
        affinityScore += fandomCounts[story.fandom] * 3; 
      }
      const storyGenres = story.genre || [];
      const readGenres = readStories.flatMap((s: any) => s.genre || []);
      const genreMatches = storyGenres.filter((genre: string) => 
        readGenres.includes(genre)
      ).length;
      affinityScore += genreMatches * 2;
      const storyTags = story.tags || [];
      storyTags.forEach((tag: string) => {
        if (tagCounts[tag]) {
          affinityScore += tagCounts[tag] * 1.5;
        }
      });
      const daysSinceCreated = Math.floor(
        (Date.now() - new Date(story.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      const recencyBonus = Math.max(0, 30 - daysSinceCreated) * 0.1;
      affinityScore += recencyBonus;
      return {
        ...story,
        affinityScore
      };
    });
    const recommendations = storiesWithScores
      .sort((a, b) => b.affinityScore - a.affinityScore)
      .slice(0, 12);
    return NextResponse.json({
      success: true,
      recommendations
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}