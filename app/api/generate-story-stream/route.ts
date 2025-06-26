import { NextRequest } from 'next/server';
import { generateStoryWithHistory } from '@/lib/claude';
import { supabase } from '@/lib/supabase';
import { verifyLocalAuth, createLocalAuthResponse } from '@/lib/local-auth-middleware';
import { triggerFirstChapterGeneration } from '@/lib/jobQueue';
export async function POST(request: NextRequest) {
  console.log('📝 Story generation API called at:', new Date().toISOString());
  console.log('🔐 Verifying local authentication...');
  const user = await verifyLocalAuth(request);
  console.log('👤 Auth result:', user ? `Authenticated as ${user.username} (${user.userId})` : 'Authentication failed');
  if (!user) {
    console.log('❌ Authentication failed, returning 401');
    return createLocalAuthResponse();
  }
  try {
    const { 
      fandom, 
      description, 
      storyName,
      characters = '',
      topics = '',
      theme = '',
      author = user.username,
      isPrivate = false,
      contentWarnings = [],
      ageRating = 'all-ages'
    } = await request.json();
    console.log('Generating story:', { storyName, fandom, author, contentWarnings, ageRating });
    if (!fandom || !storyName) {
      return new Response(
        JSON.stringify({ error: 'Fandom and story name are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ progress: 0, step: 'Starting generation...' })}\n\n`));
          console.log('💾 Creating story in database:', storyName);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ progress: 20, step: 'Creating story...' })}\n\n`));
          const storyData = {
            title: storyName,
            fandom,
            genre: ['Adventure', 'Fantasy'], 
            description: description || `A story set in the ${fandom} universe`,
            tags: ['ai-generated', 'interactive'],
            author: author,
            total_chapters: 0, 
            conversation_history: [],
            characters,
            topics,
            theme,
            is_private: isPrivate,
            created_by_session: null,
            image_status: 'none',
            author_user_id: user.userId, 
            allow_ai_continuation: true,
            story_status: 'active',
            content_warnings: contentWarnings,
            age_rating: ageRating,
            is_nsfw: contentWarnings.some((warning: string) => {
              const nsfwWarnings = ['sexual-moderate', 'sexual-graphic', 'violence-strong', 'abuse', 'suicide', 'body-horror'];
              return nsfwWarnings.includes(warning);
            }) || ageRating === '18+'
          };
          if (isPrivate) {
            console.log('🔒 Private story detected - NOT saving to database');
            console.log('📋 Private story data:', {
              title: storyName,
              fandom,
              contentWarnings: storyData.content_warnings,
              ageRating: storyData.age_rating,
              isNsfw: storyData.is_nsfw
            });
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              progress: 100, 
              step: 'Private story created! Story data will be stored locally.',
              result: {
                storyId: `private_${Date.now()}`, 
                title: storyName,
                isPrivate: true,
                storyData: storyData, 
                message: 'Private story created successfully. Data stored locally only.'
              }
            })}\n\n`));
          } else {
            console.log('🌐 Public story - saving to database');
            console.log('📋 Story data to insert:', storyData);
            console.log('🚨 Content warnings being saved:', storyData.content_warnings);
            console.log('🔞 Age rating being saved:', storyData.age_rating);
            console.log('🚫 NSFW flag being saved:', storyData.is_nsfw);
            const { data: story, error: storyError } = await supabase
              .from('stories')
              .insert([storyData])
              .select('id, title, content_warnings, age_rating, is_nsfw, share_token, is_private')
              .single();
            console.log('✅ Story insert result:', { story, error: storyError });
            console.log('🆔 Story saved to database with ID:', story?.id);
            console.log('💾 Saved content warnings:', story?.content_warnings);
            console.log('💾 Saved age rating:', story?.age_rating);
            console.log('💾 Saved NSFW flag:', story?.is_nsfw);
            if (storyError) {
              console.error('Error saving story:', storyError);
              throw new Error('Failed to create story');
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ progress: 50, step: 'Scheduling chapter generation...' })}\n\n`));
            const job = await triggerFirstChapterGeneration(story.id);
            console.log('Chapter 1 generation job scheduled:', job.id);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              progress: 100, 
              step: 'Story created! Chapter 1 is being generated in the background.',
              result: {
                storyId: story?.id,
                title: storyName,
                jobId: job.id,
                shareToken: story?.share_token,
                isPrivate: story?.is_private,
                message: 'Story created successfully. Chapter 1 will be available shortly.'
              }
            })}\n\n`));
          }
          controller.close();
        } catch (error) {
          console.error('Error in stream:', error);
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Failed to generate story' })}\n\n`));
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
    console.error('Error in generate-story-stream API:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate story' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}