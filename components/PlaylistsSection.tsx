'use client';
import { useState, useEffect } from 'react';
import { Plus, BookOpen, Users, Lock, BookCopy } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { PlaylistModal } from './PlaylistModal';
interface PlaylistsSectionProps {
  onPlaylistSelect?: (playlist: any) => void;
  className?: string;
}
const COLOR_THEMES = {
  rose: 'bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300',
  purple: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
  blue: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
  green: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
  orange: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300',
  red: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
  gray: 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300',
  teal: 'bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300'
};
export function PlaylistsSection({ onPlaylistSelect, className = '' }: PlaylistsSectionProps) {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  useEffect(() => {
    if (user?.userId) {
      loadPlaylists();
    } else {
      setPlaylists([]);
      setLoading(false);
    }
  }, [user?.userId]);
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
  const handlePlaylistCreated = (newPlaylist: any) => {
    const updatedPlaylists = [newPlaylist, ...playlists];
    setPlaylists(updatedPlaylists);
    if (user?.userId) {
      const playlistsKey = `user_playlists_${user.userId}`;
      localStorage.setItem(playlistsKey, JSON.stringify(updatedPlaylists));
    }
  };
  if (!user?.userId) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <BookCopy className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">
          Sign in to create and manage playlists
        </p>
      </div>
    );
  }
  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Playlists</h2>
          <div className="w-24 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookCopy className="h-6 w-6 text-rose-400" />
          <h2 className="text-2xl font-bold text-rose-700 dark:text-rose-300">My Playlists</h2>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span className="font-medium">New Playlist</span>
        </button>
      </div>
      {playlists.length === 0 ? (
        <div className="text-center py-12">
          <BookCopy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No playlists yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Create your first playlist to organize your favorite stories
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Create Playlist
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playlists.map((playlist) => {
            const themeClass = COLOR_THEMES[playlist.cover_color as keyof typeof COLOR_THEMES] || COLOR_THEMES.rose;
            return (
              <div
                key={playlist.id}
                onClick={() => onPlaylistSelect?.(playlist)}
                className="group cursor-pointer"
              >
                <div className="relative">
                  <div className={`
                    h-32 rounded-lg ${themeClass} 
                    flex items-center justify-center mb-3 
                    transition-all duration-200 group-hover:opacity-80
                  `}>
                    <div className="text-center">
                      <div className="font-bold text-lg mb-1">
                        {playlist.title}
                      </div>
                      <div className="flex items-center justify-center gap-4 text-sm opacity-80">
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          <span>{playlist.story_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          <span>Private</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                      {playlist.title}
                    </h3>
                    {playlist.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {playlist.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                      <span>
                        {playlist.story_count || 0} {playlist.story_count === 1 ? 'story' : 'stories'}
                      </span>
                      <span>
                        {new Date(playlist.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <PlaylistModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPlaylistCreated={handlePlaylistCreated}
      />
    </div>
  );
}