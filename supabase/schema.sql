-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to update last_updated timestamp
CREATE OR REPLACE FUNCTION update_last_updated_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update updated_at timestamp (generic)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update comment updated_at timestamp
CREATE OR REPLACE FUNCTION update_comment_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update translation updated_at timestamp
CREATE OR REPLACE FUNCTION update_translation_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update translation cache updated_at timestamp
CREATE OR REPLACE FUNCTION update_translation_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update conversations updated_at timestamp
CREATE OR REPLACE FUNCTION update_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  usage_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fandoms table
CREATE TABLE IF NOT EXISTS fandoms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  usage_count INTEGER DEFAULT 1,
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User IDs table (for local accounts)
CREATE TABLE IF NOT EXISTS user_ids (
  user_id UUID PRIMARY KEY,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Users table (for Slack authentication)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slack_user_id TEXT UNIQUE NOT NULL,
  slack_team_id TEXT NOT NULL,
  slack_team_name TEXT,
  username TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  access_token TEXT NOT NULL,
  has_plus BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stories table
CREATE TABLE stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    fandom TEXT NOT NULL,
    fandom_id UUID REFERENCES fandoms(id),
    genre TEXT[] NOT NULL DEFAULT '{}',
    description TEXT NOT NULL DEFAULT 'An AI-generated story',
    tags TEXT[] NOT NULL DEFAULT '{}',
    tag_ids UUID[] DEFAULT '{}',
    author TEXT NOT NULL DEFAULT 'Claude',
    author_user_id UUID,
    total_chapters INTEGER NOT NULL DEFAULT 1,
    conversation_history JSONB DEFAULT '[]',
    characters TEXT DEFAULT '',
    topics TEXT DEFAULT '',
    theme TEXT DEFAULT '',
    
    -- Privacy and sharing
    is_private BOOLEAN NOT NULL DEFAULT false,
    share_token UUID DEFAULT uuid_generate_v4(),
    created_by_session TEXT,
    
    -- Image generation
    image_url TEXT,
    image_generation_id TEXT,
    image_prompt TEXT,
    image_status TEXT DEFAULT 'none' CHECK (image_status IN ('none', 'generating', 'completed', 'failed')),
    image_retry_count INTEGER DEFAULT 0,
    image_last_retry_at TIMESTAMP,
    
    -- Story management
    allow_ai_continuation BOOLEAN DEFAULT true,
    story_status TEXT DEFAULT 'active' CHECK (story_status IN ('active', 'completed', 'paused')),
    
    -- Content warnings
    content_warnings TEXT[] NOT NULL DEFAULT '{}',
    is_nsfw BOOLEAN NOT NULL DEFAULT false,
    age_rating TEXT NOT NULL DEFAULT 'all-ages' CHECK (age_rating IN ('all-ages', '13+', '16+', '18+')),
    
    -- Comments and translations
    comment_count INTEGER NOT NULL DEFAULT 0,
    available_languages TEXT[] NOT NULL DEFAULT '{"en"}',
    
    -- Timestamps
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chapters table
CREATE TABLE chapters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    chapter_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    reading_time TEXT NOT NULL DEFAULT '3 min',
    upvotes INTEGER NOT NULL DEFAULT 0,
    downvotes INTEGER NOT NULL DEFAULT 0,
    creation_source TEXT DEFAULT 'ai' CHECK (creation_source IN ('ai', 'author')),
    author_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(story_id, chapter_number)
);

-- Votes table
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    chapter_number INTEGER NOT NULL,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
    reasons TEXT[] NOT NULL DEFAULT '{}',
    user_session_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(story_id, chapter_number, user_session_id)
);

-- Chapter generation jobs table
CREATE TABLE chapter_generation_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  chapter_number INT NOT NULL,
  trigger TEXT NOT NULL CHECK (trigger IN ('rating', 'story_creation')),
  user_feedback JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  attempts INT DEFAULT 0,
  error_message TEXT
);

-- Invite codes table
CREATE TABLE invite_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    usage_count INTEGER NOT NULL DEFAULT 0,
    max_uses INTEGER NULL,
    expires_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- CONTENT WARNINGS
-- =============================================================================

-- Available content warnings reference table
CREATE TABLE IF NOT EXISTS available_content_warnings (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('violence', 'sexual', 'substance', 'psychological', 'other')),
    severity TEXT NOT NULL CHECK (severity IN ('mild', 'moderate', 'strong')),
    requires_18_plus BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- COMMENTS SYSTEM
-- =============================================================================

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    chapter_number INTEGER, -- NULL for story-level comments, specific number for chapter comments
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- For nested replies
    author_name TEXT NOT NULL,
    author_email TEXT, -- Optional, for notifications
    author_session_id TEXT NOT NULL, -- Track user sessions for moderation
    content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 2000),
    is_spoiler BOOLEAN NOT NULL DEFAULT false,
    upvotes INTEGER NOT NULL DEFAULT 0,
    downvotes INTEGER NOT NULL DEFAULT 0,
    is_pinned BOOLEAN NOT NULL DEFAULT false, -- Story authors can pin comments
    is_deleted BOOLEAN NOT NULL DEFAULT false, -- Soft delete for moderation
    is_flagged BOOLEAN NOT NULL DEFAULT false, -- Flagged for review
    flag_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_content_length CHECK (char_length(trim(content)) >= 1),
    CONSTRAINT valid_chapter_number CHECK (chapter_number IS NULL OR chapter_number > 0)
);

-- Comment votes table
CREATE TABLE IF NOT EXISTS comment_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_session_id TEXT NOT NULL,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one vote per user per comment
    UNIQUE(comment_id, user_session_id)
);

-- Comment flags table
CREATE TABLE IF NOT EXISTS comment_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    flagger_session_id TEXT NOT NULL,
    reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'spoiler', 'off_topic', 'other')),
    description TEXT, -- Optional additional details
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate flags from same user
    UNIQUE(comment_id, flagger_session_id)
);

-- =============================================================================
-- CHAPTER REACTIONS
-- =============================================================================

-- Chapter reactions table
CREATE TABLE IF NOT EXISTS chapter_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- Local user ID
  username TEXT NOT NULL,
  reaction TEXT NOT NULL CHECK (reaction IN ('😍', '😭', '🔥', '😱')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one reaction per user per chapter
  UNIQUE(chapter_id, user_id)
);

-- =============================================================================
-- PLAYLISTS
-- =============================================================================

-- Playlists table
CREATE TABLE IF NOT EXISTS playlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  user_id TEXT NOT NULL, -- Local user ID
  username TEXT NOT NULL,
  is_public BOOLEAN DEFAULT false,
  cover_color TEXT DEFAULT 'rose', -- Color theme for playlist
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Playlist stories junction table
CREATE TABLE IF NOT EXISTS playlist_stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sort_order INTEGER DEFAULT 0,
  
  -- Ensure unique story per playlist
  UNIQUE(playlist_id, story_id)
);

-- =============================================================================
-- ONE-OFFS
-- =============================================================================

-- One-offs table for standalone chapters
CREATE TABLE IF NOT EXISTS one_offs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_user_id TEXT NOT NULL,
  author TEXT NOT NULL,
  original_story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  original_chapter_number INTEGER NOT NULL,
  description TEXT,
  tags TEXT[],
  content_warnings TEXT[],
  age_rating TEXT DEFAULT 'all-ages',
  is_nsfw BOOLEAN DEFAULT FALSE,
  fandom TEXT,
  reading_time TEXT DEFAULT '5 min',
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- TRANSLATION SYSTEM
-- =============================================================================

-- Translation cache table
CREATE TABLE IF NOT EXISTS translation_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_type VARCHAR(50) NOT NULL, -- 'story_metadata', 'chapter_content'
    content_id VARCHAR(255) NOT NULL, -- story_id or story_id:chapter_number
    source_language VARCHAR(10) NOT NULL DEFAULT 'en',
    target_language VARCHAR(10) NOT NULL,
    original_content JSONB NOT NULL, -- Original content that was translated
    translated_content JSONB NOT NULL, -- Translated content
    content_hash VARCHAR(64) NOT NULL, -- SHA-256 hash of original content for cache validation
    quality_score DECIMAL(3,2), -- Translation quality score (0.00 to 1.00)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'), -- Cache expiration
    
    UNIQUE(content_type, content_id, source_language, target_language)
);

-- Supported languages reference table
CREATE TABLE IF NOT EXISTS supported_languages (
    code TEXT PRIMARY KEY, -- ISO 639-1 code
    name TEXT NOT NULL, -- English name
    native_name TEXT NOT NULL, -- Native name
    flag_emoji TEXT NOT NULL, -- Flag emoji
    rtl BOOLEAN NOT NULL DEFAULT false, -- Right-to-left script
    currency_code TEXT, -- ISO 4217 currency code for local expressions
    currency_symbol TEXT, -- Currency symbol
    date_format TEXT DEFAULT 'MM/DD/YYYY', -- Local date format
    number_format TEXT DEFAULT 'en-US', -- Number formatting locale
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Translations table
CREATE TABLE IF NOT EXISTS translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    chapter_number INTEGER NOT NULL,
    target_language TEXT NOT NULL, -- ISO 639-1 language codes (en, es, fr, de, ja, etc.)
    original_language TEXT NOT NULL DEFAULT 'en',
    translated_title TEXT NOT NULL,
    translated_content TEXT NOT NULL,
    translator_type TEXT NOT NULL DEFAULT 'ai' CHECK (translator_type IN ('ai', 'human', 'community')),
    translator_info JSONB DEFAULT '{}', -- Store translator details, model used, etc.
    quality_score DECIMAL(3,2) DEFAULT NULL, -- 0.00 to 1.00 quality rating
    is_approved BOOLEAN NOT NULL DEFAULT true, -- For community translations
    usage_count INTEGER NOT NULL DEFAULT 0, -- Track how often this translation is accessed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one translation per chapter per language
    UNIQUE(story_id, chapter_number, target_language)
);

-- Translation requests table
CREATE TABLE IF NOT EXISTS translation_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    chapter_number INTEGER NOT NULL,
    target_language TEXT NOT NULL REFERENCES supported_languages(code),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    priority INTEGER NOT NULL DEFAULT 5, -- 1-10, higher = more priority
    requested_by_session TEXT, -- User session who requested it
    error_message TEXT,
    processing_started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate requests
    UNIQUE(story_id, chapter_number, target_language)
);

-- =============================================================================
-- CONVERSATIONS
-- =============================================================================

-- Conversations table to store AI interactions
CREATE TABLE IF NOT EXISTS conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    chapter_number INTEGER NOT NULL,
    conversation_type VARCHAR(50) NOT NULL, -- 'story_generation', 'chapter_continuation', 'translation'
    user_input JSONB NOT NULL, -- What the user sent to AI
    ai_response JSONB NOT NULL, -- What AI responded back
    model_used VARCHAR(100) NOT NULL, -- Which AI model was used
    token_count INTEGER, -- Number of tokens used
    quality_score DECIMAL(3,2), -- Quality assessment if available
    processing_time_ms INTEGER, -- How long it took to process
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Tags indexes
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_tags_usage_count ON tags(usage_count DESC);

-- Fandoms indexes
CREATE INDEX IF NOT EXISTS idx_fandoms_name ON fandoms(name);
CREATE INDEX IF NOT EXISTS idx_fandoms_category ON fandoms(category);
CREATE INDEX IF NOT EXISTS idx_fandoms_usage_count ON fandoms(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_fandoms_is_custom ON fandoms(is_custom);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_slack_user_id ON users(slack_user_id);
CREATE INDEX IF NOT EXISTS idx_users_slack_team_id ON users(slack_team_id);
CREATE INDEX IF NOT EXISTS idx_users_has_plus ON users(has_plus);

-- Stories indexes
CREATE INDEX idx_stories_fandom ON stories(fandom);
CREATE INDEX idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_fandom_id ON stories(fandom_id);
CREATE INDEX idx_stories_share_token ON stories(share_token);
CREATE INDEX IF NOT EXISTS stories_author_user_id_idx ON stories (author_user_id);
CREATE INDEX IF NOT EXISTS idx_stories_content_warnings ON stories USING GIN (content_warnings);
CREATE INDEX IF NOT EXISTS idx_stories_is_nsfw ON stories (is_nsfw);
CREATE INDEX IF NOT EXISTS idx_stories_age_rating ON stories (age_rating);

-- Chapters indexes
CREATE INDEX idx_chapters_story_id ON chapters(story_id);
CREATE INDEX idx_chapters_chapter_number ON chapters(chapter_number);

-- Votes indexes
CREATE INDEX idx_votes_story_id ON votes(story_id);
CREATE INDEX idx_votes_user_session ON votes(user_session_id);

-- Chapter generation jobs indexes
CREATE INDEX idx_chapter_generation_jobs_status ON chapter_generation_jobs(status);
CREATE INDEX idx_chapter_generation_jobs_story_id ON chapter_generation_jobs(story_id);
CREATE INDEX idx_chapter_generation_jobs_created_at ON chapter_generation_jobs(created_at);

-- Invite codes indexes
CREATE INDEX idx_invite_codes_code ON invite_codes(code);
CREATE INDEX idx_invite_codes_active ON invite_codes(is_active);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_story_id ON comments(story_id);
CREATE INDEX IF NOT EXISTS idx_comments_chapter_number ON comments(chapter_number);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_author_session ON comments(author_session_id);
CREATE INDEX IF NOT EXISTS idx_comments_not_deleted ON comments(story_id, is_deleted, created_at DESC) WHERE is_deleted = false;

-- Comment votes indexes
CREATE INDEX IF NOT EXISTS idx_comment_votes_comment_id ON comment_votes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_votes_user_session ON comment_votes(user_session_id);

-- Comment flags indexes
CREATE INDEX IF NOT EXISTS idx_comment_flags_comment_id ON comment_flags(comment_id);

-- Chapter reactions indexes
CREATE INDEX IF NOT EXISTS idx_chapter_reactions_chapter ON chapter_reactions(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_reactions_user ON chapter_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_chapter_reactions_reaction ON chapter_reactions(reaction);
CREATE INDEX IF NOT EXISTS idx_chapter_reactions_created_at ON chapter_reactions(created_at);

-- Playlists indexes
CREATE INDEX IF NOT EXISTS idx_playlists_user ON playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_playlists_public ON playlists(is_public);
CREATE INDEX IF NOT EXISTS idx_playlists_created_at ON playlists(created_at);
CREATE INDEX IF NOT EXISTS idx_playlist_stories_playlist ON playlist_stories(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_stories_story ON playlist_stories(story_id);
CREATE INDEX IF NOT EXISTS idx_playlist_stories_order ON playlist_stories(playlist_id, sort_order);

-- One-offs indexes
CREATE INDEX IF NOT EXISTS idx_one_offs_author ON one_offs(author_user_id);
CREATE INDEX IF NOT EXISTS idx_one_offs_original_story ON one_offs(original_story_id);
CREATE INDEX IF NOT EXISTS idx_one_offs_created_at ON one_offs(created_at);
CREATE INDEX IF NOT EXISTS idx_one_offs_fandom ON one_offs(fandom);

-- Translation cache indexes
CREATE INDEX idx_translation_cache_lookup ON translation_cache(content_type, content_id, source_language, target_language);
CREATE INDEX idx_translation_cache_expiry ON translation_cache(expires_at);
CREATE INDEX idx_translation_cache_hash ON translation_cache(content_hash);

-- Available content warnings indexes
CREATE INDEX IF NOT EXISTS idx_available_content_warnings_category ON available_content_warnings (category);

-- Translations indexes
CREATE INDEX IF NOT EXISTS idx_translations_story_chapter ON translations(story_id, chapter_number);
CREATE INDEX IF NOT EXISTS idx_translations_language ON translations(target_language);
CREATE INDEX IF NOT EXISTS idx_translations_usage ON translations(usage_count DESC);

-- Translation requests indexes
CREATE INDEX IF NOT EXISTS idx_translation_requests_status ON translation_requests(status, created_at);
CREATE INDEX IF NOT EXISTS idx_translation_requests_priority ON translation_requests(priority DESC, created_at);

-- Conversations indexes
CREATE INDEX idx_conversations_story_id ON conversations(story_id);
CREATE INDEX idx_conversations_chapter ON conversations(story_id, chapter_number);
CREATE INDEX idx_conversations_type ON conversations(conversation_type);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_reactions DISABLE ROW LEVEL SECURITY; -- Temporarily disabled for local auth
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE one_offs ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE supported_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE available_content_warnings ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- POLICIES
-- =============================================================================

-- Stories policies
CREATE POLICY "Public stories are readable" ON stories FOR SELECT USING (is_private = false);
CREATE POLICY "Private stories are readable via share token" ON stories FOR SELECT USING (is_private = true);
CREATE POLICY "Stories are publicly writable" ON stories FOR INSERT WITH CHECK (true);
CREATE POLICY "Stories are publicly updatable" ON stories FOR UPDATE USING (true);

-- Chapters policies
CREATE POLICY "Chapters are publicly readable" ON chapters FOR SELECT USING (true);
CREATE POLICY "Chapters are publicly writable" ON chapters FOR INSERT WITH CHECK (true);
CREATE POLICY "Chapters are publicly updatable" ON chapters FOR UPDATE USING (true);

-- Votes policies
CREATE POLICY "Votes are publicly readable" ON votes FOR SELECT USING (true);
CREATE POLICY "Votes are publicly writable" ON votes FOR INSERT WITH CHECK (true);

-- Chapter generation jobs policies
CREATE POLICY "Allow all operations on chapter_generation_jobs" ON chapter_generation_jobs
FOR ALL USING (true) WITH CHECK (true);

-- Invite codes policies
CREATE POLICY "Invite codes are publicly readable" ON invite_codes FOR SELECT USING (true);

-- Users policies
CREATE POLICY "Anyone can create users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all reads" ON users FOR SELECT USING (true);
CREATE POLICY "Allow all updates" ON users FOR UPDATE USING (true);

-- Comments policies
CREATE POLICY "Comments are publicly readable" ON comments FOR SELECT USING (is_deleted = false);
CREATE POLICY "Comments are publicly writable" ON comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Comments can be updated by author" ON comments FOR UPDATE USING (true);

-- Comment votes policies
CREATE POLICY "Comment votes are publicly readable" ON comment_votes FOR SELECT USING (true);
CREATE POLICY "Comment votes are publicly writable" ON comment_votes FOR INSERT WITH CHECK (true);

-- Comment flags policies
CREATE POLICY "Comment flags are publicly writable" ON comment_flags FOR INSERT WITH CHECK (true);

-- Playlists policies
CREATE POLICY "Users can view own playlists" ON playlists
  FOR SELECT USING (user_id = current_setting('app.user_id', true));
CREATE POLICY "Anyone can view public playlists" ON playlists
  FOR SELECT USING (is_public = true);
CREATE POLICY "Users can insert own playlists" ON playlists
  FOR INSERT WITH CHECK (user_id = current_setting('app.user_id', true));
CREATE POLICY "Users can update own playlists" ON playlists
  FOR UPDATE USING (user_id = current_setting('app.user_id', true));
CREATE POLICY "Users can delete own playlists" ON playlists
  FOR DELETE USING (user_id = current_setting('app.user_id', true));

-- Playlist stories policies
CREATE POLICY "Users can view playlist stories for accessible playlists" ON playlist_stories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM playlists p 
      WHERE p.id = playlist_id 
      AND (p.user_id = current_setting('app.user_id', true) OR p.is_public = true)
    )
  );
CREATE POLICY "Users can manage stories in own playlists" ON playlist_stories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM playlists p 
      WHERE p.id = playlist_id 
      AND p.user_id = current_setting('app.user_id', true)
    )
  );

-- One-offs policies
CREATE POLICY "Users can view own one-offs" ON one_offs
  FOR SELECT USING (author_user_id = auth.uid()::text);
CREATE POLICY "Users can insert own one-offs" ON one_offs
  FOR INSERT WITH CHECK (author_user_id = auth.uid()::text);
CREATE POLICY "Users can update own one-offs" ON one_offs
  FOR UPDATE USING (author_user_id = auth.uid()::text);
CREATE POLICY "Users can delete own one-offs" ON one_offs
  FOR DELETE USING (author_user_id = auth.uid()::text);

-- Translation cache policies
CREATE POLICY "Translation cache is publicly readable" ON translation_cache FOR SELECT USING (true);
CREATE POLICY "Translation cache is publicly writable" ON translation_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "Translation cache is publicly updatable" ON translation_cache FOR UPDATE USING (true);

-- Supported languages policies
CREATE POLICY "Supported languages are publicly readable" ON supported_languages FOR SELECT USING (true);

-- Translations policies
CREATE POLICY "Translations are publicly readable" ON translations FOR SELECT USING (true);
CREATE POLICY "Translations are publicly writable" ON translations FOR INSERT WITH CHECK (true);

-- Translation requests policies
CREATE POLICY "Translation requests are publicly readable" ON translation_requests FOR SELECT USING (true);
CREATE POLICY "Translation requests are publicly writable" ON translation_requests FOR INSERT WITH CHECK (true);

-- Conversations policies
CREATE POLICY "Conversations are publicly readable" ON conversations FOR SELECT USING (true);
CREATE POLICY "Conversations are publicly writable" ON conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Conversations are publicly updatable" ON conversations FOR UPDATE USING (true);

-- Available content warnings policies
CREATE POLICY "Content warnings are publicly readable" ON available_content_warnings FOR SELECT USING (true);

-- =============================================================================
-- SPECIALIZED FUNCTIONS
-- =============================================================================

-- Function to increment tag usage
CREATE OR REPLACE FUNCTION increment_tag_usage(tag_name VARCHAR)
RETURNS VOID AS $$
BEGIN
  INSERT INTO tags (name, usage_count)
  VALUES (tag_name, 1)
  ON CONFLICT (name)
  DO UPDATE SET 
    usage_count = tags.usage_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to increment fandom usage
CREATE OR REPLACE FUNCTION increment_fandom_usage(fandom_name VARCHAR)
RETURNS VOID AS $$
BEGIN
  INSERT INTO fandoms (name, usage_count)
  VALUES (fandom_name, 1)
  ON CONFLICT (name)
  DO UPDATE SET 
    usage_count = fandoms.usage_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to save story tags and update their usage
CREATE OR REPLACE FUNCTION save_story_tags(story_id UUID, tag_names TEXT[])
RETURNS VOID AS $$
DECLARE
  tag_name TEXT;
  tag_id UUID;
  tag_ids UUID[] := '{}';
BEGIN
  -- Loop through each tag name
  FOREACH tag_name IN ARRAY tag_names
  LOOP
    -- Insert or update tag usage
    PERFORM increment_tag_usage(tag_name);
    
    -- Get the tag ID
    SELECT id INTO tag_id FROM tags WHERE name = tag_name;
    
    -- Add to tag_ids array
    tag_ids := array_append(tag_ids, tag_id);
  END LOOP;
  
  -- Update the story with tag IDs
  UPDATE stories SET tag_ids = tag_ids WHERE id = story_id;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_translations()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM translation_cache 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update comment vote counts
CREATE OR REPLACE FUNCTION update_comment_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update vote counts when a new vote is added
        UPDATE comments 
        SET 
            upvotes = (SELECT COUNT(*) FROM comment_votes WHERE comment_id = NEW.comment_id AND vote_type = 'up'),
            downvotes = (SELECT COUNT(*) FROM comment_votes WHERE comment_id = NEW.comment_id AND vote_type = 'down')
        WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Update vote counts when a vote is removed
        UPDATE comments 
        SET 
            upvotes = (SELECT COUNT(*) FROM comment_votes WHERE comment_id = OLD.comment_id AND vote_type = 'up'),
            downvotes = (SELECT COUNT(*) FROM comment_votes WHERE comment_id = OLD.comment_id AND vote_type = 'down')
        WHERE id = OLD.comment_id;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Update vote counts when a vote is changed
        UPDATE comments 
        SET 
            upvotes = (SELECT COUNT(*) FROM comment_votes WHERE comment_id = NEW.comment_id AND vote_type = 'up'),
            downvotes = (SELECT COUNT(*) FROM comment_votes WHERE comment_id = NEW.comment_id AND vote_type = 'down')
        WHERE id = NEW.comment_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update comment flag counts
CREATE OR REPLACE FUNCTION update_comment_flag_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update flag count and mark as flagged if threshold reached
        UPDATE comments 
        SET 
            flag_count = (SELECT COUNT(*) FROM comment_flags WHERE comment_id = NEW.comment_id),
            is_flagged = (SELECT COUNT(*) FROM comment_flags WHERE comment_id = NEW.comment_id) >= 3
        WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Update flag count when a flag is removed
        UPDATE comments 
        SET 
            flag_count = (SELECT COUNT(*) FROM comment_flags WHERE comment_id = OLD.comment_id),
            is_flagged = (SELECT COUNT(*) FROM comment_flags WHERE comment_id = OLD.comment_id) >= 3
        WHERE id = OLD.comment_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update story comment counts
CREATE OR REPLACE FUNCTION update_story_comment_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.is_deleted = false THEN
        -- Increment comment count when a new comment is added
        UPDATE stories 
        SET comment_count = comment_count + 1
        WHERE id = NEW.story_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle soft delete/undelete
        IF OLD.is_deleted = false AND NEW.is_deleted = true THEN
            -- Comment was soft deleted
            UPDATE stories 
            SET comment_count = comment_count - 1
            WHERE id = NEW.story_id;
        ELSIF OLD.is_deleted = true AND NEW.is_deleted = false THEN
            -- Comment was restored
            UPDATE stories 
            SET comment_count = comment_count + 1
            WHERE id = NEW.story_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Hard delete (should be rare)
        IF OLD.is_deleted = false THEN
            UPDATE stories 
            SET comment_count = comment_count - 1
            WHERE id = OLD.story_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to increment translation usage
CREATE OR REPLACE FUNCTION increment_translation_usage()
RETURNS TRIGGER AS $$
BEGIN
    -- This would be called when a translation is accessed
    UPDATE translations 
    SET usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE id = NEW.translation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update story available languages
CREATE OR REPLACE FUNCTION update_story_available_languages()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Add new language to story's available languages
        UPDATE stories 
        SET available_languages = array_append(
            CASE 
                WHEN NEW.target_language = ANY(available_languages) THEN available_languages
                ELSE available_languages
            END,
            CASE 
                WHEN NEW.target_language = ANY(available_languages) THEN NULL
                ELSE NEW.target_language
            END
        )
        WHERE id = NEW.story_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Remove language if no more translations exist
        UPDATE stories 
        SET available_languages = array_remove(available_languages, OLD.target_language)
        WHERE id = OLD.story_id 
        AND NOT EXISTS (
            SELECT 1 FROM translations 
            WHERE story_id = OLD.story_id 
            AND target_language = OLD.target_language
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Stories triggers
CREATE TRIGGER update_stories_last_updated 
    BEFORE UPDATE ON stories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_last_updated_column();

-- Chapter generation jobs triggers
CREATE TRIGGER update_chapter_generation_jobs_updated_at 
    BEFORE UPDATE ON chapter_generation_jobs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Users triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments triggers
CREATE TRIGGER update_comment_vote_counts_trigger
    AFTER INSERT OR UPDATE OR DELETE ON comment_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_vote_counts();

CREATE TRIGGER update_comment_flag_counts_trigger
    AFTER INSERT OR DELETE ON comment_flags
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_flag_counts();

CREATE TRIGGER update_comments_updated_at 
    BEFORE UPDATE ON comments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_comment_updated_at_column();

CREATE TRIGGER update_story_comment_counts_trigger
    AFTER INSERT OR UPDATE OR DELETE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_story_comment_counts();

-- Chapter reactions triggers
CREATE TRIGGER update_chapter_reactions_updated_at BEFORE UPDATE ON chapter_reactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Playlists triggers
CREATE TRIGGER update_playlists_updated_at BEFORE UPDATE ON playlists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- One-offs triggers
CREATE TRIGGER update_one_offs_updated_at BEFORE UPDATE ON one_offs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Translation cache triggers
CREATE TRIGGER trigger_update_translation_cache_updated_at
    BEFORE UPDATE ON translation_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_translation_cache_updated_at();

-- Translations triggers
CREATE TRIGGER update_translations_updated_at 
    BEFORE UPDATE ON translations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_translation_updated_at_column();

CREATE TRIGGER update_story_available_languages_trigger
    AFTER INSERT OR DELETE ON translations
    FOR EACH ROW
    EXECUTE FUNCTION update_story_available_languages();

-- Conversations triggers
CREATE TRIGGER trigger_update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_conversations_updated_at();

-- =============================================================================
-- STORAGE BUCKETS
-- =============================================================================

-- Create the images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up policies for the images bucket
CREATE POLICY "Public can view images" ON storage.objects
FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can upload images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'images');

CREATE POLICY "Authenticated users can update images" ON storage.objects
FOR UPDATE USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can delete images" ON storage.objects
FOR DELETE USING (bucket_id = 'images');

-- =============================================================================
-- VIEWS
-- =============================================================================

-- Chapter reaction counts view
CREATE OR REPLACE VIEW chapter_reaction_counts AS
SELECT 
  chapter_id,
  reaction,
  COUNT(*) as count
FROM chapter_reactions
GROUP BY chapter_id, reaction;

-- Playlist summary view
CREATE OR REPLACE VIEW playlist_summary AS
SELECT 
  p.*,
  COALESCE(ps.story_count, 0) as story_count,
  COALESCE(ps.latest_added, p.created_at) as latest_story_added
FROM playlists p
LEFT JOIN (
  SELECT 
    playlist_id,
    COUNT(*) as story_count,
    MAX(added_at) as latest_added
  FROM playlist_stories
  GROUP BY playlist_id
) ps ON p.id = ps.playlist_id;

-- Comment threads view
CREATE OR REPLACE VIEW comment_threads AS
SELECT 
    c.*,
    COALESCE(reply_count.count, 0) as reply_count,
    CASE 
        WHEN c.parent_comment_id IS NULL THEN 0
        ELSE 1
    END as thread_level
FROM comments c
LEFT JOIN (
    SELECT parent_comment_id, COUNT(*) as count
    FROM comments 
    WHERE parent_comment_id IS NOT NULL AND is_deleted = false
    GROUP BY parent_comment_id
) reply_count ON c.id = reply_count.parent_comment_id
WHERE c.is_deleted = false
ORDER BY c.created_at DESC;

-- Translation statistics view
CREATE OR REPLACE VIEW translation_stats AS
SELECT 
    s.id as story_id,
    s.title,
    s.fandom,
    COUNT(t.id) as total_translations,
    array_agg(DISTINCT t.target_language) FILTER (WHERE t.target_language IS NOT NULL) as translated_languages,
    SUM(t.usage_count) as total_translation_usage,
    MAX(t.created_at) as latest_translation_date
FROM stories s
LEFT JOIN translations t ON s.id = t.story_id
GROUP BY s.id, s.title, s.fandom;

-- =============================================================================
-- INITIAL DATA
-- =============================================================================

-- Insert default fandoms
INSERT INTO fandoms (name, description, category, usage_count, is_custom) VALUES
  ('Marvel Cinematic Universe', 'Stories set in the world of Marvel superheroes', 'Movies & TV', 15420, false),
  ('Harry Potter', 'Magical adventures in the wizarding world', 'Books', 28150, false),
  ('Star Wars', 'Epic space opera adventures', 'Movies & TV', 12340, false),
  ('BTS', 'K-pop idol stories and scenarios', 'Music', 45230, false),
  ('Attack on Titan', 'Post-apocalyptic titan fighting adventures', 'Anime & Manga', 8920, false),
  ('Genshin Impact', 'Fantasy adventures in the world of Teyvat', 'Gaming', 11580, false),
  ('Stranger Things', 'Supernatural mysteries in Hawkins', 'Movies & TV', 7650, false),
  ('My Hero Academia', 'Superhero academy adventures', 'Anime & Manga', 13420, false)
ON CONFLICT (name) DO NOTHING;

-- Insert standard content warning types
INSERT INTO available_content_warnings (id, name, description, category, severity, requires_18_plus) VALUES
-- Violence category
('violence-mild', 'Mild Violence', 'Minor physical conflict, cartoon violence', 'violence', 'mild', false),
('violence-moderate', 'Moderate Violence', 'Realistic combat, fighting scenes', 'violence', 'moderate', false),
('violence-strong', 'Strong Violence', 'Graphic violence, gore, torture', 'violence', 'strong', true),
('death', 'Character Death', 'Characters die during the story', 'violence', 'moderate', false),
('war', 'War/Battle', 'Military conflict, battle scenes', 'violence', 'moderate', false),

-- Sexual content category
('sexual-themes', 'Sexual Themes', 'Sexual situations, innuendo', 'sexual', 'mild', false),
('sexual-moderate', 'Sexual Content', 'Explicit sexual descriptions, adult situations', 'sexual', 'moderate', true),
('sexual-graphic', 'Graphic Sexual Content', 'Detailed explicit sexual content', 'sexual', 'strong', true),
('romance', 'Romance', 'Romantic relationships, kissing', 'sexual', 'mild', false),

-- Substance use category
('alcohol', 'Alcohol Use', 'Characters consume alcohol', 'substance', 'mild', false),
('drugs', 'Drug Use', 'Illegal drug use or abuse', 'substance', 'moderate', true),
('smoking', 'Smoking/Tobacco', 'Characters smoke or use tobacco', 'substance', 'mild', false),

-- Psychological content category
('mental-health', 'Mental Health Issues', 'Depression, anxiety, mental illness', 'psychological', 'mild', false),
('suicide', 'Suicide/Self-Harm', 'Suicidal thoughts or self-harm', 'psychological', 'strong', true),
('abuse', 'Abuse', 'Physical, emotional, or psychological abuse', 'psychological', 'strong', true),
('trauma', 'Trauma', 'Traumatic events, PTSD', 'psychological', 'moderate', false),
('manipulation', 'Manipulation', 'Emotional manipulation, gaslighting', 'psychological', 'moderate', false),

-- Other category
('language-strong', 'Strong Language', 'Strong profanity, offensive language', 'other', 'moderate', false),
('religion', 'Religious Content', 'Religious themes or discussions', 'other', 'mild', false),
('political', 'Political Content', 'Political themes or discussions', 'other', 'mild', false),
('body-horror', 'Body Horror', 'Disturbing bodily transformations', 'other', 'strong', true),
('horror', 'Horror Elements', 'Scary, horror-themed content', 'other', 'moderate', false)
ON CONFLICT (id) DO NOTHING;

-- Insert supported languages
INSERT INTO supported_languages (code, name, native_name, flag_emoji, rtl, currency_code, currency_symbol, date_format, number_format) VALUES
('en', 'English', 'English', '🇺🇸', false, 'USD', '$', 'MM/DD/YYYY', 'en-US'),
('es', 'Spanish', 'Español', '🇪🇸', false, 'EUR', '€', 'DD/MM/YYYY', 'es-ES'),
('fr', 'French', 'Français', '🇫🇷', false, 'EUR', '€', 'DD/MM/YYYY', 'fr-FR'),
('de', 'German', 'Deutsch', '🇩🇪', false, 'EUR', '€', 'DD.MM.YYYY', 'de-DE'),
('it', 'Italian', 'Italiano', '🇮🇹', false, 'EUR', '€', 'DD/MM/YYYY', 'it-IT'),
('pt', 'Portuguese', 'Português', '🇧🇷', false, 'BRL', 'R$', 'DD/MM/YYYY', 'pt-BR'),
('ru', 'Russian', 'Русский', '🇷🇺', false, 'RUB', '₽', 'DD.MM.YYYY', 'ru-RU'),
('ja', 'Japanese', '日本語', '🇯🇵', false, 'JPY', '¥', 'YYYY/MM/DD', 'ja-JP'),
('ko', 'Korean', '한국어', '🇰🇷', false, 'KRW', '₩', 'YYYY.MM.DD', 'ko-KR'),
('zh', 'Chinese', '中文', '🇨🇳', false, 'CNY', '¥', 'YYYY/MM/DD', 'zh-CN'),
('ar', 'Arabic', 'العربية', '🇸🇦', true, 'SAR', 'ر.س', 'DD/MM/YYYY', 'ar-SA'),
('hi', 'Hindi', 'हिन्दी', '🇮🇳', false, 'INR', '₹', 'DD/MM/YYYY', 'hi-IN'),
('th', 'Thai', 'ไทย', '🇹🇭', false, 'THB', '฿', 'DD/MM/YYYY', 'th-TH'),
('vi', 'Vietnamese', 'Tiếng Việt', '🇻🇳', false, 'VND', '₫', 'DD/MM/YYYY', 'vi-VN'),
('nl', 'Dutch', 'Nederlands', '🇳🇱', false, 'EUR', '€', 'DD-MM-YYYY', 'nl-NL'),
('sv', 'Swedish', 'Svenska', '🇸🇪', false, 'SEK', 'kr', 'YYYY-MM-DD', 'sv-SE'),
('no', 'Norwegian', 'Norsk', '🇳🇴', false, 'NOK', 'kr', 'DD.MM.YYYY', 'no-NO'),
('da', 'Danish', 'Dansk', '🇩🇰', false, 'DKK', 'kr', 'DD-MM-YYYY', 'da-DK'),
('fi', 'Finnish', 'Suomi', '🇫🇮', false, 'EUR', '€', 'DD.MM.YYYY', 'fi-FI'),
('pl', 'Polish', 'Polski', '🇵🇱', false, 'PLN', 'zł', 'DD.MM.YYYY', 'pl-PL')
ON CONFLICT (code) DO NOTHING;

-- Insert initial invite codes
INSERT INTO invite_codes (code, is_active, max_uses) VALUES
('elisa12as', true, NULL),
('sandra13pa', true, NULL)
ON CONFLICT (code) DO NOTHING;

-- Insert sample stories
INSERT INTO stories (title, fandom, genre, description, tags, total_chapters) VALUES
('The Avenger''s New Recruit', 'Marvel Cinematic Universe', ARRAY['Action', 'Adventure', 'Romance'], 'When Maya discovers her incredible strength, Tony Stark recruits her for the Avengers. But being a superhero is harder than it looks.', ARRAY['superpowers', 'found-family', 'training', 'romance-subplot'], 15),
('The Eighth Year at Hogwarts', 'Harry Potter', ARRAY['Fantasy', 'Romance', 'Drama'], 'After the war, some students return to Hogwarts for an eighth year. Healing, friendship, and unexpected romance await.', ARRAY['post-war', 'eighth-year', 'enemies-to-lovers', 'healing', 'friendship'], 23)
ON CONFLICT (title) DO NOTHING;

-- Insert sample chapters
INSERT INTO chapters (story_id, chapter_number, title, content, upvotes, downvotes) VALUES
((SELECT id FROM stories WHERE title = 'The Avenger''s New Recruit'), 1, 'Unexpected Powers', 'Maya Chen had always been ordinary—until the day she accidentally stopped a falling building with her bare hands. The incident happened so fast that she almost convinced herself it was a dream, until Tony Stark showed up at her apartment door with a knowing smile and a cup of coffee.

"Mind if I come in?" he asked, already stepping past her into the small living room. "We need to talk about what happened downtown yesterday."

Maya''s heart raced. She''d hoped no one had seen her moment of impossible strength, but apparently, she''d been wrong. "I don''t know what you''re talking about," she lied, closing the door behind him.

Tony raised an eyebrow and pulled out his phone, showing her a crystal-clear video of her catching a piece of falling debris that would have crushed a family of four. "The internet never forgets, Maya. Lucky for you, I got to this footage before it went viral."

She sank onto her couch, head in her hands. "This can''t be happening. I''m just a college student. I work at a coffee shop. I don''t have superpowers."

"Well, hate to break it to you, but the laws of physics disagree." Tony sat across from her, his expression growing serious. "Look, I know this is overwhelming. Trust me, I''ve been there. But you have two choices: let me help you control this, or wait for someone less friendly to come knocking."

Maya looked up at him, seeing genuine concern in his eyes despite his casual demeanor. Outside her window, she could hear the sounds of New York City continuing its relentless pace, oblivious to the fact that her entire world had just changed forever.

"What exactly are you offering?" she asked quietly.

Tony''s smile returned, but this time it held a hint of excitement. "Training. Purpose. A chance to be part of something bigger than yourself. Ever heard of the Avengers Initiative?"', 127, 3),

((SELECT id FROM stories WHERE title = 'The Eighth Year at Hogwarts'), 1, 'Returning to Hogwarts', 'The Hogwarts Express had never felt so quiet. Hermione Granger pressed her face to the window, watching the Scottish countryside roll by as she tried to process the fact that she was actually returning to school. After everything that had happened—the war, the losses, the year spent hunting Horcruxes—the idea of going back to classes and homework felt almost absurd.

"You sure about this?" Ron asked from across the compartment, voicing the question they''d all been thinking. "I mean, we could always just... not. We saved the wizarding world. I think we''ve earned a break from Potions essays."

Harry looked up from the letter he''d been reading—another thank-you note from a family they''d helped during the war. "McGonagall said they''re calling it the ''Eighth Year'' program. For students whose education was... interrupted. We don''t have to do it, but—"

"But we need to," Hermione finished softly. "I need to. I need something normal after... after everything. And I need to finish what I started here."

The compartment fell silent again. They all knew what she meant. Hogwarts had been home for so long, but their last memory of it was battle—friends falling, corridors filled with smoke and screams, the Great Hall transformed into a makeshift morgue.

"Besides," Hermione continued, trying to inject some lightness into her voice, "apparently there are students from all houses participating. Even some Slytherins."

Ron''s expression darkened. "Please tell me Malfoy isn''t—"

"He is," Harry said quietly. "Kingsley thought it would be good for... reconciliation. Moving forward together."

"Brilliant," Ron muttered. "Just what we need. More quality time with the ferret."

Hermione sighed, turning back to the window. In the distance, she could see the familiar outline of Hogwarts castle, its towers reaching toward the cloudy sky like old friends welcoming her home. Despite everything, despite the memories and the pain, she felt a flutter of excitement in her chest.

Maybe they could find a way to heal here. Maybe they could find a way to be students again, instead of soldiers.', 156, 12)
ON CONFLICT (story_id, chapter_number) DO NOTHING;