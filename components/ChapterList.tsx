'use client';
import { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Clock, CheckCircle } from 'lucide-react';
import { SimpleHeader } from './SimpleHeader';
import { UserContextManager } from '@/lib/userContext';
import type { Story } from './HomepageView';
interface ChapterListProps {
  story: Story;
  onBack: () => void;
  onChapterSelect: (chapterIndex: number) => void;
}
export function ChapterList({ story, onBack, onChapterSelect }: ChapterListProps) {
  const [userContext] = useState(() => UserContextManager.getInstance().getUserContext());
  const [translatedStory, setTranslatedStory] = useState<{title: string, description: string, fandom: string, tags: string[]} | null>(null);
  const [loadingTranslation, setLoadingTranslation] = useState(false);
  const userStory = userContext.stories.find(s => s.id === story.id);
  const currentChapter = userStory?.currentChapter || 0;
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
  }, [currentLanguage, story]);
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
          console.log('📦 [CHAPTERLIST] Using cached story translation');
        } else {
          console.log('🌐 [CHAPTERLIST] Generated new story translation');
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
  const isChapterRead = (chapterNumber: number) => {
    return chapterNumber <= currentChapter;
  };
  const handleChapterClick = (chapterIndex: number) => {
    onChapterSelect(chapterIndex);
  };
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SimpleHeader 
        onLogoClick={onBack}
        leftContent={
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button onClick={onBack} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img src="/readitt.png" alt="Readitt" className="h-6 w-6" />
            </button>
          </div>
        }
        centerContent={
          <div className="text-center">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate max-w-xs">
              {displayStory.title}
            </h1>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {story.chapters.length} Chapter{story.chapters.length === 1 ? '' : 's'}
            </div>
          </div>
        }
      />
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 min-h-screen">
        <div className="px-6 md:px-12 pt-8 pb-6 border-b border-gray-100 dark:border-gray-700">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-rose-50 dark:bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-10 w-10 text-rose-300 dark:text-gray-500" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {displayStory.title}
            </h1>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
              <span className="bg-rose-100 dark:bg-gray-700 text-rose-700 dark:text-rose-300 px-3 py-1 rounded-full font-medium">
                {displayStory.fandom}
              </span>
              <span>{story.author}</span>
            </div>
            <p className="text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
              {displayStory.description}
            </p>
            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Progress: {currentChapter} of {story.chapters.length} chapters read
            </div>
          </div>
        </div>
        <div className="px-6 md:px-12 py-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Chapters</h2>
          <div className="space-y-3">
            {story.chapters.map((chapter, index) => {
              const isRead = isChapterRead(chapter.number);
              const isCurrent = index === currentChapter; 
              return (
                <button
                  key={chapter.id}
                  onClick={() => handleChapterClick(index)}
                  className={`w-full text-left p-4 rounded-lg border transition-all hover:shadow-sm ${
                    isRead
                      ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-rose-200 dark:hover:border-gray-600'
                  } ${
                    isCurrent
                      ? 'ring-2 ring-rose-300 dark:ring-rose-600'
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center gap-2">
                        {isRead ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                        )}
                        <span className={`font-medium text-sm ${
                          isRead 
                            ? 'text-gray-500 dark:text-gray-400' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          Chapter {chapter.number}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-medium ${
                          isRead 
                            ? 'text-gray-600 dark:text-gray-400' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {chapter.title}
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{chapter.readingTime}</span>
                      </div>
                      {isCurrent && (
                        <span className="bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 px-2 py-1 rounded-full text-xs font-medium">
                          Current
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-8 text-center">
            <button
              onClick={() => handleChapterClick(Math.min(currentChapter, story.chapters.length - 1))}
              className="bg-rose-300 text-rose-800 px-8 py-3 rounded-lg font-medium hover:bg-rose-400 transition-colors"
            >
              {currentChapter === 0 ? 'Start Reading' : `Continue from Chapter ${Math.min(currentChapter + 1, story.chapters.length)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}