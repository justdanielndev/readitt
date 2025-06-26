'use client';
import { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, ThumbsUp, ThumbsDown, Users, MessageSquare, Wand2, Save, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { UserContextManager } from '@/lib/userContext';
interface Story {
  id: string;
  title: string;
  fandom: string;
  description: string;
  characters?: string;
  topics?: string;
  theme?: string;
  contentWarnings?: string[];
  ageRating?: string;
  isNsfw?: boolean;
}
interface Chapter {
  id: string;
  chapter_number: number;
  title: string;
  content: string;
  upvotes: number;
  downvotes: number;
}
interface Vote {
  id: string;
  chapter_number: number;
  vote_type: 'up' | 'down';
  reasons: string[];
  user_session_id: string;
  created_at: string;
}
interface AIChapterGenerationViewProps {
  story: Story;
  chapterNumber: number;
  onBack: () => void;
  onChapterCreated: () => void;
}
export function AIChapterGenerationView({ story, chapterNumber, onBack, onChapterCreated }: AIChapterGenerationViewProps) {
  const [previousChapters, setPreviousChapters] = useState<Chapter[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<string[]>([]);
  const [authorInstructions, setAuthorInstructions] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [chapterTitle, setChapterTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [storyData, setStoryData] = useState<Story>(story);
  useEffect(() => {
    loadChapterData();
  }, [story.id]);
  const loadChapterData = async () => {
    setLoadingData(true);
    try {
      const userContext = UserContextManager.getInstance().getUserContext();
      const { data: fullStoryData, error: storyError } = await supabase
        .from('stories')
        .select('id, title, fandom, description, characters, topics, theme, content_warnings, age_rating, is_nsfw')
        .eq('id', story.id)
        .eq('author_user_id', userContext.userId)
        .single();
      if (storyError) {
        console.error('Error loading story data:', storyError);
      } else if (fullStoryData) {
        console.log('📖 [AI-CHAPTER] Loaded story data with content warnings:', fullStoryData.content_warnings);
        setStoryData({
          ...story,
          contentWarnings: fullStoryData.content_warnings || [],
          ageRating: fullStoryData.age_rating || 'all-ages',
          isNsfw: fullStoryData.is_nsfw || false,
          characters: fullStoryData.characters,
          topics: fullStoryData.topics,
          theme: fullStoryData.theme
        });
      }
      const { data: chaptersData, error: chaptersError } = await supabase
        .from('chapters')
        .select('id, chapter_number, title, content, upvotes, downvotes')
        .eq('story_id', story.id)
        .order('chapter_number', { ascending: true });
      if (chaptersError) {
        console.error('Error loading chapters:', chaptersError);
      } else {
        setPreviousChapters(chaptersData || []);
      }
      const { data: votesData, error: votesError } = await supabase
        .from('votes')
        .select('*')
        .eq('story_id', story.id)
        .order('created_at', { ascending: false });
      if (votesError) {
        console.error('Error loading votes:', votesError);
      } else {
        setVotes(votesData || []);
      }
      if (previousChapters.length > 0) {
        setChapterTitle(`Chapter ${chapterNumber}: The Next Adventure`);
      } else {
        setChapterTitle(`Chapter ${chapterNumber}: ${story.title} Begins`);
      }
    } catch (error) {
      console.error('Error loading chapter data:', error);
    } finally {
      setLoadingData(false);
    }
  };
  const getRatingInsights = () => {
    const insights: { type: string; count: number; reasons: string[] }[] = [];
    const reasonCounts: { [key: string]: number } = {};
    votes.forEach(vote => {
      vote.reasons.forEach(reason => {
        const key = `${vote.vote_type}_${reason}`;
        reasonCounts[key] = (reasonCounts[key] || 0) + 1;
      });
    });
    const upvoteReasons: { [key: string]: number } = {};
    const downvoteReasons: { [key: string]: number } = {};
    Object.entries(reasonCounts).forEach(([key, count]) => {
      const [voteType, reason] = key.split('_', 2);
      if (voteType === 'up') {
        upvoteReasons[reason] = count;
      } else {
        downvoteReasons[reason] = count;
      }
    });
    Object.entries(upvoteReasons).forEach(([reason, count]) => {
      insights.push({ type: 'positive', count, reasons: [reason] });
    });
    Object.entries(downvoteReasons).forEach(([reason, count]) => {
      insights.push({ type: 'negative', count, reasons: [reason] });
    });
    return insights.sort((a, b) => b.count - a.count);
  };
  const handleRatingToggle = (insight: string) => {
    setSelectedRatings(prev => 
      prev.includes(insight) 
        ? prev.filter(r => r !== insight)
        : [...prev, insight]
    );
  };
  const generateChapter = async () => {
    if (!chapterTitle.trim()) {
      alert('Please enter a chapter title');
      return;
    }
    setGenerating(true);
    try {
      const insights = getRatingInsights();
      const selectedInsights = insights.filter(insight => 
        selectedRatings.some(selected => 
          selected.includes(insight.reasons[0])
        )
      );
      const requestBody = {
        storyId: story.id,
        chapterNumber,
        chapterTitle,
        authorInstructions,
        selectedRatings: selectedInsights,
        previousChapters: previousChapters.slice(-3), 
        contentWarnings: storyData.contentWarnings || [],
        ageRating: storyData.ageRating || 'all-ages',
        isNsfw: storyData.isNsfw || false,
        storyContext: {
          title: storyData.title,
          fandom: storyData.fandom,
          description: storyData.description,
          characters: storyData.characters,
          topics: storyData.topics,
          theme: storyData.theme
        }
      };
      console.log('🚨 [AI-CHAPTER] Sending content warnings to API:', storyData.contentWarnings);
      console.log('🔞 [AI-CHAPTER] Sending age rating to API:', storyData.ageRating);
      const userContext = UserContextManager.getInstance().getUserContext();
      const response = await fetch('/api/generate-ai-chapter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userContext.userId,
          'x-username': userContext.username,
        },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) {
        throw new Error('Failed to generate chapter');
      }
      const result = await response.json();
      setGeneratedContent(result.content);
    } catch (error) {
      console.error('Error generating chapter:', error);
      alert('Failed to generate chapter. Please try again.');
    } finally {
      setGenerating(false);
    }
  };
  const saveChapter = async () => {
    if (!chapterTitle.trim() || !generatedContent.trim()) {
      alert('Please generate chapter content first');
      return;
    }
    setLoading(true);
    try {
      const readingTime = getReadingTime(generatedContent);
      const { error } = await supabase
        .from('chapters')
        .insert([{
          story_id: story.id,
          chapter_number: chapterNumber,
          title: chapterTitle,
          content: generatedContent,
          reading_time: readingTime,
          creation_source: 'ai',
          author_notes: authorInstructions || null
        }]);
      if (error) {
        console.error('Error saving chapter:', error);
        alert('Failed to save chapter');
      } else {
        await supabase
          .from('stories')
          .update({ 
            total_chapters: chapterNumber,
            last_updated: new Date().toISOString()
          })
          .eq('id', story.id);
        onChapterCreated();
      }
    } catch (error) {
      console.error('Error saving chapter:', error);
      alert('Failed to save chapter');
    } finally {
      setLoading(false);
    }
  };
  const getReadingTime = (content: string) => {
    const words = content.split(' ').length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min read`;
  };
  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-300 dark:bg-gray-600 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  const insights = getRatingInsights();
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-purple-600" />
                AI Chapter Generation
              </h1>
              <p className="text-rose-600 dark:text-rose-400 text-sm">{story.title} - Chapter {chapterNumber}</p>
            </div>
          </div>
          <button
            onClick={saveChapter}
            disabled={loading || !generatedContent.trim()}
            className="flex items-center gap-2 bg-rose-300 hover:bg-rose-400 disabled:bg-gray-300 disabled:cursor-not-allowed text-rose-800 disabled:text-gray-500 font-medium px-6 py-3 rounded-full transition-colors"
          >
            <Save className="h-5 w-5" />
            {loading ? 'Saving...' : 'Save Chapter'}
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-rose-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Chapter Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Chapter Title
                  </label>
                  <input
                    type="text"
                    value={chapterTitle}
                    onChange={(e) => setChapterTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-rose-300 focus:border-transparent"
                    placeholder="Enter chapter title"
                  />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-rose-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-rose-600" />
                Reader Feedback
              </h3>
              {insights.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-sm">No reader feedback available yet. Generate your first chapter to start receiving ratings!</p>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Select feedback to incorporate into the AI generation:
                  </p>
                  {insights.slice(0, 8).map((insight, index) => (
                    <label key={index} className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedRatings.includes(`${insight.type}_${insight.reasons[0]}`)}
                        onChange={() => handleRatingToggle(`${insight.type}_${insight.reasons[0]}`)}
                        className="mt-1 rounded border-gray-300 text-rose-600 focus:ring-rose-300"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {insight.type === 'positive' ? (
                            <ThumbsUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <ThumbsDown className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {insight.reasons[0]}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            ({insight.count} votes)
                          </span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-rose-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-rose-600" />
                Author Instructions
              </h3>
              <textarea
                value={authorInstructions}
                onChange={(e) => setAuthorInstructions(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-rose-300 focus:border-transparent text-sm"
                placeholder="Provide specific instructions for the AI about what should happen in this chapter, character development, plot points, etc."
              />
            </div>
            <button
              onClick={generateChapter}
              disabled={generating || !chapterTitle.trim()}
              className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white disabled:text-gray-500 font-medium px-6 py-4 rounded-full transition-colors"
            >
              {generating ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Generating Chapter...
                </>
              ) : (
                <>
                  <Wand2 className="h-5 w-5" />
                  Generate Chapter with AI
                </>
              )}
            </button>
          </div>
          <div className="space-y-6">
            {previousChapters.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-rose-100 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Story Context</h3>
                <div className="space-y-3">
                  <div className="text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Last Chapter:</span>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">
                      {previousChapters[previousChapters.length - 1]?.title}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Total Chapters:</span>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">{previousChapters.length}</span>
                  </div>
                  {story.characters && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Characters:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">{story.characters}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-rose-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Generated Content</h3>
              {generatedContent ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">{chapterTitle}</h4>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-sans">
                        {generatedContent}
                      </pre>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>Words: {generatedContent.split(' ').length}</span>
                    <span>Reading time: {getReadingTime(generatedContent)}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Sparkles className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-2">No content generated yet</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Configure your settings and click "Generate Chapter with AI" to create content
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}