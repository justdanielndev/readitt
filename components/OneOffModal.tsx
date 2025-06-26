'use client';
import { useState, useEffect } from 'react';
import { X, BadgePlus, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { ContentWarningSelector } from './ContentWarningSelector';
interface OneOffModalProps {
  isOpen: boolean;
  onClose: () => void;
  story: any;
  currentChapter: number;
  chapterContent: string;
}
export function OneOffModal({ isOpen, onClose, story, currentChapter, chapterContent }: OneOffModalProps) {
  const { user } = useAuth();
  const [storyName, setStoryName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [contentWarnings, setContentWarnings] = useState<string[]>([]);
  const [ageRating, setAgeRating] = useState('all-ages');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'setup' | 'confirm'>('setup');
  useEffect(() => {
    if (isOpen) {
      setStoryName(`${story.title} - Alternative Path`);
      setDescription('Continue the story in a different direction...');
      setTags(story.tags?.join(', ') || '');
      setContentWarnings(story.contentWarnings || []);
      setAgeRating(story.ageRating || 'all-ages');
      setError('');
      setStep('setup');
    }
  }, [isOpen, story]);
  const handleSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyName.trim() || !description.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    console.log('✅ One-off setup complete:', {
      storyName,
      description,
      contentWarnings,
      ageRating
    });
    setError('');
    setStep('confirm');
  };
  const handleGeneration = async () => {
    setIsGenerating(true);
    setError('');
    try {
      const response = await fetch('/api/create-one-off', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalStoryId: story.id,
          originalChapter: currentChapter,
          chapterContent: chapterContent,
          storyName: storyName.trim(),
          description: description.trim(),
          tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
          contentWarnings: contentWarnings,
          ageRating: ageRating,
          originalStory: story, 
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const existingOneOffs = JSON.parse(localStorage.getItem('user_one_offs') || '[]');
        const newOneOff = {
          id: Date.now().toString(), 
          ...data.oneOff
        };
        existingOneOffs.push(newOneOff);
        localStorage.setItem('user_one_offs', JSON.stringify(existingOneOffs));
        onClose();
        alert('One-off created successfully! Check your library to view it.');
        window.location.reload();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create one-off');
      }
    } catch (error) {
      console.error('Error creating one-off:', error);
      setError('Failed to create one-off story. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  const handleBack = () => {
    setStep('setup');
    setError('');
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-rose-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <BadgePlus className="h-6 w-6 text-rose-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {step === 'setup' ? 'Create One-Off Story' : 'Generate One-Off'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        {step === 'setup' ? (
          <form onSubmit={handleSetupSubmit} className="p-6 space-y-4">
          <div className="bg-gradient-to-r from-rose-50 to-pink-50 dark:bg-gradient-to-r dark:from-gray-700 dark:to-gray-600 p-4 rounded-lg border border-rose-200 dark:border-gray-600">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-rose-500" />
              <span className="text-sm font-medium text-rose-700 dark:text-rose-300">Plus Feature</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Create a private one-off chapter that continues from chapter {currentChapter + 1} of "{story.title}" with your custom direction.
            </p>
          </div>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="storyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Story Name *
            </label>
            <input
              type="text"
              id="storyName"
              value={storyName}
              onChange={(e) => setStoryName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter your story name"
              required
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Story Direction *
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 dark:bg-gray-700 dark:text-white resize-none"
              placeholder="Describe what should happen next in your story..."
              required
            />
          </div>
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <input
              type="text"
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 dark:bg-gray-700 dark:text-white"
              placeholder="adventure, romance, action (comma separated)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Content Warnings
            </label>
            <ContentWarningSelector
              selectedWarnings={contentWarnings}
              onWarningsChange={setContentWarnings}
              onAgeRatingChange={setAgeRating}
              ageRating={ageRating}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Specific to this one-off chapter
            </p>
          </div>
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 p-3 rounded-lg">
            <p className="text-sm text-rose-700 dark:text-rose-300">
              <strong>Note:</strong> This will create a private one-off chapter that only you can see. You can customize content warnings specifically for this chapter.
            </p>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              disabled={isGenerating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-rose-500 to-purple-500 text-white rounded-lg hover:from-rose-600 hover:to-purple-600 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Continue
            </button>
          </div>
        </form>
        ) : (
          <div className="p-6 space-y-4">
            <div className="bg-gradient-to-r from-rose-50 to-pink-50 dark:bg-gradient-to-r dark:from-gray-700 dark:to-gray-600 p-4 rounded-lg border border-rose-200 dark:border-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-rose-500" />
                <span className="text-sm font-medium text-rose-700 dark:text-rose-300">Ready to Generate</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                AI will create your one-off chapter based on the settings below.
              </p>
            </div>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            <div className="space-y-3">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-1">Story Name</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{storyName}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-1">Story Direction</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
              </div>
              {contentWarnings.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">Content Warnings</h3>
                  <div className="flex flex-wrap gap-1">
                    {contentWarnings.map((warning, index) => (
                      <span key={index} className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs rounded">
                        {warning}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-1">Age Rating</h3>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">
                  {ageRating}
                </span>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                disabled={isGenerating}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleGeneration}
                disabled={isGenerating}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-rose-500 to-purple-500 text-white rounded-lg hover:from-rose-600 hover:to-purple-600 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? 'Generating...' : 'Generate One-Off'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}