'use client';
import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SlackLogin } from '@/components/SlackLogin';
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/verify');
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated) {
            router.push('/');
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    };
    checkAuth();
  }, [router]);
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl border border-rose-100 dark:border-gray-700 shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <img src="/readitt.png" alt="Readitt" className="h-12 w-12 mr-3" />
            <h1 className="text-3xl font-bold text-rose-700 dark:text-rose-300">readitt</h1>
          </div>
        </div>
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-300 text-sm">
              {error === 'auth_failed' ? 'Authentication failed. Please try again.' : 'An error occurred during login.'}
            </p>
          </div>
        )}
        <SlackLogin />
      </div>
    </div>
  );
}
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl border border-rose-100 dark:border-gray-700 shadow-lg p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-700 dark:border-rose-300 mx-auto"></div>
          </div>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}