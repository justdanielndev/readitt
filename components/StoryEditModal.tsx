'use client';
import { useState, useEffect } from 'react';
import { X, Save, Trash2, BookOpen, Tag, User, FileText, Settings, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { UserContextManager } from '@/lib/userContext';
import { ImageUploadModal } from './ImageUploadModal';
interface Story {
  id: string;
  title: string;
  fandom: string;
  description: string;
  total_chapters: number;
  story_status: 'active' | 'completed' | 'paused';
  image_url?: string;
  characters?: string;
  topics?: string;
  theme?: string;
}
interface StoryEditModalProps {
  story: Story | null;
  isOpen: boolean;
  onClose: () => void;
  onStoryUpdated: () => void;
  onStoryDeleted: () => void;
}
export function StoryEditModal({ story, isOpen, onClose, onStoryUpdated, onStoryDeleted }: StoryEditModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    fandom: '',
    description: '',
    story_status: 'active' as const,
    characters: '',
    topics: '',
    theme: ''
  });
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (story) {
      setFormData({
        title: story.title || '',
        fandom: story.fandom || '',
        description: story.description || '',
        story_status: story.story_status || 'active',
        characters: story.characters || '',
        topics: story.topics || '',
        theme: story.theme || ''
      });
      setCurrentImageUrl(story.image_url);
    }
  }, [story]);
  const handleSave = async () => {
    if (!story) return;
    setLoading(true);
    try {
      const userManager = UserContextManager.getInstance();
      const userContext = userManager.getUserContext();
      const { error } = await supabase
        .from('stories')
        .update({
          title: formData.title,
          fandom: formData.fandom,
          description: formData.description,
          story_status: formData.story_status,
          characters: formData.characters,
          topics: formData.topics,
          theme: formData.theme,
          last_updated: new Date().toISOString()
        })
        .eq('id', story.id)
        .eq('author_user_id', userContext.userId);
      if (error) {
        console.error('Error updating story:', error);
        alert('Failed to update story');
      } else {
        onStoryUpdated();
        onClose();
      }
    } catch (error) {
      console.error('Error updating story:', error);
      alert('Failed to update story');
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async () => {
    if (!story || !deleteConfirm) return;
    setLoading(true);
    try {
      const userManager = UserContextManager.getInstance();
      const userContext = userManager.getUserContext();
      await supabase
        .from('chapters')
        .delete()
        .eq('story_id', story.id);
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', story.id)
        .eq('author_user_id', userContext.userId);
      if (error) {
        console.error('Error deleting story:', error);
        alert('Failed to delete story');
      } else {
        onStoryDeleted();
        onClose();
      }
    } catch (error) {
      console.error('Error deleting story:', error);
      alert('Failed to delete story');
    } finally {
      setLoading(false);
      setDeleteConfirm(false);
    }
  };
  if (!isOpen || !story) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Settings className="h-6 w-6 text-rose-600" />
              Edit Story
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-rose-600" />
              Basic Information
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Story Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-rose-300 focus:border-transparent"
                placeholder="Enter story title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fandom
              </label>
              <input
                type="text"
                value={formData.fandom}
                onChange={(e) => setFormData({ ...formData, fandom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-rose-300 focus:border-transparent"
                placeholder="Enter fandom"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-rose-300 focus:border-transparent"
                placeholder="Enter story description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={formData.story_status}
                onChange={(e) => setFormData({ ...formData, story_status: e.target.value as 'active' | 'completed' | 'paused' })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-rose-300 focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-rose-600" />
              Story Cover
            </h3>
            <div className="flex items-start gap-4">
              <div className="w-32 h-20 bg-rose-50 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                {currentImageUrl ? (
                  <img 
                    src={currentImageUrl} 
                    alt="Story cover"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <BookOpen className="h-8 w-8 text-rose-300" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {currentImageUrl ? 'Custom cover image uploaded' : 'No custom cover image'}
                </p>
                <button
                  onClick={() => setIsImageModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-300 hover:bg-rose-400 text-rose-800 rounded-full text-sm font-medium transition-colors"
                >
                  <ImageIcon className="h-4 w-4" />
                  {currentImageUrl ? 'Change Image' : 'Upload Image'}
                </button>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Tag className="h-5 w-5 text-rose-600" />
              Story Details
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Characters
              </label>
              <input
                type="text"
                value={formData.characters}
                onChange={(e) => setFormData({ ...formData, characters: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-rose-300 focus:border-transparent"
                placeholder="Main characters (comma separated)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Topics
              </label>
              <input
                type="text"
                value={formData.topics}
                onChange={(e) => setFormData({ ...formData, topics: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-rose-300 focus:border-transparent"
                placeholder="Story topics/themes"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Theme
              </label>
              <input
                type="text"
                value={formData.theme}
                onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-rose-300 focus:border-transparent"
                placeholder="Overall theme"
              />
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Story Statistics</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Total Chapters:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{story.total_chapters}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Story ID:</span>
                <span className="ml-2 font-mono text-xs text-gray-900 dark:text-gray-100">{story.id}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 rounded-b-xl">
          <div className="flex items-center justify-between">
            <div>
              {!deleteConfirm ? (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Story
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-600 dark:text-red-400">Are you sure?</span>
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="px-3 py-1 bg-red-600 text-white rounded-full text-sm hover:bg-red-700 disabled:opacity-50"
                  >
                    {loading ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded-full text-sm hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading || !formData.title.trim() || !formData.fandom.trim()}
                className="flex items-center gap-2 bg-rose-300 hover:bg-rose-400 disabled:bg-gray-300 disabled:cursor-not-allowed text-rose-800 disabled:text-gray-500 px-6 py-2 rounded-full font-medium transition-colors"
              >
                <Save className="h-4 w-4" />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
        <ImageUploadModal
          storyId={story.id}
          currentImageUrl={currentImageUrl}
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          onImageUpdated={(imageUrl) => {
            setCurrentImageUrl(imageUrl || undefined);
            onStoryUpdated();
          }}
        />
      </div>
    </div>
  );
}