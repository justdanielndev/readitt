'use client';
import { useState, useEffect } from 'react';
import { X, Plus, BookCopy, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth';
interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  story: any;
}
export function AddToPlaylistModal({ isOpen, onClose, story }: AddToPlaylistModalProps) {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (isOpen && user?.userId) {
      loadPlaylists();
    }
  }, [isOpen, user?.userId]);
  const loadPlaylists = async () => {
    if (!user?.userId) return;
    try {
      setLoading(true);
      const playlistsKey = `user_playlists_${user.userId}`;
      const stored = localStorage.getItem(playlistsKey);
      if (stored) {
        const parsedPlaylists = JSON.parse(stored);
        setPlaylists(parsedPlaylists);
      } else {
        setPlaylists([]);
      }
    } catch (error) {
      console.error('Error loading playlists from localStorage:', error);
      setPlaylists([]);
    } finally {
      setLoading(false);
    }
  };
  const handleAddToPlaylist = async (playlistId: string) => {
    if (!user?.userId || adding) return;
    setAdding(playlistId);
    setError('');
    try {
      const playlistsKey = `user_playlists_${user.userId}`;
      const playlistStoriesKey = `playlist_stories_${playlistId}`;
      const existingStories = JSON.parse(localStorage.getItem(playlistStoriesKey) || '[]');
      if (existingStories.some((s: any) => s.id === story.id)) {
        setError('Story is already in this playlist');
        return;
      }
      const storyData = {
        id: story.id,
        title: story.title,
        author: story.author,
        fandom: story.fandom,
        addedAt: new Date().toISOString()
      };
      existingStories.push(storyData);
      localStorage.setItem(playlistStoriesKey, JSON.stringify(existingStories));
      const playlists = JSON.parse(localStorage.getItem(playlistsKey) || '[]');
      const updatedPlaylists = playlists.map((p: any) => 
        p.id === playlistId 
          ? { ...p, story_count: existingStories.length, updated_at: new Date().toISOString() }
          : p
      );
      localStorage.setItem(playlistsKey, JSON.stringify(updatedPlaylists));
      console.log('✅ Story added to playlist in localStorage');
      onClose();
    } catch (error) {
      console.error('Error adding to playlist:', error);
      setError('Failed to add story to playlist. Please try again.');
    } finally {
      setAdding(null);
    }
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full max-h-[70vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <BookCopy className="h-6 w-6 text-rose-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Add to Playlist
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6">
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              {story.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {story.fandom} • {story.author}
            </p>
          </div>
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : playlists.length === 0 ? (
            <div className="text-center py-8">
              <BookCopy className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No playlists yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Create your first playlist to start organizing stories
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => handleAddToPlaylist(playlist.id)}
                  disabled={adding === playlist.id}
                  className="w-full p-4 text-left bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors border border-transparent hover:border-rose-300 dark:hover:border-rose-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {playlist.title}
                      </h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <span>{playlist.story_count || 0} stories</span>
                        <span>Private</span>
                      </div>
                    </div>
                    <div className="ml-3">
                      {adding === playlist.id ? (
                        <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Plus className="h-5 w-5 text-gray-400 group-hover:text-rose-500" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}