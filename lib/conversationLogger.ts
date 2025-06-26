import { supabase } from './supabase';
export interface ConversationLog {
  story_id: string;
  chapter_number: number;
  conversation_type: 'story_generation' | 'chapter_continuation' | 'translation';
  user_input: any;
  ai_response: any;
  model_used: string;
  token_count?: number;
  quality_score?: number;
  processing_time_ms?: number;
}
export async function logConversation(log: ConversationLog): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('conversations')
      .insert([{
        story_id: log.story_id,
        chapter_number: log.chapter_number,
        conversation_type: log.conversation_type,
        user_input: log.user_input,
        ai_response: log.ai_response,
        model_used: log.model_used,
        token_count: log.token_count,
        quality_score: log.quality_score,
        processing_time_ms: log.processing_time_ms
      }]);
    if (error) {
      console.error('Error logging conversation:', error);
      return false;
    }
    console.log(`📝 Conversation logged: ${log.conversation_type} for story ${log.story_id}, chapter ${log.chapter_number}`);
    return true;
  } catch (error) {
    console.error('Error logging conversation:', error);
    return false;
  }
}
export async function getConversationHistory(
  storyId: string, 
  conversationType?: 'story_generation' | 'chapter_continuation' | 'translation'
): Promise<any[]> {
  try {
    let query = supabase
      .from('conversations')
      .select('*')
      .eq('story_id', storyId)
      .order('created_at', { ascending: true });
    if (conversationType) {
      query = query.eq('conversation_type', conversationType);
    }
    const { data, error } = await query;
    if (error) {
      console.error('Error getting conversation history:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('Error getting conversation history:', error);
    return [];
  }
}
export async function getConversationStats(): Promise<{
  total: number;
  byType: Record<string, number>;
  byModel: Record<string, number>;
  totalTokens: number;
  averageProcessingTime: number;
}> {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('conversation_type, model_used, token_count, processing_time_ms');
    if (error || !data) {
      return {
        total: 0,
        byType: {},
        byModel: {},
        totalTokens: 0,
        averageProcessingTime: 0
      };
    }
    const stats = {
      total: data.length,
      byType: {} as Record<string, number>,
      byModel: {} as Record<string, number>,
      totalTokens: 0,
      averageProcessingTime: 0
    };
    let totalProcessingTime = 0;
    let processingTimeCount = 0;
    data.forEach(item => {
      stats.byType[item.conversation_type] = (stats.byType[item.conversation_type] || 0) + 1;
      stats.byModel[item.model_used] = (stats.byModel[item.model_used] || 0) + 1;
      if (item.token_count) {
        stats.totalTokens += item.token_count;
      }
      if (item.processing_time_ms) {
        totalProcessingTime += item.processing_time_ms;
        processingTimeCount++;
      }
    });
    if (processingTimeCount > 0) {
      stats.averageProcessingTime = Math.round(totalProcessingTime / processingTimeCount);
    }
    return stats;
  } catch (error) {
    console.error('Error getting conversation stats:', error);
    return {
      total: 0,
      byType: {},
      byModel: {},
      totalTokens: 0,
      averageProcessingTime: 0
    };
  }
}