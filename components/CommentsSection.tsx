'use client';
import { useState, useEffect } from 'react';
import { MessageCircle, ThumbsUp, ThumbsDown, Reply, Flag, Pin, MoreVertical, Eye, EyeOff, Send, X } from 'lucide-react';
import { UserContextManager } from '@/lib/userContext';
interface Comment {
  id: string;
  story_id: string;
  chapter_number?: number;
  parent_comment_id?: string;
  author_name: string;
  content: string;
  is_spoiler: boolean;
  upvotes: number;
  downvotes: number;
  is_pinned: boolean;
  reply_count: number;
  created_at: string;
  updated_at: string;
  replies?: Comment[];
}
interface CommentsSectionProps {
  storyId: string;
  chapterNumber?: number;
  isAuthor?: boolean;
  onCommentCountChange?: (count: number) => void;
}
interface CommentItemProps {
  comment: Comment;
  isAuthor?: boolean;
  onReply: (parentId: string) => void;
  onVote: (commentId: string, voteType: 'up' | 'down') => void;
  onFlag: (commentId: string) => void;
  onPin?: (commentId: string) => void;
  userVotes: Map<string, 'up' | 'down'>;
  level?: number;
}
function CommentItem({ 
  comment, 
  isAuthor, 
  onReply, 
  onVote, 
  onFlag, 
  onPin, 
  userVotes,
  level = 0 
}: CommentItemProps) {
  const [showSpoiler, setShowSpoiler] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const userVote = userVotes.get(comment.id);
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;
    return date.toLocaleDateString();
  };
  const handleVote = (voteType: 'up' | 'down') => {
    if (userVote === voteType) {
      return;
    }
    onVote(comment.id, voteType);
  };
  return (
    <div 
      className={`${level > 0 ? 'ml-6 border-l-2 border-gray-200 dark:border-gray-700 pl-4' : ''} mb-4`}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-rose-600 dark:text-rose-400">
                {comment.author_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-900 dark:text-white">
                {comment.author_name}
              </span>
              {comment.is_pinned && (
                <Pin className="inline-block ml-2 h-4 w-4 text-rose-500" />
              )}
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {formatTimeAgo(comment.created_at)}
                {comment.chapter_number && (
                  <span className="ml-2">• Chapter {comment.chapter_number}</span>
                )}
              </div>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <MoreVertical className="h-4 w-4 text-gray-500" />
            </button>
            {showOptions && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-32">
                <button
                  onClick={() => {
                    onFlag(comment.id);
                    setShowOptions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Flag className="h-4 w-4" />
                  Report
                </button>
                {isAuthor && onPin && (
                  <button
                    onClick={() => {
                      onPin(comment.id);
                      setShowOptions(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Pin className="h-4 w-4" />
                    {comment.is_pinned ? 'Unpin' : 'Pin'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="mb-3">
          {comment.is_spoiler && !showSpoiler ? (
            <button
              onClick={() => setShowSpoiler(true)}
              className="flex items-center gap-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-800 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
            >
              <EyeOff className="h-4 w-4" />
              <span className="text-sm font-medium">Spoiler - Click to reveal</span>
            </button>
          ) : (
            <div className="relative">
              <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
                {comment.content}
              </p>
              {comment.is_spoiler && showSpoiler && (
                <button
                  onClick={() => setShowSpoiler(false)}
                  className="absolute top-0 right-0 p-1 bg-yellow-100 dark:bg-yellow-900/50 rounded text-yellow-600 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/70"
                >
                  <EyeOff className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleVote('up')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-sm transition-colors ${
                userVote === 'up'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <ThumbsUp className="h-4 w-4" />
              <span>{comment.upvotes}</span>
            </button>
            <button
              onClick={() => handleVote('down')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-sm transition-colors ${
                userVote === 'down'
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <ThumbsDown className="h-4 w-4" />
              <span>{comment.downvotes}</span>
            </button>
          </div>
          {level < 2 && ( 
            <button
              onClick={() => onReply(comment.id)}
              className="flex items-center gap-1 px-2 py-1 rounded text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Reply className="h-4 w-4" />
              <span>Reply</span>
              {comment.reply_count > 0 && (
                <span className="text-xs">({comment.reply_count})</span>
              )}
            </button>
          )}
        </div>
      </div>
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              isAuthor={isAuthor}
              onReply={onReply}
              onVote={onVote}
              onFlag={onFlag}
              onPin={onPin}
              userVotes={userVotes}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
function CommentForm({ 
  storyId, 
  chapterNumber, 
  parentCommentId, 
  onSubmit, 
  onCancel 
}: {
  storyId: string;
  chapterNumber?: number;
  parentCommentId?: string;
  onSubmit: (comment: any) => void;
  onCancel?: () => void;
}) {
  const [content, setContent] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const userContext = UserContextManager.getInstance().getUserContext();
  const authorName = userContext.username || 'Anonymous Reader';
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !authorName.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          story_id: storyId,
          chapter_number: chapterNumber,
          parent_comment_id: parentCommentId,
          author_name: authorName.trim(),
          content: content.trim(),
          is_spoiler: isSpoiler,
        }),
      });
      if (response.ok) {
        const newComment = await response.json();
        onSubmit(newComment);
        setContent('');
        setIsSpoiler(false);
      } else {
        console.error('Failed to submit comment');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
              {authorName.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Commenting as {authorName}
          </span>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <input
            type="checkbox"
            checked={isSpoiler}
            onChange={(e) => setIsSpoiler(e.target.checked)}
            className="rounded"
          />
          <span>Spoiler</span>
        </label>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={parentCommentId ? "Write a reply..." : "Write a comment..."}
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent resize-none"
        required
      />
      <div className="flex items-center justify-between mt-3">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {content.length}/2000 characters
        </div>
        <div className="flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!content.trim() || content.length > 2000 || isSubmitting}
            className="flex items-center gap-2 px-4 py-2 bg-rose-300 text-rose-800 rounded-lg font-medium hover:bg-rose-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </form>
  );
}
export function CommentsSection({ storyId, chapterNumber, isAuthor, onCommentCountChange }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [userVotes, setUserVotes] = useState<Map<string, 'up' | 'down'>>(new Map());
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest');
  useEffect(() => {
    loadComments();
  }, [storyId, chapterNumber, sortBy]);
  const loadComments = async () => {
    try {
      const params = new URLSearchParams({
        story_id: storyId,
        sort: sortBy,
      });
      if (chapterNumber) {
        params.append('chapter_number', chapterNumber.toString());
      }
      const response = await fetch(`/api/comments?${params}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
        setUserVotes(new Map(data.userVotes?.map((v: any) => [v.comment_id, v.vote_type]) || []));
        onCommentCountChange?.(data.comments.length);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleCommentSubmit = (newComment: Comment) => {
    if (replyingTo) {
      setComments(prev => prev.map(comment => {
        if (comment.id === replyingTo) {
          return {
            ...comment,
            replies: [...(comment.replies || []), newComment],
            reply_count: comment.reply_count + 1
          };
        }
        return comment;
      }));
      setReplyingTo(null);
    } else {
      setComments(prev => [newComment, ...prev]);
    }
    setShowCommentForm(false);
    onCommentCountChange?.(comments.length + 1);
  };
  const handleVote = async (commentId: string, voteType: 'up' | 'down') => {
    try {
      const response = await fetch('/api/comments/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment_id: commentId,
          vote_type: voteType,
        }),
      });
      if (response.ok) {
        const { upvotes, downvotes } = await response.json();
        setComments(prev => prev.map(comment => {
          if (comment.id === commentId) {
            return { ...comment, upvotes, downvotes };
          }
          if (comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map(reply => 
                reply.id === commentId ? { ...reply, upvotes, downvotes } : reply
              )
            };
          }
          return comment;
        }));
        setUserVotes(prev => new Map(prev.set(commentId, voteType)));
      }
    } catch (error) {
      console.error('Error voting on comment:', error);
    }
  };
  const handleFlag = async (commentId: string) => {
    try {
      const response = await fetch('/api/comments/flag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment_id: commentId,
          reason: 'inappropriate',
        }),
      });
      if (response.ok) {
        alert('Comment reported successfully');
      }
    } catch (error) {
      console.error('Error flagging comment:', error);
    }
  };
  const handlePin = async (commentId: string) => {
    if (!isAuthor) return;
    try {
      const response = await fetch('/api/comments/pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment_id: commentId,
        }),
      });
      if (response.ok) {
        const { is_pinned } = await response.json();
        setComments(prev => prev.map(comment => 
          comment.id === commentId ? { ...comment, is_pinned } : comment
        ));
      }
    } catch (error) {
      console.error('Error pinning comment:', error);
    }
  };
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-gray-400" />
          <span className="font-medium text-gray-600 dark:text-gray-400">Loading comments...</span>
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-20"></div>
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Comments ({comments.length})
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="popular">Most popular</option>
          </select>
          <button
            onClick={() => setShowCommentForm(!showCommentForm)}
            className="flex items-center gap-2 px-4 py-2 bg-rose-300 text-rose-800 rounded-lg font-medium hover:bg-rose-400 transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            Add Comment
          </button>
        </div>
      </div>
      {showCommentForm && (
        <CommentForm
          storyId={storyId}
          chapterNumber={chapterNumber}
          onSubmit={handleCommentSubmit}
          onCancel={() => setShowCommentForm(false)}
        />
      )}
      {replyingTo && (
        <CommentForm
          storyId={storyId}
          chapterNumber={chapterNumber}
          parentCommentId={replyingTo}
          onSubmit={handleCommentSubmit}
          onCancel={() => setReplyingTo(null)}
        />
      )}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No comments yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Be the first to share your thoughts!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              isAuthor={isAuthor}
              onReply={(parentId) => {
                setReplyingTo(parentId);
                setShowCommentForm(false);
              }}
              onVote={handleVote}
              onFlag={handleFlag}
              onPin={isAuthor ? handlePin : undefined}
              userVotes={userVotes}
            />
          ))
        )}
      </div>
    </div>
  );
}