'use client';
import { useState } from 'react';
import { X } from 'lucide-react';
interface VoteModalProps {
  voteType: 'up' | 'down';
  onSubmit: (reasons: string[]) => void;
  onClose: () => void;
}
const positiveReasons = [
  'Great character development',
  'Engaging plot progression',
  'Excellent dialogue',
  'Perfect pacing',
  'Emotional depth',
  'Action sequences',
  'World building',
  'Romance elements',
  'Humor and wit',
  'Cliffhanger ending'
];
const negativeReasons = [
  'Plot inconsistencies',
  'Rushed pacing',
  'Out of character moments',
  'Confusing plot points',
  'Poor dialogue',
  'Lack of tension',
  'Too much exposition',
  'Repetitive writing',
  'Unclear motivations',
  'Weak ending'
];
export function VoteModal({ voteType, onSubmit, onClose }: VoteModalProps) {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [customFeedback, setCustomFeedback] = useState('');
  const reasons = voteType === 'up' ? positiveReasons : negativeReasons;
  const title = voteType === 'up' ? 'Why did you like this chapter?' : 'What could be improved?';
  const handleReasonToggle = (reason: string) => {
    setSelectedReasons(prev => 
      prev.includes(reason)
        ? prev.filter(r => r !== reason)
        : [...prev, reason]
    );
  };
  const handleSubmit = () => {
    const allReasons = [...selectedReasons];
    if (customFeedback.trim()) {
      allReasons.push(customFeedback.trim());
    }
    onSubmit(allReasons);
  };
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={handleBackdropClick}>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 w-full max-w-md max-h-[80vh] overflow-hidden shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 max-h-96 overflow-y-auto">
          <div className="space-y-2 mb-6">
            {reasons.map((reason) => (
              <button
                key={reason}
                onClick={() => handleReasonToggle(reason)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-all duration-200 ${
                  selectedReasons.includes(reason)
                    ? voteType === 'up'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                      : 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {reason}
              </button>
            ))}
          </div>
          <div>
            <label htmlFor="customFeedback" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Additional feedback (optional)
            </label>
            <textarea
              id="customFeedback"
              value={customFeedback}
              onChange={(e) => setCustomFeedback(e.target.value)}
              placeholder="Tell us more..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        </div>
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}