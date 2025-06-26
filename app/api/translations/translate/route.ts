import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getCachedTranslation, setCachedTranslation } from '@/lib/translationCache';
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});
export async function POST(request: NextRequest) {
  try {
    const { 
      title, 
      content, 
      target_language, 
      language_info, 
      story_id, 
      chapter_number 
    } = await request.json();
    if (!title || !content || !target_language) {
      return NextResponse.json(
        { error: 'Title, content, and target language are required' },
        { status: 400 }
      );
    }
    const originalContent = {
      title,
      content
    };
    const contentId = story_id && chapter_number ? 
      `${story_id}_ch${chapter_number}` : 
      `${title.substring(0, 50)}_${Date.now()}`;
    const cached = await getCachedTranslation(
      'chapter_content',
      contentId,
      'en', 
      target_language,
      originalContent
    );
    if (cached) {
      console.log(`📦 Using cached chapter translation for ${target_language}:`, contentId);
      return NextResponse.json({
        translated_title: cached.translated_content.title,
        translated_content: cached.translated_content.content,
        notes: cached.translated_content.notes || '',
        cached: true
      });
    }
    console.log(`🌐 Generating new chapter translation for ${target_language}:`, contentId);
    const translationPrompt = `You are a professional translator specializing in creative fiction. Your task is to translate a story chapter while preserving the narrative style, character voices, and emotional impact.
TRANSLATION DETAILS:
- Target Language: ${language_info?.native_name || target_language} (${target_language})
- Currency: ${language_info?.currency_symbol || '$'} (${language_info?.currency_code || 'USD'})
- Date Format: ${language_info?.date_format || 'MM/DD/YYYY'}
- Writing Direction: ${language_info?.rtl ? 'Right-to-left' : 'Left-to-right'}
TRANSLATION GUIDELINES:
1. Maintain the original tone, style, and narrative voice
2. Preserve character personalities and dialogue patterns
3. Adapt cultural references to be understandable in the target culture
4. Convert currency amounts to local currency (${language_info?.currency_symbol || '$'})
5. Adapt date formats to local conventions (${language_info?.date_format || 'MM/DD/YYYY'})
6. Use appropriate local expressions and idioms where suitable
7. Maintain paragraph structure and formatting
8. Keep markdown formatting intact
9. Preserve the emotional impact and reading experience
10. Do NOT add quotation marks, commas, or extra punctuation around the translated title
CONTENT TO TRANSLATE:
Title: ${title}
Content:
${content}
Provide your translation in the following format:
<translated_title>
[Translated title here]
</translated_title>
<translated_content>
[Translated content here, maintaining all formatting and structure]
</translated_content>
<translation_notes>
[Brief notes about any cultural adaptations, currency conversions, or significant translation choices made]
</translation_notes>`;
    console.log(`🌐 Translating to ${target_language}:`, { title, contentLength: content.length });
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 8000,
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
    const contentMatch = fullResponse.match(/<translated_content>([\s\S]*?)<\/translated_content>/);
    const notesMatch = fullResponse.match(/<translation_notes>([\s\S]*?)<\/translation_notes>/);
    if (!titleMatch || !contentMatch) {
      console.error('Failed to extract translation from Claude response');
      return NextResponse.json(
        { error: 'Failed to extract translation from AI response' },
        { status: 500 }
      );
    }
    const translatedTitle = titleMatch[1].trim();
    const translatedContent = contentMatch[1].trim();
    const translationNotes = notesMatch ? notesMatch[1].trim() : '';
    const originalWordCount = content.split(/\s+/).length;
    const translatedWordCount = translatedContent.split(/\s+/).length;
    const lengthRatio = translatedWordCount / originalWordCount;
    let qualityScore = 1.0;
    if (lengthRatio < 0.5 || lengthRatio > 2.0) {
      qualityScore = 0.6; 
    } else if (lengthRatio < 0.7 || lengthRatio > 1.5) {
      qualityScore = 0.8; 
    }
    const translatedContentData = {
      title: translatedTitle,
      content: translatedContent,
      notes: translationNotes
    };
    await setCachedTranslation(
      'chapter_content',
      contentId,
      'en', 
      target_language,
      originalContent,
      translatedContentData,
      qualityScore
    );
    console.log(`✅ Translation completed and cached:`, {
      originalLength: originalWordCount,
      translatedLength: translatedWordCount,
      lengthRatio,
      qualityScore
    });
    return NextResponse.json({
      translated_title: translatedTitle,
      translated_content: translatedContent,
      translation_notes: translationNotes,
      quality_score: qualityScore,
      quality_indicators: {
        length_ratio: lengthRatio,
        original_word_count: originalWordCount,
        translated_word_count: translatedWordCount,
        model_used: 'claude-3-7-sonnet-20250219'
      },
      cached: false
    });
  } catch (error) {
    console.error('Error in translation API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}