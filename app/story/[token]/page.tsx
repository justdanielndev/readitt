'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ReadingView } from '@/components/ReadingView';
import { ContentWarningDisplay } from '@/components/ContentWarningDisplay';
import { saveUserStory } from '@/lib/userStories';
interface Story {
  id: string;
  title: string;
  fandom: string;
  genre: string[];
  description: string;
  tags: string[];
  author: string;
  totalChapters: number;
  lastUpdated: string;
  isPrivate: boolean;
  shareToken: string;
  contentWarnings?: string[];
  ageRating?: string;
  isNsfw?: boolean;
  chapters: Array<{
    id: string;
    number: number;
    title: string;
    content: string;
    readingTime: string;
    upvotes: number;
    downvotes: number;
  }>;
}
export default function SharedStoryPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [showContentWarning, setShowContentWarning] = useState(false);
  const [warningsAccepted, setWarningsAccepted] = useState(false);
  useEffect(() => {
    async function fetchStory() {
      try {
        const response = await fetch(`/api/shared-story/${token}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('Story not found or link has expired');
          } else {
            setError('Failed to load story');
          }
          return;
        }
        const storyData = await response.json();
        console.log('📖 [SHARED] Story data received:', storyData);
        console.log('🏷️ [SHARED] Content warnings:', storyData.contentWarnings);
        console.log('🔞 [SHARED] Age rating:', storyData.ageRating);
        console.log('🚫 [SHARED] Is NSFW:', storyData.isNsfw);
        setStory(storyData);
        const hasWarnings = storyData.contentWarnings && storyData.contentWarnings.length > 0;
        const isAdultContent = storyData.ageRating === '18+' || storyData.isNsfw;
        console.log('⚠️ [SHARED] Has warnings:', hasWarnings);
        console.log('🔞 [SHARED] Is adult content:', isAdultContent);
        console.log('🚨 [SHARED] Should show warning:', hasWarnings || isAdultContent);
        if (hasWarnings || isAdultContent) {
          console.log('📋 [SHARED] Showing content warning display');
          setShowContentWarning(true);
        } else {
          console.log('✅ [SHARED] No warnings, accepting automatically');
          setWarningsAccepted(true);
        }
        saveUserStory({
          id: storyData.id,
          title: storyData.title,
          fandom: storyData.fandom,
          shareToken: storyData.shareToken,
          isPrivate: storyData.isPrivate,
          isOwner: false
        });
      } catch (err) {
        console.error('Error fetching story:', err);
        setError('Failed to load story');
      } finally {
        setLoading(false);
      }
    }
    if (token) {
      fetchStory();
    }
  }, [token]);
  const handleChapterChange = (chapterIndex: number) => {
    setCurrentChapter(chapterIndex);
  };
  const handleBack = () => {
    router.push('/');
  };
  const handleAcceptWarnings = () => {
    setWarningsAccepted(true);
    setShowContentWarning(false);
  };
  const handleDeclineWarnings = () => {
    router.push('/');
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-300 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading story...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <a 
            href="/" 
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Return to Home
          </a>
        </div>
      </div>
    );
  }
  if (!story) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Story Not Found</h1>
          <a 
            href="/" 
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Return to Home
          </a>
        </div>
      </div>
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
  if (!warningsAccepted) {
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
    <>
      {story.isPrivate && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-40 bg-yellow-50 border border-yellow-200 rounded-lg p-3 shadow-lg">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 616 0z" clipRule="evenodd" />
            </svg>
            <span className="text-yellow-800 font-medium text-sm">Private Story - Saved to your collection</span>
          </div>
        </div>
      )}
      <ReadingView 
        story={story} 
        currentChapter={currentChapter}
        onChapterChange={handleChapterChange}
        onBack={handleBack}
      />
    </>
  );
}