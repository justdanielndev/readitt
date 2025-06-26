'use client';
import { Home, Compass, BookOpen, PenTool } from 'lucide-react';
interface BottomNavigationProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}
export function BottomNavigation({ activeTab = 'home', onTabChange }: BottomNavigationProps) {
  const tabs = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
    },
    {
      id: 'browse',
      label: 'Browse',
      icon: Compass,
    },
    {
      id: 'library',
      label: 'Library',
      icon: BookOpen,
    },
    {
      id: 'create',
      label: 'Create',
      icon: PenTool,
    },
  ];
  const handleTabClick = (tabId: string) => {
    onTabChange?.(tabId);
  };
  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40">
        <div className="bg-surface-container-high dark:bg-surface-container-high backdrop-blur-sm">
          <div className="flex items-center justify-around h-20 px-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className="flex flex-col items-center justify-center w-16 h-16 group"
                >
                  <div
                    className={`relative flex items-center justify-center w-16 h-8 rounded-full transition-all duration-200 ${
                      isActive
                        ? 'bg-secondary-container dark:bg-secondary-container'
                        : 'group-hover:bg-secondary-container/40 dark:group-hover:bg-secondary-container/40'
                    }`}
                  >
                    <Icon
                      className={`h-6 w-6 transition-colors duration-200 ${
                        isActive
                          ? 'text-on-secondary-container dark:text-on-secondary-container'
                          : 'text-on-surface-variant dark:text-on-surface-variant'
                      }`}
                    />
                  </div>
                  <span
                    className={`text-xs font-medium mt-1 transition-colors duration-200 ${
                      isActive
                        ? 'text-on-surface dark:text-on-surface'
                        : 'text-on-surface-variant dark:text-on-surface-variant'
                    }`}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="hidden md:block fixed bottom-0 left-0 right-0 z-40">
        <div className="bg-surface-container-high dark:bg-surface-container-high backdrop-blur-sm border-t border-outline-variant dark:border-outline-variant">
          <div className="flex items-center justify-center h-16 px-6">
            <div className="flex items-center gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`flex items-center gap-3 px-6 py-2 rounded-full transition-all duration-200 min-w-fit ${
                      isActive
                        ? 'bg-secondary-container dark:bg-secondary-container'
                        : 'hover:bg-secondary-container/40 dark:hover:bg-secondary-container/40'
                    }`}
                  >
                    <Icon
                      className={`h-6 w-6 transition-colors duration-200 ${
                        isActive
                          ? 'text-on-secondary-container dark:text-on-secondary-container'
                          : 'text-on-surface-variant dark:text-on-surface-variant'
                      }`}
                    />
                    <span
                      className={`font-medium transition-colors duration-200 ${
                        isActive
                          ? 'text-on-secondary-container dark:text-on-secondary-container'
                          : 'text-on-surface-variant dark:text-on-surface-variant'
                      }`}
                    >
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}