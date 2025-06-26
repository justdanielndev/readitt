interface GDPRConsent {
  analyticsConsent: boolean;
  promptAnalysisConsent: boolean;
  storyMetadataConsent: boolean;
  consentTimestamp: string;
  consentVersion: string;
}
class GDPRCompliantAnalytics {
  private static instance: GDPRCompliantAnalytics;
  private readonly CONSENT_VERSION = '1.0';
  private readonly RESEARCH_ID_KEY = 'readitt_research_id';
  private readonly CONSENT_KEY = 'readitt_gdpr_consent';
  private constructor() {}
  static getInstance(): GDPRCompliantAnalytics {
    if (!GDPRCompliantAnalytics.instance) {
      GDPRCompliantAnalytics.instance = new GDPRCompliantAnalytics();
    }
    return GDPRCompliantAnalytics.instance;
  }
  getAnonymousResearchId(): string {
    let researchId = localStorage.getItem(this.RESEARCH_ID_KEY);
    if (!researchId) {
      researchId = this.generateSecureUUID();
      localStorage.setItem(this.RESEARCH_ID_KEY, researchId);
      console.log('🔒 [GDPR] Generated new anonymous research ID');
    }
    return researchId;
  }
  hasValidConsent(): boolean {
    const consent = this.getStoredConsent();
    if (!consent) return false;
    if (consent.consentVersion !== this.CONSENT_VERSION) return false;
    return consent.analyticsConsent && 
           consent.promptAnalysisConsent && 
           consent.storyMetadataConsent;
  }
  recordConsent(): void {
    const fullConsent: GDPRConsent = {
      analyticsConsent: true,
      promptAnalysisConsent: true,
      storyMetadataConsent: true,
      consentTimestamp: new Date().toISOString(),
      consentVersion: this.CONSENT_VERSION,
    };
    localStorage.setItem(this.CONSENT_KEY, JSON.stringify(fullConsent));
    console.log('🔒 [GDPR] User consent recorded (full research participation)');
  }
  async withdrawConsent(): Promise<void> {
    const researchId = this.getAnonymousResearchId();
    localStorage.removeItem(this.RESEARCH_ID_KEY);
    localStorage.removeItem(this.CONSENT_KEY);
    this.clearLocalResearchData();
    await this.requestDataDeletion(researchId);
    console.log('🔒 [GDPR] User consent withdrawn, data deletion requested');
  }
  getConsentStatus(): GDPRConsent | null {
    return this.getStoredConsent();
  }
  canCollectData(type: 'analytics' | 'prompts' | 'metadata'): boolean {
    const consent = this.getStoredConsent();
    if (!consent) return false;
    switch (type) {
      case 'analytics':
        return consent.analyticsConsent;
      case 'prompts':
        return consent.promptAnalysisConsent;
      case 'metadata':
        return consent.storyMetadataConsent;
      default:
        return false;
    }
  }
  anonymizeForResearch(data: any): any {
    if (!this.hasValidConsent()) {
      console.log('🔒 [GDPR] No valid consent, blocking data collection');
      return null;
    }
    const anonymized = {
      ...data,
      userId: this.getAnonymousResearchId(),
      userAgent: undefined,
      ipAddress: undefined,
      deviceId: undefined,
      anonymizedAt: new Date().toISOString(),
    };
    console.log('🔒 [GDPR] Data anonymized for research');
    return anonymized;
  }
  private generateSecureUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(16);
      crypto.getRandomValues(array);
      const hex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${(parseInt(hex.slice(16, 17), 16) & 0x3 | 0x8).toString(16)}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  private getStoredConsent(): GDPRConsent | null {
    try {
      const stored = localStorage.getItem(this.CONSENT_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('🔒 [GDPR] Error reading consent:', error);
      return null;
    }
  }
  private clearLocalResearchData(): void {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('prompt_count_') || 
          key?.startsWith('research_') || 
          key?.startsWith('analytics_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    sessionStorage.removeItem('research-session-id');
  }
  private async requestDataDeletion(researchId: string): Promise<void> {
    try {
      await fetch('/api/research/delete-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ researchId }),
      });
    } catch (error) {
      console.error('🔒 [GDPR] Error requesting data deletion:', error);
    }
  }
}
export { GDPRCompliantAnalytics, type GDPRConsent };