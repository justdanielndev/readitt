'use client';
import { useState, useEffect } from 'react';
import { BookOpen, ThumbsUp, Calendar, User, Star, Eye, Sparkles, TrendingUp, Clock, BookCopy } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { UserContextManager } from '@/lib/userContext';
import { useAuth } from '@/lib/auth';
import { PlaylistsSection } from './PlaylistsSection';
import { AddToPlaylistModal } from './AddToPlaylistModal';
import type { Story } from './HomepageView';
interface PopularStoriesProps {
  onStorySelect: (story: Story) => void;
  searchQuery?: string;
  selectedCategory?: string;
  selectedFandom?: string;
  pageType?: 'home' | 'library' | 'browse';
}
export function PopularStories({ onStorySelect, searchQuery = '', selectedCategory = 'All', selectedFandom, pageType = 'home' }: PopularStoriesProps) {
  const { user: authUser } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [cachedStories, setCachedStories] = useState<Story[]>([]);
  const [recommendedStories, setRecommendedStories] = useState<Story[]>([]);
  const [oneOffs, setOneOffs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const [oneOffsLoading, setOneOffsLoading] = useState(true);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [selectedStoryForPlaylist, setSelectedStoryForPlaylist] = useState<any>(null);
  const handleAddToPlaylist = (story: any) => {
    setSelectedStoryForPlaylist(story);
    setShowAddToPlaylist(true);
  };
  useEffect(() => {
    loadCachedStories();
    if (pageType === 'home' || pageType === 'browse') {
      loadDatabaseStories();
    }
    if (pageType === 'home' || pageType === 'library') {
      loadOneOffs();
    }
  }, [pageType]);
  const loadCachedStories = async () => {
    const userManager = UserContextManager.getInstance();
    const userContext = userManager.getUserContext();
    if (userContext.stories.length === 0) {
      setCachedStories([]);
      if (pageType === 'library') {
        setStories([]);
        setLoading(false);
      }
      return;
    }
    try {
      const storyIds = userContext.stories.map(s => s.id);
      const { data: storiesData, error } = await supabase
        .from('stories')
        .select(`
          *,
          chapters (*)
        `)
        .in('id', storyIds);
      if (error) {
        console.error('Error loading cached story images:', error);
      }
      const userStories: Story[] = userContext.stories.map(userStory => {
        const isCompleted = userStory.status === 'completed' || userStory.currentChapter >= userStory.totalChapters;
        const dbStory = storiesData?.find(s => s.id === userStory.id);
        return {
          id: userStory.id,
          title: userStory.title,
          fandom: userStory.fandom,
          genre: dbStory?.genre || ['Adventure'], 
          description: dbStory?.description || (isCompleted ? 'Story completed' : `Continue reading from chapter ${userStory.currentChapter}`),
          tags: isCompleted ? ['completed'] : ['in-progress'],
          author: userStory.author || 'Unknown Author',
          totalChapters: userStory.totalChapters,
          lastUpdated: userStory.lastRead.split('T')[0],
          chapters: dbStory?.chapters?.map((chapter: any) => ({
            id: chapter.id,
            number: chapter.chapter_number,
            title: chapter.title,
            content: chapter.content,
            readingTime: chapter.reading_time,
            upvotes: chapter.upvotes || 0,
            downvotes: chapter.downvotes || 0,
          })) || [],
          isCompleted: isCompleted,
          imageUrl: dbStory?.image_url || null,
          imageStatus: dbStory?.image_status || 'none'
        };
      });
      setCachedStories(userStories);
      if (pageType === 'library') {
        setStories(userStories);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading cached stories:', error);
      const userStories: Story[] = userContext.stories.map(userStory => {
        const isCompleted = userStory.status === 'completed' || userStory.currentChapter >= userStory.totalChapters;
        return {
          id: userStory.id,
          title: userStory.title,
          fandom: userStory.fandom,
          genre: ['Adventure'],
          description: isCompleted ? 'Story completed' : `Continue reading from chapter ${userStory.currentChapter}`,
          tags: isCompleted ? ['completed'] : ['in-progress'],
          author: userStory.author || 'Unknown Author',
          totalChapters: userStory.totalChapters,
          lastUpdated: userStory.lastRead.split('T')[0],
          chapters: Array.from({ length: userStory.totalChapters }, (_, i) => ({
            id: `fallback-${userStory.id}-${i + 1}`,
            number: i + 1,
            title: `Chapter ${i + 1}`,
            content: '',
            readingTime: '5 min',
            upvotes: 0,
            downvotes: 0,
          })),
          isCompleted: isCompleted,
          imageUrl: null,
          imageStatus: 'none'
        };
      });
      setCachedStories(userStories);
      if (pageType === 'library') {
        setStories(userStories);
        setLoading(false);
      }
    }
  };
  const loadDatabaseStories = async () => {
    try {
      setRecommendationsLoading(true);
      if (pageType === 'browse') {
        await loadUnreadStories();
      } else {
        await loadRecommendations();
      }
    } catch (error) {
      console.error('Error loading database stories:', error);
      loadSampleStories();
    } finally {
      setRecommendationsLoading(false);
    }
  };
  const loadUnreadStories = async () => {
    const userManager = UserContextManager.getInstance();
    const userContext = userManager.getUserContext();
    const readStoryIds = userContext.stories.map(s => s.id);
    const allow18Plus = userContext.preferences.show18PlusContent || false;
    console.log('🔍 [BROWSE] User allows 18+ content:', allow18Plus);
    let query = supabase
      .from('stories')
      .select(`
        *,
        chapters (*)
      `)
      .not('id', 'in', `(${readStoryIds.join(',')})`)
      .eq('is_private', false);
    if (!allow18Plus) {
      query = query
        .neq('age_rating', '18+')
        .eq('is_nsfw', false);
    }
    const { data: storiesData, error } = await query
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error loading unread stories:', error);
      loadSampleStories();
      return;
    }
    if (storiesData && storiesData.length > 0) {
      const formattedStories = formatStoriesData(storiesData);
      setRecommendedStories(formattedStories);
    } else {
      loadSampleStories();
    }
    setLoading(false);
  };
  const loadRecommendations = async () => {
    const userManager = UserContextManager.getInstance();
    const userContext = userManager.getUserContext();
    const userStories = userContext.stories;
    const response = await fetch('/api/recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        readStories: userStories,
        userPreferences: userContext.preferences
      })
    });
    const result = await response.json();
    if (result.success && result.recommendations) {
      const formattedRecommendations = formatStoriesData(result.recommendations);
      setRecommendedStories(formattedRecommendations);
    } else {
      loadSampleStories();
    }
    setLoading(false);
  };
  const formatStoriesData = (storiesData: any[]) => {
    return storiesData.map(story => ({
      id: story.id,
      title: story.title,
      fandom: story.fandom,
      genre: story.genre,
      description: story.description,
      tags: story.tags,
      author: story.author,
      totalChapters: story.total_chapters,
      lastUpdated: story.last_updated,
      imageUrl: story.image_url,
      imageStatus: story.image_status,
      chapters: story.chapters?.map((chapter: any) => ({
        id: chapter.id,
        number: chapter.chapter_number,
        title: chapter.title,
        content: chapter.content,
        readingTime: chapter.reading_time,
        upvotes: chapter.upvotes,
        downvotes: chapter.downvotes,
      })) || []
    }));
  };
  const loadSampleStories = () => {
    const userManager = UserContextManager.getInstance();
    const userContext = userManager.getUserContext();
    const sampleStories: Story[] = [
      {
        id: '1',
        title: "The Avenger's New Recruit",
        fandom: 'Marvel Cinematic Universe',
        genre: ['Action', 'Adventure', 'Romance'],
        description: 'When Maya discovers her incredible strength, Tony Stark recruits her for the Avengers. But being a superhero is harder than it looks.',
        tags: ['superpowers', 'found-family', 'training', 'romance-subplot'],
        author: `${userContext.username}`,
        totalChapters: 15,
        lastUpdated: '2024-12-20',
        chapters: [
          {
            id: 'c1',
            number: 1,
            title: 'Unexpected Powers',
            content: 'Maya Chen had always been ordinary—until the day she accidentally stopped a falling building with her bare hands...',
            readingTime: '3 min',
            upvotes: 127,
            downvotes: 3,
          }
        ]
      },
      {
        id: '2',
        title: 'The Eighth Year at Hogwarts',
        fandom: 'Harry Potter',
        genre: ['Fantasy', 'Romance', 'Drama'],
        description: 'After the war, some students return to Hogwarts for an eighth year. Healing, friendship, and unexpected romance await.',
        tags: ['post-war', 'eighth-year', 'enemies-to-lovers', 'healing', 'friendship'],
        author: `${userContext.username}`,
        totalChapters: 23,
        lastUpdated: '2024-12-19',
        chapters: [
          {
            id: 'c2',
            number: 1,
            title: 'Returning to Hogwarts',
            content: 'The Hogwarts Express had never felt so quiet. Hermione Granger pressed her face to the window...',
            readingTime: '4 min',
            upvotes: 156,
            downvotes: 12,
          }
        ]
      }
    ];
    setRecommendedStories([]);
  };
  const loadOneOffs = async () => {
    try {
      setOneOffsLoading(true);
      if (typeof window !== 'undefined') {
        const storedOneOffs = localStorage.getItem('user_one_offs');
        if (storedOneOffs) {
          const oneOffs = JSON.parse(storedOneOffs);
          setOneOffs(oneOffs);
        } else {
          setOneOffs([]);
        }
      } else {
        setOneOffs([]);
      }
    } catch (error) {
      console.error('Error loading one-offs:', error);
      setOneOffs([]);
    } finally {
      setOneOffsLoading(false);
    }
  };
  if (loading && pageType === 'library') {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Your Stories</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-300 dark:bg-gray-600"></div>
              <div className="p-4">
                <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-3"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3 mb-3"></div>
                <div className="flex justify-between">
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  const searchStories = (stories: Story[]) => {
    if (searchQuery === '') return stories;
    return stories.filter(story => 
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.fandom.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };
  const filterStories = (stories: Story[]) => {
    return stories.filter(story => {
      const matchesCategory = selectedCategory === 'All' || 
        story.genre.some(g => g.toLowerCase().includes(selectedCategory.toLowerCase()));
      const matchesFandom = !selectedFandom || selectedFandom === 'All' ||
        story.fandom.toLowerCase().includes(selectedFandom.toLowerCase());
      return matchesCategory && matchesFandom;
    });
  };
  let filteredCachedStories = cachedStories;
  let filteredRecommendedStories = recommendedStories;
  if (searchQuery) {
    filteredCachedStories = searchStories(cachedStories);
    filteredRecommendedStories = searchStories(recommendedStories);
  } else {
    if (pageType === 'home') {
      filteredCachedStories = filterStories(cachedStories);
      filteredRecommendedStories = filterStories(recommendedStories);
    } else if (pageType === 'library') {
      filteredCachedStories = filterStories(cachedStories);
    } else if (pageType === 'browse') {
      filteredRecommendedStories = filterStories(recommendedStories);
    }
  }
  return (
    <div className="space-y-8">
      {(pageType === 'home' || pageType === 'library') && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-rose-400" />
            <h2 className="text-2xl font-bold text-rose-700 dark:text-rose-300">
              {pageType === 'library' ? 'Your Library' : 'Continue Reading'}
            </h2>
            {(searchQuery || selectedCategory !== 'All') && filteredCachedStories.length > 0 && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({filteredCachedStories.length} {filteredCachedStories.length === 1 ? 'story' : 'stories'})
              </span>
            )}
          </div>
          {filteredCachedStories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCachedStories.map((story, index) => (
                <StoryCard key={story.id} story={story} index={index} onStorySelect={onStorySelect} isFromCache={true} onAddToPlaylist={handleAddToPlaylist} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {pageType === 'library' ? 'No stories in your library' : 'No stories started yet'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {pageType === 'library' ? 'Start reading stories to build your library' : 'Explore stories below to start reading'}
              </p>
            </div>
          )}
        </div>
      )}
      {(pageType === 'home' || pageType === 'library') && authUser?.hasPlus && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Star className="h-6 w-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              My One-Offs
            </h2>
            {oneOffs.length > 0 && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({oneOffs.length} {oneOffs.length === 1 ? 'one-off' : 'one-offs'})
              </span>
            )}
          </div>
          {oneOffsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
                  <div className="h-32 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-gray-700 dark:to-gray-600"></div>
                  <div className="p-4">
                    <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-3"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full mb-2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : oneOffs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {oneOffs.map((oneOff, index) => (
                <OneOffCard key={oneOff.id} oneOff={oneOff} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Star className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No one-offs yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Create one-offs from any chapter as a Plus user to explore alternative storylines
              </p>
            </div>
          )}
        </div>
      )}
      {pageType === 'library' && (
        <PlaylistsSection />
      )}
      {(pageType === 'home' || pageType === 'browse') && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-rose-400" />
            <h2 className="text-2xl font-bold text-rose-700 dark:text-rose-300">
              {pageType === 'browse' ? 'Discover Stories' : 'Recommended for You'}
            </h2>
            {(searchQuery || selectedCategory !== 'All') && filteredRecommendedStories.length > 0 && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({filteredRecommendedStories.length} {filteredRecommendedStories.length === 1 ? 'story' : 'stories'})
              </span>
            )}
          </div>
          {recommendationsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-300 dark:bg-gray-600"></div>
                  <div className="p-4">
                    <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-3"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3 mb-3"></div>
                    <div className="flex justify-between">
                      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredRecommendedStories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecommendedStories.map((story, index) => (
                <StoryCard key={story.id} story={story} index={index} onStorySelect={onStorySelect} isFromCache={false} onAddToPlaylist={handleAddToPlaylist} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {pageType === 'browse' ? 'No stories found' : 'No recommendations available'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {pageType === 'browse' ? 'Try adjusting your search or filters' : 'Start reading some stories to get personalized recommendations'}
              </p>
            </div>
          )}
        </div>
      )}
      <AddToPlaylistModal
        isOpen={showAddToPlaylist}
        onClose={() => setShowAddToPlaylist(false)}
        story={selectedStoryForPlaylist}
      />
    </div>
  );
}
function StoryCard({ story, index, onStorySelect, isFromCache, onAddToPlaylist }: { 
  story: any, 
  index: number, 
  onStorySelect: (story: any) => void,
  isFromCache: boolean,
  onAddToPlaylist?: (story: any) => void
}) {
  const [translatedStory, setTranslatedStory] = useState<{title: string, description: string, fandom: string, tags: string[]} | null>(null);
  const [loadingTranslation, setLoadingTranslation] = useState(false);
  const isCompleted = story.isCompleted || (story.tags && story.tags.includes('completed'));
  const userManager = UserContextManager.getInstance();
  const currentLanguage = userManager.getEffectiveReadingLanguage();
  useEffect(() => {
    if (currentLanguage !== 'en' && !translatedStory && !loadingTranslation) {
      const cacheKey = `story_meta_${story.id}_${currentLanguage}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const cachedData = JSON.parse(cached);
          const now = Date.now();
          if (cachedData.timestamp && (now - cachedData.timestamp) < 24 * 60 * 60 * 1000) {
            setTranslatedStory(cachedData.data);
            return;
          }
        } catch (e) {
        }
      }
      loadStoryTranslation();
    }
  }, [currentLanguage, story.id]);
  const loadStoryTranslation = async () => {
    setLoadingTranslation(true);
    try {
      const langResponse = await fetch('/api/translations/languages');
      const langData = await langResponse.json();
      const languageInfo = langData.languages.find((lang: any) => lang.code === currentLanguage);
      const response = await fetch('/api/translations/story-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: story.title,
          description: story.description,
          fandom: story.fandom,
          tags: story.tags,
          target_language: currentLanguage,
          language_info: languageInfo,
          story_id: story.id 
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const translatedData = {
          title: data.translated_title,
          description: data.translated_description,
          fandom: data.translated_fandom,
          tags: data.translated_tags
        };
        setTranslatedStory(translatedData);
        const cacheKey = `story_meta_${story.id}_${currentLanguage}`;
        localStorage.setItem(cacheKey, JSON.stringify({
          data: translatedData,
          timestamp: Date.now()
        }));
        if (data.cached) {
          console.log('📦 [STORYLIST] Using cached story translation');
        } else {
          console.log('🌐 [STORYLIST] Generated new story translation');
        }
      }
    } catch (error) {
      console.error('Error loading story translation:', error);
    } finally {
      setLoadingTranslation(false);
    }
  };
  const displayStory = translatedStory || {
    title: story.title,
    description: story.description,
    fandom: story.fandom,
    tags: story.tags
  };
  const handleClick = () => {
    if (!isFromCache) {
      const userManager = UserContextManager.getInstance();
      const existingStory = userManager.getUserContext().stories.find(s => s.id === story.id);
      if (!existingStory) {
        userManager.addStory({
          id: story.id,
          title: story.title,
          fandom: story.fandom,
          author: story.author,
          status: 'pending',
          currentChapter: 0, 
          totalChapters: story.totalChapters
        });
      }
    }
    onStorySelect(story);
  };
  return (
    <div
      onClick={handleClick}
      className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden bg-white dark:bg-gray-800 rounded-xl border border-rose-100 dark:border-gray-700 hover:border-rose-200 dark:hover:border-gray-600"
    >
      <div className="relative">
        <div className="w-full h-48 bg-rose-50 dark:bg-gray-800 group-hover:scale-105 transition-transform duration-300 flex items-center justify-center overflow-hidden">
          <StoryImage story={story} />
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 truncate">{displayStory.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">by {story.author}</p>
          </div>
          <span className="bg-rose-100 dark:bg-gray-700 text-rose-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs font-medium ml-2 whitespace-nowrap">
            {displayStory.fandom}
          </span>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">{displayStory.description}</p>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-rose-500 dark:text-gray-400">
              <BookOpen className="h-4 w-4" />
              <span>{story.chapters?.length || 0} chapter{(story.chapters?.length || 0) === 1 ? '' : 's'}</span>
            </div>
            <div className="flex items-center gap-1 text-green-500 dark:text-gray-400">
              <ThumbsUp className="h-4 w-4" />
              <span>{story.chapters?.reduce((total: number, chapter: any) => total + (chapter.upvotes || 0), 0) || 0}</span>
            </div>
            {story.chapters?.reduce((total: number, chapter: any) => total + (chapter.downvotes || 0), 0) > 0 && (
              <div className="flex items-center gap-1 text-red-500 dark:text-gray-400">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" transform="rotate(180 10 10)" />
                </svg>
                <span>{story.chapters?.reduce((total: number, chapter: any) => total + (chapter.downvotes || 0), 0) || 0}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onAddToPlaylist && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToPlaylist(story);
                }}
                className="p-1.5 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                title="Add to playlist"
              >
                <BookCopy className="h-4 w-4 text-rose-500 dark:text-rose-400" />
              </button>
            )}
            <div className="text-xs text-gray-400">
              {story.lastUpdated}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function StoryImage({ story }: { story: any }) {
  const [imageError, setImageError] = useState(false);
  const handleImageError = () => {
    console.error('Image failed to load:', story.imageUrl);
    setImageError(true);
  };
  if (story.imageStatus === 'generating') {
    return (
      <div className="flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-300 mb-2"></div>
        <span className="text-xs text-rose-300">Generating cover...</span>
      </div>
    );
  }
  if (story.imageUrl && story.imageStatus === 'completed' && !imageError) {
    return (
      <img 
        src={story.imageUrl} 
        alt={story.title}
        className="w-full h-full object-cover"
        onError={handleImageError}
      />
    );
  }
  return <BookOpen className="h-16 w-16 text-rose-300 dark:text-gray-500" />;
}
function OneOffCard({ oneOff, index }: { oneOff: any, index: number }) {
  const [showContent, setShowContent] = useState(false);
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };
  const getPreview = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };
  return (
    <div className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden bg-white dark:bg-gray-800 rounded-xl border border-purple-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-gray-600">
      <div className="relative">
        <div className="w-full h-32 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 group-hover:scale-105 transition-transform duration-300 flex items-center justify-center overflow-hidden">
          <Star className="h-12 w-12 text-purple-300 dark:text-gray-500" />
        </div>
        <div className="absolute top-2 right-2 bg-purple-100 dark:bg-gray-700 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full text-xs font-medium">
          One-Off
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 truncate">{oneOff.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">by {oneOff.author}</p>
          </div>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          Original Chapter {oneOff.originalChapter + 1} • One-Off Continuation
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">
          {oneOff.description}
        </p>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-purple-500 dark:text-gray-400">
              <Clock className="h-4 w-4" />
              <span>{oneOff.readingTime}</span>
            </div>
            <span className="bg-purple-100 dark:bg-gray-700 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full text-xs font-medium">
              One-Off
            </span>
          </div>
          <div className="text-xs text-gray-400">
            {formatDate(oneOff.createdAt)}
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowContent(!showContent);
            }}
            className="text-purple-600 dark:text-purple-400 text-sm font-medium hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
          >
            {showContent ? 'Hide Content' : 'Read Content'}
          </button>
        </div>
        {showContent && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
              {getPreview(oneOff.content, 500)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}