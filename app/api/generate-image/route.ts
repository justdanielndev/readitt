import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
const AI_HORDE_API_KEY = process.env.AI_HORDE_API_KEY;
const AI_HORDE_BASE_URL = 'https://aihorde.net/api';
export async function POST(request: NextRequest) {
  try {
    const { storyId, storyTitle, storyDescription, fandom, imagePrompt } = await request.json();
    if (!AI_HORDE_API_KEY) {
      console.error('AI_HORDE_API_KEY not configured');
      return NextResponse.json(
        { error: 'Image generation not configured' },
        { status: 500 }
      );
    }
    const finalImagePrompt = imagePrompt || `${fandom} cover art for "${storyTitle}", horizontal composition, landscape orientation, book cover style, high quality, detailed, digital art, illustration`;
    const response = await fetch(`${AI_HORDE_BASE_URL}/v2/generate/async`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': AI_HORDE_API_KEY,
        'Client-Agent': 'readitt:1.0:https://readitt.pluraldan.link'
      },
      body: JSON.stringify({
        prompt: finalImagePrompt,
        params: {
          sampler_name: 'k_euler',
          cfg_scale: 7.5,
          height: 768,
          width: 960,
          steps: 30,
          n: 1
        },
        nsfw: true,
        trusted_workers: true,
        slow_workers: true,
        censor_nsfw: true,
        models: ['AlbedoBase XL (SDXL)', 'stable_diffusion'],
      })
    });
    if (!response.ok) {
      const errorData = await response.text();
      console.error('AI Horde API error:', response.status, errorData);
      return NextResponse.json(
        { error: 'Failed to queue image generation' },
        { status: response.status }
      );
    }
    const result = await response.json();
    const generationId = result.id;
    const { error: updateError } = await supabase
      .from('stories')
      .update({
        image_generation_id: generationId,
        image_prompt: finalImagePrompt,
        image_status: 'generating'
      })
      .eq('id', storyId);
    if (updateError) {
      console.error('Error updating story with image generation ID:', updateError);
      return NextResponse.json(
        { error: 'Failed to update story' },
        { status: 500 }
      );
    }
    return NextResponse.json({
      success: true,
      generationId,
      imagePrompt: finalImagePrompt,
      message: 'Image generation queued successfully'
    });
  } catch (error) {
    console.error('Error in image generation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
async function generateImagePrompt(storyTitle: string, storyDescription: string, fandom: string, chapterContent?: string): Promise<string> {
  try {
    const prompt = `Create an EXTREMELY appealing and eye-catching horizontal cover image prompt for "${storyTitle}" (a ${fandom} story). This needs to be a stunning book cover that will instantly grab new readers' attention and make them want to read the story. 
Make it:
- Visually striking and dramatic
- Professional book cover quality
- Horizontal/landscape orientation (wider than tall)
- Appealing to readers who love ${fandom}
- Atmospheric and cinematic
AVOID any references to children, minors, or kids (censored content).
Story Description: ${storyDescription}
${chapterContent ? `First Chapter Content: ${chapterContent.substring(0, 1000)}...` : ''}
Generate a detailed, marketable cover image prompt that will attract new readers:`;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });
    if (response.ok) {
      const result = await response.json();
      const generatedPrompt = result.content[0].text.trim();
      return `${generatedPrompt}, horizontal composition, landscape orientation, book cover style, high quality, detailed, digital art, illustration`;
    } else {
      console.error('Failed to generate image prompt with Claude');
      return `${fandom} cover art for "${storyTitle}", horizontal composition, landscape orientation, book cover style, high quality, detailed, digital art, illustration`;
    }
  } catch (error) {
    console.error('Error generating image prompt:', error);
    return `${fandom} cover art for "${storyTitle}", horizontal composition, landscape orientation, book cover style, high quality, detailed, digital art, illustration`;
  }
}