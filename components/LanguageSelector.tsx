'use client';
import { useState, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
interface Language {
  code: string;
  name: string;
  native_name: string;
  flag_emoji: string;
  rtl: boolean;
}
interface LanguageSelectorProps {
  value: string;
  onChange: (languageCode: string) => void;
  label: string;
  disabled?: boolean;
  className?: string;
}
export function LanguageSelector({
  value,
  onChange,
  label,
  disabled = false,
  className = ''
}: LanguageSelectorProps) {
  const [supportedLanguages, setSupportedLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
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
  const getSelectedLanguage = () => {
    return supportedLanguages.find(lang => lang.code === value) || {
      code: 'en',
      name: 'English',
      native_name: 'English',
      flag_emoji: '🇺🇸',
      rtl: false
    };
  };
  const handleSelect = (languageCode: string) => {
    onChange(languageCode);
    setShowDropdown(false);
  };
  const selectedLang = getSelectedLanguage();
  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Globe className="h-4 w-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500">Loading languages...</span>
      </div>
    );
  }
  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <div className="relative">
        <button
          onClick={() => !disabled && setShowDropdown(!showDropdown)}
          disabled={disabled}
          className={`w-full flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors ${
            disabled 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{selectedLang.flag_emoji}</span>
            <div className="text-left">
              <div className="font-medium text-gray-900 dark:text-white">
                {selectedLang.native_name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {selectedLang.name}
              </div>
            </div>
          </div>
          <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${
            showDropdown ? 'rotate-180' : ''
          }`} />
        </button>
        {showDropdown && !disabled && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
            <div className="p-1">
              {supportedLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full text-left p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    value === lang.code ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{lang.flag_emoji}</span>
                      <div>
                        <div className="font-medium">{lang.native_name}</div>
                        <div className="text-xs text-gray-500">{lang.name}</div>
                      </div>
                    </div>
                    {value === lang.code && (
                      <Check className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}