'use client';
import { useState } from 'react';
import { X, Plus, Palette, BookCopy } from 'lucide-react';
import { useAuth } from '@/lib/auth';
interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaylistCreated?: (playlist: any) => void;
}
const COLOR_THEMES = [
  { name: 'rose', bg: 'bg-rose-100 dark:bg-rose-900', border: 'border-rose-300 dark:border-rose-700', text: 'text-rose-700 dark:text-rose-300' },
  { name: 'purple', bg: 'bg-purple-100 dark:bg-purple-900', border: 'border-purple-300 dark:border-purple-700', text: 'text-purple-700 dark:text-purple-300' },
  { name: 'blue', bg: 'bg-blue-100 dark:bg-blue-900', border: 'border-blue-300 dark:border-blue-700', text: 'text-blue-700 dark:text-blue-300' },
  { name: 'green', bg: 'bg-green-100 dark:bg-green-900', border: 'border-green-300 dark:border-green-700', text: 'text-green-700 dark:text-green-300' },
  { name: 'orange', bg: 'bg-orange-100 dark:bg-orange-900', border: 'border-orange-300 dark:border-orange-700', text: 'text-orange-700 dark:text-orange-300' },
  { name: 'red', bg: 'bg-red-100 dark:bg-red-900', border: 'border-red-300 dark:border-red-700', text: 'text-red-700 dark:text-red-300' },
  { name: 'gray', bg: 'bg-gray-100 dark:bg-gray-900', border: 'border-gray-300 dark:border-gray-700', text: 'text-gray-700 dark:text-gray-300' },
  { name: 'teal', bg: 'bg-teal-100 dark:bg-teal-900', border: 'border-teal-300 dark:border-teal-700', text: 'text-teal-700 dark:text-teal-300' }
];
export function PlaylistModal({ isOpen, onClose, onPlaylistCreated }: PlaylistModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverColor, setCoverColor] = useState('rose');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a playlist title');
      return;
    }
    if (!user?.userId) {
      setError('You must be logged in to create playlists');
      return;
    }
    setIsCreating(true);
    setError('');
    try {
      const response = await fetch('/api/playlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          userId: user.userId,
          username: user.username || 'Anonymous',
          coverColor
        }),
      });
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Playlist created:', data.playlist);
        if (onPlaylistCreated) {
          onPlaylistCreated(data.playlist);
        }
        setTitle('');
        setDescription('');
        setCoverColor('rose');
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create playlist');
      }
    } catch (error) {
      console.error('Error creating playlist:', error);
      setError('Failed to create playlist. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };
  if (!isOpen) return null;
  const selectedTheme = COLOR_THEMES.find(theme => theme.name === coverColor);
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <BookCopy className="h-6 w-6 text-rose-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Create Playlist
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview</h3>
            <div className={`h-24 rounded-lg ${selectedTheme?.bg} border-2 ${selectedTheme?.border} flex items-center justify-center`}>
              <div className="text-center">
                <div className={`${selectedTheme?.text} font-bold text-lg`}>
                  {title || 'Playlist Title'}
                </div>
                {(description || title) && (
                  <div className={`${selectedTheme?.text} text-sm opacity-80`}>
                    {description || 'Your playlist description'}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Playlist Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 dark:bg-gray-700 dark:text-white"
              placeholder="My Reading List"
              required
              maxLength={100}
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 dark:bg-gray-700 dark:text-white resize-none"
              placeholder="Stories that make me feel..."
              maxLength={500}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Palette className="h-4 w-4 inline mr-1" />
              Cover Theme
            </label>
            <div className="grid grid-cols-4 gap-2">
              {COLOR_THEMES.map((theme) => (
                <button
                  key={theme.name}
                  type="button"
                  onClick={() => setCoverColor(theme.name)}
                  className={`
                    h-12 rounded-lg ${theme.bg} border-2 transition-all duration-200
                    ${coverColor === theme.name 
                      ? theme.border 
                      : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                  title={`${theme.name} theme`}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || !title.trim()}
              className="flex-1 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? 'Creating...' : 'Create Playlist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}