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

// Export with alternative name for compatibility
export const availableAvatars = avatarOptions;

export const defaultAIProfile: AIProfile = {
  name: "Maya",
  description: "Your friendly AI companion who loves to chat about anything and everything!",
  personality: "warm, empathetic, intelligent, and slightly playful",
  avatarUrl: "https://i.imghippo.com/files/LJlBm1736067488.png",
  interests: [
    "technology",
    "creativity",
    "learning",
    "helping others",
    "conversations"
  ],
  responseStyle: "conversational and supportive",
  language: "English",
  customInstructions: "Be helpful, friendly, and engaging. Keep responses concise but meaningful."
};

// Admin status display configuration
export const defaultAdminStatusDisplay: AdminStatusDisplay = {
  id: "admin-status-001",
  name: "Admin",
  status: "Online",
  lastSeen: new Date().toISOString(),
  statusImageUrl: "https://i.imghippo.com/files/LJlBm1736067488.png"
};

// Managed demo contacts configuration
export const defaultManagedContactStatuses: ManagedContactStatus[] = [
  {
    id: "demo-contact-001",
    name: "Maya",
    status: "Active now",
    lastSeen: new Date().toISOString(),
    avatarUrl: "https://i.imghippo.com/files/LJlBm1736067488.png",
    isOnline: true,
    hasStory: true,
    hasNewStory: false,
    storyData: {
      id: "story-001",
      imageUrl: "https://i.imghippo.com/files/LJlBm1736067488.png",
      caption: "Living my best AI life! 🤖✨",
      timestamp: new Date().toISOString(),
      viewCount: 127
    }
  }
];

export const DEFAULT_ADSTERRA_DIRECT_LINK = "https://www.profitablecpmnetwork.com/g8nhym4yg?key=2b71bf819cb8c5c7f8e011b7b75ea097";
export const DEFAULT_MONETAG_DIRECT_LINK = "https://example.com/monetag";

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
  adsterraPopunderCode: "<!-- Adsterra Popunder Code Placeholder -->",
  adsterraPopunderEnabled: false,

  monetagDirectLink: DEFAULT_MONETAG_DIRECT_LINK,
  monetagDirectLinkEnabled: false,
  monetagBannerCode: "<!-- Monetag Banner Code Placeholder -->",
  monetagBannerEnabled: false,
  monetagNativeBannerCode: "<!-- Monetag Native Banner Code Placeholder -->",
  monetagNativeBannerEnabled: false,
  monetagSocialBarCode: "<!-- Monetag Social Bar Code Placeholder -->",
  monetagSocialBarEnabled: false,
  monetagPopunderCode: "<!-- Monetag Popunder Code Placeholder -->",
  monetagPopunderEnabled: false,

  maxDirectLinkAdsPerDay: 10,
  maxDirectLinkAdsPerSession: 3,
  messagesPerAdTrigger: 5,
  inactivityAdTimeoutMs: 30000,
  inactivityAdChance: 0.3,
  userMediaInterstitialChance: 0.2
};

export const defaultAIMediaAssetsConfig: AIMediaAssetsConfig = {
  assets: [
    {
      id: "default-sent-sound",
      type: "audio",
      url: "/media/message-sent.mp3",
      description: "Default message sent sound"
    },
    {
      id: "default-received-sound",
      type: "audio",
      url: "/media/message-received.mp3",
      description: "Default message received sound"
    },
    {
      id: "default-bg-image",
      type: "image",
      url: "/chat-bg.png",
      description: "Default chat background image"
    }
  ]
};

// Export all required items
export {
  defaultAIProfile,
  defaultAdSettings,
  defaultAIMediaAssetsConfig,
  DEFAULT_ADSTERRA_DIRECT_LINK,
  DEFAULT_MONETAG_DIRECT_LINK,
  defaultAdminStatusDisplay, // Exporting defaultAdminStatusDisplay
  defaultManagedContactStatuses // Exporting defaultManagedContactStatuses
};