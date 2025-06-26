import { NextRequest } from 'next/server';
import { generateStoryWithHistory } from '@/lib/claude';
import { supabase } from '@/lib/supabase';
import { verifyLocalAuth, createLocalAuthResponse } from '@/lib/local-auth-middleware';
import { logConversation } from '@/lib/conversationLogger';
export async function POST(request: NextRequest) {
  console.log('AI Chapter generation API called at:', new Date().toISOString());
  const user = await verifyLocalAuth(request);
  if (!user) {
    return createLocalAuthResponse();
  }
  try {
    const { 
      storyId,
      chapterNumber,
      chapterTitle,
      authorInstructions,
      selectedRatings,
      previousChapters,
      storyContext,
      contentWarnings,
      ageRating,
      isNsfw
    } = await request.json();
    console.log('🚨 [API] Received content warnings as params:', contentWarnings);
    console.log('🔞 [API] Received age rating as params:', ageRating);
    console.log('🚫 [API] Received NSFW flag as params:', isNsfw);
    console.log('Generating AI chapter:', { storyId, chapterNumber, chapterTitle });
    if (!storyId || !chapterNumber || !chapterTitle) {
      return new Response(
        JSON.stringify({ error: 'Story ID, chapter number, and title are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('id, author_user_id, content_warnings, age_rating, title, fandom, characters, topics, theme, conversation_history')
      .eq('id', storyId)
      .eq('author_user_id', user.userId)
      .single();
    console.log('📖 Story data for AI generation:', story);
    if (storyError || !story) {
      return new Response(
        JSON.stringify({ error: 'Story not found or access denied' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    let contextPrompt = '';
    if (chapterNumber === 1) {
      console.log('📖 Generating Chapter 1 with full story context...');
      const { generateStoryWithHistory } = await import('@/lib/claude');
      console.log('🚨 Using content warnings for AI (from params):', contentWarnings);
      console.log('🔞 Using age rating for AI (from params):', ageRating);
      console.log('🔍 Content warnings type:', typeof contentWarnings);
      console.log('🔍 Content warnings array check:', Array.isArray(contentWarnings));
      console.log('🔍 Content warnings length:', contentWarnings?.length);
      console.log('🔍 Final content warnings being passed:', contentWarnings || []);
      const result = await generateStoryWithHistory(
        story.title || storyContext.title,
        story.fandom || storyContext.fandom,
        story.characters || storyContext.characters || '',
        story.topics || storyContext.topics || '',
        story.theme || storyContext.theme || '',
        contentWarnings || [],
        ageRating || 'all-ages',
        [], 
        undefined 
      );
      let chapterContent = result.content || result.fullResponse;
      chapterContent = chapterContent.replace(/<[^>]*>/g, '').trim();
      console.log('✅ Chapter 1 generated successfully');
      console.log('📄 Generated chapter length:', chapterContent.length);
      await logConversation({
        story_id: storyId,
        chapter_number: chapterNumber,
        conversation_type: 'story_generation',
        user_input: {
          title: story.title || storyContext.title,
          fandom: story.fandom || storyContext.fandom,
          characters: story.characters || storyContext.characters || '',
          topics: story.topics || storyContext.topics || '',
          theme: story.theme || storyContext.theme || '',
          contentWarnings: contentWarnings || [],
          ageRating: ageRating || 'all-ages'
        },
        ai_response: chapterContent,
        model_used: 'claude-3-7-sonnet-20250219'
      });
      const updatedConversationHistory = [
        {
          role: 'assistant',
          content: `<chapter>\nChapter ${chapterNumber}: ${chapterTitle}\n\n${chapterContent}\n</chapter>`
        }
      ];
      await supabase
        .from('stories')
        .update({ 
          conversation_history: updatedConversationHistory 
        })
        .eq('id', storyId);
      return new Response(
        JSON.stringify({ 
          success: true,
          content: chapterContent,
          title: chapterTitle,
          chapterNumber: chapterNumber
        }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    } else {
      console.log(`📚 Generating Chapter ${chapterNumber} as continuation with conversation history...`);
      console.log(`🚨 Using content warnings for Chapter ${chapterNumber} (from params):`, contentWarnings);
      console.log(`🔞 Using age rating for Chapter ${chapterNumber} (from params):`, ageRating);
      let userFeedback = '';
      if (selectedRatings && selectedRatings.length > 0) {
        userFeedback += 'Reader Feedback to Incorporate:\n';
        selectedRatings.forEach((rating: any) => {
          const sentiment = rating.type === 'positive' ? 'Readers liked' : 'Readers wanted improvement in';
          userFeedback += `- ${sentiment}: ${rating.reasons[0]} (${rating.count} votes)\n`;
        });
        userFeedback += '\n';
      }
      if (authorInstructions) {
        userFeedback += `Author Instructions: ${authorInstructions}\n\n`;
      }
      userFeedback += `Continue with Chapter ${chapterNumber} titled "${chapterTitle}".`;
      const { continueStory } = await import('@/lib/claude');
      let conversationHistory = story.conversation_history || [];
      if (conversationHistory.length === 0) {
        console.log('🔄 Conversation history empty, rebuilding from existing chapters...');
        const { data: chapters, error: chaptersError } = await supabase
          .from('chapters')
          .select('chapter_number, title, content')
          .eq('story_id', storyId)
          .order('chapter_number', { ascending: true });
        if (!chaptersError && chapters && chapters.length > 0) {
          conversationHistory = [];
          for (const chapter of chapters) {
            conversationHistory.push({
              role: 'assistant',
              content: `<chapter>\nChapter ${chapter.chapter_number}: ${chapter.title}\n\n${chapter.content}\n</chapter>`
            });
          }
          console.log('✅ Rebuilt conversation history with', conversationHistory.length, 'entries from chapters');
        }
      }
      console.log('📜 Using conversation history with', conversationHistory.length, 'messages');
      const result = await continueStory(
        conversationHistory,
        userFeedback,
        chapterNumber,
        undefined 
      );
      let chapterContent = result.content || result.fullResponse;
    console.log('📄 Generated chapter length:', chapterContent.length);
    chapterContent = chapterContent.replace(/<[^>]*>/g, '').trim();
    if (chapterContent.length < 100) {
      return new Response(
        JSON.stringify({ error: 'Generated content is too short, please try again' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    console.log('AI chapter generated successfully, length:', chapterContent.length);
    await logConversation({
      story_id: storyId,
      chapter_number: chapterNumber,
      conversation_type: 'chapter_continuation',
      user_input: {
        userFeedback,
        selectedRatings,
        authorInstructions,
        conversationHistoryLength: conversationHistory.length
      },
      ai_response: chapterContent,
      model_used: 'claude-3-7-sonnet-20250219'
    });
    const updatedConversationHistory = [
      ...conversationHistory,
      {
        role: 'assistant',
        content: `<chapter>\nChapter ${chapterNumber}: ${chapterTitle}\n\n${chapterContent}\n</chapter>`
      }
    ];
    await supabase
      .from('stories')
      .update({ 
        conversation_history: updatedConversationHistory 
      })
      .eq('id', storyId);
    return new Response(
      JSON.stringify({ 
        success: true,
        content: chapterContent,
        title: chapterTitle,
        chapterNumber: chapterNumber
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
    }
  } catch (error) {
    console.error('Error in generate-ai-chapter API:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate chapter' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}