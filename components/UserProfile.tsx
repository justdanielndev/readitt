'use client';
import { useState, useEffect, useRef } from 'react';
import { X, User, Download, Upload, BarChart3, BookOpen, Calendar, QrCode, Camera, LogOut, Trash2, AlertTriangle, Shield, Settings } from 'lucide-react';
import { UserContextManager, type UserContext } from '@/lib/userContext';
import { clearAllUserStories, clearOwnedStories, clearSavedStories, getUserStories } from '@/lib/userStories';
import { useAuth } from '@/lib/auth';
import { AgeVerificationModal } from './AgeVerificationModal';
import { LanguageSelector } from './LanguageSelector';
import QRCode from 'qrcode';
import QrScanner from 'qr-scanner';
interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}
export function UserProfile({ isOpen, onClose }: UserProfileProps) {
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'stats' | 'data' | 'manage'>('profile');
  const { user: authUser, logout } = useAuth();
  const [showQR, setShowQR] = useState(false);
  const [qrData, setQrData] = useState('');
  const [qrImageUrl, setQrImageUrl] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const [isProcessingQR, setIsProcessingQR] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [userStories, setUserStories] = useState<any[]>([]);
  const [showAgeVerification, setShowAgeVerification] = useState(false);
  useEffect(() => {
    if (isOpen) {
      const manager = UserContextManager.getInstance();
      setUserContext(manager.getUserContext());
      setUserStories(getUserStories());
    }
  }, [isOpen]);
  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
      }
    };
  }, []);
  if (!isOpen || !userContext) return null;
  const handleExportData = async () => {
    try {
      const manager = UserContextManager.getInstance();
      const exportData = await manager.exportToQR();
      setQrData(exportData);
      const qrImageDataUrl = await QRCode.toDataURL(exportData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#f9a8d4', 
          light: '#fdf2f8' 
        }
      });
      setQrImageUrl(qrImageDataUrl);
      setShowQR(true);
    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('Failed to create export. Please try again.');
    }
  };
  const handleStartScanning = async () => {
    setShowScanner(true);
    setIsProcessingQR(false); 
    await new Promise(resolve => setTimeout(resolve, 100));
    try {
      if (videoRef.current) {
        qrScannerRef.current = new QrScanner(
          videoRef.current,
          async (result) => {
            if (isProcessingQR) {
              return;
            }
            setIsProcessingQR(true);
            if (qrScannerRef.current) {
              qrScannerRef.current.stop();
            }
            const manager = UserContextManager.getInstance();
            try {
              const success = await manager.importFromQR(result.data);
              if (success) {
                const updatedContext = manager.getUserContext();
                alert('Data imported successfully!');
                setUserContext(updatedContext);
                setShowScanner(false);
                setIsProcessingQR(false);
              } else {
                alert('Failed to import data. Please check the QR code.');
                setIsProcessingQR(false);
                setShowScanner(false);
              }
            } catch (error) {
              console.error('Import error:', error);
              alert('Failed to import data. Please try again.');
              setIsProcessingQR(false);
              setShowScanner(false);
            }
          },
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
          }
        );
        await qrScannerRef.current.start();
      } else {
        alert('Video element not ready. Please try again.');
        setShowScanner(false);
      }
    } catch (error) {
      console.error('Error starting QR scanner:', error);
      alert(`Could not access camera: ${error.message}. Please check permissions.`);
      setShowScanner(false);
    }
  };
  const handleStopScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
    }
    setShowScanner(false);
    setIsProcessingQR(false);
  };
  const handleProfilePictureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const manager = UserContextManager.getInstance();
        manager.updateUserContext({ avatar: result });
        setUserContext(manager.getUserContext());
      };
      reader.readAsDataURL(file);
    }
  };
  const getUserInitial = () => {
    return userContext.username.charAt(0).toUpperCase();
  };
  const handleDeleteAction = async (action: string) => {
    const manager = UserContextManager.getInstance();
    switch (action) {
      case 'clear-all-stories':
        manager.clearAllStories();
        break;
      case 'clear-reading-history':
        manager.clearReadingHistory();
        break;
      case 'clear-owned-stories':
        clearOwnedStories();
        break;
      case 'clear-saved-stories':
        clearSavedStories();
        break;
      case 'delete-account':
        try {
          manager.clearAllData();
          clearAllUserStories();
          const { GDPRCompliantAnalytics } = await import('@/lib/gdprCompliantAnalytics');
          const gdpr = GDPRCompliantAnalytics.getInstance();
          await gdpr.withdrawConsent();
          alert('Account deleted successfully. All your data, stories, and research information have been permanently removed.');
        } catch (error) {
          console.error('Failed to delete account:', error);
          alert('Failed to delete account. Please try again.');
        }
        break;
    }
    setUserContext(manager.getUserContext());
    setUserStories(getUserStories());
    setShowDeleteConfirm(null);
  };
  const handleDeleteStory = (storyId: string, isFromUserContext = true) => {
    const manager = UserContextManager.getInstance();
    if (isFromUserContext) {
      manager.removeStory(storyId);
      setUserContext(manager.getUserContext());
    } else {
      const stories = getUserStories();
      const filtered = stories.filter(s => s.id !== storyId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('readitt_user_stories', JSON.stringify(filtered));
      }
      setUserStories(getUserStories());
    }
  };
  const isSlackUser = !!(authUser?.slackUserId && authUser?.slackTeamId);
  const handle18PlusToggle = (enabled: boolean) => {
    if (isSlackUser && enabled) {
      return;
    }
    if (enabled && !userContext?.preferences.show18PlusContent) {
      setShowAgeVerification(true);
    } else if (!enabled) {
      const manager = UserContextManager.getInstance();
      manager.updatePreferences({ show18PlusContent: false });
      setUserContext(manager.getUserContext());
    }
  };
  const handleAgeVerificationConfirm = () => {
    if (isSlackUser) {
      setShowAgeVerification(false);
      return;
    }
    const manager = UserContextManager.getInstance();
    manager.updatePreferences({ show18PlusContent: true });
    setUserContext(manager.getUserContext());
    setShowAgeVerification(false);
  };
  const handleAgeVerificationCancel = () => {
    setShowAgeVerification(false);
  };
  const stats = UserContextManager.getInstance().getReadingStats();
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Profile</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="text-center mb-6">
          <div className="relative inline-block">
            <div className="h-20 w-20 bg-rose-300 rounded-full flex items-center justify-center mx-auto mb-3 overflow-hidden">
              {userContext.avatar ? (
                <img 
                  src={userContext.avatar} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-rose-800">
                  {getUserInitial()}
                </span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 bg-rose-300 hover:bg-rose-400 text-rose-800 p-2 rounded-full transition-colors shadow-lg"
            >
              <Camera className="h-3 w-3" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleProfilePictureUpload}
              className="hidden"
            />
          </div>
          <h3 className="text-lg font-semibold text-rose-800 dark:text-gray-300">{userContext.username}</h3>
          <p className="text-sm text-rose-600 dark:text-gray-400">
            Member since {new Date(userContext.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex space-x-1 mb-6 bg-rose-300 dark:bg-gray-800 rounded-lg p-1">
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'stats', label: 'Stats', icon: BarChart3 },
            { id: 'data', label: 'Data', icon: Download },
            { id: 'manage', label: 'Manage', icon: Trash2 }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === id
                  ? 'bg-rose-300 dark:bg-rose-300 text-black shadow-sm'
                  : 'text-black dark:text-gray-300 hover:text-black dark:hover:text-gray-100'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
        <div className="space-y-4">
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black dark:text-gray-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={userContext.username}
                  onChange={(e) => {
                    const manager = UserContextManager.getInstance();
                    manager.updateUserContext({ username: e.target.value });
                    setUserContext(manager.getUserContext());
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-rose-300 dark:bg-rose-300 text-black dark:text-black focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black dark:text-gray-300 mb-1">
                  Description/bio
                </label>
                <textarea
                  value={userContext.aiContext || "Your user's description will appear here once implemented."}
                  readOnly
                  placeholder="AI context is automatically generated based on your reading preferences and history."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-500 resize-none cursor-not-allowed opacity-75"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Coming soon!
                </p>
              </div>
              {authUser && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="font-medium text-black dark:text-gray-300 mb-2">Slack Account</h4>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Connected as: <span className="font-medium text-black dark:text-white">{authUser.username}</span>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Team ID: <span className="font-mono text-xs">{authUser.slackTeamId}</span>
                    </p>
                  </div>
                </div>
              )}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="font-medium text-rose-800 dark:text-gray-300 mb-3">Legal & Privacy</h4>
                <div className="space-y-2">
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300 transition-colors"
                  >
                    Privacy Policy
                  </a>
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300 transition-colors"
                  >
                    Terms of Service
                  </a>
                </div>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <button
                  onClick={logout}
                  className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-rose-800 dark:text-gray-300 mb-4 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Content Settings
                </h4>
                <div className="space-y-4">
                  <div className={`flex items-center justify-between p-4 border rounded-lg ${
                    isSlackUser 
                      ? 'bg-gray-100 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600' 
                      : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800'
                  }`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {isSlackUser ? (
                          <Shield className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                        )}
                        <span className={`font-medium ${
                          isSlackUser 
                            ? 'text-gray-700 dark:text-gray-300' 
                            : 'text-rose-800 dark:text-rose-300'
                        }`}>
                          Show 18+ Content
                        </span>
                      </div>
                      <p className={`text-sm ${
                        isSlackUser 
                          ? 'text-gray-600 dark:text-gray-400' 
                          : 'text-rose-700 dark:text-rose-400'
                      }`}>
                        {isSlackUser 
                          ? 'As Hack Club is intended for <18 users, we cannot verify you\'re over 18 (you 99% sure wouldn\'t have joined the Hack Club slack if you were over 18).'
                          : 'Allow access to adult content and mature stories.'
                        }
                      </p>
                      {userContext.preferences.show18PlusContent && (
                        <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                          ✓ 18+ content is currently enabled
                        </p>
                      )}
                    </div>
                    <label className={`relative inline-flex items-center ml-4 ${
                      isSlackUser ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                    }`}>
                      <input
                        type="checkbox"
                        checked={userContext.preferences.show18PlusContent}
                        onChange={(e) => handle18PlusToggle(e.target.checked)}
                        disabled={isSlackUser}
                        className="sr-only peer"
                      />
                      <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-300 dark:peer-focus:ring-rose-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 ${
                        isSlackUser ? 'peer-checked:bg-gray-400' : 'peer-checked:bg-rose-600'
                      }`}></div>
                    </label>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Language Settings
                    </h4>
                    <div className="space-y-4">
                      <LanguageSelector
                        value={userContext.preferences.appLanguage}
                        onChange={(languageCode) => {
                          const manager = UserContextManager.getInstance();
                          manager.updateLanguagePreferences(languageCode);
                          setUserContext(manager.getUserContext());
                        }}
                        label="App Language"
                        className="mb-4"
                      />
                      <LanguageSelector
                        value={userContext.preferences.readingLanguage}
                        onChange={(languageCode) => {
                          const manager = UserContextManager.getInstance();
                          manager.updateLanguagePreferences(undefined, languageCode);
                          setUserContext(manager.getUserContext());
                        }}
                        label="Reading Language"
                        className="mb-4"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'stats' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-rose-300 dark:bg-gray-800 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-rose-300 dark:text-rose-300">{stats.totalStories}</div>
                  <div className="text-sm text-rose-800 dark:text-gray-400">Total Stories</div>
                </div>
                <div className="bg-rose-300 dark:bg-gray-800 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-rose-300 dark:text-rose-300">{stats.completedStories}</div>
                  <div className="text-sm text-rose-800 dark:text-gray-400">Completed</div>
                </div>
                <div className="bg-rose-300 dark:bg-gray-800 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-rose-300 dark:text-rose-300">{stats.currentlyReading}</div>
                  <div className="text-sm text-rose-800 dark:text-gray-400">Reading</div>
                </div>
                <div className="bg-rose-300 dark:bg-gray-800 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-rose-300 dark:text-rose-300">{stats.totalChaptersRead}</div>
                  <div className="text-sm text-rose-800 dark:text-gray-400">Chapters Read</div>
                </div>
              </div>
              {stats.favoriteGenres.length > 0 && (
                <div>
                  <h4 className="font-medium text-rose-800 dark:text-gray-300 mb-2">Favorite Fandoms</h4>
                  <div className="flex flex-wrap gap-2">
                    {stats.favoriteGenres.map(genre => (
                      <span key={genre} className="bg-rose-300 dark:bg-gray-800 text-rose-800 dark:text-gray-300 px-3 py-1 rounded-full text-sm">
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'data' && (
            <div className="space-y-4">
              <div className="text-center space-y-4">
                <p className="text-sm text-rose-800 dark:text-gray-400">
                  Export or import your reading data using QR codes
                </p>
                <div className="space-y-3">
                  <button
                    onClick={handleExportData}
                    className="w-full flex items-center justify-center gap-2 bg-rose-300 text-rose-800 px-4 py-3 rounded-lg font-medium hover:bg-rose-400 transition-colors"
                  >
                    <QrCode className="h-4 w-4" />
                    Export Data as QR
                  </button>
                  <button
                    onClick={handleStartScanning}
                    className="w-full flex items-center justify-center gap-2 border border-rose-300 dark:border-gray-600 text-rose-800 dark:text-gray-300 px-4 py-3 rounded-lg font-medium hover:bg-rose-300/20 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    Scan QR to Import
                  </button>
                </div>
                <div className="text-xs text-rose-800 dark:text-gray-400">
                  <p>Last updated: {new Date(userContext.lastUpdated).toLocaleString()}</p>
                  <p>User ID: {userContext.userId.slice(-8)}</p>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'manage' && (
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-rose-800 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Reading Data
                </h4>
                {userContext.stories.length > 0 && (
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-rose-800 dark:text-rose-300 mb-2">
                      Reading Progress ({userContext.stories.length} stories)
                    </h5>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {userContext.stories.map((story) => (
                        <div key={story.id} className="flex items-center justify-between p-2 bg-rose-50 dark:bg-rose-900/20 rounded text-xs">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-rose-900 dark:text-rose-100 truncate">{story.title}</p>
                            <p className="text-rose-700 dark:text-rose-300">{story.fandom} • Ch {story.currentChapter}/{story.totalChapters}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteStory(story.id, true)}
                            className="ml-2 p-1 text-red-500 hover:text-red-700 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setShowDeleteConfirm('clear-all-stories')}
                      className="w-full mt-2 text-sm text-rose-600 hover:text-rose-800 transition-colors"
                    >
                      Clear All Reading Progress
                    </button>
                  </div>
                )}
                {userStories.length > 0 && (
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-rose-800 dark:text-rose-300 mb-2">
                      Saved Stories ({userStories.length} stories)
                    </h5>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {userStories.map((story) => (
                        <div key={story.id} className="flex items-center justify-between p-2 bg-rose-50 dark:bg-rose-900/20 rounded text-xs">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-rose-900 dark:text-rose-100 truncate">{story.title}</p>
                            <p className="text-rose-700 dark:text-rose-300">
                              {story.fandom} • {story.isOwner ? 'Created' : 'Shared'}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteStory(story.id, false)}
                            className="ml-2 p-1 text-red-500 hover:text-red-700 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => setShowDeleteConfirm('clear-owned-stories')}
                        className="flex-1 text-sm text-rose-600 hover:text-rose-800 transition-colors"
                      >
                        Clear Created Stories
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm('clear-saved-stories')}
                        className="flex-1 text-sm text-rose-600 hover:text-rose-800 transition-colors"
                      >
                        Clear Shared Stories
                      </button>
                    </div>
                  </div>
                )}
                <div className="space-y-2 pt-4 border-t border-rose-200 dark:border-rose-800">
                  <button
                    onClick={() => setShowDeleteConfirm('clear-reading-history')}
                    className="w-full flex items-center justify-center gap-2 text-rose-600 hover:text-rose-800 transition-colors py-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear Reading History
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm('delete-account')}
                    className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        {showQR && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-60">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-rose-700 dark:text-rose-300 mb-4">
                  Export Data QR Code
                </h3>
                {qrImageUrl && (
                  <div className="mb-4">
                    <img src={qrImageUrl} alt="QR Code" className="mx-auto rounded-lg shadow-lg" />
                  </div>
                )}
                <p className="text-sm text-rose-600 dark:text-rose-400 mb-4">
                  Scan this QR code with another device to import your data
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => navigator.clipboard.writeText(qrData)}
                    className="flex-1 bg-rose-200 text-rose-700 px-4 py-2 rounded-lg font-medium hover:bg-rose-300 transition-colors"
                  >
                    Copy Data
                  </button>
                  <button
                    onClick={() => setShowQR(false)}
                    className="flex-1 border border-rose-300 dark:border-rose-600 text-rose-700 dark:text-rose-300 px-4 py-2 rounded-lg font-medium hover:bg-rose-50 dark:hover:bg-rose-800 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {showScanner && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-60">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-rose-700 dark:text-rose-300 mb-4">
                  Scan QR Code
                </h3>
                <div className="mb-4">
                  <video 
                    ref={videoRef}
                    className="w-full rounded-lg shadow-lg"
                    style={{ maxHeight: '300px' }}
                  />
                </div>
                <p className="text-sm text-rose-600 dark:text-rose-400 mb-4">
                  {isProcessingQR ? 'Processing QR code...' : 'Point your camera at the QR code to import data'}
                </p>
                <button
                  onClick={handleStopScanning}
                  disabled={isProcessingQR}
                  className={`w-full border border-rose-300 dark:border-rose-600 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isProcessingQR 
                      ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                      : 'text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-800'
                  }`}
                >
                  {isProcessingQR ? 'Processing...' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-60">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Confirm Deletion
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  {showDeleteConfirm === 'clear-all-stories' && 'This will remove all your reading progress data. This action cannot be undone.'}
                  {showDeleteConfirm === 'clear-reading-history' && 'This will clear your reading history. This action cannot be undone.'}
                  {showDeleteConfirm === 'clear-owned-stories' && 'This will remove all stories you created from your saved collection.'}
                  {showDeleteConfirm === 'clear-saved-stories' && 'This will remove all stories shared with you from your collection.'}
                  {showDeleteConfirm === 'delete-account' && 'This will permanently delete your entire account including all stories, reading progress, settings, and research data. This action cannot be undone.'}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteAction(showDeleteConfirm)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        <AgeVerificationModal
          isOpen={showAgeVerification}
          onConfirm={handleAgeVerificationConfirm}
          onCancel={handleAgeVerificationCancel}
        />
      </div>
    </div>
  );
}