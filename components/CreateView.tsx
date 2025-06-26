'use client';
import { useState, useEffect } from 'react';
import { Plus, BookOpen, Edit3, Image, Settings, Play, FileText, Sparkles, PenTool } from 'lucide-react';
import { UserContextManager } from '@/lib/userContext';
import { supabase } from '@/lib/supabase';
import { StoryEditModal } from './StoryEditModal';
import { ChapterManagementView } from './ChapterManagementView';
interface CreatedStory {
  id: string;
  title: string;
  fandom: string;
  description: string;
  total_chapters: number;
  story_status: 'active' | 'completed' | 'paused';
  image_url?: string;
  created_at: string;
  last_updated: string;
}
interface CreateViewProps {
  onCreateNew: () => void;
}
export function CreateView({ onCreateNew }: CreateViewProps) {
  const [stories, setStories] = useState<CreatedStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState<CreatedStory | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewingChapters, setViewingChapters] = useState<CreatedStory | null>(null);
  useEffect(() => {
    loadCreatedStories();
  }, []);
  useEffect(() => {
    const handleFocus = () => {
      loadCreatedStories();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);
  const loadCreatedStories = async () => {
    console.log('📚 Loading created stories...');
    try {
      const userManager = UserContextManager.getInstance();
      const userContext = userManager.getUserContext();
      console.log('👤 Current user context:', userContext);
      console.log('🆔 User ID for query:', userContext.userId);
      if (!userContext.userId) {
        console.log('❌ No user ID found, stopping story load');
        setLoading(false);
        return;
      }
      console.log('🔍 Querying stories for user:', userContext.userId);
      const { data: storiesData, error } = await supabase
        .from('stories')
        .select('id, title, fandom, description, total_chapters, story_status, image_url, created_at, last_updated, characters, topics, theme')
        .eq('author_user_id', userContext.userId)
        .order('last_updated', { ascending: false });
      if (error) {
        console.error('❌ Error loading created stories:', error);
        console.error('🔧 Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
      } else {
        console.log('✅ Stories loaded successfully:', storiesData);
        console.log('📊 Number of stories found:', storiesData?.length || 0);
        setStories(storiesData || []);
      }
    } catch (error) {
      console.error('❌ Error loading stories:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleEditStory = (story: CreatedStory) => {
    setSelectedStory(story);
    setIsEditModalOpen(true);
  };
  const handleStoryUpdated = () => {
    loadCreatedStories();
    setSelectedStory(null);
    setIsEditModalOpen(false);
  };
  const handleStoryDeleted = () => {
    loadCreatedStories();
    setSelectedStory(null);
    setIsEditModalOpen(false);
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'paused': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="h-3 w-3" />;
      case 'completed': return <BookOpen className="h-3 w-3" />;
      case 'paused': return <Settings className="h-3 w-3" />;
      default: return <FileText className="h-3 w-3" />;
    }
  };
  if (viewingChapters) {
    return (
      <ChapterManagementView
        story={viewingChapters}
        onBack={() => setViewingChapters(null)}
      />
    );
  }
  if (loading) {
    return (
      <div className="w-full">
        <div className="w-full">
          <div className="flex items-center gap-2 mb-8">
            <PenTool className="h-6 w-6 text-rose-400" />
            <h2 className="text-2xl font-bold text-rose-700 dark:text-rose-300">My Stories</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-rose-100 dark:border-gray-700 overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-300 dark:bg-gray-600"></div>
                <div className="p-4">
                  <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-3"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full mb-2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="w-full">
      <div className="w-full">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <PenTool className="h-6 w-6 text-rose-400" />
            <h2 className="text-2xl font-bold text-rose-700 dark:text-rose-300">My Stories</h2>
          </div>
          <button
            onClick={onCreateNew}
            className="flex items-center gap-2 bg-rose-300 text-rose-800 px-4 py-2 rounded-full font-medium hover:bg-rose-400 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create
          </button>
        </div>
        {stories.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="h-16 w-16 text-rose-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-rose-700 dark:text-rose-300 mb-2">
              No Stories Yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start your creative journey by creating your first story
            </p>
            <button
              onClick={onCreateNew}
              className="flex items-center gap-2 bg-rose-300 text-rose-800 px-4 py-2 rounded-full font-medium hover:bg-rose-400 transition-colors mx-auto"
            >
              <Sparkles className="h-4 w-4" />
              Create Your First Story
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story) => (
              <div
                key={story.id}
                onClick={() => setViewingChapters(story)}
                className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden bg-white dark:bg-gray-800 rounded-xl border border-rose-100 dark:border-gray-700 hover:border-rose-300 dark:hover:border-gray-600"
              >
                <div className="relative">
                  <div className="w-full h-48 bg-rose-50 dark:bg-gray-700 group-hover:scale-105 transition-transform duration-300 flex items-center justify-center overflow-hidden">
                    {story.image_url ? (
                      <img 
                        src={story.image_url} 
                        alt={story.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <BookOpen className="h-16 w-16 text-rose-300 dark:text-rose-300" />
                    )}
                  </div>
                  <div className="absolute top-3 left-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(story.story_status)}`}>
                      {getStatusIcon(story.story_status)}
                      {story.story_status}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditStory(story);
                      }}
                      className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Edit3 className="h-4 w-4 text-rose-600" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 truncate">{story.title}</h3>
                      <p className="text-sm text-rose-600 dark:text-rose-400">{story.fandom}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">{story.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-rose-500 dark:text-gray-400">
                        <BookOpen className="h-4 w-4" />
                        <span>{story.total_chapters} chapters</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(story.last_updated).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <StoryEditModal
        story={selectedStory}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onStoryUpdated={handleStoryUpdated}
        onStoryDeleted={handleStoryDeleted}
      />
    </div>
  );
}