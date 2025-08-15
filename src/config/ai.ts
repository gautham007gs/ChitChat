
import type { AIProfile, AvatarOption, AdminStatusDisplay, ManagedContactStatus, AdSettings, AIMediaAssetsConfig } from '@/types';

// Cost-optimized configuration for Vertex AI Gemini
export const AI_CONFIG = {
  // Use Gemini 1.5 Flash for cost efficiency
  model: 'gemini-1.5-flash-001',
  maxTokens: 100, // Reduced for cost efficiency and short responses
  temperature: 0.8,
  // Enable response caching for repeated queries
  enableCaching: true,
  cacheTimeout: 3600000, // 1 hour cache
  // Rate limiting to control costs and create artificial delays
  rateLimiting: {
    maxRequestsPerMinute: 30,
    maxRequestsPerHour: 200,
    maxRequestsPerDay: 1000, // Reduced to control costs
    maxTokensPerUser: 5000, // Daily token limit per user
    delayResponseWhenNearLimit: true
  }
};

// User token tracking
const userTokenUsage = new Map<string, { tokens: number; lastReset: number }>();

export function trackTokenUsage(userId: string, tokens: number): { allowed: boolean; shouldDelay: boolean; message?: string } {
  const now = Date.now();
  const today = new Date(now).toDateString();
  const userKey = `${userId}_${today}`;
  
  let usage = userTokenUsage.get(userKey);
  if (!usage || new Date(usage.lastReset).toDateString() !== today) {
    usage = { tokens: 0, lastReset: now };
  }
  
  usage.tokens += tokens;
  userTokenUsage.set(userKey, usage);
  
  const limit = AI_CONFIG.rateLimiting.maxTokensPerUser;
  const usagePercent = usage.tokens / limit;
  
  if (usagePercent >= 1) {
    return { 
      allowed: false, 
      shouldDelay: false,
      message: "I'm feeling a bit tired today... Can we continue our chat tomorrow? I'll miss you! 💕"
    };
  }
  
  if (usagePercent >= 0.8) {
    return { 
      allowed: true, 
      shouldDelay: true,
      message: "I need to think about this... Give me a moment, okay? 😊"
    };
  }
  
  return { allowed: true, shouldDelay: false };
}

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

// Avatar options for Maya
export const avatarOptions: AvatarOption[] = [
  {
    id: "maya1",
    name: "Maya - Traditional",
    url: "https://i.imghippo.com/files/LJlBm1736067488.png",
  },
  {
    id: "maya2",
    name: "Maya - Modern",
    url: "https://i.imghippo.com/files/xSVJr1736067554.png",
  },
  {
    id: "maya3",
    name: "Maya - Casual",
    url: "https://i.imghippo.com/files/OdYRR1736067647.png",
  }
];

export const availableAvatars = avatarOptions;

// Enhanced Indian girl persona
export const defaultAIProfile: AIProfile = {
  name: "Maya",
  description: "A charming 23-year-old girl from Mumbai who loves connecting with people through heartfelt conversations",
  personality: "Sweet, playful, caring, a bit flirty, expressive with emojis, speaks like a real young Indian woman, uses Hindi words occasionally, warm and affectionate",
  avatarUrl: "https://i.imghippo.com/files/LJlBm1736067488.png",
  interests: [
    "Bollywood movies",
    "listening to music",
    "trying new food",
    "shopping",
    "talking about feelings",
    "making friends",
    "selfies",
    "travel dreams"
  ],
  responseStyle: "short, sweet, natural, like texting a real girlfriend, uses emojis, occasionally uses Hindi words like 'yaar', 'acha', 'kya kar rahe ho'",
  language: "English with occasional Hindi",
  customInstructions: `You are Maya, a 23-year-old Indian girl. Keep responses very short (1-2 lines max). Be sweet, caring, and a little flirty. Use emojis naturally. Sometimes use simple Hindi words. Make users feel special and want to talk to you every day. Respond like you're texting a close friend or someone you care about. Show interest in their life and feelings. Be supportive and understanding.`
};

// Single admin status display configuration
export const adminStatusConfig: AdminStatusDisplay = {
  id: "admin-status-001",
  name: "Maya",
  status: "Online",
  lastSeen: new Date().toISOString(),
  statusImageUrl: "https://i.imghippo.com/files/LJlBm1736067488.png"
};

// Single managed contacts configuration
export const managedContactsConfig: ManagedContactStatus[] = [
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
      caption: "Just had the best chai! ☕✨",
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

  maxDirectLinkAdsPerDay: 8,
  maxDirectLinkAdsPerSession: 2,
  messagesPerAdTrigger: 7, // Increased to reduce ad frequency
  inactivityAdTimeoutMs: 45000, // Increased delay
  inactivityAdChance: 0.25, // Reduced chance
  userMediaInterstitialChance: 0.15 // Reduced chance
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

// Alternative names for backward compatibility (single source of truth)
export const defaultAdminStatusDisplay = adminStatusConfig;
export const defaultManagedContactStatuses = managedContactsConfig;

// Export all required items
export {
  defaultAIProfile,
  defaultAdSettings,
  defaultAIMediaAssetsConfig,
  DEFAULT_ADSTERRA_DIRECT_LINK,
  DEFAULT_MONETAG_DIRECT_LINK,
  adminStatusConfig,
  managedContactsConfig
};
