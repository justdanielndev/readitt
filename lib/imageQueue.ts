import { supabase } from './supabase';
const AI_HORDE_BASE_URL = 'https://aihorde.net/api';
let isImageProcessing = false;
function getRetryDelay(retryCount: number): number {
  const delays = [
    10 * 60 * 1000,  
    20 * 60 * 1000,  
    60 * 60 * 1000,  
    2 * 60 * 60 * 1000,  
    3 * 60 * 60 * 1000   
  ];
  return delays[retryCount - 1] || delays[delays.length - 1];
}
function isReadyForRetry(story: any): boolean {
  if (!story.image_last_retry_at && !story.created_at) return false;
  const retryCount = story.image_retry_count || 0;
  if (retryCount >= 5) return false; 
  const lastAttemptTime = story.image_last_retry_at || story.created_at;
  const timeSinceLastAttempt = Date.now() - new Date(lastAttemptTime).getTime();
  const requiredDelay = getRetryDelay(retryCount + 1);
  return timeSinceLastAttempt >= requiredDelay;
}
async function checkImageGeneration(storyId: string, generationId: string): Promise<boolean> {
  try {
    console.log(`Checking image generation status for story ${storyId}`);
    const statusResponse = await fetch(
      `${AI_HORDE_BASE_URL}/v2/generate/check/${generationId}`,
      {
        headers: {
          'Client-Agent': 'readitt:1.0:https://readitt.pluraldan.link'
        }
      }
    );
    if (!statusResponse.ok) {
      console.error('Failed to check AI Horde status:', statusResponse.status);
      return false;
    }
    const statusData = await statusResponse.json();
    if (statusData.done) {
      const resultResponse = await fetch(
        `${AI_HORDE_BASE_URL}/v2/generate/status/${generationId}`,
        {
          headers: {
            'Client-Agent': 'readitt:1.0:https://readitt.pluraldan.link'
          }
        }
      );
      if (resultResponse.ok) {
        const resultData = await resultResponse.json();
        if (resultData.generations && resultData.generations.length > 0) {
          const generation = resultData.generations[0];
          const tempImageUrl = generation.img;
          try {
            console.log(`Downloading image for story ${storyId} from: ${tempImageUrl}`);
            const imageResponse = await fetch(tempImageUrl);
            if (!imageResponse.ok) {
              throw new Error(`Failed to download image: ${imageResponse.status}`);
            }
            const imageBlob = await imageResponse.blob();
            const fileName = `story-covers/${storyId}.webp`;
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('images')
              .upload(fileName, imageBlob, {
                contentType: 'image/webp',
                upsert: true
              });
            if (uploadError) {
              console.error('Error uploading image to storage:', uploadError);
              throw uploadError;
            }
            const { data: { publicUrl } } = supabase.storage
              .from('images')
              .getPublicUrl(fileName);
            const { error: updateError } = await supabase
              .from('stories')
              .update({
                image_url: publicUrl,
                image_status: 'completed'
              })
              .eq('id', storyId);
            if (updateError) {
              console.error('Error updating story with image URL:', updateError);
              return false;
            }
            console.log(`Image generation completed for story ${storyId}: ${publicUrl}`);
            return true; 
          } catch (downloadError) {
            console.error(`Error downloading/uploading image for story ${storyId}:`, downloadError);
            const { error: updateError } = await supabase
              .from('stories')
              .update({
                image_url: tempImageUrl,
                image_status: 'completed'
              })
              .eq('id', storyId);
            if (updateError) {
              console.error('Error updating story with fallback image URL:', updateError);
              return false;
            }
            console.log(`Image generation completed for story ${storyId} with temporary URL: ${tempImageUrl}`);
            return true;
          }
        }
      }
      await supabase
        .from('stories')
        .update({ image_status: 'failed' })
        .eq('id', storyId);
      console.log(`Image generation failed for story ${storyId}`);
      return true; 
    } else if (statusData.faulted) {
      await supabase
        .from('stories')
        .update({ image_status: 'failed' })
        .eq('id', storyId);
      console.log(`Image generation faulted for story ${storyId}`);
      return true; 
    } else {
      console.log(`Image generation in progress for story ${storyId} (queue position: ${statusData.queue_position})`);
      return false; 
    }
  } catch (error) {
    console.error(`Error checking image generation for story ${storyId}:`, error);
    return false;
  }
}
async function processImageJobs() {
  if (isImageProcessing) return;
  isImageProcessing = true;
  try {
    const { data: generatingStories, error: generatingError } = await supabase
      .from('stories')
      .select('id, image_generation_id')
      .eq('image_status', 'generating')
      .not('image_generation_id', 'is', null);
    if (generatingError) {
      console.error('Error fetching generating image jobs:', generatingError);
      return;
    }
    const { data: retryStories, error: retryError } = await supabase
      .from('stories')
      .select('id, title, description, fandom, image_prompt, image_retry_count, image_last_retry_at, created_at')
      .eq('image_status', 'none')
      .not('image_prompt', 'is', null) 
      .lt('image_retry_count', 5); 
    if (retryError) {
      console.error('Error fetching retry image jobs:', retryError);
    }
    const stories = generatingStories || [];
    const allRetryStories = retryStories || [];
    const readyRetryStories = allRetryStories.filter(isReadyForRetry);
    if (stories && stories.length > 0) {
      console.log(`Processing ${stories.length} image generation jobs`);
      for (const story of stories) {
        if (story.image_generation_id) {
          await checkImageGeneration(story.id, story.image_generation_id);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    if (readyRetryStories && readyRetryStories.length > 0) {
      console.log(`Processing ${readyRetryStories.length} image generation retry jobs (${allRetryStories.length} total pending)`);
      for (const story of readyRetryStories) {
        try {
          const retryCount = story.image_retry_count || 0;
          const nextAttempt = retryCount + 1;
          const retryDelayNames = ['10 minutes', '20 minutes', '1 hour', '2 hours', '3 hours'];
          const delayName = retryDelayNames[retryCount] || '3 hours';
          console.log(`Retrying image generation for story ${story.id} (attempt ${nextAttempt}/5, after ${delayName} delay)`);
          const response = await fetch('https://readitt.pluraldan.link/api/generate-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              storyId: story.id,
              storyTitle: story.title,
              storyDescription: story.description,
              fandom: story.fandom,
              imagePrompt: story.image_prompt
            }),
          });
          if (response.ok) {
            console.log(`Successfully retried image generation for story ${story.id}`);
          } else {
            console.error(`Retry failed for story ${story.id}:`, response.status);
          }
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`Error retrying image generation for story ${story.id}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Image processor error:', error);
  } finally {
    isImageProcessing = false;
  }
}
if (typeof window === 'undefined') { 
  console.log('Starting image queue processor...');
  processImageJobs();
  const imageInterval = setInterval(() => {
    if (!isImageProcessing) {
      processImageJobs();
    }
  }, 10000);
  process.on('SIGINT', () => {
    clearInterval(imageInterval);
  });
}
export async function checkSpecificImage(storyId: string) {
  const { data: story, error } = await supabase
    .from('stories')
    .select('image_generation_id, image_status')
    .eq('id', storyId)
    .single();
  if (error || !story || !story.image_generation_id || story.image_status !== 'generating') {
    return false;
  }
  return await checkImageGeneration(storyId, story.image_generation_id);
}