'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
interface ChapterReactionsProps {
  chapterId: string;
  className?: string;
}
const REACTIONS = [
  { emoji: '😍', label: 'Love it' },
  { emoji: '😭', label: 'Emotional' },
  { emoji: '🔥', label: 'Exciting' },
  { emoji: '😱', label: 'Shocking' }
];
interface ReactionCounts {
  '😍': number;
  '😭': number;
  '🔥': number;
  '😱': number;
}
export function ChapterReactions({ chapterId, className = '' }: ChapterReactionsProps) {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<ReactionCounts>({
    '😍': 0,
    '😭': 0,
    '🔥': 0,
    '😱': 0
  });
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    if (chapterId) {
      loadReactions();
      loadUserReaction();
    }
  }, [chapterId]);
  const loadReactions = async () => {
    try {
      const response = await fetch(`/api/chapter-reactions?chapterId=${chapterId}`);
      if (response.ok) {
        const data = await response.json();
        setReactions(data.reactions);
      }
    } catch (error) {
      console.error('Error loading reactions:', error);
    } finally {
      setLoading(false);
    }
  };
  const loadUserReaction = () => {
    if (!user?.userId) return;
    const userReactions = JSON.parse(localStorage.getItem('user_chapter_reactions') || '{}');
    const reaction = userReactions[chapterId];
    setUserReaction(reaction || null);
  };
  const handleReactionClick = async (emoji: string) => {
    if (!user?.userId || submitting) return;
    setSubmitting(true);
    try {
      if (userReaction === emoji) {
        await removeReaction();
      } else {
        await addReaction(emoji);
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
    } finally {
      setSubmitting(false);
    }
  };
  const addReaction = async (emoji: string) => {
    const response = await fetch('/api/chapter-reactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chapterId,
        reaction: emoji,
        userId: user?.userId,
        username: user?.username || 'Anonymous'
      }),
    });
    if (response.ok) {
      setReactions(prev => ({
        ...prev,
        [userReaction as keyof ReactionCounts]: userReaction ? Math.max(0, prev[userReaction as keyof ReactionCounts] - 1) : prev[userReaction as keyof ReactionCounts],
        [emoji as keyof ReactionCounts]: prev[emoji as keyof ReactionCounts] + 1
      }));
      const userReactions = JSON.parse(localStorage.getItem('user_chapter_reactions') || '{}');
      userReactions[chapterId] = emoji;
      localStorage.setItem('user_chapter_reactions', JSON.stringify(userReactions));
      setUserReaction(emoji);
    }
  };
  const removeReaction = async () => {
    if (!userReaction) return;
    const response = await fetch(`/api/chapter-reactions?chapterId=${chapterId}&userId=${user?.userId}`, {
      method: 'DELETE',
    });
    if (response.ok) {
      setReactions(prev => ({
        ...prev,
        [userReaction as keyof ReactionCounts]: Math.max(0, prev[userReaction as keyof ReactionCounts] - 1)
      }));
      const userReactions = JSON.parse(localStorage.getItem('user_chapter_reactions') || '{}');
      delete userReactions[chapterId];
      localStorage.setItem('user_chapter_reactions', JSON.stringify(userReactions));
      setUserReaction(null);
    }
  };
  if (loading) {
    return (
      <div className={`flex items-center justify-center py-4 ${className}`}>
        <div className="flex space-x-2">
          {REACTIONS.map((reaction) => (
            <div key={reaction.emoji} className="w-10 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }
  const totalReactions = Object.values(reactions).reduce((sum, count) => sum + count, 0);
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-center space-x-3">
        {REACTIONS.map((reaction) => {
          const count = reactions[reaction.emoji as keyof ReactionCounts];
          const isSelected = userReaction === reaction.emoji;
          return (
            <button
              key={reaction.emoji}
              onClick={() => handleReactionClick(reaction.emoji)}
              disabled={submitting || !user?.userId}
              className={`
                relative group flex items-center space-x-1 px-3 py-2 rounded-lg transition-all duration-200
                ${isSelected 
                  ? 'bg-rose-50 dark:bg-gray-700 border-2 border-rose-300 dark:border-rose-700' 
                  : 'bg-gray-50 dark:bg-gray-800 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'
                }
                ${!user?.userId ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${submitting ? 'opacity-50 cursor-wait' : ''}
              `}
              title={`${reaction.label}${!user?.userId ? ' (Login required)' : ''}`}
            >
              <span className="text-lg select-none">{reaction.emoji}</span>
              {count > 0 && (
                <span className={`
                  text-sm font-medium select-none
                  ${isSelected 
                    ? 'text-rose-600 dark:text-rose-300' 
                    : 'text-gray-600 dark:text-gray-300'
                  }
                `}>
                  {count}
                </span>
              )}
              {user?.userId && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  {reaction.label}
                </div>
              )}
            </button>
          );
        })}
      </div>
      {totalReactions > 0 && (
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {totalReactions} {totalReactions === 1 ? 'reaction' : 'reactions'}
          </p>
        </div>
      )}
      {!user?.userId && (
        <div className="text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Sign in to react to chapters
          </p>
        </div>
      )}
    </div>
  );
}