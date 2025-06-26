interface ReadingAnalytics {
  userId: string; 
  storyId: string;
  storyTitle: string;
  storyFandom: string;
  contentWarnings: string[];
  ageRating: string;
  isOwnStory: boolean;
  chapterNumber: number;
  chapterTitle: string;
  startTime: number;
  endTime?: number;
  scrollSpeed: number;
  completionPercentage: number;
  rating?: 'up' | 'down';
  readingDuration: number;
  timestamp: string;
  pauseCount: number;
  backtrackCount: number;
  avgReadingSpeed: number; 
  interactionCount: number; 
  storyGenre: string[];
  chapterWordCount: number;
  sessionType: 'first_read' | 'reread' | 'continuation';
}
class ResearchAnalytics {
  private static instance: ResearchAnalytics;
  private currentSession: Partial<ReadingAnalytics> | null = null;
  private scrollPositions: number[] = [];
  private startTime: number = 0;
  private lastScrollTime: number = 0;
  private pauseCount: number = 0;
  private backtrackCount: number = 0;
  private interactionCount: number = 0;
  private lastScrollY: number = 0;
  private pauseStartTime: number = 0;
  private totalPauseTime: number = 0;
  private constructor() {}
  static getInstance(): ResearchAnalytics {
    if (!ResearchAnalytics.instance) {
      ResearchAnalytics.instance = new ResearchAnalytics();
    }
    return ResearchAnalytics.instance;
  }
  async startReadingSession(
    userId: string,
    story: {
      id: string;
      title: string;
      fandom: string;
      contentWarnings?: string[];
      ageRating?: string;
      author?: string;
      authorUserId?: string;
      genre?: string[];
    },
    chapterNumber: number,
    chapterTitle: string,
    chapterContent?: string
  ) {
    this.startTime = Date.now();
    this.scrollPositions = [];
    this.lastScrollTime = this.startTime;
    this.pauseCount = 0;
    this.backtrackCount = 0;
    this.interactionCount = 0;
    this.lastScrollY = 0;
    this.totalPauseTime = 0;
    const isOwnStory = await this.checkIfUserOwnsStory(story.id);
    const chapterWordCount = chapterContent ? this.countWords(chapterContent) : 0;
    const sessionType = 'first_read' as const; 
    this.currentSession = {
      userId,
      storyId: story.id,
      storyTitle: story.title,
      storyFandom: story.fandom,
      contentWarnings: story.contentWarnings || [],
      ageRating: story.ageRating || 'all-ages',
      isOwnStory,
      chapterNumber,
      chapterTitle,
      startTime: this.startTime,
      timestamp: new Date().toISOString(),
      pauseCount: 0,
      backtrackCount: 0,
      avgReadingSpeed: 0,
      interactionCount: 0,
      storyGenre: story.genre || [],
      chapterWordCount,
      sessionType,
    };
  }
  trackScrollEvent(scrollY: number, documentHeight: number, windowHeight: number) {
    if (!this.currentSession) return;
    const currentTime = Date.now();
    const timeDiff = currentTime - this.lastScrollTime;
    if (timeDiff > 3000 && this.pauseStartTime === 0) {
      this.pauseStartTime = this.lastScrollTime;
      this.pauseCount++;
    } else if (timeDiff <= 3000 && this.pauseStartTime > 0) {
      this.totalPauseTime += currentTime - this.pauseStartTime;
      this.pauseStartTime = 0;
    }
    if (scrollY < this.lastScrollY - 100) {
      this.backtrackCount++;
    }
    if (timeDiff > 0) {
      const scrollDistance = Math.abs(scrollY - (this.scrollPositions[this.scrollPositions.length - 1] || 0));
      const scrollSpeed = scrollDistance / timeDiff; 
      this.scrollPositions.push(scrollY);
      this.currentSession.scrollSpeed = scrollSpeed;
      const maxScroll = documentHeight - windowHeight;
      const completionPercentage = maxScroll > 0 ? Math.min(100, (scrollY / maxScroll) * 100) : 0;
      this.currentSession.completionPercentage = completionPercentage;
      this.currentSession.pauseCount = this.pauseCount;
      this.currentSession.backtrackCount = this.backtrackCount;
      this.currentSession.interactionCount = this.interactionCount;
      if (this.currentSession.chapterWordCount && this.currentSession.completionPercentage > 0) {
        const wordsRead = (this.currentSession.chapterWordCount * this.currentSession.completionPercentage) / 100;
        const minutesElapsed = (currentTime - this.startTime - this.totalPauseTime) / 60000;
        this.currentSession.avgReadingSpeed = minutesElapsed > 0 ? wordsRead / minutesElapsed : 0;
      }
    }
    this.lastScrollY = scrollY;
    this.lastScrollTime = currentTime;
  }
  trackInteraction() {
    this.interactionCount++;
    if (this.currentSession) {
      this.currentSession.interactionCount = this.interactionCount;
    }
  }
  setRating(rating: 'up' | 'down') {
    if (this.currentSession) {
      this.currentSession.rating = rating;
    }
  }
  async endReadingSession() {
    if (!this.currentSession) {
      console.log('📊 [RESEARCH] No active session to end');
      return;
    }
    const endTime = Date.now();
    const readingDuration = endTime - this.startTime;
    if (readingDuration < 1000) { 
      console.log('📊 [RESEARCH] Session too short, not logging');
      this.resetSession();
      return;
    }
    const avgScrollSpeed = this.scrollPositions.length > 1 
      ? this.scrollPositions.reduce((sum, pos, index) => {
          if (index === 0) return sum;
          return sum + Math.abs(pos - this.scrollPositions[index - 1]);
        }, 0) / (this.scrollPositions.length - 1)
      : 0;
    const finalData: ReadingAnalytics = {
      ...this.currentSession as ReadingAnalytics,
      endTime,
      readingDuration,
      scrollSpeed: avgScrollSpeed,
    };
    console.log('📊 [RESEARCH] Reading session completed:', {
      chapter: finalData.chapterNumber,
      duration: finalData.readingDuration,
      completion: finalData.completionPercentage
    });
    try {
      await this.sendToAirtable(finalData);
    } catch (error) {
      console.error('❌ [RESEARCH] Failed to send analytics:', error);
    }
    this.resetSession();
  }
  private resetSession() {
    this.currentSession = null;
    this.scrollPositions = [];
    this.startTime = 0;
    this.pauseCount = 0;
    this.backtrackCount = 0;
    this.interactionCount = 0;
    this.lastScrollY = 0;
    this.pauseStartTime = 0;
    this.totalPauseTime = 0;
  }
  private async sendToAirtable(data: ReadingAnalytics) {
    try {
      const { GDPRCompliantAnalytics } = await import('@/lib/gdprCompliantAnalytics');
      const gdpr = GDPRCompliantAnalytics.getInstance();
      const anonymizedData = gdpr.anonymizeForResearch(data);
      if (!anonymizedData) {
        console.log('🔒 [RESEARCH] Data collection blocked - no valid consent');
        return;
      }
      const response = await fetch('/api/research/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(anonymizedData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      console.log('✅ [RESEARCH] Analytics sent successfully (GDPR compliant)');
    } catch (error) {
      console.error('❌ [RESEARCH] Error sending analytics:', error);
    }
  }
  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }
  private async checkIfUserOwnsStory(storyId: string): Promise<boolean> {
    try {
      const { UserContextManager } = await import('@/lib/userContext');
      const { supabase } = await import('@/lib/supabase');
      const userManager = UserContextManager.getInstance();
      const userContext = userManager.getUserContext();
      if (!userContext.userId) {
        return false;
      }
      const { data, error } = await supabase
        .from('stories')
        .select('id')
        .eq('id', storyId)
        .eq('author_user_id', userContext.userId)
        .single();
      if (error) {
        console.log('Story ownership check failed:', error.message);
        return false;
      }
      return !!data; 
    } catch (error) {
      console.error('Error checking story ownership:', error);
      return false;
    }
  }
}
export { ResearchAnalytics, type ReadingAnalytics };