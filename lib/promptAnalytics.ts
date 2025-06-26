interface PromptEvolution {
  userId: string;
  promptNumber: number; 
  promptType: 'story_creation' | 'one_off' | 'chapter_rating' | 'translation_request' | 'comment';
  complexityScore: number; 
  coherenceScore: number; 
  creativityScore: number; 
  lazinessIndicators: string[];
  aiDependencyLevel: number; 
  originalityScore: number; 
  effortScore: number; 
  repetitivenessScore: number; 
  timestamp: string;
  sessionId: string;
}
class PromptAnalytics {
  private static instance: PromptAnalytics;
  private constructor() {}
  static getInstance(): PromptAnalytics {
    if (!PromptAnalytics.instance) {
      PromptAnalytics.instance = new PromptAnalytics();
    }
    return PromptAnalytics.instance;
  }
  async analyzePrompt(data: {
    userId: string;
    promptType: 'story_creation' | 'one_off' | 'chapter_rating' | 'translation_request' | 'comment';
    promptContent: {
      description?: string;
      characters?: string;
      topics?: string;
      themes?: string;
      rating?: string;
      reasons?: string[];
      comments?: string;
      [key: string]: any;
    };
  }) {
    console.log('🔍 [PROMPT ANALYTICS] Analyzing prompt:', {
      type: data.promptType,
      userId: data.userId.slice(0, 8) + '...',
    });
    try {
      const promptNumber = await this.getUserPromptCount(data.userId);
      const analysis = await this.analyzeWithClaude(data.promptContent, data.promptType);
      const promptEvolution: PromptEvolution = {
        userId: data.userId,
        promptNumber: promptNumber + 1,
        promptType: data.promptType,
        ...analysis,
        timestamp: new Date().toISOString(),
        sessionId: this.getSessionId(),
      };
      await this.sendToAirtable(promptEvolution);
      await this.incrementUserPromptCount(data.userId);
    } catch (error) {
      console.error('❌ [PROMPT ANALYTICS] Analysis failed:', error);
    }
  }
  private async analyzeWithClaude(promptContent: any, promptType: string): Promise<{
    complexityScore: number;
    coherenceScore: number;
    creativityScore: number;
    lazinessIndicators: string[];
    aiDependencyLevel: number;
    originalityScore: number;
    effortScore: number;
    repetitivenessScore: number;
  }> {
    const analysisPrompt = this.buildAnalysisPrompt(promptContent, promptType);
    const response = await fetch('/api/research/analyze-prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: analysisPrompt,
        promptType: promptType,
      }),
    });
    if (!response.ok) {
      throw new Error(`Analysis failed: ${response.status}`);
    }
    const result = await response.json();
    return result.analysis;
  }
  private buildAnalysisPrompt(promptContent: any, promptType: string): string {
    const contentText = this.extractTextFromPrompt(promptContent);
    return `Analyze this user prompt for research purposes. Rate each aspect 0-10 and identify patterns:
PROMPT TYPE: ${promptType}
CONTENT: ${contentText}
Rate these aspects (0-10):
1. COMPLEXITY: Depth, detail, sophistication
2. COHERENCE: Logical flow, clarity, structure
3. CREATIVITY: Originality, imagination, uniqueness
4. AI_DEPENDENCY: Reliance on AI suggestions/templates (higher = more dependent)
5. ORIGINALITY: Fresh ideas vs cliches/repetition
6. EFFORT: Time/thought invested (based on detail/depth)
7. REPETITIVENESS: Similar to common patterns (higher = more repetitive)
LAZINESS INDICATORS: List specific signs of low effort:
- Generic descriptions
- Minimal detail
- Copy-paste patterns
- Single word responses
- etc.
Respond in JSON format:
{
  "complexityScore": 0-10,
  "coherenceScore": 0-10,
  "creativityScore": 0-10,
  "aiDependencyLevel": 0-10,
  "originalityScore": 0-10,
  "effortScore": 0-10,
  "repetitivenessScore": 0-10,
  "lazinessIndicators": ["indicator1", "indicator2"]
}`;
  }
  private extractTextFromPrompt(promptContent: any): string {
    const textParts: string[] = [];
    if (promptContent.description) textParts.push(`Description: ${promptContent.description}`);
    if (promptContent.characters) textParts.push(`Characters: ${promptContent.characters}`);
    if (promptContent.topics) textParts.push(`Topics: ${promptContent.topics}`);
    if (promptContent.themes) textParts.push(`Themes: ${promptContent.themes}`);
    if (promptContent.rating) textParts.push(`Rating: ${promptContent.rating}`);
    if (promptContent.reasons) textParts.push(`Reasons: ${promptContent.reasons.join(', ')}`);
    if (promptContent.comments) textParts.push(`Comment: ${promptContent.comments}`);
    Object.entries(promptContent).forEach(([key, value]) => {
      if (!['description', 'characters', 'topics', 'themes', 'rating', 'reasons', 'comments'].includes(key) && value) {
        textParts.push(`${key}: ${value}`);
      }
    });
    return textParts.join('\n');
  }
  private async sendToAirtable(data: PromptEvolution) {
    try {
      const { GDPRCompliantAnalytics } = await import('@/lib/gdprCompliantAnalytics');
      const gdpr = GDPRCompliantAnalytics.getInstance();
      const anonymizedData = gdpr.anonymizeForResearch(data);
      if (!anonymizedData) {
        console.log('🔒 [PROMPT ANALYTICS] Data collection blocked - no valid consent');
        return;
      }
      await fetch('/api/research/prompt-analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(anonymizedData),
      });
      console.log('✅ [PROMPT ANALYTICS] Analysis sent to Airtable (GDPR compliant)');
    } catch (error) {
      console.error('❌ [PROMPT ANALYTICS] Failed to send to Airtable:', error);
    }
  }
  private async getUserPromptCount(userId: string): Promise<number> {
    const stored = localStorage.getItem(`prompt_count_${userId}`);
    return stored ? parseInt(stored) : 0;
  }
  private async incrementUserPromptCount(userId: string): Promise<void> {
    const current = await this.getUserPromptCount(userId);
    localStorage.setItem(`prompt_count_${userId}`, (current + 1).toString());
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
export { PromptAnalytics, type PromptEvolution };