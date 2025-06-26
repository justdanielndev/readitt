'use client';
import { useState } from 'react';
import { AlertTriangle, Shield, X } from 'lucide-react';
interface AgeVerificationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
export function AgeVerificationModal({ isOpen, onConfirm, onCancel }: AgeVerificationModalProps) {
  const [isConfirmed, setIsConfirmed] = useState(false);
  if (!isOpen) return null;
  const handleConfirm = () => {
    if (isConfirmed) {
      onConfirm();
    }
  };
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-rose-100 dark:bg-rose-900/20 mb-4">
            <Shield className="h-8 w-8 text-rose-600 dark:text-rose-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Are you 18 years or older?
          </h3>
          <div className="text-left space-y-4 mb-6">
            <div className="flex items-start gap-3 p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-rose-800 dark:text-rose-300">
                <p className="font-medium mb-1">18+ Content Warning</p>
                <p>You are about to enable access to adult content that may contain:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Mature themes and situations</li>
                  <li>Sexual content</li>
                  <li>Violence and disturbing content</li>
                  <li>Strong language</li>
                </ul>
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p className="mb-3">
                By enabling this setting, you confirm that:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 mt-1">•</span>
                  <span>You are at least 18 years of age</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 mt-1">•</span>
                  <span>You understand the nature of adult content</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 mt-1">•</span>
                  <span>You wish to access 18+ rated stories</span>
                </li>
              </ul>
            </div>
            <div className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <input
                id="age-confirmation"
                type="checkbox"
                checked={isConfirmed}
                onChange={(e) => setIsConfirmed(e.target.checked)}
                className="mt-1 h-4 w-4 text-rose-600 border-gray-300 rounded focus:ring-rose-500"
              />
              <label htmlFor="age-confirmation" className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                I confirm that I am 18 years of age or older and wish to access adult content.
              </label>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-3 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!isConfirmed}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                isConfirmed
                  ? 'bg-rose-500 hover:bg-rose-600 text-white'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              Enable 18+ Content
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            You can disable this setting at any time in your profile settings.
          </p>
        </div>
      </div>
    </div>
  );
}