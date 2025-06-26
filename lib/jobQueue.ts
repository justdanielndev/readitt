import { generateStoryWithHistory, continueStory } from './claude';
import { supabase } from './supabase';
import './imageQueue'; 
export interface ChapterGenerationJob {
  id: string;
  story_id: string;
  chapter_number: number;
  trigger: 'rating' | 'story_creation';
  user_feedback?: {
    voteType: 'up' | 'down';
    reasons: string[];
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  attempts: number;
  error_message?: string;
}
let isProcessing = false;
async function processJob(job: ChapterGenerationJob): Promise<void> {
  console.log(`Starting chapter generation: Story ${job.story_id}, Chapter ${job.chapter_number}, Trigger: ${job.trigger}`);
  await supabase
    .from('chapter_generation_jobs')
    .update({ 
      status: 'processing', 
      updated_at: new Date().toISOString(),
      attempts: job.attempts + 1
    })
    .eq('id', job.id);
  try {
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('*')
      .eq('id', job.story_id)
      .single();
    if (storyError || !story) {
      throw new Error(`Story not found: ${job.story_id}`);
    }
    let newChapter;
    let result;
    if (job.chapter_number === 1 && job.trigger === 'story_creation') {
      console.log('🚨 [JOB QUEUE] Using content warnings for Chapter 1:', story.content_warnings);
      console.log('🔞 [JOB QUEUE] Using age rating for Chapter 1:', story.age_rating);
      result = await generateStoryWithHistory(
        story.title,
        story.fandom,
        story.characters || '',
        story.topics || '',
        story.theme || '',
        story.content_warnings || [],
        story.age_rating || 'all-ages',
        [], 
        () => {} 
      );
      newChapter = {
        title: result.title,
        content: result.content,
        readingTime: '4 min' 
      };
      const updateData: any = {
        conversation_history: result.conversationHistory,
        total_chapters: Math.max(story.total_chapters, 1)
      };
      if (result.storyData) {
        updateData.characters = result.storyData.characters;
        updateData.topics = result.storyData.topics;
        updateData.theme = result.storyData.themes;
        updateData.description = result.storyData.description;
      }
      await supabase
        .from('stories')
        .update(updateData)
        .eq('id', job.story_id);
    } else {
      const feedback = job.user_feedback ? 
        `User ${job.user_feedback.voteType === 'up' ? 'loved' : 'had concerns about'} the previous chapter. Reasons: ${job.user_feedback.reasons.join(', ')}` :
        'Continue the story naturally';
      result = await continueStory(
        story.conversation_history || [],
        feedback,
        job.chapter_number,
        () => {} 
      );
      newChapter = {
        title: result.title,
        content: result.content,
        readingTime: '4 min' 
      };
      await supabase
        .from('stories')
        .update({ 
          conversation_history: result.conversationHistory,
          total_chapters: Math.max(story.total_chapters, job.chapter_number)
        })
        .eq('id', job.story_id);
    }
    const { data: insertedChapter, error: insertError } = await supabase
      .from('chapters')
      .insert([{
        story_id: job.story_id,
        chapter_number: job.chapter_number,
        title: newChapter.title,
        content: newChapter.content,
        reading_time: newChapter.readingTime,
        upvotes: 0,
        downvotes: 0,
      }])
      .select()
      .single();
    if (insertError) {
      throw new Error(`Failed to save chapter: ${insertError.message}`);
    }
    if (insertedChapter && job.chapter_number === 1 && result.imagePrompt) {
      try {
        await fetch(`https://readitt.pluraldan.link/api/generate-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            storyId: job.story_id,
            storyTitle: story.title,
            storyDescription: story.description,
            fandom: story.fandom,
            imagePrompt: result.imagePrompt
          }),
        });
        console.log(`Image generation queued for story ${job.story_id}`);
      } catch (imageError) {
        console.error('Failed to queue image generation:', imageError);
      }
    }
    await supabase
      .from('chapter_generation_jobs')
      .update({ 
        status: 'completed', 
        updated_at: new Date().toISOString()
      })
      .eq('id', job.id);
    console.log(`Chapter generation completed: Story ${job.story_id}, Chapter ${job.chapter_number}`);
  } catch (error) {
    console.error(`Chapter generation failed: Story ${job.story_id}, Chapter ${job.chapter_number}`, error);
    await supabase
      .from('chapter_generation_jobs')
      .update({ 
        status: 'failed', 
        updated_at: new Date().toISOString(),
        error_message: error instanceof Error ? error.message : 'Unknown error'
      })
      .eq('id', job.id);
  }
}
async function processJobs() {
  if (isProcessing) return;
  isProcessing = true;
  try {
    const { data: jobs, error } = await supabase
      .from('chapter_generation_jobs')
      .select('*')
      .eq('status', 'pending')
      .lt('attempts', 3)
      .order('created_at', { ascending: true })
      .limit(1);
    if (error) {
      console.error('Error fetching jobs:', error);
      return;
    }
    if (jobs && jobs.length > 0) {
      await processJob(jobs[0]);
      setTimeout(processJobs, 1000);
    } else {
      setTimeout(processJobs, 10000);
    }
  } catch (error) {
    console.error('Job processor error:', error);
    setTimeout(processJobs, 10000);
  } finally {
    isProcessing = false;
  }
}
if (typeof window === 'undefined') {
  processJobs();
}
export async function scheduleChapterGeneration(jobData: Omit<ChapterGenerationJob, 'id' | 'status' | 'created_at' | 'updated_at' | 'attempts'>) {
  const job = {
    ...jobData,
    status: 'pending' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    attempts: 0
  };
  const { data, error } = await supabase
    .from('chapter_generation_jobs')
    .insert([job])
    .select()
    .single();
  if (error) {
    throw new Error(`Failed to schedule job: ${error.message}`);
  }
  console.log(`Scheduled chapter generation job ${data.id}: Story ${jobData.story_id}, Chapter ${jobData.chapter_number}`);
  if (!isProcessing) {
    setTimeout(processJobs, 100);
  }
  return data;
}
export async function triggerChapterGenerationOnRating(
  storyId: string, 
  currentChapterNumber: number,
  voteType: 'up' | 'down',
  reasons: string[]
) {
  const { data: story, error } = await supabase
    .from('stories')
    .select('total_chapters')
    .eq('id', storyId)
    .single();
  if (error || !story) {
    throw new Error(`Story not found: ${storyId}`);
  }
  const nextChapterNumber = story.total_chapters + 1;
  return scheduleChapterGeneration({
    story_id: storyId,
    chapter_number: nextChapterNumber,
    trigger: 'rating',
    user_feedback: {
      voteType,
      reasons
    }
  });
}
export async function triggerFirstChapterGeneration(storyId: string) {
  return scheduleChapterGeneration({
    story_id: storyId,
    chapter_number: 1,
    trigger: 'story_creation'
  });
}
export async function getQueueHealth() {
  const { data: jobs, error } = await supabase
    .from('chapter_generation_jobs')
    .select('status')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  if (error) {
    return { error: error.message };
  }
  const stats = jobs.reduce((acc, job) => {
    acc[job.status] = (acc[job.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  return {
    pending: stats.pending || 0,
    processing: stats.processing || 0,
    completed: stats.completed || 0,
    failed: stats.failed || 0,
    total: jobs.length
  };
}