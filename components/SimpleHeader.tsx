'use client';
import { useState } from 'react';
import { UserProfile } from './UserProfile';
import { UserContextManager } from '@/lib/userContext';
import { useAuth } from '@/lib/auth';
import { PlusBadge } from './PlusBadge';
interface SimpleHeaderProps {
  onUserProfileOpen?: () => void;
  leftContent?: React.ReactNode;
  centerContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  onLogoClick?: () => void;
}
export function SimpleHeader({ onUserProfileOpen, leftContent, centerContent, rightContent, onLogoClick }: SimpleHeaderProps) {
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [userContext] = useState(() => UserContextManager.getInstance().getUserContext());
  const { user: authUser } = useAuth();
  const getUserInitial = () => {
    const username = authUser?.username || userContext.username;
    return username.charAt(0).toUpperCase();
  };
  const getDisplayName = () => {
    return authUser?.username || userContext.username;
  };
  const handleProfileClick = () => {
    if (onUserProfileOpen) {
      onUserProfileOpen();
    } else {
      setIsUserProfileOpen(true);
    }
  };
  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            {leftContent || (
              <div className="flex items-center">
                <button onClick={onLogoClick} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <img src="/readitt.png" alt="Readitt" className="h-8 w-8" />
                  <div className="flex items-baseline">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">readitt</span>
                    {authUser?.hasPlus && <PlusBadge />}
                  </div>
                </button>
              </div>
            )}
          </div>
          {centerContent && (
            <div className="flex-1 flex justify-center mx-4">
              {centerContent}
            </div>
          )}
          <div className="flex items-center gap-3">
            {rightContent}
            <button 
              onClick={handleProfileClick}
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
      </header>
      {!onUserProfileOpen && (
        <UserProfile 
          isOpen={isUserProfileOpen}
          onClose={() => setIsUserProfileOpen(false)}
        />
      )}
    </>
  );
}