'use client';
import { AlertTriangle, Settings, Shield } from 'lucide-react';
interface NSFWBlockedModalProps {
  isOpen: boolean;
  storyTitle: string;
  onClose: () => void;
  onOpenSettings: () => void;
}
export function NSFWBlockedModal({ isOpen, storyTitle, onClose, onOpenSettings }: NSFWBlockedModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-rose-100 dark:bg-rose-900/20 mb-4">
            <Shield className="h-8 w-8 text-rose-600 dark:text-rose-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Adult Content Blocked
          </h3>
          <div className="text-left space-y-4 mb-6">
            <div className="flex items-start gap-3 p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-rose-800 dark:text-rose-300">
                <p className="font-medium mb-1">"{storyTitle}"</p>
                <p>This story contains adult content (18+) and is currently blocked by your content settings.</p>
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p className="mb-3">
                To access 18+ content, you need to:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 mt-1">•</span>
                  <span>Enable "Show 18+ Content" in your settings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 mt-1">•</span>
                  <span>Complete age verification (18+ years required)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 mt-1">•</span>
                  <span>Confirm you understand the nature of adult content</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-3 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={onOpenSettings}
              className="flex-1 bg-rose-500 hover:bg-rose-600 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Open Settings
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            This setting helps ensure age-appropriate content access.
          </p>
        </div>
      </div>
    </div>
  );
}