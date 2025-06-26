'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, ThumbsUp, ThumbsDown, ChevronLeft, ChevronRight, Share2, Copy, Check, ArrowUp, ArrowDown, MessageCircle, AlertCircle, BadgePlus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { VoteModal } from './VoteModal';
import { SimpleHeader } from './SimpleHeader';
import { CommentsSection } from './CommentsSection';
import { TranslationSelector } from './TranslationSelector';
import { ContentWarningDisplay } from './ContentWarningDisplay';
import { NSFWBlockedModal } from './NSFWBlockedModal';
import { OneOffModal } from './OneOffModal';
import { ChapterReactions } from './ChapterReactions';
import { ChapterSummary } from './ChapterSummary';
import { supabase } from '@/lib/supabase';
import { UserContextManager } from '@/lib/userContext';
import { useAuth } from '@/lib/auth';
import { ResearchAnalytics } from '@/lib/researchAnalytics';
import type { Story } from './HomepageView';
interface ReadingViewProps {
  story: Story;
  currentChapter: number;
  onChapterChange: (chapter: number) => void;
  onBack: () => void;
}
export function ReadingView({ story, currentChapter, onChapterChange, onBack }: ReadingViewProps) {
  const { user: authUser } = useAuth();
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [voteType, setVoteType] = useState<'up' | 'down'>('up');
  const [userVotes, setUserVotes] = useState<Map<string, { type: 'up' | 'down'; reasons: string[] }>>(new Map());
  const [statsInitialized, setStatsInitialized] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [availableLanguages, setAvailableLanguages] = useState<string[]>(['en']);
  const [showContentWarning, setShowContentWarning] = useState(false);
  const [warningsAccepted, setWarningsAccepted] = useState(false);
  const [showNSFWBlocked, setShowNSFWBlocked] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<{title: string, content: string} | null>(null);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [showOneOffModal, setShowOneOffModal] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);
  const autoLoadAttempted = useRef<boolean>(false);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const scrollThreshold = 100; 
  const [readingProgress, setReadingProgress] = useState(0);
  const readingProgressMarked = useRef(false);
  const researchAnalytics = ResearchAnalytics.getInstance();
  const chapter = story.chapters[currentChapter];
  useEffect(() => {
    if (story) {
      console.log('📖 [READINGVIEW] Story loaded, checking content warnings');
      console.log('🏷️ [READINGVIEW] Content warnings:', story.contentWarnings);
      console.log('🔞 [READINGVIEW] Age rating:', story.ageRating);
      console.log('🚫 [READINGVIEW] Is NSFW:', story.isNsfw);
      const userManager = UserContextManager.getInstance();
      const userPreferences = userManager.getUserContext().preferences;
      const isAdultContent = story.ageRating === '18+' || story.isNsfw;
      const isSlackUser = authUser?.slackUserId && authUser?.slackTeamId;
      console.log('⚙️ [READINGVIEW] User 18+ setting enabled:', userPreferences.show18PlusContent);
      console.log('🔞 [READINGVIEW] Is adult content:', isAdultContent);
      console.log('👤 [READINGVIEW] Is Slack user:', isSlackUser);
      if (isAdultContent && !userPreferences.show18PlusContent) {
        console.log('🚫 [READINGVIEW] NSFW content blocked by user settings');
        setShowNSFWBlocked(true);
        return;
      }
      const hasWarnings = story.contentWarnings && story.contentWarnings.length > 0;
      console.log('⚠️ [READINGVIEW] Has warnings:', hasWarnings);
      console.log('🚨 [READINGVIEW] Should show warning:', hasWarnings || isAdultContent);
      if (hasWarnings || isAdultContent) {
        console.log('📋 [READINGVIEW] Showing content warning display');
        setShowContentWarning(true);
        setWarningsAccepted(false);
      } else {
        console.log('✅ [READINGVIEW] No warnings, accepting automatically');
        setWarningsAccepted(true);
        setShowContentWarning(false);
      }
    }
  }, [story]);
  useEffect(() => {
    if (!statsInitialized && story && chapter) {
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
      setStatsInitialized(true);
    }
  }, [story, chapter, currentChapter, statsInitialized]);
  useEffect(() => {
    researchAnalytics.endReadingSession();
    setReadingProgress(0);
    readingProgressMarked.current = false;
    if (chapter && statsInitialized) {
      const userManager = UserContextManager.getInstance();
      const userId = userManager.getUserContext().userId;
      researchAnalytics.startReadingSession(
        userId,
        {
          id: story.id,
          title: story.title,
          fandom: story.fandom,
          contentWarnings: story.contentWarnings,
          ageRating: story.ageRating,
          author: story.author,
          authorUserId: (story as any).author_user_id,
          genre: story.genre,
        },
        chapter.number,
        chapter.title,
        chapter.content
      ).catch(error => {
        console.error('Failed to start reading analytics session:', error);
      });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentChapter, story, chapter, statsInitialized, researchAnalytics]);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setShowShareMenu(false);
      }
    }
    if (showShareMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showShareMenu]);
  const handleScroll = useCallback(() => {
    if (isTransitioning || !contentRef.current) return;
    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const progressPercent = Math.min(100, Math.max(0, (scrollY / (documentHeight - windowHeight)) * 100));
    setReadingProgress(progressPercent);
    researchAnalytics.trackScrollEvent(scrollY, documentHeight, windowHeight);
    if (progressPercent >= 90 && !readingProgressMarked.current && statsInitialized && story) {
      readingProgressMarked.current = true;
      const userManager = UserContextManager.getInstance();
      userManager.updateStoryProgress(story.id, currentChapter + 1);
      const userContext = userManager.getUserContext();
      const storyIndex = userContext.stories.findIndex(s => s.id === story.id);
      if (storyIndex !== -1 && userContext.stories[storyIndex].status === 'pending') {
        userContext.stories[storyIndex].status = 'reading';
        userManager.updateUserContext({ stories: userContext.stories });
      }
      if (currentChapter >= story.chapters.length - 1) {
        if (storyIndex !== -1) {
          userContext.stories[storyIndex].status = 'completed';
          userManager.updateUserContext({ stories: userContext.stories });
        }
      }
    }
    const isScrollingDown = scrollY > lastScrollY.current;
    const isScrollingUp = scrollY < lastScrollY.current;
    lastScrollY.current = scrollY;
    if (scrollY <= 0 && isScrollingUp && currentChapter > 0) {
      setScrollDirection('up');
      const progress = Math.min(Math.abs(scrollY) / scrollThreshold, 1);
      setScrollProgress(progress);
      setShowScrollIndicator(progress > 0.1);
      if (progress >= 1) {
        researchAnalytics.endReadingSession();
        handlePrevChapter();
        return;
      }
    }
    else if (scrollY + windowHeight >= documentHeight - 5 && isScrollingDown && currentChapter < story.chapters.length - 1) {
      setScrollDirection('down');
      const overscroll = (scrollY + windowHeight) - documentHeight;
      const progress = Math.min(overscroll / scrollThreshold, 1);
      setScrollProgress(progress);
      setShowScrollIndicator(progress > 0.1);
      if (progress >= 1) {
        researchAnalytics.endReadingSession();
        handleNextChapter();
        return;
      }
    }
    else {
      setShowScrollIndicator(false);
      setScrollProgress(0);
      setScrollDirection(null);
    }
  }, [currentChapter, story.chapters.length, isTransitioning, statsInitialized, story]);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);
  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    touchEndY.current = e.changedTouches[0].clientY;
    const swipeDistance = touchStartY.current - touchEndY.current;
    const minSwipeDistance = 50;
    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 5) {
        if (currentChapter < story.chapters.length - 1) {
          researchAnalytics.endReadingSession();
          handleNextChapter();
        }
      } else if (swipeDistance < 0 && window.scrollY <= 0) {
        if (currentChapter > 0) {
          researchAnalytics.endReadingSession();
          handlePrevChapter();
        }
      }
    }
  }, [currentChapter, story.chapters.length]);
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      window.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('touchstart', handleTouchStart, { passive: true });
      window.addEventListener('touchend', handleTouchEnd, { passive: true });
      return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('touchstart', handleTouchStart);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [handleScroll, handleTouchStart, handleTouchEnd]);
  const navigateToChapter = useCallback((newChapter: number) => {
    setIsTransitioning(true);
    setShowScrollIndicator(false);
    setScrollProgress(0);
    const content = contentRef.current;
    if (content) {
      content.style.opacity = '0.5';
      content.style.transform = 'translateY(10px)';
    }
    setTimeout(() => {
      onChapterChange(newChapter);
      setTimeout(() => {
        if (content) {
          content.style.opacity = '1';
          content.style.transform = 'translateY(0)';
        }
        setIsTransitioning(false);
      }, 150);
    }, 200);
  }, [onChapterChange]);
  const handleNextChapter = useCallback(() => {
    if (currentChapter < story.chapters.length - 1) {
      researchAnalytics.trackInteraction();
      navigateToChapter(currentChapter + 1);
    }
  }, [currentChapter, story.chapters.length, navigateToChapter, researchAnalytics]);
  const handlePrevChapter = useCallback(() => {
    if (currentChapter > 0) {
      researchAnalytics.trackInteraction();
      navigateToChapter(currentChapter - 1);
    }
  }, [currentChapter, navigateToChapter, researchAnalytics]);
  if (!chapter) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Chapter not found</h2>
          <button onClick={onBack} className="text-rose-300 hover:text-rose-400">
            Go back
          </button>
        </div>
      </div>
    );
  }
  if (!chapter.content || chapter.content.trim() === '') {
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
                {story.title}
              </h1>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Chapter {chapter.number} of {story.chapters.length}
              </div>
            </div>
          }
        />
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 min-h-screen">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <h2 className="pt-20 text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Chapter {chapter.number}: {chapter.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                This chapter is being written right now! Please check back in about 5 minutes.
              </p>
              <button onClick={onBack} className="text-rose-300 hover:text-rose-400 underline">
                Go back to chapter list
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  const handleVote = (type: 'up' | 'down') => {
    const voteKey = `${story.id}-${chapter.number}`;
    if (userVotes.has(voteKey)) {
      return;
    }
    researchAnalytics.trackInteraction();
    setVoteType(type);
    setShowVoteModal(true);
  };
  const handleVoteSubmit = async (reasons: string[]) => {
    const voteKey = `${story.id}-${chapter.number}`;
    const userSessionId = localStorage.getItem('user-session-id') || 
      (() => {
        const id = `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        localStorage.setItem('user-session-id', id);
        return id;
      })();
    setUserVotes(prev => new Map(prev.set(voteKey, { type: voteType, reasons })));
    researchAnalytics.setRating(voteType);
    try {
      await supabase.from('votes').insert([
        {
          story_id: story.id,
          chapter_number: chapter.number,
          vote_type: voteType,
          reasons,
          user_session_id: userSessionId,
        }
      ]);
      await supabase
        .from('chapters')
        .update({
          upvotes: voteType === 'up' ? chapter.upvotes + 1 : chapter.upvotes,
          downvotes: voteType === 'down' ? chapter.downvotes + 1 : chapter.downvotes,
        })
        .eq('story_id', story.id)
        .eq('chapter_number', chapter.number);
      console.log('✅ Chapter rating saved successfully');
    } catch (error) {
      console.error('Error saving vote:', error);
    }
    setShowVoteModal(false);
  };
  const handleShare = async () => {
    try {
      const response = await fetch(`/api/story/${story.id}/share`);
      if (response.ok) {
        const data = await response.json();
        setShareUrl(data.shareUrl);
        setShowShareMenu(true);
      }
    } catch (error) {
      console.error('Error getting share link:', error);
    }
  };
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };
  const voteKey = `${story.id}-${chapter.number}`;
  const userVote = userVotes.get(voteKey);
  const loadAvailableTranslations = useCallback(async () => {
    try {
      const response = await fetch(`/api/translations?story_id=${story.id}&chapter_number=${chapter.number}`);
      if (response.ok) {
        const data = await response.json();
        const languages = ['en', ...data.translations.map((t: any) => t.target_language)];
        setAvailableLanguages(languages);
      }
    } catch (error) {
      console.error('Error loading translations:', error);
    }
  }, [story.id, chapter.number]);
  useEffect(() => {
    setTranslatedContent(null);
    setCurrentLanguage('en');
    setTranslationError(null);
    autoLoadAttempted.current = false;
    loadAvailableTranslations();
  }, [loadAvailableTranslations]);
  useEffect(() => {
    if (autoLoadAttempted.current || availableLanguages.length <= 1) {
      return;
    }
    const userManager = UserContextManager.getInstance();
    const preferredLanguage = userManager.getEffectiveReadingLanguage();
    if (preferredLanguage !== 'en' && 
        availableLanguages.includes(preferredLanguage) && 
        currentLanguage === 'en' && 
        !translatedContent) {
      console.log('🌐 [READINGVIEW] Auto-loading preferred reading language:', preferredLanguage);
      autoLoadAttempted.current = true;
      const loadContent = async () => {
        try {
          const response = await fetch(
            `/api/translations/content?story_id=${story.id}&chapter_number=${chapter.number}&target_language=${preferredLanguage}`
          );
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.translation) {
              setCurrentLanguage(preferredLanguage);
              setTranslatedContent({
                title: data.translation.title,
                content: data.translation.content
              });
              console.log('✅ [READINGVIEW] Auto-loaded translation for:', preferredLanguage);
            }
          }
        } catch (error) {
          console.error('❌ [READINGVIEW] Error auto-loading translation:', error);
        }
      };
      loadContent();
    }
  }, [availableLanguages, story.id, chapter.number]); 
  const handleLanguageChange = (language: string, translatedData?: {title: string, content: string}) => {
    setCurrentLanguage(language);
    setTranslationError(null);
    if (language === 'en') {
      setTranslatedContent(null);
    } else if (translatedData) {
      setTranslatedContent(translatedData);
    } else {
      console.warn('Language changed but no translated content provided');
    }
  };
  const handleTranslationRequest = () => {
    setTimeout(() => {
      loadAvailableTranslations();
    }, 2000);
  };
  const handleTranslationError = (error: string) => {
    setTranslationError(error);
    console.error('Translation error:', error);
  };
  const handleAcceptWarnings = () => {
    console.log('✅ [READINGVIEW] Content warnings accepted');
    setWarningsAccepted(true);
    setShowContentWarning(false);
  };
  const handleDeclineWarnings = () => {
    console.log('❌ [READINGVIEW] Content warnings declined, going back');
    researchAnalytics.endReadingSession();
    onBack();
  };
  const handleNSFWBlockedClose = () => {
    console.log('❌ [READINGVIEW] NSFW blocked modal closed, going back');
    researchAnalytics.endReadingSession();
    onBack();
  };
  const handleOpenSettings = () => {
    console.log('⚙️ [READINGVIEW] Opening settings from NSFW blocked modal');
    onBack();
  };
  const processContent = (content: string | undefined | null) => {
    if (!content) {
      return '';
    }
    const processedContent = content
      .replace(/<newline\/>/g, '\n')
      .replace(/<paragraph\/>/g, '\n\n')
      .replace(/\n{3,}/g, '\n\n');
    return processedContent;
  };
  if (showNSFWBlocked && story) {
    return (
      <NSFWBlockedModal
        isOpen={showNSFWBlocked}
        storyTitle={story.title}
        onClose={handleNSFWBlockedClose}
        onOpenSettings={handleOpenSettings}
      />
    );
  }
  if (showContentWarning && story) {
    return (
      <ContentWarningDisplay
        contentWarnings={story.contentWarnings || []}
        ageRating={story.ageRating || 'all-ages'}
        storyTitle={story.title}
        onAccept={handleAcceptWarnings}
        onDecline={handleDeclineWarnings}
      />
    );
  }
  if (!warningsAccepted && story && (story.contentWarnings?.length || story.ageRating === '18+' || story.isNsfw)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-300 mx-auto mb-4"></div>
          <p className="text-gray-600">Preparing story...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SimpleHeader 
        onLogoClick={onBack}
        leftContent={
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                researchAnalytics.endReadingSession();
                onBack();
              }}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button onClick={() => {
              researchAnalytics.endReadingSession();
              onBack();
            }} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img src="/readitt.png" alt="Readitt" className="h-6 w-6" />
            </button>
          </div>
        }
        centerContent={
          <div className="text-center">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate max-w-xs">
              {story.title}
            </h1>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Chapter {chapter.number} of {story.totalChapters}
            </div>
          </div>
        }
        rightContent={
          <div className="relative">
            <button
              onClick={handleShare}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Share2 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            {showShareMenu && (
              <div ref={shareMenuRef} className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Share Story</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-3 py-2 bg-rose-300 text-rose-800 rounded hover:bg-rose-400 transition-colors flex items-center gap-1"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <button
                    onClick={() => setShowShareMenu(false)}
                    className="w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        }
      />
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 min-h-screen">
        <div className="px-6 md:px-12 pt-8 pb-6 border-b border-gray-100 dark:border-gray-700">
          {currentChapter > 0 && (
            <div className="flex justify-start mb-4">
              <button
                onClick={handlePrevChapter}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
              >
                <ArrowUp className="h-4 w-4" />
                Previous Chapter
              </button>
            </div>
          )}
          <div className="text-center mb-6">
            <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3 inline">
              <ReactMarkdown 
                components={{
                  p: ({ children }) => <span>{children}</span>,
                  h1: ({ children }) => <span>{children}</span>,
                  h2: ({ children }) => <span>{children}</span>,
                  h3: ({ children }) => <span>{children}</span>,
                  strong: ({ children }) => <strong>{children}</strong>,
                  em: ({ children }) => <em>{children}</em>,
                }}
              >
                {translatedContent ? translatedContent.title : chapter.title}
              </ReactMarkdown>
              {translatedContent && (
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-normal">
                  Translated to {currentLanguage}
                </div>
              )}
            </div>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
              <span className="bg-rose-100 dark:bg-gray-700 text-rose-700 dark:text-rose-300 px-3 py-1 rounded-full font-medium">
                {story.fandom}
              </span>
              <span>{story.author}</span>
              <span>{chapter.readingTime}</span>
              {commentCount > 0 && (
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  <span>{commentCount} comments</span>
                </div>
              )}
            </div>
            <div className="flex justify-center">
              <TranslationSelector
                storyId={story.id}
                chapterNumber={chapter.number}
                currentLanguage={currentLanguage}
                availableLanguages={availableLanguages}
                onLanguageChange={handleLanguageChange}
                onTranslationRequest={handleTranslationRequest}
                onTranslationError={handleTranslationError}
              />
            </div>
          </div>
        </div>
        <div className="px-6 md:px-12 pb-6">
          <ChapterSummary
            storyId={story.id}
            storyTitle={story.title}
            totalChapters={story.totalChapters}
            currentChapter={chapter.number}
          />
        </div>
        <div ref={contentRef} className="px-6 md:px-12 py-8 transition-all duration-200">
          <div className="prose prose-lg dark:prose-invert max-w-none text-lg md:text-xl leading-relaxed font-serif">
            <ReactMarkdown 
              components={{
                p: ({ children }) => (
                  <p className="mb-4 text-gray-900 dark:text-gray-100 leading-relaxed">
                    {children}
                  </p>
                ),
                h1: ({ children }) => (
                  <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                    {children}
                  </h2>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-gray-900 dark:text-white">
                    {children}
                  </strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-gray-900 dark:text-gray-100">
                    {children}
                  </em>
                ),
              }}
            >
              {processContent(translatedContent ? translatedContent.content : chapter.content)}
            </ReactMarkdown>
            {translationError && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium text-red-800 dark:text-red-300">
                    Translation Error
                  </span>
                </div>
                <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                  {translationError}
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="px-6 md:px-12 py-8 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="hidden md:flex gap-4 mb-8">
            <button
              onClick={handlePrevChapter}
              disabled={currentChapter === 0}
              className="flex-1 flex items-center justify-center space-x-2 py-4 px-6 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="font-medium">Previous Chapter</span>
            </button>
            <button
              onClick={handleNextChapter}
              disabled={currentChapter >= story.chapters.length - 1}
              className="flex-1 flex items-center justify-center space-x-2 py-4 px-6 bg-rose-300 text-rose-800 rounded-lg hover:bg-rose-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <span className="font-medium">Next Chapter</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
              How did this chapter make you feel?
            </h3>
            <ChapterReactions 
              chapterId={chapter.id} 
              className="mb-6"
            />
          </div>
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              How was this chapter?
            </h3>
            <div className="flex justify-center space-x-4 mb-4">
              <button
                onClick={() => handleVote('up')}
                disabled={!!userVote}
                className={`flex items-center space-x-3 px-6 py-3 rounded-lg transition-all shadow-sm ${
                  userVote?.type === 'up'
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800'
                    : userVote
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed border border-gray-200 dark:border-gray-700'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/10 hover:text-green-600 border border-gray-200 dark:border-gray-700 hover:border-green-200'
                }`}
              >
                <ThumbsUp className="h-5 w-5" />
                <span className="font-medium">Loved it ({chapter.upvotes})</span>
              </button>
              <button
                onClick={() => handleVote('down')}
                disabled={!!userVote}
                className={`flex items-center space-x-3 px-6 py-3 rounded-lg transition-all shadow-sm ${
                  userVote?.type === 'down'
                    ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                    : userVote
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed border border-gray-200 dark:border-gray-700'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 border border-gray-200 dark:border-gray-700 hover:border-red-200'
                }`}
              >
                <ThumbsDown className="h-5 w-5" />
                <span className="font-medium">Could be better ({chapter.downvotes})</span>
              </button>
            </div>
            {userVote && (
              <div className="text-green-600 dark:text-green-400 text-sm font-medium bg-green-50 dark:bg-green-900/20 py-2 px-4 rounded-lg inline-block">
                ✓ Thank you for your feedback!
              </div>
            )}
          </div>
          {currentChapter >= story.chapters.length - 1 && !userVote && (
            <div className="text-center mt-6 p-4 bg-rose-50 dark:bg-gray-800 rounded-xl border border-rose-200 dark:border-gray-700">
              <p className="text-rose-700 dark:text-rose-300 font-medium">
                🎉 You've reached the last available chapter!
              </p>
              <p className="text-rose-600 dark:text-rose-400 text-sm mt-1">
                Vote above with your POV to help write the next chapter!
              </p>
            </div>
          )}
          {authUser?.hasPlus && (
            <div className="text-center mt-6 p-4 bg-gradient-to-r from-rose-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-xl border border-rose-200 dark:border-gray-600">
              <div className="flex items-center justify-center gap-2 mb-2">
                <BadgePlus className="h-5 w-5 text-rose-500" />
                <span className="text-sm font-medium text-rose-600 dark:text-rose-400">Plus Feature</span>
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Create Private One-Off Story
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Continue from this chapter with your own custom story direction
              </p>
              <button
                onClick={() => setShowOneOffModal(true)}
                className="bg-gradient-to-r from-rose-500 to-purple-500 text-white px-6 py-2 rounded-lg font-medium hover:from-rose-600 hover:to-purple-600 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Create One-Off
              </button>
            </div>
          )}
        </div>
        <div className="px-6 md:px-12 py-8 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <CommentsSection
            storyId={story.id}
            chapterNumber={chapter.number}
            onCommentCountChange={setCommentCount}
          />
        </div>
      </div>
      {showScrollIndicator && scrollDirection && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50 md:hidden">
          <div 
            className="bg-white dark:bg-gray-800 rounded-full p-4 shadow-lg border-2 border-rose-300 dark:border-rose-600 transition-all duration-200"
            style={{
              transform: `scale(${0.8 + scrollProgress * 0.4})`,
              opacity: 0.7 + scrollProgress * 0.3
            }}
          >
            {scrollDirection === 'up' ? (
              <ArrowUp className="h-8 w-8 text-rose-500" />
            ) : (
              <ArrowDown className="h-8 w-8 text-rose-500" />
            )}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-gray-200"
                stroke="currentColor"
                strokeWidth="2"
                fill="transparent"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-rose-300"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                fill="transparent"
                strokeDasharray={`${scrollProgress * 100}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
          </div>
        </div>
      )}
      {showVoteModal && (
        <VoteModal
          voteType={voteType}
          onSubmit={handleVoteSubmit}
          onClose={() => setShowVoteModal(false)}
        />
      )}
      {showOneOffModal && (
        <OneOffModal
          isOpen={showOneOffModal}
          onClose={() => setShowOneOffModal(false)}
          story={story}
          currentChapter={currentChapter}
          chapterContent={translatedContent ? translatedContent.content : chapter.content}
        />
      )}
    </div>
  );
}