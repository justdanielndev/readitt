interface StoryResearchData {
  userId: string;
  storyId: string;
  storyType: 'public_story' | 'private_story' | 'one_off';
  contentWarnings: string[];
  model: string; 
  characters?: string;
  description?: string;
  fandom?: string;
  genre?: string[];
  ageRating?: string;
  isPrivate: boolean;
  timestamp: string;
  userLanguage: string;
  sessionId: string;
}
class StoryResearchAnalytics {
  private static instance: StoryResearchAnalytics;
  private constructor() {}
  static getInstance(): StoryResearchAnalytics {
    if (!StoryResearchAnalytics.instance) {
      StoryResearchAnalytics.instance = new StoryResearchAnalytics();
    }
    return StoryResearchAnalytics.instance;
  }
  async logStoryCreation(data: {
    userId: string;
    storyId: string;
    storyType: 'public_story' | 'private_story' | 'one_off';
    contentWarnings: string[];
    model: string; 
    characters?: string;
    description?: string;
    fandom?: string;
    genre?: string[];
    ageRating?: string;
    isPrivate: boolean;
  }) {
    const researchData: StoryResearchData = {
      ...data,
      timestamp: new Date().toISOString(),
      userLanguage: navigator.language || 'en',
      sessionId: this.getSessionId(),
    };
    console.log('📚 [STORY RESEARCH] Logging story creation:', {
      storyType: researchData.storyType,
      isPrivate: researchData.isPrivate,
      hasMetadata: data.storyType !== 'one_off',
      model: researchData.model
    });
    try {
      await this.sendToAirtable(researchData);
    } catch (error) {
      console.error('❌ [STORY RESEARCH] Failed to send analytics:', error);
    }
  }
  private async sendToAirtable(data: StoryResearchData) {
    try {
      const { GDPRCompliantAnalytics } = await import('@/lib/gdprCompliantAnalytics');
      const gdpr = GDPRCompliantAnalytics.getInstance();
      const anonymizedData = gdpr.anonymizeForResearch(data);
      if (!anonymizedData) {
        console.log('🔒 [STORY RESEARCH] Data collection blocked - no valid consent');
        return;
      }
      const response = await fetch('/api/research/story-analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(anonymizedData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      console.log('✅ [STORY RESEARCH] Story analytics sent successfully (GDPR compliant)');
    } catch (error) {
      console.error('❌ [STORY RESEARCH] Error sending story analytics:', error);
    }
  }
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('research-session-id');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      sessionStorage.setItem('research-session-id', sessionId);
    }
    return sessionId;
  }
}
export { StoryResearchAnalytics, type StoryResearchData };