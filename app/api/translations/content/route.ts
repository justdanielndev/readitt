import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
const translationCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const CACHE_TTL = 30 * 60 * 1000; 
function getCacheKey(storyId: string, chapterNumber: string, targetLanguage: string): string {
  return `translation:${storyId}:${chapterNumber}:${targetLanguage}`;
}
function getCachedTranslation(key: string) {
  const cached = translationCache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }
  if (cached) {
    translationCache.delete(key); 
  }
  return null;
}
function setCachedTranslation(key: string, data: any, ttl: number = CACHE_TTL) {
  translationCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
}
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storyId = searchParams.get('story_id');
    const chapterNumber = searchParams.get('chapter_number');
    const targetLanguage = searchParams.get('target_language');
    if (!storyId || !chapterNumber || !targetLanguage) {
      return NextResponse.json({ 
        error: 'Missing required parameters: story_id, chapter_number, target_language' 
      }, { status: 400 });
    }
    const cacheKey = getCacheKey(storyId, chapterNumber, targetLanguage);
    const cachedResult = getCachedTranslation(cacheKey);
    if (cachedResult) {
      const response = NextResponse.json({
        ...cachedResult,
        cached: true,
        cache_timestamp: new Date().toISOString()
      });
      response.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=7200'); 
      response.headers.set('X-Translation-Cached', 'true');
      return response;
    }
    const { data: translation, error } = await supabase
      .from('translations')
      .select(`
        id,
        translated_title,
        translated_content,
        target_language,
        quality_score,
        created_at,
        updated_at,
        usage_count
      `)
      .eq('story_id', storyId)
      .eq('chapter_number', parseInt(chapterNumber))
      .eq('target_language', targetLanguage)
      .single();
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ 
          error: 'Translation not found',
          available: false 
        }, { status: 404 });
      }
      console.error('Database error:', error);
      return NextResponse.json({ 
        error: 'Failed to retrieve translation' 
      }, { status: 500 });
    }
    const { error: updateError } = await supabase
      .from('translations')
      .update({ 
        usage_count: (translation.usage_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', translation.id);
    if (updateError) {
      console.error('Failed to update usage count:', updateError);
    }
    const { data: originalChapter, error: chapterError } = await supabase
      .from('chapters')
      .select('title, content')
      .eq('story_id', storyId)
      .eq('chapter_number', parseInt(chapterNumber))
      .single();
    if (chapterError) {
      console.error('Failed to get original chapter:', chapterError);
    }
    const result = {
      success: true,
      translation: {
        id: translation.id,
        title: translation.translated_title,
        content: translation.translated_content,
        language: translation.target_language,
        quality_score: translation.quality_score,
        created_at: translation.created_at,
        usage_count: translation.usage_count
      },
      original: originalChapter ? {
        title: originalChapter.title,
        content: originalChapter.content
      } : null,
      metadata: {
        story_id: storyId,
        chapter_number: parseInt(chapterNumber),
        target_language: targetLanguage
      },
      cached: false
    };
    setCachedTranslation(cacheKey, result);
    const response = NextResponse.json(result);
    response.headers.set('Cache-Control', 'public, max-age=1800, s-maxage=3600'); 
    response.headers.set('X-Translation-Cached', 'false');
    return response;
  } catch (error) {
    console.error('Translation content API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}