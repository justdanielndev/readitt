'use client';
import { useState, useEffect, useCallback } from 'react';
import { Globe, Loader2, Check, AlertCircle, Download, Sparkles } from 'lucide-react';
interface Language {
  code: string;
  name: string;
  native_name: string;
  flag_emoji: string;
  rtl: boolean;
  currency_code?: string;
  currency_symbol?: string;
}
interface TranslationStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  quality_score?: number;
  created_at?: string;
  error?: string;
}
interface TranslationSelectorProps {
  storyId: string;
  chapterNumber: number;
  currentLanguage: string;
  availableLanguages: string[];
  onLanguageChange: (language: string, translatedContent?: {title: string, content: string}) => void;
  onTranslationRequest?: (targetLanguage: string) => void;
  onTranslationError?: (error: string) => void;
}
export function TranslationSelector({
  storyId,
  chapterNumber,
  currentLanguage,
  availableLanguages,
  onLanguageChange,
  onTranslationRequest,
  onTranslationError
}: TranslationSelectorProps) {
  const [supportedLanguages, setSupportedLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [translatingTo, setTranslatingTo] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [translationProgress, setTranslationProgress] = useState<Record<string, TranslationStatus>>({});
  const [loadingContent, setLoadingContent] = useState(false);
  useEffect(() => {
    loadSupportedLanguages();
  }, []);
  const loadSupportedLanguages = async () => {
    try {
      const response = await fetch('/api/translations/languages');
      if (response.ok) {
        const data = await response.json();
        setSupportedLanguages(data.languages);
      }
    } catch (error) {
      console.error('Error loading supported languages:', error);
    } finally {
      setLoading(false);
    }
  };
  const loadTranslatedContent = useCallback(async (languageCode: string) => {
    setLoadingContent(true);
    try {
      const response = await fetch(
        `/api/translations/content?story_id=${storyId}&chapter_number=${chapterNumber}&target_language=${languageCode}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.translation) {
          onLanguageChange(languageCode, {
            title: data.translation.title,
            content: data.translation.content
          });
        } else {
          onTranslationError?.('Failed to load translated content');
        }
      } else {
        const errorData = await response.json();
        onTranslationError?.(errorData.error || 'Translation not available');
      }
    } catch (error) {
      console.error('Error loading translated content:', error);
      onTranslationError?.('Network error loading translation');
    } finally {
      setLoadingContent(false);
    }
  }, [storyId, chapterNumber, onLanguageChange, onTranslationError]);
  const handleLanguageSelect = async (languageCode: string) => {
    if (languageCode === currentLanguage) {
      setShowDropdown(false);
      return;
    }
    setShowDropdown(false);
    if (availableLanguages.includes(languageCode)) {
      await loadTranslatedContent(languageCode);
    } else {
      await requestTranslation(languageCode);
    }
  };
  const requestTranslation = async (languageCode: string) => {
    setTranslatingTo(languageCode);
    setTranslationProgress(prev => ({
      ...prev,
      [languageCode]: { status: 'pending' }
    }));
    try {
      const response = await fetch('/api/translations/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          story_id: storyId,
          chapter_number: chapterNumber,
          target_language: languageCode,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        onTranslationRequest?.(languageCode);
        setTranslationProgress(prev => ({
          ...prev,
          [languageCode]: { status: 'processing' }
        }));
        pollTranslationStatus(languageCode);
      } else {
        setTranslationProgress(prev => ({
          ...prev,
          [languageCode]: { status: 'failed', error: data.error }
        }));
        onTranslationError?.(data.error || 'Failed to request translation');
        setTranslatingTo(null);
      }
    } catch (error) {
      console.error('Error requesting translation:', error);
      setTranslationProgress(prev => ({
        ...prev,
        [languageCode]: { status: 'failed', error: 'Network error' }
      }));
      onTranslationError?.('Network error requesting translation');
      setTranslatingTo(null);
    }
  };
  const pollTranslationStatus = async (languageCode: string) => {
    const maxAttempts = 60;
    let attempts = 0;
    const poll = async () => {
      try {
        const response = await fetch(
          `/api/translations/status?story_id=${storyId}&chapter_number=${chapterNumber}&target_language=${languageCode}`
        );
        if (response.ok) {
          const data = await response.json();
          setTranslationProgress(prev => ({
            ...prev,
            [languageCode]: {
              status: data.status,
              quality_score: data.quality_score,
              created_at: data.created_at,
              error: data.error
            }
          }));
          if (data.status === 'completed') {
            setTranslatingTo(null);
            await loadTranslatedContent(languageCode);
            return;
          } else if (data.status === 'failed') {
            setTranslatingTo(null);
            onTranslationError?.(data.error || 'Translation failed');
            return;
          }
        }
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000); 
        } else {
          setTranslatingTo(null);
          setTranslationProgress(prev => ({
            ...prev,
            [languageCode]: { status: 'failed', error: 'Translation timed out' }
          }));
          onTranslationError?.('Translation timed out after 60 seconds');
        }
      } catch (error) {
        console.error('Error polling translation status:', error);
        setTranslatingTo(null);
        setTranslationProgress(prev => ({
          ...prev,
          [languageCode]: { status: 'failed', error: 'Network error during polling' }
        }));
        onTranslationError?.('Network error during translation');
      }
    };
    poll();
  };
  const getCurrentLanguage = () => {
    return supportedLanguages.find(lang => lang.code === currentLanguage);
  };
  const getLanguageDisplay = (lang: Language, isAvailable: boolean) => {
    const progress = translationProgress[lang.code];
    const isTranslating = translatingTo === lang.code;
    return (
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <span className="text-lg">{lang.flag_emoji}</span>
          <div>
            <div className="font-medium">{lang.native_name}</div>
            <div className="text-xs text-gray-500">{lang.name}</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isAvailable && !isTranslating && ( 
            <div className="flex items-center gap-1">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-xs text-green-600">Ready</span>
            </div>
          )}
          {isTranslating && (
            <div className="flex items-center gap-1">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              <span className="text-xs text-blue-600">
                {progress?.status === 'pending' ? 'Starting...' : 'Translating...'}
              </span>
            </div>
          )}
          {progress?.status === 'completed' && !isAvailable && (
            <div className="flex items-center gap-1">
              <Sparkles className="h-4 w-4 text-green-500" />
              <span className="text-xs text-green-600">Complete</span>
            </div>
          )}
          {progress?.status === 'failed' && (
            <div className="flex items-center gap-1">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-xs text-red-600">Failed</span>
            </div>
          )}
          {!isAvailable && !progress && !isTranslating && (
            <div className="flex items-center gap-1">
              <Download className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-400">Translate</span>
            </div>
          )}
          {progress?.quality_score && (
            <div className="text-xs text-gray-500 ml-1">
              {Math.round(progress.quality_score * 100)}%
            </div>
          )}
        </div>
      </div>
    );
  };
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading languages...</span>
      </div>
    );
  }
  const currentLang = getCurrentLanguage();
  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors ${
          loadingContent || translatingTo 
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 cursor-wait'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}
        disabled={loadingContent || translatingTo !== null}
      >
        <Globe className={`h-4 w-4 ${
          loadingContent || translatingTo 
            ? 'text-blue-600 dark:text-blue-400' 
            : 'text-gray-600 dark:text-gray-400'
        }`} />
        {currentLang ? (
          <div className="flex items-center gap-2">
            <span className="text-lg">{currentLang.flag_emoji}</span>
            <span className="text-sm font-medium">{currentLang.native_name}</span>
            {currentLang.rtl && (
              <span className="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">RTL</span>
            )}
          </div>
        ) : (
          <span className="text-sm">Select Language</span>
        )}
        {(loadingContent || translatingTo) && (
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
        )}
      </button>
      {showDropdown && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1 mb-2">
              Available Languages
            </div>
            {supportedLanguages
              .filter(lang => availableLanguages.includes(lang.code))
              .map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageSelect(lang.code)}
                  className={`w-full text-left p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    currentLanguage === lang.code ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  {getLanguageDisplay(lang, true)}
                </button>
              ))}
            {supportedLanguages.filter(lang => !availableLanguages.includes(lang.code)).length > 0 && (
              <>
                <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1 mb-2">
                  Request Translation
                </div>
                {supportedLanguages
                  .filter(lang => !availableLanguages.includes(lang.code))
                  .map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageSelect(lang.code)}
                      disabled={translatingTo === lang.code}
                      className="w-full text-left p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {getLanguageDisplay(lang, false)}
                    </button>
                  ))}
              </>
            )}
          </div>
        </div>
      )}
      {(translatingTo || loadingContent) && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 z-50">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            <div className="flex-1">
              <div className="text-sm font-medium text-blue-800 dark:text-blue-300">
                {loadingContent ? 'Loading translation...' : 'Translating chapter...'}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400">
                {loadingContent 
                  ? 'Fetching translated content'
                  : `Takes around 60s...`
                }
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}