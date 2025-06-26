import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { story_id, chapter_number, target_language } = body;
    if (!story_id || typeof story_id !== 'string') {
      return NextResponse.json(
        { error: 'Valid story ID is required' },
        { status: 400 }
      );
    }
    if (!chapter_number || typeof chapter_number !== 'number' || chapter_number < 1) {
      return NextResponse.json(
        { error: 'Valid chapter number (positive integer) is required' },
        { status: 400 }
      );
    }
    if (!target_language || typeof target_language !== 'string' || target_language.length < 2) {
      return NextResponse.json(
        { error: 'Valid target language code is required' },
        { status: 400 }
      );
    }
    const { data: supportedLanguage, error: langError } = await supabase
      .from('supported_languages')
      .select('code, is_active')
      .eq('code', target_language)
      .eq('is_active', true)
      .single();
    if (langError || !supportedLanguage) {
      return NextResponse.json(
        { error: `Language '${target_language}' is not supported or inactive` },
        { status: 400 }
      );
    }
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .select('id, title, content, story_id')
      .eq('story_id', story_id)
      .eq('chapter_number', chapter_number)
      .single();
    if (chapterError || !chapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }
    const { data: existingTranslation, error: translationCheckError } = await supabase
      .from('translations')
      .select('id')
      .eq('story_id', story_id)
      .eq('chapter_number', chapter_number)
      .eq('target_language', target_language)
      .single();
    if (translationCheckError && translationCheckError.code !== 'PGRST116') {
      console.error('Error checking existing translation:', translationCheckError);
      return NextResponse.json(
        { error: 'Failed to check existing translation' },
        { status: 500 }
      );
    }
    if (existingTranslation) {
      return NextResponse.json(
        { 
          error: 'Translation already exists for this chapter and language',
          existing_translation_id: existingTranslation.id 
        },
        { status: 409 }
      );
    }
    const { data: pendingRequest, error: pendingError } = await supabase
      .from('translation_requests')
      .select('id, status, created_at')
      .eq('story_id', story_id)
      .eq('chapter_number', chapter_number)
      .eq('target_language', target_language)
      .in('status', ['pending', 'processing'])
      .single();
    if (pendingError && pendingError.code !== 'PGRST116') {
      console.error('Error checking pending requests:', pendingError);
      return NextResponse.json(
        { error: 'Failed to check existing requests' },
        { status: 500 }
      );
    }
    if (pendingRequest) {
      return NextResponse.json(
        { 
          error: `Translation request already ${pendingRequest.status}`,
          existing_request_id: pendingRequest.id,
          status: pendingRequest.status,
          created_at: pendingRequest.created_at
        },
        { status: 409 }
      );
    }
    const userSessionId = request.headers.get('x-session-id') || 
                         request.headers.get('x-forwarded-for') || 
                         `anonymous-${Date.now()}-${Math.random()}`;
    const { data: translationRequest, error: requestError } = await supabase
      .from('translation_requests')
      .insert([
        {
          story_id,
          chapter_number,
          target_language,
          requested_by_session: userSessionId,
          status: 'pending'
        }
      ])
      .select()
      .single();
    if (requestError) {
      console.error('Error creating translation request:', requestError);
      return NextResponse.json(
        { error: 'Failed to create translation request' },
        { status: 500 }
      );
    }
    processTranslation(story_id, chapter_number, target_language, chapter.title, chapter.content);
    return NextResponse.json({
      success: true,
      request_id: translationRequest.id,
      message: 'Translation request created successfully',
      estimated_completion: new Date(Date.now() + 60000).toISOString(), 
      polling_url: `/api/translations/status?story_id=${story_id}&chapter_number=${chapter_number}&target_language=${target_language}`
    });
  } catch (error) {
    console.error('Error in translation request API:', error);
    const isDevelopment = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      { 
        error: 'Internal server error',
        ...(isDevelopment && { 
          details: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        })
      },
      { status: 500 }
    );
  }
}
async function processTranslation(
  storyId: string, 
  chapterNumber: number, 
  targetLanguage: string, 
  originalTitle: string, 
  originalContent: string
) {
  try {
    await supabase
      .from('translation_requests')
      .update({ 
        status: 'processing',
        processing_started_at: new Date().toISOString()
      })
      .eq('story_id', storyId)
      .eq('chapter_number', chapterNumber)
      .eq('target_language', targetLanguage);
    const { data: languageInfo } = await supabase
      .from('supported_languages')
      .select('*')
      .eq('code', targetLanguage)
      .single();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); 
    try {
      const response = await fetch(`https://readitt.pluraldan.link/api/translations/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: originalTitle,
          content: originalContent,
          target_language: targetLanguage,
          language_info: languageInfo,
          story_id: storyId,
          chapter_number: chapterNumber
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        const translationResult = await response.json();
        if (!translationResult.translated_title || !translationResult.translated_content) {
          throw new Error('Invalid translation result: missing title or content');
        }
      await supabase
        .from('translations')
        .insert([
          {
            story_id: storyId,
            chapter_number: chapterNumber,
            target_language: targetLanguage,
            original_language: 'en',
            translated_title: translationResult.translated_title,
            translated_content: translationResult.translated_content,
            translator_type: 'ai',
            translator_info: {
              model: 'claude-sonnet-4',
              timestamp: new Date().toISOString(),
              quality_indicators: translationResult.quality_indicators || {}
            },
            quality_score: translationResult.quality_score || null
          }
        ]);
        await supabase
          .from('translation_requests')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('story_id', storyId)
          .eq('chapter_number', chapterNumber)
          .eq('target_language', targetLanguage);
      } else {
        const errorText = await response.text();
        throw new Error(`Translation API failed: ${response.status} ${response.statusText} - ${errorText}`);
      }
    } catch (fetchError) {
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error('Translation request timed out after 2 minutes');
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Error processing translation:', error);
    await supabase
      .from('translation_requests')
      .update({ 
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      })
      .eq('story_id', storyId)
      .eq('chapter_number', chapterNumber)
      .eq('target_language', targetLanguage);
  }
}