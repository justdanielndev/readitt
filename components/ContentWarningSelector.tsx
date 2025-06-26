'use client';
import { useState, useEffect } from 'react';
import { AlertTriangle, Shield, Eye, EyeOff, Info } from 'lucide-react';
interface ContentWarning {
  id: string;
  name: string;
  description: string;
  category: 'violence' | 'sexual' | 'substance' | 'psychological' | 'other';
  severity: 'mild' | 'moderate' | 'strong';
  requires_18_plus: boolean;
}
interface ContentWarningSelectorProps {
  selectedWarnings: string[];
  onWarningsChange: (warnings: string[]) => void;
  onAgeRatingChange: (rating: string) => void;
  ageRating: string;
}
const CATEGORY_COLORS = {
  violence: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300',
  sexual: 'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300',
  substance: 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-300',
  psychological: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300',
  other: 'bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-900/20 dark:border-gray-800 dark:text-gray-300'
};
const CATEGORY_ICONS = {
  violence: '⚔️',
  sexual: '💕',
  substance: '🍷',
  psychological: '🧠',
  other: '⚠️'
};
const SEVERITY_COLORS = {
  mild: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  moderate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  strong: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
};
export function ContentWarningSelector({ 
  selectedWarnings, 
  onWarningsChange, 
  onAgeRatingChange, 
  ageRating 
}: ContentWarningSelectorProps) {
  const [availableWarnings, setAvailableWarnings] = useState<ContentWarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  useEffect(() => {
    loadAvailableWarnings();
  }, []);
  const loadAvailableWarnings = async () => {
    try {
      const warnings: ContentWarning[] = [
        { id: 'violence-mild', name: 'Mild Violence', description: 'Minor physical conflict, cartoon violence', category: 'violence', severity: 'mild', requires_18_plus: false },
        { id: 'violence-moderate', name: 'Moderate Violence', description: 'Realistic combat, fighting scenes', category: 'violence', severity: 'moderate', requires_18_plus: false },
        { id: 'violence-strong', name: 'Strong Violence', description: 'Graphic violence, gore, torture', category: 'violence', severity: 'strong', requires_18_plus: true },
        { id: 'death', name: 'Character Death', description: 'Characters die during the story', category: 'violence', severity: 'moderate', requires_18_plus: false },
        { id: 'war', name: 'War/Battle', description: 'Military conflict, battle scenes', category: 'violence', severity: 'moderate', requires_18_plus: false },
        { id: 'sexual-themes', name: 'Sexual Themes', description: 'Sexual situations, innuendo', category: 'sexual', severity: 'mild', requires_18_plus: false },
        { id: 'sexual-moderate', name: 'Sexual Content', description: 'Explicit sexual descriptions, adult situations', category: 'sexual', severity: 'moderate', requires_18_plus: true },
        { id: 'sexual-graphic', name: 'Graphic Sexual Content', description: 'Detailed explicit sexual content', category: 'sexual', severity: 'strong', requires_18_plus: true },
        { id: 'romance', name: 'Romance', description: 'Romantic relationships, kissing', category: 'sexual', severity: 'mild', requires_18_plus: false },
        { id: 'alcohol', name: 'Alcohol Use', description: 'Characters consume alcohol', category: 'substance', severity: 'mild', requires_18_plus: false },
        { id: 'drugs', name: 'Drug Use', description: 'Illegal drug use or abuse', category: 'substance', severity: 'moderate', requires_18_plus: true },
        { id: 'smoking', name: 'Smoking/Tobacco', description: 'Characters smoke or use tobacco', category: 'substance', severity: 'mild', requires_18_plus: false },
        { id: 'mental-health', name: 'Mental Health Issues', description: 'Depression, anxiety, mental illness', category: 'psychological', severity: 'mild', requires_18_plus: false },
        { id: 'suicide', name: 'Suicide/Self-Harm', description: 'Suicidal thoughts or self-harm', category: 'psychological', severity: 'strong', requires_18_plus: true },
        { id: 'abuse', name: 'Abuse', description: 'Physical, emotional, or psychological abuse', category: 'psychological', severity: 'strong', requires_18_plus: true },
        { id: 'trauma', name: 'Trauma', description: 'Traumatic events, PTSD', category: 'psychological', severity: 'moderate', requires_18_plus: false },
        { id: 'manipulation', name: 'Manipulation', description: 'Emotional manipulation, gaslighting', category: 'psychological', severity: 'moderate', requires_18_plus: false },
        { id: 'language-strong', name: 'Strong Language', description: 'Strong profanity, offensive language', category: 'other', severity: 'moderate', requires_18_plus: false },
        { id: 'religion', name: 'Religious Content', description: 'Religious themes or discussions', category: 'other', severity: 'mild', requires_18_plus: false },
        { id: 'political', name: 'Political Content', description: 'Political themes or discussions', category: 'other', severity: 'mild', requires_18_plus: false },
        { id: 'body-horror', name: 'Body Horror', description: 'Disturbing bodily transformations', category: 'other', severity: 'strong', requires_18_plus: true },
        { id: 'horror', name: 'Horror Elements', description: 'Scary, horror-themed content', category: 'other', severity: 'moderate', requires_18_plus: false }
      ];
      setAvailableWarnings(warnings);
    } catch (error) {
      console.error('Error loading content warnings:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleWarningToggle = (warningId: string) => {
    const warning = availableWarnings.find(w => w.id === warningId);
    if (!warning) return;
    let newWarnings;
    if (selectedWarnings.includes(warningId)) {
      newWarnings = selectedWarnings.filter(id => id !== warningId);
    } else {
      newWarnings = [...selectedWarnings, warningId];
    }
    onWarningsChange(newWarnings);
    const hasAdultContent = newWarnings.some(id => {
      const w = availableWarnings.find(warning => warning.id === id);
      return w?.requires_18_plus;
    });
    if (hasAdultContent && ageRating !== '18+') {
      onAgeRatingChange('18+');
    }
  };
  const filteredWarnings = selectedCategory === 'all' 
    ? availableWarnings 
    : availableWarnings.filter(w => w.category === selectedCategory);
  const categories = ['all', 'violence', 'sexual', 'substance', 'psychological', 'other'];
  const hasNsfwContent = selectedWarnings.some(id => {
    const warning = availableWarnings.find(w => w.id === id);
    return warning?.requires_18_plus || warning?.category === 'sexual';
  });
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-rose-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Content Warnings</h3>
        </div>
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-rose-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Content Warnings</h3>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <Info className="h-4 w-4" />
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>
      <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-rose-800 dark:text-rose-300 mb-1">Content Warning Guidelines</p>
            <p className="text-rose-700 dark:text-rose-400">
              Select all content warnings that apply to your story. This helps readers make informed decisions and ensures appropriate AI generation guidelines.
            </p>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Age Rating</label>
        <div className="flex flex-wrap gap-2">
          {['all-ages', '13+', '16+', '18+'].map((rating) => (
            <button
              key={rating}
              onClick={() => onAgeRatingChange(rating)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                ageRating === rating
                  ? 'bg-rose-300 border-rose-400 text-rose-800'
                  : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {rating === 'all-ages' ? 'All Ages' : rating}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Category</label>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                selectedCategory === category
                  ? 'bg-rose-300 border-rose-400 text-rose-800'
                  : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {category !== 'all' && CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS]}
              {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Content Warnings ({selectedWarnings.length} selected)
          </label>
          {hasNsfwContent && (
            <div className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-full">
              <EyeOff className="h-3 w-3 text-red-600 dark:text-red-400" />
              <span className="text-xs font-medium text-red-700 dark:text-red-300">NSFW</span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
          {filteredWarnings.map((warning) => {
            const isSelected = selectedWarnings.includes(warning.id);
            return (
              <button
                key={warning.id}
                onClick={() => handleWarningToggle(warning.id)}
                className={`text-left p-3 rounded-lg border transition-all ${
                  isSelected
                    ? `${CATEGORY_COLORS[warning.category]} ring-2 ring-rose-300 dark:ring-rose-600`
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {warning.name}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SEVERITY_COLORS[warning.severity]}`}>
                        {warning.severity}
                      </span>
                      {warning.requires_18_plus && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                          18+
                        </span>
                      )}
                    </div>
                    {showDetails && (
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {warning.description}
                      </p>
                    )}
                  </div>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    isSelected 
                      ? 'bg-rose-300 border-rose-400' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {isSelected && <span className="text-rose-800 text-xs">✓</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      {selectedWarnings.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Selected Warnings Summary</h4>
          <div className="flex flex-wrap gap-2">
            {selectedWarnings.map(id => {
              const warning = availableWarnings.find(w => w.id === id);
              if (!warning) return null;
              return (
                <span
                  key={id}
                  className={`px-2 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[warning.category]}`}
                >
                  {warning.name}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}