'use client';
import { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, Search, Plus, BookOpen, Users, Heart, Zap } from 'lucide-react';
import { SimpleHeader } from './SimpleHeader';
import { ContentWarningSelector } from './ContentWarningSelector';
import type { Fandom } from './HomepageView';
interface FandomSelectionProps {
  onBack: () => void;
  onFandomSelect: (fandom: Fandom, storyParams: {
    storyName: string;
    characters: string;
    topics: string;
    theme: string;
    isPrivate: boolean;
    contentWarnings: string[];
    ageRating: string;
  }) => void;
}
const popularFandoms: Fandom[] = [
  {
    id: '1',
    name: 'Marvel Cinematic Universe',
    description: 'Stories set in the world of Marvel superheroes',
    category: 'Movies & TV',
    popularity: 95,
    stories: 15420
  },
  {
    id: '2',
    name: 'Harry Potter',
    description: 'Magical adventures in the wizarding world',
    category: 'Books',
    popularity: 92,
    stories: 28150
  },
  {
    id: '3',
    name: 'Star Wars',
    description: 'Epic space opera adventures',
    category: 'Movies & TV',
    popularity: 88,
    stories: 12340
  },
  {
    id: '4',
    name: 'BTS',
    description: 'K-pop idol stories and scenarios',
    category: 'Music',
    popularity: 91,
    stories: 45230
  },
  {
    id: '5',
    name: 'Attack on Titan',
    description: 'Post-apocalyptic titan fighting adventures',
    category: 'Anime & Manga',
    popularity: 85,
    stories: 8920
  },
  {
    id: '6',
    name: 'Genshin Impact',
    description: 'Fantasy adventures in the world of Teyvat',
    category: 'Gaming',
    popularity: 83,
    stories: 11580
  },
  {
    id: '7',
    name: 'Stranger Things',
    description: 'Supernatural mysteries in Hawkins',
    category: 'Movies & TV',
    popularity: 80,
    stories: 7650
  },
  {
    id: '8',
    name: 'My Hero Academia',
    description: 'Superhero academy adventures',
    category: 'Anime & Manga',
    popularity: 87,
    stories: 13420
  }
];
const categories = [
  { name: 'All', icon: '🌟' },
  { name: 'Movies & TV', icon: '🎬' },
  { name: 'Books', icon: '📚' },
  { name: 'Anime & Manga', icon: '🎌' },
  { name: 'Gaming', icon: '🎮' },
  { name: 'Music', icon: '🎵' },
  { name: 'Custom', icon: '✨' }
];
export function FandomSelection({ onBack, onFandomSelect }: FandomSelectionProps) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFandom, setSelectedFandom] = useState<Fandom | null>(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customFandomName, setCustomFandomName] = useState('');
  const [customFandomDesc, setCustomFandomDesc] = useState('');
  const [customFandomCategory, setCustomFandomCategory] = useState('Custom');
  const [storyName, setStoryName] = useState('');
  const [characters, setCharacters] = useState('');
  const [topics, setTopics] = useState('');
  const [theme, setTheme] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [contentWarnings, setContentWarnings] = useState<string[]>([]);
  const [ageRating, setAgeRating] = useState('all-ages');
  const [fandoms, setFandoms] = useState<Fandom[]>(popularFandoms);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadFandoms();
  }, []);
  const loadFandoms = async () => {
    try {
      const response = await fetch('/api/fandoms');
      const result = await response.json();
      if (result.success) {
        const dbFandoms = result.fandoms.map((f: any) => ({
          id: f.id,
          name: f.name,
          description: f.description,
          category: f.category,
          popularity: Math.min(95, f.usage_count / 100), 
          stories: f.usage_count,
          isCustom: f.is_custom
        }));
        setFandoms(dbFandoms);
      }
    } catch (error) {
      console.error('Error loading fandoms:', error);
    } finally {
      setLoading(false);
    }
  };
  const filteredFandoms = fandoms.filter(fandom => {
    const matchesCategory = selectedCategory === 'All' || fandom.category === selectedCategory;
    const matchesSearch = fandom.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         fandom.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  const handleCustomFandomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFandomName.trim()) return;
    try {
      const response = await fetch('/api/fandoms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: customFandomName.trim(),
          description: customFandomDesc.trim() || `Stories set in the ${customFandomName.trim()} universe`,
          category: customFandomCategory
        })
      });
      const result = await response.json();
      if (result.success) {
        const customFandom: Fandom = {
          id: result.fandom.id,
          name: result.fandom.name,
          description: result.fandom.description,
          category: result.fandom.category,
          popularity: 75,
          stories: 1,
          isCustom: true
        };
        setFandoms(prev => [customFandom, ...prev]);
        setSelectedFandom(customFandom);
        setShowCustomForm(false);
      } else {
        alert(result.error || 'Failed to create custom fandom');
      }
    } catch (error) {
      console.error('Error creating custom fandom:', error);
      alert('Failed to create custom fandom. Please try again.');
    }
  };
  const handleFandomClick = (fandom: Fandom) => {
    setSelectedFandom(fandom);
  };
  const handleStartGeneration = () => {
    if (!selectedFandom) return;
    console.log('🚨 Content warnings being sent:', contentWarnings);
    console.log('🔞 Age rating being sent:', ageRating);
    onFandomSelect(selectedFandom, {
      storyName: storyName.trim() || `Adventures in ${selectedFandom.name}`,
      characters: characters.trim(),
      topics: topics.trim() || 'adventure, discovery',
      theme: theme.trim() || 'courage and friendship',
      isPrivate: isPrivate,
      contentWarnings: contentWarnings,
      ageRating: ageRating
    });
  };
  return (
    <div className="min-h-screen bg-background">
      <SimpleHeader onLogoClick={() => window.location.href = '/'} />
      <div className="bg-background border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:text-rose-900 dark:hover:text-rose-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Back</span>
          </button>
          <div className="text-center flex flex-col items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Choose Your Universe</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Select a fandom or create your own</p>
          </div>
          <div className="w-20"></div> 
        </div>
      </div>
      <div className="w-full px-6 py-8">
        <div className="max-w-4xl mx-auto mb-8">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search fandoms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent shadow-sm"
            />
          </div>
          <div className="flex flex-wrap gap-3 mb-8">
            {categories.map((category) => (
              <button
                key={category.name}
                onClick={() => {
                  if (category.name === 'Custom') {
                    setShowCustomForm(true);
                    setSelectedCategory('All');
                  } else {
                    setSelectedCategory(category.name);
                    setShowCustomForm(false);
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${
                  selectedCategory === category.name
                    ? 'bg-rose-300 text-rose-800'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>
        {showCustomForm && (
          <div className="max-w-2xl mx-auto mb-12">
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-2xl">
                  <Sparkles className="h-6 w-6 text-rose-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Your Universe</h2>
                  <p className="text-gray-500 dark:text-gray-400">Build a custom fandom from scratch</p>
                </div>
              </div>
              <form onSubmit={handleCustomFandomSubmit} className="space-y-6">
                <div>
                  <label htmlFor="fandomName" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Universe Name
                  </label>
                  <input
                    type="text"
                    id="fandomName"
                    value={customFandomName}
                    onChange={(e) => setCustomFandomName(e.target.value)}
                    placeholder="e.g., Neo-Tokyo 2087, Mystic Realms..."
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="fandomDesc" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    id="fandomDesc"
                    value={customFandomDesc}
                    onChange={(e) => setCustomFandomDesc(e.target.value)}
                    placeholder="Describe your world..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent resize-none"
                  />
                </div>
                <div>
                  <label htmlFor="fandomCategory" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    id="fandomCategory"
                    value={customFandomCategory}
                    onChange={(e) => setCustomFandomCategory(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent"
                    required
                  >
                    {categories.filter(cat => cat.name !== 'All' && cat.name !== 'Custom').map((category) => (
                      <option key={category.name} value={category.name}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-rose-300 text-rose-800 px-6 py-3 rounded-xl font-semibold hover:bg-rose-400 transition-colors"
                  >
                    Create Universe
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCustomForm(false)}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {!showCustomForm && (
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredFandoms.map((fandom) => (
                <div
                  key={fandom.id}
                  onClick={() => handleFandomClick(fandom)}
                  className={`group relative bg-white dark:bg-gray-800 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-xl border-2 ${
                    selectedFandom?.id === fandom.id 
                      ? 'border-rose-300 shadow-xl ring-4 ring-rose-100 dark:ring-rose-900/30' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-rose-300 shadow-lg'
                  }`}
                >
                  {selectedFandom?.id === fandom.id && (
                    <div className="absolute -top-2 -right-2 bg-rose-300 text-rose-800 rounded-full p-2 shadow-lg">
                      <Heart className="h-4 w-4 fill-current" />
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full text-xs font-medium">
                      {fandom.category}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Users className="h-3 w-3" />
                      <span>{(fandom.stories / 1000).toFixed(1)}k</span>
                    </div>
                  </div>
                  <div className="mb-4">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-rose-600 transition-colors">
                      {fandom.name}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-3">
                      {fandom.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-end">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {(fandom.stories / 1000).toFixed(1)}k stories
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {filteredFandoms.length === 0 && (
              <div className="text-center py-16">
                <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">No fandoms found</h3>
                <p className="text-gray-400">Try adjusting your search or category filter</p>
              </div>
            )}
          </div>
        )}
        {selectedFandom && !showCustomForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-rose-100 dark:bg-rose-900/30 rounded-2xl">
                  <Zap className="h-8 w-8 text-rose-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Customize Your Story</h2>
                  <p className="text-gray-500 dark:text-gray-400">Fine-tune your adventure</p>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 mb-8 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <BookOpen className="h-5 w-5 text-rose-500" />
                  <span className="font-semibold text-gray-900 dark:text-white">Selected Universe</span>
                </div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">{selectedFandom.name}</h3>
                <p className="text-gray-600 dark:text-gray-300">{selectedFandom.description}</p>
              </div>
              <div className="space-y-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="storyName" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Story Title
                    </label>
                    <input
                      type="text"
                      id="storyName"
                      value={storyName}
                      onChange={(e) => setStoryName(e.target.value)}
                      placeholder={`Adventures in ${selectedFandom.name}`}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="characters" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Characters
                    </label>
                    <input
                      type="text"
                      id="characters"
                      value={characters}
                      onChange={(e) => setCharacters(e.target.value)}
                      placeholder="e.g., Tony Stark, Hermione..."
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="topics" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Story Elements
                    </label>
                    <input
                      type="text"
                      id="topics"
                      value={topics}
                      onChange={(e) => setTopics(e.target.value)}
                      placeholder="adventure, romance, mystery..."
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="theme" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Theme & Mood
                    </label>
                    <input
                      type="text"
                      id="theme"
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                      placeholder="courage and friendship..."
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <ContentWarningSelector
                    selectedWarnings={contentWarnings}
                    onWarningsChange={setContentWarnings}
                    onAgeRatingChange={setAgeRating}
                    ageRating={ageRating}
                  />
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="privacy" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Story Privacy
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Private stories can only be accessed through a shareable link
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        id="privacy"
                        checked={isPrivate}
                        onChange={(e) => setIsPrivate(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-300 dark:peer-focus:ring-rose-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-rose-600"></div>
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedFandom(null)}
                  className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Back to Selection
                </button>
                <button
                  onClick={handleStartGeneration}
                  className="flex-2 bg-rose-300 text-rose-800 px-8 py-3 rounded-xl font-semibold hover:bg-rose-400 transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles className="h-5 w-5" />
                  Generate Story
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}