'use client';
import { useState } from 'react';
import { AlertTriangle, Shield, Eye, EyeOff, X, Check } from 'lucide-react';
interface ContentWarningDisplayProps {
  contentWarnings: string[];
  ageRating: string;
  storyTitle: string;
  onAccept: () => void;
  onDecline: () => void;
}
const WARNING_INFO: Record<string, { name: string; description: string; category: string; severity: string }> = {
  'violence-mild': { name: 'Mild Violence', description: 'Minor physical conflict, cartoon violence', category: 'violence', severity: 'mild' },
  'violence-moderate': { name: 'Moderate Violence', description: 'Realistic combat, fighting scenes', category: 'violence', severity: 'moderate' },
  'violence-strong': { name: 'Strong Violence', description: 'Graphic violence, gore, torture', category: 'violence', severity: 'strong' },
  'death': { name: 'Character Death', description: 'Characters die during the story', category: 'violence', severity: 'moderate' },
  'war': { name: 'War/Battle', description: 'Military conflict, battle scenes', category: 'violence', severity: 'moderate' },
  'sexual-themes': { name: 'Sexual Themes', description: 'Sexual situations, innuendo', category: 'sexual', severity: 'mild' },
  'sexual-moderate': { name: 'Sexual Content', description: 'Explicit sexual descriptions, adult situations', category: 'sexual', severity: 'moderate' },
  'sexual-graphic': { name: 'Graphic Sexual Content', description: 'Detailed explicit sexual content', category: 'sexual', severity: 'strong' },
  'romance': { name: 'Romance', description: 'Romantic relationships, kissing', category: 'sexual', severity: 'mild' },
  'alcohol': { name: 'Alcohol Use', description: 'Characters consume alcohol', category: 'substance', severity: 'mild' },
  'drugs': { name: 'Drug Use', description: 'Illegal drug use or abuse', category: 'substance', severity: 'moderate' },
  'smoking': { name: 'Smoking/Tobacco', description: 'Characters smoke or use tobacco', category: 'substance', severity: 'mild' },
  'mental-health': { name: 'Mental Health Issues', description: 'Depression, anxiety, mental illness', category: 'psychological', severity: 'mild' },
  'suicide': { name: 'Suicide/Self-Harm', description: 'Suicidal thoughts or self-harm', category: 'psychological', severity: 'strong' },
  'abuse': { name: 'Abuse', description: 'Physical, emotional, or psychological abuse', category: 'psychological', severity: 'strong' },
  'trauma': { name: 'Trauma', description: 'Traumatic events, PTSD', category: 'psychological', severity: 'moderate' },
  'manipulation': { name: 'Manipulation', description: 'Emotional manipulation, gaslighting', category: 'psychological', severity: 'moderate' },
  'language-strong': { name: 'Strong Language', description: 'Strong profanity, offensive language', category: 'other', severity: 'moderate' },
  'religion': { name: 'Religious Content', description: 'Religious themes or discussions', category: 'other', severity: 'mild' },
  'political': { name: 'Political Content', description: 'Political themes or discussions', category: 'other', severity: 'mild' },
  'body-horror': { name: 'Body Horror', description: 'Disturbing bodily transformations', category: 'other', severity: 'strong' },
  'horror': { name: 'Horror Elements', description: 'Scary, horror-themed content', category: 'other', severity: 'moderate' }
};
const CATEGORY_COLORS = {
  violence: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300',
  sexual: 'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300',
  substance: 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-300',
  psychological: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300',
  other: 'bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-900/20 dark:border-gray-800 dark:text-gray-300'
};
const SEVERITY_COLORS = {
  mild: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  moderate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  strong: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
};
const AGE_RATING_INFO = {
  'all-ages': { name: 'All Ages', description: 'Suitable for all readers', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  '13+': { name: '13+', description: 'Suitable for ages 13 and up', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  '16+': { name: '16+', description: 'Suitable for ages 16 and up', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
  '18+': { name: '18+', description: 'Adult content - 18 and up only', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' }
};
export function ContentWarningDisplay({ 
  contentWarnings, 
  ageRating, 
  storyTitle, 
  onAccept, 
  onDecline 
}: ContentWarningDisplayProps) {
  const [showDetails, setShowDetails] = useState(false);
  const hasWarnings = contentWarnings.length > 0;
  const isNsfw = contentWarnings.some(warning => {
    const info = WARNING_INFO[warning];
    return info?.category === 'sexual' || info?.severity === 'strong' || ageRating === '18+';
  });
  const ratingInfo = AGE_RATING_INFO[ageRating as keyof typeof AGE_RATING_INFO] || AGE_RATING_INFO['all-ages'];
  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-xl">
            <AlertTriangle className="h-8 w-8 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Content Warning
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please review the content information for <span className="font-semibold">"{storyTitle}"</span>
            </p>
          </div>
        </div>
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <span className="font-semibold text-gray-900 dark:text-white">Age Rating</span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-2 rounded-lg text-sm font-medium ${ratingInfo.color}`}>
              {ratingInfo.name}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {ratingInfo.description}
            </span>
          </div>
        </div>
        {hasWarnings ? (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <EyeOff className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <span className="font-semibold text-gray-900 dark:text-white">
                  Content Warnings ({contentWarnings.length})
                </span>
              </div>
              {isNsfw && (
                <div className="flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-full">
                  <EyeOff className="h-3 w-3 text-red-600 dark:text-red-400" />
                  <span className="text-xs font-medium text-red-700 dark:text-red-300">NSFW</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {contentWarnings.map((warningId) => {
                const warning = WARNING_INFO[warningId];
                if (!warning) return null;
                return (
                  <div
                    key={warningId}
                    className={`p-3 rounded-lg border ${CATEGORY_COLORS[warning.category as keyof typeof CATEGORY_COLORS]}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{warning.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SEVERITY_COLORS[warning.severity as keyof typeof SEVERITY_COLORS]}`}>
                        {warning.severity}
                      </span>
                    </div>
                    {showDetails && (
                      <p className="text-xs opacity-80">{warning.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors underline"
            >
              {showDetails ? 'Hide details' : 'Show details'}
            </button>
          </div>
        ) : (
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <Eye className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="font-semibold text-gray-900 dark:text-white">Content Warnings</span>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-green-800 dark:text-green-300 font-medium">
                  No content warnings - Safe for all ages
                </span>
              </div>
            </div>
          </div>
        )}
        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-rose-800 dark:text-rose-300 mb-1">
                Why do we show content warnings?
              </p>
              <p className="text-rose-700 dark:text-rose-400">
                Content warnings help you make informed decisions about what you read. 
                They ensure transparency about the story's content and help create a safer reading environment.
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <button
            onClick={onDecline}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
            Not for me
          </button>
          <button
            onClick={onAccept}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-rose-300 text-rose-800 rounded-xl font-medium hover:bg-rose-400 transition-colors"
          >
            <Check className="h-5 w-5" />
            I understand, continue reading
          </button>
        </div>
      </div>
    </div>
  );
}