'use client';
import { useState } from 'react';
import { FileText, Sparkles, Crown, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';
interface CatchUpSummaryProps {
  storyId: string;
  storyTitle: string;
  totalChapters: number;
  currentChapter: number;
  className?: string;
}
export function ChapterSummary({ storyId, storyTitle, totalChapters, currentChapter, className = '' }: CatchUpSummaryProps) {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fromChapter, setFromChapter] = useState(Math.max(1, currentChapter - 2));
  const [toChapter, setToChapter] = useState(currentChapter - 1);
  const generateSummary = async () => {
    if (!user?.userId || loading || fromChapter > toChapter) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/chapter-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storyId,
          fromChapter,
          toChapter,
          userId: user.userId
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary);
        const cacheKey = `catchup_summary_${storyId}_${fromChapter}_${toChapter}`;
        localStorage.setItem(cacheKey, JSON.stringify({
          summary: data.summary,
          timestamp: Date.now()
        }));
        setShowModal(false);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to generate catch-up summary');
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      setError('Failed to generate catch-up summary. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  if (!user?.hasPlus) {
    return (
      <div className={`p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg ${className}`}>
        <div className="flex items-center gap-2 mb-2">
          <Crown className="h-5 w-5 text-amber-500" />
          <span className="font-medium text-amber-800 dark:text-amber-300">Plus Feature</span>
        </div>
        <p className="text-sm text-amber-700 dark:text-amber-400">
          Upgrade to Plus to get AI-powered "catch me up" summaries of multiple chapters.
        </p>
      </div>
    );
  }
  return (
    <>
      <div className={className}>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
        >
          <FileText className="h-4 w-4" />
          <span className="font-medium">Catch Me Up</span>
          <div className="flex items-center gap-1 px-2 py-1 bg-rose-600 rounded-full">
            <Sparkles className="h-3 w-3" />
            <span className="text-xs font-medium">AI</span>
          </div>
        </button>
        {summary && (
          <div className="mt-4 p-4 bg-white dark:bg-gray-800 border border-rose-200 dark:border-rose-800 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {storyTitle} • Chapters {fromChapter}-{toChapter}
            </div>
            <div className="text-gray-900 dark:text-gray-100 leading-relaxed">
              {summary}
            </div>
          </div>
        )}
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-rose-500" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Catch Me Up
                </h2>
                <div className="flex items-center gap-1 px-2 py-1 bg-rose-100 dark:bg-rose-800 rounded-full">
                  <Sparkles className="h-3 w-3 text-rose-600 dark:text-rose-300" />
                  <span className="text-xs font-medium text-rose-700 dark:text-rose-300">AI</span>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Get an AI summary of chapters to catch up on the story
              </div>
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    From Chapter:
                  </label>
                  <select
                    value={fromChapter}
                    onChange={(e) => setFromChapter(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 dark:bg-gray-700 dark:text-white"
                  >
                    {Array.from({ length: Math.max(1, currentChapter - 1) }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>Chapter {num}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    To Chapter:
                  </label>
                  <select
                    value={toChapter}
                    onChange={(e) => setToChapter(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 dark:bg-gray-700 dark:text-white"
                  >
                    {Array.from({ length: Math.max(1, currentChapter - 1) }, (_, i) => i + 1).filter(num => num >= fromChapter).map(num => (
                      <option key={num} value={num}>Chapter {num}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={generateSummary}
                  disabled={loading || fromChapter > toChapter}
                  className="flex-1 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Catch Me Up
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}