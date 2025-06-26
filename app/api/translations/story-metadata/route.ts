import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});
export async function POST(request: NextRequest) {
  try {
    const { 
      title, 
      description, 
      tags, 
      fandom,
      target_language, 
      language_info,
      story_id 
    } = await request.json();
    if (!title || !target_language) {
      return NextResponse.json(
        { error: 'Title and target language are required' },
        { status: 400 }
      );
    }
    const originalContent = {
      title,
      description: description || '',
      fandom: fandom || '',
      tags: tags || []
    };
    const contentId = story_id || `${title}_${fandom || 'no_fandom'}`;
    console.log(`🌐 Generating new story metadata translation for ${target_language}:`, contentId);
    const translationPrompt = `You are a professional translator specializing in creative fiction metadata. Your task is to translate story information while preserving meaning and appeal to readers.
TRANSLATION DETAILS:
- Target Language: ${language_info?.native_name || target_language} (${target_language})
- Writing Direction: ${language_info?.rtl ? 'Right-to-left' : 'Left-to-right'}
TRANSLATION GUIDELINES:
1. Translate the story title to be appealing and accurate in the target language
2. Translate the description to maintain the story's appeal and key plot points
3. Translate tags to equivalent terms that readers would search for
4. Keep fandom names in their commonly used form in the target language
5. Maintain the excitement and appeal of the original text
6. Use natural, fluent language that sounds native
7. Avoid using quotation marks in your translated output
CONTENT TO TRANSLATE:
Title: ${title}
${description ? `Description: ${description}` : ''}
${fandom ? `Fandom: ${fandom}` : ''}
${tags && tags.length > 0 ? `Tags: ${tags.join(', ')}` : ''}
Provide your translation in the following format:
<translated_title>
[Translated title here]
</translated_title>
${description ? `<translated_description>
[Translated description here]
</translated_description>` : ''}
${fandom ? `<translated_fandom>
[Translated fandom name here, using the commonly accepted name in the target language]
</translated_fandom>` : ''}
${tags && tags.length > 0 ? `<translated_tags>
[Translated tags here, comma separated]
</translated_tags>` : ''}`;
    console.log(`🌐 Translating story metadata to ${target_language}:`, { title, fandom });
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 2000,
      temperature: 0.3, 
      messages: [
        {
          role: 'user',
          content: translationPrompt
        }
      ]
    });
    const fullResponse = response.content[0].type === 'text' ? response.content[0].text : '';
    const titleMatch = fullResponse.match(/<translated_title>([\s\S]*?)<\/translated_title>/);
    const descriptionMatch = fullResponse.match(/<translated_description>([\s\S]*?)<\/translated_description>/);
    const fandomMatch = fullResponse.match(/<translated_fandom>([\s\S]*?)<\/translated_fandom>/);
    const tagsMatch = fullResponse.match(/<translated_tags>([\s\S]*?)<\/translated_tags>/);
    if (!titleMatch) {
      console.error('Failed to extract title translation from Claude response');
      return NextResponse.json(
        { error: 'Failed to extract translation from AI response' },
        { status: 500 }
      );
    }
    const translatedTitle = titleMatch[1].trim();
    const translatedDescription = descriptionMatch ? descriptionMatch[1].trim() : description;
    const translatedFandom = fandomMatch ? fandomMatch[1].trim() : fandom;
    const translatedTags = tagsMatch ? tagsMatch[1].trim().split(',').map(tag => tag.trim()) : tags;
    const translatedContent = {
      title: translatedTitle,
      description: translatedDescription,
      fandom: translatedFandom,
      tags: translatedTags
    };
    console.log(`✅ Story metadata translation completed and cached`);
    return NextResponse.json({
      translated_title: translatedTitle,
      translated_description: translatedDescription,
      translated_fandom: translatedFandom,
      translated_tags: translatedTags,
      cached: false
    });
  } catch (error) {
    console.error('Error in story metadata translation API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}