import { createClient } from '@supabase/supabase-js'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
export type Database = {
  public: {
    Tables: {
      stories: {
        Row: {
          id: string
          title: string
          fandom: string
          genre: string[]
          description: string
          tags: string[]
          author: string
          total_chapters: number
          conversation_history: Array<{ role: 'user' | 'assistant'; content: string }>
          characters: string
          topics: string
          theme: string
          last_updated: string
          created_at: string
          is_private: boolean
          share_token: string
          created_by_session: string | null
          image_url: string | null
          image_generation_id: string | null
          image_prompt: string | null
          image_status: 'none' | 'generating' | 'completed' | 'failed'
          image_retry_count: number
          image_last_retry_at: string | null
          author_user_id: string | null
          allow_ai_continuation: boolean
          story_status: 'active' | 'completed' | 'paused'
        }
        Insert: {
          id?: string
          title: string
          fandom: string
          genre: string[]
          description: string
          tags: string[]
          author: string
          total_chapters: number
          conversation_history?: Array<{ role: 'user' | 'assistant'; content: string }>
          characters?: string
          topics?: string
          theme?: string
          last_updated?: string
          created_at?: string
          is_private?: boolean
          share_token?: string
          created_by_session?: string
          image_url?: string | null
          image_generation_id?: string | null
          image_prompt?: string | null
          image_status?: 'none' | 'generating' | 'completed' | 'failed'
          image_retry_count?: number
          image_last_retry_at?: string | null
          author_user_id?: string | null
          allow_ai_continuation?: boolean
          story_status?: 'active' | 'completed' | 'paused'
        }
        Update: {
          id?: string
          title?: string
          fandom?: string
          genre?: string[]
          description?: string
          tags?: string[]
          author?: string
          total_chapters?: number
          conversation_history?: Array<{ role: 'user' | 'assistant'; content: string }>
          characters?: string
          topics?: string
          theme?: string
          last_updated?: string
          created_at?: string
          image_url?: string | null
          image_generation_id?: string | null
          image_prompt?: string | null
          image_status?: 'none' | 'generating' | 'completed' | 'failed'
          image_retry_count?: number
          image_last_retry_at?: string | null
          author_user_id?: string | null
          allow_ai_continuation?: boolean
          story_status?: 'active' | 'completed' | 'paused'
        }
      }
      chapters: {
        Row: {
          id: string
          story_id: string
          chapter_number: number
          title: string
          content: string
          reading_time: string
          upvotes: number
          downvotes: number
          created_at: string
          creation_source: 'ai' | 'author'
          author_notes: string | null
        }
        Insert: {
          id?: string
          story_id: string
          chapter_number: number
          title: string
          content: string
          reading_time: string
          upvotes?: number
          downvotes?: number
          created_at?: string
          creation_source?: 'ai' | 'author'
          author_notes?: string | null
        }
        Update: {
          id?: string
          story_id?: string
          chapter_number?: number
          title?: string
          content?: string
          reading_time?: string
          upvotes?: number
          downvotes?: number
          created_at?: string
          creation_source?: 'ai' | 'author'
          author_notes?: string | null
        }
      }
      votes: {
        Row: {
          id: string
          story_id: string
          chapter_number: number
          vote_type: 'up' | 'down'
          reasons: string[]
          user_session_id: string
          created_at: string
        }
        Insert: {
          id?: string
          story_id: string
          chapter_number: number
          vote_type: 'up' | 'down'
          reasons: string[]
          user_session_id: string
          created_at?: string
        }
        Update: {
          id?: string
          story_id?: string
          chapter_number?: number
          vote_type?: 'up' | 'down'
          reasons?: string[]
          user_session_id?: string
          created_at?: string
        }
      }
      user_ids: {
        Row: {
          user_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          created_at?: string
        }
        Update: {
          user_id?: string
          created_at?: string
        }
      }
      invite_codes: {
        Row: {
          id: string
          code: string
          is_active: boolean
          usage_count: number
          max_uses: number | null
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          is_active?: boolean
          usage_count?: number
          max_uses?: number | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          is_active?: boolean
          usage_count?: number
          max_uses?: number | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}