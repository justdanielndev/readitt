'use client';
import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit3, Trash2, BookOpen, Eye, ThumbsUp, ThumbsDown, Sparkles, PenTool, Save, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { UserContextManager } from '@/lib/userContext';
import ReactMarkdown from 'react-markdown';
import { AIChapterGenerationView } from './AIChapterGenerationView';
interface Story {
  id: string;
  title: string;
  fandom: string;
  description: string;
  total_chapters: number;
  story_status: 'active' | 'completed' | 'paused';
  image_url?: string;
}
interface Chapter {
  id: string;
  story_id: string;
  chapter_number: number;
  title: string;
  content: string;
  reading_time: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
  creation_source: 'ai' | 'author';
  author_notes?: string;
}
interface ChapterManagementViewProps {
  story: Story;
  onBack: () => void;
}
export function ChapterManagementView({ story, onBack }: ChapterManagementViewProps) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [isEditingChapter, setIsEditingChapter] = useState(false);
  const [isCreatingChapter, setIsCreatingChapter] = useState(false);
  const [createMode, setCreateMode] = useState<'manual' | 'ai' | null>(null);
  useEffect(() => {
    loadChapters();
  }, [story.id]);
  const loadChapters = async () => {
    setLoading(true);
    try {
      const { data: chaptersData, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('story_id', story.id)
        .order('chapter_number', { ascending: true });
      if (error) {
        console.error('Error loading chapters:', error);
      } else {
        setChapters(chaptersData || []);
      }
    } catch (error) {
      console.error('Error loading chapters:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleNewChapter = () => {
    setIsCreatingChapter(true);
    setCreateMode(null);
  };
  const handleChapterCreated = () => {
    loadChapters();
    setIsCreatingChapter(false);
    setCreateMode(null);
  };
  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm('Are you sure you want to delete this chapter?')) return;
    try {
      const { error } = await supabase
        .from('chapters')
        .delete()
        .eq('id', chapterId);
      if (error) {
        console.error('Error deleting chapter:', error);
        alert('Failed to delete chapter');
      } else {
        loadChapters();
      }
    } catch (error) {
      console.error('Error deleting chapter:', error);
      alert('Failed to delete chapter');
    }
  };
  const getReadingTime = (content: string) => {
    const words = content.split(' ').length;
    const minutes = Math.ceil(words / 200); 
    return `${minutes} min read`;
  };
  if (loading) {
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
  if (isCreatingChapter) {
    if (createMode === 'ai') {
      return (
        <AIChapterGenerationView
          story={story}
          chapterNumber={chapters.length + 1}
          onBack={() => setIsCreatingChapter(false)}
          onChapterCreated={handleChapterCreated}
        />
      );
    }
    return (
      <ChapterCreationView
        story={story}
        chapterNumber={chapters.length + 1}
        mode={createMode}
        onBack={() => setIsCreatingChapter(false)}
        onModeSelect={setCreateMode}
        onChapterCreated={handleChapterCreated}
      />
    );
  }
  if (selectedChapter && isEditingChapter) {
    return (
      <ChapterEditView
        chapter={selectedChapter}
        onBack={() => {
          setIsEditingChapter(false);
          setSelectedChapter(null);
        }}
        onChapterUpdated={() => {
          loadChapters();
          setIsEditingChapter(false);
          setSelectedChapter(null);
        }}
      />
    );
  }
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
              <h1 className="text-2xl font-bold text-rose-700 dark:text-rose-300">{story.title}</h1>
              <p className="text-rose-600 dark:text-rose-400 text-sm">{story.fandom}</p>
            </div>
          </div>
          <button
            onClick={handleNewChapter}
            className="flex items-center gap-2 bg-rose-300 hover:bg-rose-400 text-rose-800 font-medium px-6 py-3 rounded-full transition-colors"
          >
            <Plus className="h-5 w-5" />
            New Chapter
          </button>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-rose-100 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-24 h-32 bg-rose-50 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
              {story.image_url ? (
                <img 
                  src={story.image_url} 
                  alt={story.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <BookOpen className="h-8 w-8 text-rose-300" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-gray-700 dark:text-gray-300 mb-4">{story.description}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span>{chapters.length} chapters</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  story.story_status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                  story.story_status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                }`}>
                  {story.story_status}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Chapters</h2>
          {chapters.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-rose-100 dark:border-gray-700 p-12 text-center">
              <BookOpen className="h-12 w-12 text-rose-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Chapters Yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Start writing your story by creating the first chapter</p>
              <button
                onClick={handleNewChapter}
                className="flex items-center gap-2 bg-rose-300 hover:bg-rose-400 text-rose-800 font-medium px-6 py-3 rounded-full transition-colors mx-auto"
              >
                <Sparkles className="h-5 w-5" />
                Create First Chapter
              </button>
            </div>
          ) : (
            chapters.map((chapter) => (
              <div key={chapter.id} className="bg-white dark:bg-gray-800 rounded-xl border border-rose-100 dark:border-gray-700 p-6 hover:border-rose-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-medium text-rose-600 dark:text-rose-400">
                        Chapter {chapter.chapter_number}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                        chapter.creation_source === 'ai' 
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                      }`}>
                        {chapter.creation_source === 'ai' ? <Sparkles className="h-3 w-3" /> : <PenTool className="h-3 w-3" />}
                        {chapter.creation_source === 'ai' ? 'AI Generated' : 'Manual'}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{chapter.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                      <span>{chapter.reading_time}</span>
                      <span>•</span>
                      <div className="flex items-center gap-2">
                        <ThumbsUp className="h-4 w-4" />
                        <span>{chapter.upvotes}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ThumbsDown className="h-4 w-4" />
                        <span>{chapter.downvotes}</span>
                      </div>
                      <span>•</span>
                      <span>{new Date(chapter.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 line-clamp-2">
                      {chapter.content.substring(0, 200)}...
                    </p>
                    {chapter.author_notes && (
                      <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-400">
                        <p className="text-sm text-yellow-800 dark:text-yellow-300">
                          <strong>Author Notes:</strong> {chapter.author_notes}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedChapter(chapter);
                        setIsEditingChapter(true);
                      }}
                      className="p-2 text-gray-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full transition-colors"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteChapter(chapter.id)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
interface ChapterCreationViewProps {
  story: Story;
  chapterNumber: number;
  mode: 'manual' | 'ai' | null;
  onBack: () => void;
  onModeSelect: (mode: 'manual' | 'ai') => void;
  onChapterCreated: () => void;
}
function ChapterCreationView({ story, chapterNumber, mode, onBack, onModeSelect, onChapterCreated }: ChapterCreationViewProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author_notes: ''
  });
  const [loading, setLoading] = useState(false);
  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Please fill in both title and content');
      return;
    }
    setLoading(true);
    try {
      const readingTime = getReadingTime(formData.content);
      const { error } = await supabase
        .from('chapters')
        .insert([{
          story_id: story.id,
          chapter_number: chapterNumber,
          title: formData.title,
          content: formData.content,
          reading_time: readingTime,
          creation_source: mode,
          author_notes: formData.author_notes || null
        }]);
      if (error) {
        console.error('Error creating chapter:', error);
        alert('Failed to create chapter');
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
      console.error('Error creating chapter:', error);
      alert('Failed to create chapter');
    } finally {
      setLoading(false);
    }
  };
  const getReadingTime = (content: string) => {
    const words = content.split(' ').length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min read`;
  };
  if (!mode) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <h1 className="text-2xl font-bold text-rose-700 dark:text-rose-300">Create Chapter {chapterNumber}</h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => onModeSelect('manual')}
              className="bg-white dark:bg-gray-800 rounded-xl border border-rose-100 dark:border-gray-700 p-8 hover:border-rose-300 transition-colors text-center"
            >
              <PenTool className="h-12 w-12 text-rose-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Write Manually</h3>
              <p className="text-gray-600 dark:text-gray-400">Write the chapter yourself using Markdown</p>
            </button>
            <button
              onClick={() => onModeSelect('ai')}
              className="bg-white dark:bg-gray-800 rounded-xl border border-rose-100 dark:border-gray-700 p-8 hover:border-rose-300 transition-colors text-center"
            >
              <Sparkles className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Generate with AI</h3>
              <p className="text-gray-600 dark:text-gray-400">Let AI continue your story based on ratings and feedback</p>
            </button>
          </div>
        </div>
      </div>
    );
  }
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
              <h1 className="text-2xl font-bold text-rose-700 dark:text-rose-300">
                {mode === 'manual' ? 'Write' : 'Generate'} Chapter {chapterNumber}
              </h1>
              <p className="text-rose-600 dark:text-rose-400 text-sm">{story.title}</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={loading || !formData.title.trim() || !formData.content.trim()}
            className="flex items-center gap-2 bg-rose-300 hover:bg-rose-400 disabled:bg-gray-300 disabled:cursor-not-allowed text-rose-800 disabled:text-gray-500 font-medium px-6 py-3 rounded-full transition-colors"
          >
            <Save className="h-5 w-5" />
            {loading ? 'Saving...' : 'Save Chapter'}
          </button>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-rose-100 dark:border-gray-700 p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Chapter Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-rose-300 focus:border-transparent"
              placeholder="Enter chapter title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Content {mode === 'manual' && '(Markdown supported)'}
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={20}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-rose-300 focus:border-transparent font-mono text-sm"
              placeholder={mode === 'manual' ? 'Write your chapter content in Markdown...' : 'AI will generate content here...'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Author Notes (Optional)
            </label>
            <textarea
              value={formData.author_notes}
              onChange={(e) => setFormData({ ...formData, author_notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-rose-300 focus:border-transparent"
              placeholder="Add any notes for readers..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
interface ChapterEditViewProps {
  chapter: Chapter;
  onBack: () => void;
  onChapterUpdated: () => void;
}
function ChapterEditView({ chapter, onBack, onChapterUpdated }: ChapterEditViewProps) {
  const [formData, setFormData] = useState({
    title: chapter.title,
    content: chapter.content,
    author_notes: chapter.author_notes || ''
  });
  const [loading, setLoading] = useState(false);
  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Please fill in both title and content');
      return;
    }
    setLoading(true);
    try {
      const readingTime = getReadingTime(formData.content);
      const { error } = await supabase
        .from('chapters')
        .update({
          title: formData.title,
          content: formData.content,
          reading_time: readingTime,
          author_notes: formData.author_notes || null
        })
        .eq('id', chapter.id);
      if (error) {
        console.error('Error updating chapter:', error);
        alert('Failed to update chapter');
      } else {
        onChapterUpdated();
      }
    } catch (error) {
      console.error('Error updating chapter:', error);
      alert('Failed to update chapter');
    } finally {
      setLoading(false);
    }
  };
  const getReadingTime = (content: string) => {
    const words = content.split(' ').length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min read`;
  };
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
              <h1 className="text-2xl font-bold text-rose-700 dark:text-rose-300">Edit Chapter {chapter.chapter_number}</h1>
              <p className="text-rose-600 dark:text-rose-400 text-sm flex items-center gap-2">
                {chapter.creation_source === 'ai' ? <Sparkles className="h-4 w-4" /> : <PenTool className="h-4 w-4" />}
                {chapter.creation_source === 'ai' ? 'AI Generated' : 'Manual'}
              </p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={loading || !formData.title.trim() || !formData.content.trim()}
            className="flex items-center gap-2 bg-rose-300 hover:bg-rose-400 disabled:bg-gray-300 disabled:cursor-not-allowed text-rose-800 disabled:text-gray-500 font-medium px-6 py-3 rounded-full transition-colors"
          >
            <Save className="h-5 w-5" />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-rose-100 dark:border-gray-700 p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Chapter Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-rose-300 focus:border-transparent"
              placeholder="Enter chapter title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Content (Markdown supported)
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={20}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-rose-300 focus:border-transparent font-mono text-sm"
              placeholder="Write your chapter content in Markdown..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Author Notes (Optional)
            </label>
            <textarea
              value={formData.author_notes}
              onChange={(e) => setFormData({ ...formData, author_notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-rose-300 focus:border-transparent"
              placeholder="Add any notes for readers..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}