'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
export function SlackLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [ageConsent, setAgeConsent] = useState(false);
  const [legalConsent, setLegalConsent] = useState(false);
  const router = useRouter();
  const handleSlackLogin = async () => {
    if (!ageConsent || !legalConsent) {
      alert('Please confirm your age and accept the Terms of Service, Privacy Policy, and research consent.');
      return;
    }
    setIsLoading(true);
    try {
      const { GDPRCompliantAnalytics } = await import('@/lib/gdprCompliantAnalytics');
      const gdpr = GDPRCompliantAnalytics.getInstance();
      gdpr.recordConsent();
      window.location.href = '/api/auth/slack';
    } catch (error) {
      console.error('Slack login failed:', error);
      setIsLoading(false);
    }
  };
  const handleInviteCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ageConsent || !legalConsent) {
      setInviteError('Please confirm your age and accept the Terms of Service, Privacy Policy, and research consent.');
      return;
    }
    setIsLoading(true);
    setInviteError('');
    if (inviteCode === 'elisa12as') {
      try {
        const response = await fetch('/api/auth/invite-code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ inviteCode }),
        });
        if (response.ok) {
          const { GDPRCompliantAnalytics } = await import('@/lib/gdprCompliantAnalytics');
          const gdpr = GDPRCompliantAnalytics.getInstance();
          gdpr.recordConsent();
          router.push('/');
        } else {
          setInviteError('Authentication failed. Please try again.');
        }
      } catch (error) {
        console.error('Invite code login failed:', error);
        setInviteError('Authentication failed. Please try again.');
      }
    } else {
      setInviteError('Invalid invite code.');
    }
    setIsLoading(false);
  };
  return (
    <div className="space-y-4">
      <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="ageConsent"
            checked={ageConsent}
            onChange={(e) => setAgeConsent(e.target.checked)}
            className="mt-1 h-4 w-4 text-rose-600 focus:ring-rose-500 border-gray-300 rounded"
          />
          <label htmlFor="ageConsent" className="text-sm text-gray-700 dark:text-gray-300 leading-5">
            I confirm that I am at least 14 years old (or the minimum legal age in my country, if higher) and able to provide my own consent for data processing.
          </label>
        </div>
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="legalConsent"
            checked={legalConsent}
            onChange={(e) => setLegalConsent(e.target.checked)}
            className="mt-1 h-4 w-4 text-rose-600 focus:ring-rose-500 border-gray-300 rounded"
          />
          <label htmlFor="legalConsent" className="text-sm text-gray-700 dark:text-gray-300 leading-5">
            I have read and agree to the{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-rose-600 hover:text-rose-800 underline">
              Terms of Service
            </a>,{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-rose-600 hover:text-rose-800 underline">
              Privacy Policy
            </a>, and{' '}
            <a href="/research-consent" target="_blank" rel="noopener noreferrer" className="text-rose-600 hover:text-rose-800 underline">
              research participation
            </a>.
          </label>
        </div>
      </div>
      {!showInviteCode ? (
        <>
          <button
            onClick={handleSlackLogin}
            disabled={isLoading || !ageConsent || !legalConsent}
            className="w-full flex items-center justify-center gap-3 bg-rose-300 hover:bg-rose-400 disabled:opacity-50 disabled:cursor-not-allowed text-rose-800 font-medium py-4 px-6 rounded-lg transition-colors shadow-sm border border-rose-200"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
            </svg>
            {isLoading ? 'Connecting...' : 'Continue with Slack'}
          </button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">or</span>
            </div>
          </div>
          <button
            onClick={() => setShowInviteCode(true)}
            className="w-full text-rose-700 dark:text-rose-300 hover:text-rose-800 dark:hover:text-rose-200 font-medium py-2 transition-colors"
          >
            Use invite code
          </button>
        </>
      ) : (
        <form onSubmit={handleInviteCodeSubmit} className="space-y-4">
          <div>
            <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Invite Code
            </label>
            <input
              type="text"
              id="inviteCode"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter your invite code"
              required
            />
          </div>
          {inviteError && (
            <p className="text-red-600 dark:text-red-400 text-sm">{inviteError}</p>
          )}
          <button
            type="submit"
            disabled={isLoading || !ageConsent || !legalConsent}
            className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {isLoading ? 'Verifying...' : 'Continue'}
          </button>
          <button
            type="button"
            onClick={() => setShowInviteCode(false)}
            className="w-full text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium py-2 transition-colors"
          >
            Back to Slack login
          </button>
        </form>
      )}
    </div>
  );
}