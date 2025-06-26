import { NextRequest } from 'next/server';
import { continueStory } from '@/lib/claude';
import { supabase } from '@/lib/supabase';
import { verifyAuth, createAuthResponse } from '@/lib/auth-middleware';
export async function POST(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) {
    return createAuthResponse();
  }
  try {
    const { 
      storyId,
      userFeedback,
      chapterNumber
    } = await request.json();
    if (!storyId || !userFeedback || !chapterNumber) {
      return new Response(
        JSON.stringify({ error: 'Story ID, user feedback, and chapter number are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select(`
        *,
        chapters (
          chapter_number,
          title,
          content
        )
      `)
      .eq('id', storyId)
      .single();
    if (storyError || !story) {
      return new Response(
        JSON.stringify({ error: 'Story not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    let conversationHistory = story.conversation_history || [];
    console.log('📜 [CONTINUE-STORY] Current conversation history length:', conversationHistory.length);
    console.log('📖 [CONTINUE-STORY] Available chapters:', story.chapters?.length || 0);
    if (conversationHistory.length === 0 && story.chapters && story.chapters.length > 0) {
      console.log('🔄 [CONTINUE-STORY] Rebuilding conversation history from chapters');
      conversationHistory = [];
      const sortedChapters = story.chapters.sort((a: any, b: any) => a.chapter_number - b.chapter_number);
      for (const chapter of sortedChapters) {
        conversationHistory.push({
          role: 'assistant',
          content: `<chapter>\nChapter ${chapter.chapter_number}: ${chapter.title}\n\n${chapter.content}\n</chapter>`
        });
      }
      console.log('✅ [CONTINUE-STORY] Rebuilt conversation history with', conversationHistory.length, 'entries');
    }
    console.log('📜 [CONTINUE-STORY] Final conversation history length:', conversationHistory.length);
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ progress: 0, step: 'Processing feedback...' })}\n\n`));
          const result = await continueStory(
            conversationHistory,
            userFeedback,
            chapterNumber,
            (progress) => {
              let step = 'Planning chapter structure...';
              if (progress >= 50 && progress < 100) {
                step = 'Writing chapter content...';
              } else if (progress >= 100) {
                step = 'Finalizing chapter...';
              }
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ progress, step })}\n\n`));
            }
          );
          const { error: updateError } = await supabase
            .from('stories')
            .update({
              conversation_history: result.conversationHistory,
              total_chapters: chapterNumber,
              last_updated: new Date().toISOString()
            })
            .eq('id', storyId);
          if (updateError) {
            console.error('Error updating story:', updateError);
          }
          const chapterData = {
            story_id: storyId,
            chapter_number: chapterNumber,
            title: result.title,
            content: result.content,
            reading_time: '4 min',
            upvotes: 0,
            downvotes: 0,
          };
          const { error: chapterError } = await supabase
            .from('chapters')
            .insert([chapterData]);
          if (chapterError) {
            console.error('Error saving chapter:', chapterError);
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            progress: 100, 
            step: 'Complete!',
            result: {
              title: result.title,
              content: result.content,
              chapterNumber,
              conversationHistory: result.conversationHistory
            }
          })}\n\n`));
          controller.close();
        } catch (error) {
          console.error('Error in continue stream:', error);
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Failed to continue story' })}\n\n`));
          controller.close();
        }
      }
    });
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in continue-story-stream API:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to continue story' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}