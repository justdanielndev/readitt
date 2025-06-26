export interface UserStory {
  id: string;
  title: string;
  fandom: string;
  shareToken: string;
  isPrivate: boolean;
  isOwner: boolean;
  savedAt: string;
  lastAccessed: string;
}
const USER_STORIES_KEY = 'readitt_user_stories';
export function getUserStories(): UserStory[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(USER_STORIES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading user stories from localStorage:', error);
    return [];
  }
}
export function saveUserStory(story: Omit<UserStory, 'savedAt' | 'lastAccessed'>): void {
  if (typeof window === 'undefined') return;
  try {
    const stories = getUserStories();
    const existingIndex = stories.findIndex(s => s.id === story.id);
    const userStory: UserStory = {
      ...story,
      savedAt: existingIndex === -1 ? new Date().toISOString() : stories[existingIndex].savedAt,
      lastAccessed: new Date().toISOString()
    };
    if (existingIndex === -1) {
      stories.push(userStory);
    } else {
      stories[existingIndex] = userStory;
    }
    localStorage.setItem(USER_STORIES_KEY, JSON.stringify(stories));
  } catch (error) {
    console.error('Error saving user story to localStorage:', error);
  }
}
export function removeUserStory(storyId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const stories = getUserStories();
    const filteredStories = stories.filter(s => s.id !== storyId);
    localStorage.setItem(USER_STORIES_KEY, JSON.stringify(filteredStories));
  } catch (error) {
    console.error('Error removing user story from localStorage:', error);
  }
}
export function updateLastAccessed(storyId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const stories = getUserStories();
    const storyIndex = stories.findIndex(s => s.id === storyId);
    if (storyIndex !== -1) {
      stories[storyIndex].lastAccessed = new Date().toISOString();
      localStorage.setItem(USER_STORIES_KEY, JSON.stringify(stories));
    }
  } catch (error) {
    console.error('Error updating last accessed time:', error);
  }
}
export function isStoryOwned(storyId: string): boolean {
  if (typeof window === 'undefined') return false;
  const stories = getUserStories();
  const story = stories.find(s => s.id === storyId);
  return story?.isOwner ?? false;
}
export function getOwnedStories(): UserStory[] {
  return getUserStories().filter(story => story.isOwner);
}
export function getSavedStories(): UserStory[] {
  return getUserStories().filter(story => !story.isOwner);
}
export function clearAllUserStories(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(USER_STORIES_KEY);
  } catch (error) {
    console.error('Error clearing all user stories:', error);
  }
}
export function clearOwnedStories(): void {
  if (typeof window === 'undefined') return;
  try {
    const stories = getUserStories();
    const filteredStories = stories.filter(story => !story.isOwner);
    localStorage.setItem(USER_STORIES_KEY, JSON.stringify(filteredStories));
  } catch (error) {
    console.error('Error clearing owned stories:', error);
  }
}
export function clearSavedStories(): void {
  if (typeof window === 'undefined') return;
  try {
    const stories = getUserStories();
    const filteredStories = stories.filter(story => story.isOwner);
    localStorage.setItem(USER_STORIES_KEY, JSON.stringify(filteredStories));
  } catch (error) {
    console.error('Error clearing saved stories:', error);
  }
}