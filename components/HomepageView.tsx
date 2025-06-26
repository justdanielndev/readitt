'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PopularStories } from './PopularStories';
import { FandomSelection } from './FandomSelection';
import { StoryGeneration } from './StoryGeneration';
import { ChapterList } from './ChapterList';
import { ReadingView } from './ReadingView';
import { NewHomepageView } from './NewHomepageView';
export type View = 'homepage' | 'fandomSelection' | 'storyGeneration' | 'chapterList' | 'readingView';
export interface Story {
  id: string;
  title: string;
  fandom: string;
  genre: string[];
  description: string;
  tags: string[];
  author: string;
  totalChapters: number;
  lastUpdated: string;
  chapters: Chapter[];
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  imageUrl?: string | null;
  imageStatus?: 'none' | 'generating' | 'completed' | 'failed';
  isCompleted?: boolean;
  contentWarnings?: string[];
  ageRating?: string;
  isNsfw?: boolean;
}
export interface Chapter {
  id: string;
  number: number;
  title: string;
  content: string;
  readingTime: string;
  upvotes: number;
  downvotes: number;
}
export interface Fandom {
  id: string;
  name: string;
  description: string;
  category: string;
  popularity: number;
  stories: number;
  isCustom?: boolean;
}
export function HomepageView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentView, setCurrentView] = useState<View>('homepage');
  const [selectedFandom, setSelectedFandom] = useState<Fandom | null>(null);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  useEffect(() => {
    const view = searchParams.get('view') as View || 'homepage';
    const storyId = searchParams.get('story');
    const chapter = searchParams.get('chapter');
    setCurrentView(view);
    if (storyId && view !== 'homepage') {
      loadStoryFromUrl(storyId, chapter ? parseInt(chapter) : 0);
    }
  }, [searchParams]);
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view') as View || 'homepage';
      const storyId = params.get('story');
      const chapter = params.get('chapter');
      setCurrentView(view);
      if (storyId && view !== 'homepage') {
        loadStoryFromUrl(storyId, chapter ? parseInt(chapter) : 0);
      } else if (view === 'homepage') {
        setCurrentStory(null);
        setCurrentChapter(0);
        setSelectedFandom(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const loadStoryFromUrl = async (storyId: string, chapterIndex: number = 0) => {
    try {
      const { data: storyData, error } = await supabase
        .from('stories')
        .select(`
          *,
          chapters (*)
        `)
        .eq('id', storyId)
        .single();
      if (error) {
        console.error('Error loading story from URL:', error);
        return;
      }
      if (storyData) {
        const story: Story = {
          id: storyData.id,
          title: storyData.title,
          fandom: storyData.fandom,
          genre: storyData.genre || [],
          description: storyData.description,
          tags: storyData.tags || [],
          author: storyData.author,
          totalChapters: storyData.total_chapters,
          lastUpdated: storyData.last_updated,
          contentWarnings: storyData.content_warnings || [],
          ageRating: storyData.age_rating || 'all-ages',
          isNsfw: storyData.is_nsfw || false,
          chapters: storyData.chapters?.map((chapter: any) => ({
            id: chapter.id,
            number: chapter.chapter_number,
            title: chapter.title,
            content: chapter.content,
            readingTime: chapter.reading_time,
            upvotes: chapter.upvotes,
            downvotes: chapter.downvotes,
          })) || []
        };
        setCurrentStory(story);
        setCurrentChapter(chapterIndex);
      }
    } catch (error) {
      console.error('Error loading story from URL:', error);
    }
  };
  const updateUrl = (view: View, storyId?: string, chapter?: number) => {
    const params = new URLSearchParams();
    if (view !== 'homepage') {
      params.set('view', view);
    }
    if (storyId) {
      params.set('story', storyId);
    }
    if (chapter !== undefined && chapter > 0) {
      params.set('chapter', chapter.toString());
    }
    const url = params.toString() ? `?${params.toString()}` : '/';
    router.push(url, { scroll: false });
  };
  const handleStartNewRead = () => {
    setCurrentView('fandomSelection');
    updateUrl('fandomSelection');
  };
  const handleBackToHome = () => {
    setCurrentView('homepage');
    setSelectedFandom(null);
    setCurrentStory(null);
    setCurrentChapter(0);
    updateUrl('homepage');
  };
  const handleFandomSelect = (fandom: Fandom, storyParams: {
    storyName: string;
    characters: string;
    topics: string;
    theme: string;
    isPrivate: boolean;
  }) => {
    setSelectedFandom(fandom);
    setCurrentView('storyGeneration');
    updateUrl('storyGeneration');
    (fandom as any).storyParams = storyParams;
  };
  const handleStoryGenerated = (story: Story) => {
    setCurrentStory(story);
    setCurrentView('readingView');
    setIsGenerating(false);
    updateUrl('readingView', story.id, 0);
  };
  const handleStorySelect = async (story: Story) => {
    console.log('📖 [HOMEPAGE] Opening story from homepage:', story.title);
    console.log('📖 [HOMEPAGE] Story ID:', story.id);
    if (story.chapters.length === 0) {
      try {
        if (typeof window !== 'undefined' && supabase) {
          const { data: storyData, error } = await supabase
            .from('stories')
            .select(`
              *,
              chapters (*)
            `)
            .eq('id', story.id)
            .single();
          if (error) {
            console.error('Error loading story chapters:', error);
            setCurrentStory(story);
          } else if (storyData && storyData.chapters) {
            console.log('📖 [HOMEPAGE] Raw story data from DB:', {
              id: storyData.id,
              title: storyData.title,
              content_warnings: storyData.content_warnings,
              age_rating: storyData.age_rating,
              is_nsfw: storyData.is_nsfw
            });
            const storyWithChapters = {
              ...story,
              contentWarnings: storyData.content_warnings || [],
              ageRating: storyData.age_rating || 'all-ages',
              isNsfw: storyData.is_nsfw || false,
              chapters: storyData.chapters.map((chapter: any) => ({
                id: chapter.id,
                number: chapter.chapter_number,
                title: chapter.title,
                content: chapter.content,
                readingTime: chapter.reading_time,
                upvotes: chapter.upvotes,
                downvotes: chapter.downvotes,
              }))
            };
            console.log('🏷️ [HOMEPAGE] Content warnings:', storyWithChapters.contentWarnings);
            console.log('🔞 [HOMEPAGE] Age rating:', storyWithChapters.ageRating);
            console.log('🚫 [HOMEPAGE] Is NSFW:', storyWithChapters.isNsfw);
            setCurrentStory(storyWithChapters);
          } else {
            setCurrentStory(story);
          }
        } else {
          setCurrentStory(story);
        }
      } catch (error) {
        console.error('Error loading chapters:', error);
        setCurrentStory(story);
      }
    } else {
      console.log('📖 [HOMEPAGE] Story already has chapters loaded');
      setCurrentStory(story);
    }
    setCurrentView('chapterList');
    updateUrl('chapterList', story.id);
  };
  const handleChapterSelect = (chapterIndex: number) => {
    setCurrentChapter(chapterIndex);
    setCurrentView('readingView');
    updateUrl('readingView', currentStory?.id, chapterIndex);
  };
  return (
    <div>
      {currentView === 'homepage' && (
        <NewHomepageView 
          onStartNewRead={handleStartNewRead}
          onStorySelect={handleStorySelect}
        />
      )}
      {currentView === 'fandomSelection' && (
        <FandomSelection
          onBack={handleBackToHome}
          onFandomSelect={handleFandomSelect}
        />
      )}
      {currentView === 'storyGeneration' && selectedFandom && (
        <StoryGeneration
          fandom={selectedFandom}
          onStoryGenerated={handleStoryGenerated}
          isGenerating={isGenerating}
          setIsGenerating={setIsGenerating}
        />
      )}
      {currentView === 'chapterList' && currentStory && (
        <ChapterList
          story={currentStory}
          onBack={handleBackToHome}
          onChapterSelect={handleChapterSelect}
        />
      )}
      {currentView === 'readingView' && currentStory && (
        <ReadingView
          story={currentStory}
          currentChapter={currentChapter}
          onChapterChange={(chapter) => {
            setCurrentChapter(chapter);
            updateUrl('readingView', currentStory.id, chapter);
          }}
          onBack={() => {
            setCurrentView('chapterList');
            updateUrl('chapterList', currentStory.id);
          }}
        />
      )}
    </div>
  );
}