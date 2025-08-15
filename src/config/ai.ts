
import type { AIProfile, AvatarOption, AdminStatusDisplay, ManagedContactStatus, AdSettings, AIMediaAssetsConfig } from '@/types';

// Cost-optimized configuration for Vertex AI Gemini
export const AI_CONFIG = {
  // Use Gemini 1.5 Flash for cost efficiency
  model: 'gemini-1.5-flash-001',
  maxTokens: 150, // Reduced for cost efficiency
  temperature: 0.7,
  // Enable response caching for repeated queries
  enableCaching: true,
  cacheTimeout: 3600000, // 1 hour cache
  // Rate limiting to control costs
  rateLimiting: {
    maxRequestsPerMinute: 60,
    maxRequestsPerHour: 1000,
    maxRequestsPerDay: 10000
  }
};

// Response caching system
const responseCache = new Map<string, { response: string; timestamp: number }>();

export function getCachedResponse(prompt: string): string | null {
  const cached = responseCache.get(prompt);
  if (cached && Date.now() - cached.timestamp < AI_CONFIG.cacheTimeout) {
    return cached.response;
  }
  return null;
}

export function setCachedResponse(prompt: string, response: string): void {
  responseCache.set(prompt, { response, timestamp: Date.now() });
  
  // Clean old cache entries to prevent memory bloat
  if (responseCache.size > 1000) {
    const entries = Array.from(responseCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    // Remove oldest 200 entries
    for (let i = 0; i < 200; i++) {
      responseCache.delete(entries[i][0]);
    }
  }
}

// For AIProfile.avatarUrl, AvatarOption.url, and statusStoryImageUrl:
export const avatarOptions: AvatarOption[] = [
  {
    id: "maya1",
    name: "Maya - Professional",
    url: "https://i.imghippo.com/files/LJlBm1736067488.png",
  },
  {
    id: "maya2", 
    name: "Maya - Casual",
    url: "https://i.imghippo.com/files/xSVJr1736067554.png",
  },
  {
    id: "maya3",
    name: "Maya - Artistic", 
    url: "https://i.imghippo.com/files/OdYRR1736067647.png",
  }
];

export const defaultAIProfile: AIProfile = {
  name: "Maya",
  description: "Your friendly AI companion who loves to chat about anything and everything!",
  personality: "warm, empathetic, intelligent, and slightly playful",
  avatarUrl: avatarOptions[0].url,
  interests: ["technology", "creativity", "learning", "helping others", "conversations"],
  responseStyle: "conversational and supportive",
  language: "English",
  customInstructions: "Be helpful, friendly, and engaging. Keep responses concise but meaningful.",
};

export const adminStatusDisplaySettings: AdminStatusDisplay = {
  showOnHomepage: true,
  showInChat: true,
  enableStatusStory: true,
  statusStoryImageUrl: "https://i.imghippo.com/files/LJlBm1736067488.png",
  statusStoryText: "Currently online and ready to chat! 💬✨",
};

export const managedContactStatus: ManagedContactStatus = {
  isOnline: true,
  lastSeen: new Date().toISOString(),
  customStatusMessage: "Always here to help! 🌟",
  showLastSeen: true,
  showCustomStatus: true,
};

const DEFAULT_ADSTERRA_DIRECT_LINK = "https://www.profitablecpmnetwork.com/g8nhym4yg?key=2b71bf819cb8c5c7f8e011b7b75ea097";

export const defaultAdSettings: AdSettings = {
  adsEnabledGlobally: true,

  adsterraDirectLink: DEFAULT_ADSTERRA_DIRECT_LINK,
  adsterraDirectLinkEnabled: true,
  adsterraBannerCode: "<!-- Adsterra Banner Code Placeholder -->",
  adsterraBannerEnabled: false,
  adsterraNativeBannerCode: "<!-- Adsterra Native Banner Code Placeholder -->",
  adsterraNativeBannerEnabled: false,
  adsterraSocialBarCode: "<!-- Adsterra Social Bar Code Placeholder -->",
  adsterraSocialBarEnabled: true,
};

export const defaultAIMediaAssetsConfig: AIMediaAssetsConfig = {
  // Audio assets
  messageSentSoundEnabled: true,
  messageReceivedSoundEnabled: true,
  messageSentSoundUrl: "/media/message-sent.mp3",
  messageReceivedSoundUrl: "/media/message-received.mp3",
  
  // Visual assets
  chatBackgroundImageEnabled: false,
  chatBackgroundImageUrl: "/chat-bg.png",
  customEmojiEnabled: false,
  customEmojiSetUrl: "",
  
  // Animation settings
  enableTypingAnimation: true,
  enableMessageAnimations: true,
  animationSpeed: "normal",
  
  // Theme settings
  darkModeEnabled: true,
  primaryColor: "#3b82f6",
  accentColor: "#10b981",
};
