'use client';
import { useState, useEffect } from 'react';
import { Search, Plus, Star, Eye, Heart, BookOpen, Sparkles, TrendingUp, Clock } from 'lucide-react';
import type { Story } from './HomepageView';
import { PopularStories } from './PopularStories';
import { UserProfile } from './UserProfile';
import { UserContextManager } from '@/lib/userContext';
import { BottomNavigation } from './BottomNavigation';
import { CreateView } from './CreateView';
import { useAuth } from '@/lib/auth';
import { PlusBadge } from './PlusBadge';
interface NewHomepageViewProps {
  onStartNewRead: () => void;
  onStorySelect: (story: Story) => void;
}
const categories = [
  { name: "All" },
  { name: "Romance" },
  { name: "Fantasy" },
  { name: "Sci-Fi" },
  { name: "Horror" },
  { name: "Mystery" },
  { name: "Adventure" },
  { name: "By Fandom" },
];
export function NewHomepageView({ onStartNewRead, onStorySelect }: NewHomepageViewProps) {
  const { user: authUser } = useAuth();
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedFandom, setSelectedFandom] = useState('All');
  const [fandoms, setFandoms] = useState<string[]>([]);
  const [showingFandoms, setShowingFandoms] = useState(false);
  const [userContext, setUserContext] = useState(() => UserContextManager.getInstance().getUserContext());
  const [activeTab, setActiveTab] = useState('home');
  useEffect(() => {
    if (selectedCategory === 'By Fandom') {
      loadFandoms();
      setShowingFandoms(true);
    } else {
      setShowingFandoms(false);
      setSelectedFandom('All');
    }
  }, [selectedCategory]);
  const loadFandoms = async () => {
    try {
      const response = await fetch('/api/fandoms');
      const result = await response.json();
      if (result.success) {
        const fandomNames = ['All', ...result.fandoms.map((f: any) => f.name)];
        setFandoms(fandomNames);
      }
    } catch (error) {
      console.error('Error loading fandoms:', error);
      setFandoms(['All', 'Marvel Cinematic Universe', 'Harry Potter', 'Star Wars']);
    }
  };
  const getUserInitial = () => {
    return userContext.username.charAt(0).toUpperCase();
  };
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedFandom('All');
    setShowingFandoms(false);
  };
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <img src="/readitt.png" alt="Readitt" className="h-8 w-8" />
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">readitt</span>
              {authUser?.hasPlus && <PlusBadge />}
            </div>
          </div>
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input 
                placeholder="Search stories..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent transition-colors"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onStartNewRead}
              className="hidden sm:flex items-center gap-2 bg-rose-300 text-rose-800 px-4 py-2 rounded-full font-medium hover:bg-rose-400 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create
            </button>
            <button 
              onClick={() => setIsUserProfileOpen(true)}
              className="h-8 w-8 bg-rose-200 rounded-full flex items-center justify-center hover:bg-rose-300 transition-colors overflow-hidden"
            >
              {userContext.avatar ? (
                <img 
                  src={userContext.avatar} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm font-medium text-rose-700">{getUserInitial()}</span>
              )}
            </button>
          </div>
        </div>
        <div className="md:hidden px-4 pb-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input 
              placeholder="Search stories..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent transition-colors"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {(showingFandoms ? fandoms.map(f => ({ name: f })) : categories).map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  if (showingFandoms) {
                    setSelectedFandom(item.name);
                  } else {
                    setSelectedCategory(item.name);
                  }
                }}
                className={`whitespace-nowrap px-4 py-2 rounded-full font-medium transition-colors flex-shrink-0 ${
                  (showingFandoms ? selectedFandom : selectedCategory) === item.name
                    ? "bg-rose-300 text-rose-800"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {item.name}
              </button>
            ))}
            {showingFandoms && (
              <button
                onClick={() => setSelectedCategory('All')}
                className="whitespace-nowrap px-4 py-2 rounded-full font-medium transition-colors flex-shrink-0 bg-rose-300 text-rose-800 hover:bg-rose-400"
              >
                ← Back to Categories
              </button>
            )}
          </div>
        </div>
      </header>
      <div className="w-full px-4 py-6">
        <div className="hidden md:flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {(showingFandoms ? fandoms.map(f => ({ name: f })) : categories).map((item) => (
            <button
              key={item.name}
              onClick={() => {
                if (showingFandoms) {
                  setSelectedFandom(item.name);
                } else {
                  setSelectedCategory(item.name);
                }
              }}
              className={`whitespace-nowrap px-4 py-2 rounded-full font-medium transition-colors ${
                (showingFandoms ? selectedFandom : selectedCategory) === item.name
                  ? "bg-rose-300 text-rose-800"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {item.name}
            </button>
          ))}
          {showingFandoms && (
            <button
              onClick={() => setSelectedCategory('All')}
              className="whitespace-nowrap px-4 py-2 rounded-full font-medium transition-colors bg-rose-300 text-rose-800 hover:bg-rose-400"
            >
              ← Back to Categories
            </button>
          )}
        </div>
        <section className="mb-12">
          {activeTab === 'create' ? (
            <CreateView key={activeTab} onCreateNew={onStartNewRead} />
          ) : (
            <PopularStories 
              onStorySelect={onStorySelect} 
              searchQuery={searchQuery}
              selectedCategory={showingFandoms ? 'All' : selectedCategory}
              selectedFandom={showingFandoms ? selectedFandom : undefined}
              pageType={activeTab as 'home' | 'library' | 'browse'}
            />
          )}
        </section>
      </div>
      <UserProfile 
        isOpen={isUserProfileOpen}
        onClose={() => {
          setIsUserProfileOpen(false);
          setUserContext(UserContextManager.getInstance().getUserContext());
        }}
      />
      <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      <div className="h-20 md:h-24"></div>
    </div>
  );
}