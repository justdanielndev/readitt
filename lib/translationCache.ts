import { supabase } from './supabase';
import crypto from 'crypto';
export interface CachedTranslation {
  id: string;
  content_type: 'story_metadata' | 'chapter_content';
  content_id: string;
  source_language: string;
  target_language: string;
  original_content: any;
  translated_content: any;
  content_hash: string;
  quality_score?: number;
  created_at: string;
  updated_at: string;
  expires_at: string;
}
export function generateContentHash(content: any): string {
  const contentString = JSON.stringify(content, Object.keys(content).sort());
  return crypto.createHash('sha256').update(contentString, 'utf8').digest('hex');
}
export async function getCachedTranslation(
  contentType: 'story_metadata' | 'chapter_content',
  contentId: string,
  sourceLanguage: string,
  targetLanguage: string,
  originalContent: any
): Promise<CachedTranslation | null> {
  try {
    const contentHash = generateContentHash(originalContent);
    const { data, error } = await supabase
      .from('translation_cache')
      .select('*')
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .eq('source_language', sourceLanguage)
      .eq('target_language', targetLanguage)
      .eq('content_hash', contentHash)
      .gt('expires_at', new Date().toISOString())
      .single();
    if (error || !data) {
      return null;
    }
    return data as CachedTranslation;
  } catch (error) {
    console.error('Error getting cached translation:', error);
    return null;
  }
}
export async function setCachedTranslation(
  contentType: 'story_metadata' | 'chapter_content',
  contentId: string,
  sourceLanguage: string,
  targetLanguage: string,
  originalContent: any,
  translatedContent: any,
  qualityScore?: number
): Promise<boolean> {
  try {
    const contentHash = generateContentHash(originalContent);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    const cacheData = {
      content_type: contentType,
      content_id: contentId,
      source_language: sourceLanguage,
      target_language: targetLanguage,
      original_content: originalContent,
      translated_content: translatedContent,
      content_hash: contentHash,
      quality_score: qualityScore,
      expires_at: expiresAt.toISOString()
    };
    const { error } = await supabase
      .from('translation_cache')
      .upsert(cacheData, {
        onConflict: 'content_type,content_id,source_language,target_language'
      });
    if (error) {
      if (error.code === '42501') {
        console.warn('Translation caching disabled due to RLS policy. Translation will work but won\'t be cached.');
        return false;
      }
      console.error('Error caching translation:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error caching translation:', error);
    return false;
  }
}
export async function isCacheValid(
  contentType: 'story_metadata' | 'chapter_content',
  contentId: string,
  sourceLanguage: string,
  targetLanguage: string,
  currentContent: any
): Promise<boolean> {
  try {
    const currentHash = generateContentHash(currentContent);
    const { data, error } = await supabase
      .from('translation_cache')
      .select('content_hash, expires_at')
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .eq('source_language', sourceLanguage)
      .eq('target_language', targetLanguage)
      .single();
    if (error || !data) {
      return false;
    }
    if (new Date(data.expires_at) < new Date()) {
      return false;
    }
    return data.content_hash === currentHash;
  } catch (error) {
    console.error('Error checking cache validity:', error);
    return false;
  }
}
export async function cleanupExpiredTranslations(): Promise<number> {
  try {
    const { data, error } = await supabase
      .rpc('cleanup_expired_translations');
    if (error) {
      console.error('Error cleaning up expired translations:', error);
      return 0;
    }
    return data || 0;
  } catch (error) {
    console.error('Error cleaning up expired translations:', error);
    return 0;
  }
}
export async function getCacheStats(): Promise<{
  total: number;
  byContentType: Record<string, number>;
  byLanguage: Record<string, number>;
}> {
  try {
    const { data: totalData, error: totalError } = await supabase
      .from('translation_cache')
      .select('content_type, target_language', { count: 'exact' })
      .gt('expires_at', new Date().toISOString());
    if (totalError || !totalData) {
      return { total: 0, byContentType: {}, byLanguage: {} };
    }
    const stats = {
      total: totalData.length,
      byContentType: {} as Record<string, number>,
      byLanguage: {} as Record<string, number>
    };
    totalData.forEach(item => {
      stats.byContentType[item.content_type] = (stats.byContentType[item.content_type] || 0) + 1;
      stats.byLanguage[item.target_language] = (stats.byLanguage[item.target_language] || 0) + 1;
    });
    return stats;
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return { total: 0, byContentType: {}, byLanguage: {} };
  }
}