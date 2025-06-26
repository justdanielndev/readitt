interface UserStory {
  id: string;
  title: string;
  fandom: string;
  author?: string;
  status: 'reading' | 'completed' | 'pending';
  currentChapter: number;
  totalChapters: number;
  lastRead: string;
  dateAdded: string;
}
interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  readingSpeed: 'slow' | 'normal' | 'fast';
  notifications: boolean;
  autoSave: boolean;
  show18PlusContent: boolean;
  appLanguage: string;
  readingLanguage: string;
}
interface UserContext {
  userId: string;
  username: string;
  avatar: string;
  stories: UserStory[];
  preferences: UserPreferences;
  customFandoms: any[];
  readingHistory: any[];
  createdAt: string;
  lastUpdated: string;
  aiContext: string;
}
const DEFAULT_USER_CONTEXT: UserContext = {
  userId: '',
  username: 'Anonymous Reader',
  avatar: '',
  stories: [],
  preferences: {
    theme: 'auto',
    readingSpeed: 'normal',
    notifications: true,
    autoSave: true,
    show18PlusContent: false,
    appLanguage: 'en',
    readingLanguage: 'en'
  },
  customFandoms: [],
  readingHistory: [],
  createdAt: new Date().toISOString(),
  lastUpdated: new Date().toISOString(),
  aiContext: ''
};
class UserContextManager {
  private static instance: UserContextManager;
  private userContext: UserContext;
  private storageKey = 'readitt_user_context';
  private constructor() {
    this.userContext = this.loadFromStorage();
  }
  static getInstance(): UserContextManager {
    if (!UserContextManager.instance) {
      UserContextManager.instance = new UserContextManager();
    }
    return UserContextManager.instance;
  }
  private loadFromStorage(): UserContext {
    console.log('🔍 Loading user context from storage...');
    if (typeof window === 'undefined') return DEFAULT_USER_CONTEXT;
    try {
      const stored = localStorage.getItem(this.storageKey);
      console.log('📁 Stored user context:', stored ? 'Found' : 'Not found');
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('📋 Parsed user context:', parsed);
        if (parsed.userId && this.isValidUUID(parsed.userId)) {
          console.log('✅ Valid UUID found:', parsed.userId);
          this.registerUserIdAsync(parsed.userId);
          return { ...DEFAULT_USER_CONTEXT, ...parsed };
        } else {
          console.log('❌ Invalid or missing UUID, migrating user...', parsed.userId);
          const newUserId = this.generateUniqueUserId();
          const migratedContext = {
            ...DEFAULT_USER_CONTEXT,
            ...parsed,
            userId: newUserId
          };
          console.log('🔄 Migrated to new UUID:', newUserId);
          this.saveToStorage(migratedContext);
          this.registerUserIdAsync(newUserId);
          return migratedContext;
        }
      }
    } catch (error) {
      console.error('❌ Error loading user context:', error);
    }
    const newUserId = this.generateUniqueUserId();
    console.log('🆕 Creating new user context with UUID:', newUserId);
    const newContext = {
      ...DEFAULT_USER_CONTEXT,
      userId: newUserId
    };
    this.saveToStorage(newContext);
    this.registerUserIdAsync(newUserId);
    return newContext;
  }
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
  private generateUniqueUserId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  private async registerUserIdAsync(userId: string): Promise<void> {
    console.log('📝 Registering user ID:', userId);
    try {
      const response = await fetch('/api/register-user-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      console.log('📡 Register response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to register user ID:', response.status, errorText);
      } else {
        const result = await response.json();
        console.log('✅ User ID registration result:', result);
      }
    } catch (error) {
      console.error('❌ Error registering user ID:', error);
    }
  }
  private saveToStorage(context: UserContext): void {
    if (typeof window === 'undefined') return;
    try {
      context.lastUpdated = new Date().toISOString();
      localStorage.setItem(this.storageKey, JSON.stringify(context));
    } catch (error) {
      console.error('Error saving user context:', error);
    }
  }
  getUserContext(): UserContext {
    return { ...this.userContext };
  }
  updateUserContext(updates: Partial<UserContext>): void {
    this.userContext = { ...this.userContext, ...updates };
    this.saveToStorage(this.userContext);
  }
  addStory(story: Omit<UserStory, 'dateAdded' | 'lastRead'>): void {
    const newStory: UserStory = {
      ...story,
      dateAdded: new Date().toISOString(),
      lastRead: new Date().toISOString()
    };
    this.userContext.stories = [newStory, ...this.userContext.stories];
    this.saveToStorage(this.userContext);
  }
  updateStoryProgress(storyId: string, currentChapter: number): void {
    const storyIndex = this.userContext.stories.findIndex(s => s.id === storyId);
    if (storyIndex !== -1) {
      this.userContext.stories[storyIndex].currentChapter = currentChapter;
      this.userContext.stories[storyIndex].lastRead = new Date().toISOString();
      const story = this.userContext.stories[storyIndex];
      if (currentChapter >= story.totalChapters) {
        story.status = 'completed';
      } else if (currentChapter > 0) {
        story.status = 'reading';
      }
      this.saveToStorage(this.userContext);
    }
  }
  removeStory(storyId: string): void {
    this.userContext.stories = this.userContext.stories.filter(s => s.id !== storyId);
    this.saveToStorage(this.userContext);
  }
  updatePreferences(preferences: Partial<UserPreferences>): void {
    this.userContext.preferences = { ...this.userContext.preferences, ...preferences };
    this.saveToStorage(this.userContext);
  }
  updateAIContext(aiContext: string): void {
    this.userContext.aiContext = aiContext;
    this.saveToStorage(this.userContext);
  }
  async exportToQR(): Promise<string> {
    const exportData = {
      ...this.userContext,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    try {
      const response = await fetch('/api/export-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportData)
      });
      const result = await response.json();
      if (result.success) {
        return result.exportId;
      } else {
        throw new Error(result.error || 'Failed to create export');
      }
    } catch (error) {
      console.error('Error creating export:', error);
      return JSON.stringify(exportData);
    }
  }
  async importFromQR(qrData: string): Promise<boolean> {
    try {
      let importedData;
      if (qrData.length === 36 && qrData.includes('-')) {
        try {
          const response = await fetch(`/api/import-data/${qrData}`);
          const result = await response.json();
          if (result.success) {
            importedData = result.userData;
          } else {
            throw new Error(result.error || 'Failed to fetch import data');
          }
        } catch (apiError) {
          console.error('API import failed, trying direct JSON parse:', apiError);
          importedData = JSON.parse(qrData);
        }
      } else {
        importedData = JSON.parse(qrData);
      }
      if (!importedData.userId || !importedData.stories) {
        throw new Error('Invalid user context data');
      }
      const mergedStories = [...this.userContext.stories];
      importedData.stories.forEach((importedStory: UserStory) => {
        const existingIndex = mergedStories.findIndex(s => s.id === importedStory.id);
        if (existingIndex !== -1) {
          if (new Date(importedStory.lastRead) > new Date(mergedStories[existingIndex].lastRead)) {
            mergedStories[existingIndex] = importedStory;
          }
        } else {
          mergedStories.push(importedStory);
        }
      });
      this.userContext = {
        ...importedData,
        stories: mergedStories,
        lastUpdated: new Date().toISOString()
      };
      this.saveToStorage(this.userContext);
      return true;
    } catch (error) {
      console.error('Error importing user context:', error);
      return false;
    }
  }
  getReadingStats() {
    const stories = this.userContext.stories;
    return {
      totalStories: stories.length,
      completedStories: stories.filter(s => s.status === 'completed').length,
      currentlyReading: stories.filter(s => s.status === 'reading').length,
      pendingStories: stories.filter(s => s.status === 'pending').length,
      totalChaptersRead: stories.reduce((total, story) => total + story.currentChapter, 0),
      favoriteGenres: this.getMostReadGenres()
    };
  }
  private getMostReadGenres(): string[] {
    const genreCount: { [key: string]: number } = {};
    this.userContext.stories.forEach(story => {
      if (genreCount[story.fandom]) {
        genreCount[story.fandom]++;
      } else {
        genreCount[story.fandom] = 1;
      }
    });
    return Object.entries(genreCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([genre]) => genre);
  }
  clearAllStories(): void {
    this.userContext.stories = [];
    this.saveToStorage(this.userContext);
  }
  clearReadingHistory(): void {
    this.userContext.readingHistory = [];
    this.saveToStorage(this.userContext);
  }
  clearAllData(): void {
    this.userContext.stories = [];
    this.userContext.readingHistory = [];
    this.userContext.customFandoms = [];
    this.saveToStorage(this.userContext);
  }
  getEffectiveReadingLanguage(): string {
    const { readingLanguage } = this.userContext.preferences;
    return readingLanguage;
  }
  updateLanguagePreferences(appLanguage?: string, readingLanguage?: string): void {
    const updates: Partial<UserPreferences> = {};
    if (appLanguage) {
      updates.appLanguage = appLanguage;
    }
    if (readingLanguage !== undefined) {
      updates.readingLanguage = readingLanguage;
    }
    this.updatePreferences(updates);
  }
}
export { UserContextManager, type UserContext, type UserStory, type UserPreferences };