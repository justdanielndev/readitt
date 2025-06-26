import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});
export async function POST(request: NextRequest) {
  try {
    const { storyId, fromChapter, toChapter, userId, forceRegenerate = false } = await request.json();
    if (!storyId || !fromChapter || !toChapter || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    console.log('📝 Generating catch-up summary:', {
      storyId,
      fromChapter,
      toChapter,
      userId,
      forceRegenerate
    });
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('title, fandom, description')
      .eq('id', storyId)
      .single();
    if (storyError || !story) {
      console.error('Error fetching story:', storyError);
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }
    const { data: chapters, error: chaptersError } = await supabase
      .from('chapters')
      .select('chapter_number, title, content')
      .eq('story_id', storyId)
      .gte('chapter_number', fromChapter)
      .lte('chapter_number', toChapter)
      .order('chapter_number', { ascending: true });
    if (chaptersError || !chapters || chapters.length === 0) {
      console.error('Error fetching chapters:', chaptersError);
      return NextResponse.json(
        { error: 'Chapters not found' },
        { status: 404 }
      );
    }
    console.log('🤖 Generating AI catch-up summary...');
    const chaptersText = chapters.map(ch => 
      `Chapter ${ch.chapter_number}: ${ch.title}\n${ch.content}`
    ).join('\n\n---\n\n');
    const prompt = `You are tasked with creating a "catch me up" summary for a reader who wants to get back into a story they've been reading.
Story Context:
- Title: ${story.title}
- Fandom: ${story.fandom}
- Description: ${story.description}
The reader wants to catch up on chapters ${fromChapter} to ${toChapter}. Here are the chapters:
${chaptersText}
Please create a comprehensive but concise summary (3-5 paragraphs) that:
1. Covers the key plot developments across these chapters
2. Highlights important character moments and relationships
3. Notes any major revelations or twists
4. Sets up where the story stands at the end of chapter ${toChapter}
Write in an engaging, conversational tone as if you're helping a friend catch up on their favorite show. Use present tense and focus on the most important events that a returning reader would need to know.`;
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });
    const summary = response.content[0]?.type === 'text' ? response.content[0].text : 'Summary could not be generated.';
    console.log('✅ Catch-up summary generated successfully');
    return NextResponse.json({
      success: true,
      summary: summary.trim(),
      storyId: storyId,
      storyTitle: story.title,
      fromChapter: fromChapter,
      toChapter: toChapter,
      chaptersCount: chapters.length
    });
  } catch (error) {
    console.error('Error in chapter-summary API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}