import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
const AI_HORDE_BASE_URL = 'https://aihorde.net/api';
export async function POST(request: NextRequest) {
  try {
    const { storyId } = await request.json();
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('image_generation_id, image_status')
      .eq('id', storyId)
      .single();
    if (storyError || !story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }
    if (!story.image_generation_id || story.image_status !== 'generating') {
      return NextResponse.json({
        status: story.image_status || 'none',
        message: 'No image generation in progress'
      });
    }
    const statusResponse = await fetch(
      `${AI_HORDE_BASE_URL}/v2/generate/check/${story.image_generation_id}`,
      {
        headers: {
          'Client-Agent': 'readitt:1.0:https://readitt.pluraldan.link'
        }
      }
    );
    if (!statusResponse.ok) {
      console.error('Failed to check AI Horde status:', statusResponse.status);
      return NextResponse.json(
        { error: 'Failed to check generation status' },
        { status: statusResponse.status }
      );
    }
    const statusData = await statusResponse.json();
    if (statusData.done) {
      const resultResponse = await fetch(
        `${AI_HORDE_BASE_URL}/v2/generate/status/${story.image_generation_id}`,
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
          const imageUrl = generation.img;
          const { error: updateError } = await supabase
            .from('stories')
            .update({
              image_url: imageUrl,
              image_status: 'completed'
            })
            .eq('id', storyId);
          if (updateError) {
            console.error('Error updating story with image URL:', updateError);
          }
          return NextResponse.json({
            status: 'completed',
            imageUrl,
            message: 'Image generation completed'
          });
        }
      }
      await supabase
        .from('stories')
        .update({ image_status: 'failed' })
        .eq('id', storyId);
      return NextResponse.json({
        status: 'failed',
        message: 'Image generation failed'
      });
    } else if (statusData.faulted) {
      await supabase
        .from('stories')
        .update({ image_status: 'failed' })
        .eq('id', storyId);
      return NextResponse.json({
        status: 'failed',
        message: 'Image generation failed'
      });
    } else {
      return NextResponse.json({
        status: 'generating',
        queuePosition: statusData.queue_position,
        waitTime: statusData.wait_time,
        message: `Image generation in progress (queue position: ${statusData.queue_position})`
      });
    }
  } catch (error) {
    console.error('Error checking image generation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}