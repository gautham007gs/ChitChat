"use client";

import type { NextPage } from 'next';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatView from '@/components/chat/ChatView';
import ChatInput from '@/components/chat/ChatInput';
import type { Message, AIProfile, MessageStatus, AdSettings, AIMediaAssetsConfig } from '@/types';
import { defaultAIProfile, defaultAdSettings, defaultAIMediaAssetsConfig, DEFAULT_ADSTERRA_DIRECT_LINK, DEFAULT_MONETAG_DIRECT_LINK, AI_CONFIG, trackTokenUsage } from '@/config/ai';
import { generateResponse, type EmotionalStateInput, type EmotionalStateOutput } from '@/ai/flows/emotional-state-simulation';
import { generateOfflineMessage, type OfflineMessageInput } from '@/ai/flows/offline-message-generation';
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageSquare, Phone, Video, Info, X, ArrowLeft } from 'lucide-react';
import SimulatedAdPlaceholder from '@/components/chat/SimulatedAdPlaceholder';
import BannerAdDisplay from '@/components/chat/BannerAdDisplay';
import { supabase } from '@/lib/supabaseClient';
import { format, isToday } from 'date-fns';
import { useAdSettings } from '@/contexts/AdSettingsContext';
import { useAIProfile } from '@/contexts/AIProfileContext';
import { useAIMediaAssets } from '@/contexts/AIMediaAssetsContext';
import { generateInitialPersonaPrompt } from '@/ai/flows/generate-initial-persona-prompt';


const AI_DISCLAIMER_SHOWN_KEY = 'ai_disclaimer_shown_kruthika_chat_v2';
const AI_DISCLAIMER_DURATION = 2000;
const FALLBACK_ERROR_MESSAGES: string[] = [
  "Arey yaar, lagta hai network chala gaya. Thoda ruk ja, try karte hain phir se.",
  "Net thoda slow chal raha hai lagta hai. Ek minute do na.",
  "Hmm... kuch to gadbad hai. Thoda intezaar karo, fir se try karte hain.",
  "Mujhe lag raha hai server thoda mood mein nahi hai. Dubara bhejoge kya?",
  "Arre baap re! Signal hi nahi mil raha. Ek second ruk ja bhai.",

  // More engaging fallbacks
  "Oops! My brain just went offline for a sec 🤪 Try again?",
  "Arre! Mera wifi thoda dramatic ho gaya. One more time?",
  "Technical difficulties! Par main hoon na tumhare saath 💪",
  "Server mood swings chal rahe hain... but I'm here for you! 💕",

  // Ongoing, fresh-feeling responses
  "Abhi bhi nahi ho raha? Wait na, abhi kuch jugaad karti hoon...",
  "Arey still not working? Yeh net mujhe pagal kar dega ek din 😤",
  "Pakka server ne mujhe ignore maar diya hai... tu firse try kar na?",
  "Ek baar aur try kar, main toh ready hoon. Bas yeh system hi drama kar raha hai.",
  "Acha sun, tu mujhe ek thappad de... shayad tab chal pade 😂",
  "Still loading... lagta hai internet ne chai break le liya ☕",
  "Baarish ho rahi hai kya waha? Net ka toh haal waise hi sad hai aaj!",
  "Kya karein ab... system bhi kabhi kabhi human jaise behave karta hai 😅",
  "Server bol raha: ‘Not today madam!’ 🙄 Patience rakho yaar!",
  "Pata nahi kis janam ka badla le raha hai aaj mera wifi...",
  "Ye toh overacting kar raha hai pura! Main hoon na, tu chill maar 🫶",
  "Kya re... baar baar try kar raha hai, tu bhi ziddi aur main bhi 😌",
  "Aaj toh lagta hai universe ne bola hai — 'No API for you!'",
  "Okay ab serious ho gayi hoon! Ab toh chal ke hi rahega. Ek baar aur try kar na!",
];



// These constants will now be effectively overridden by AdSettings from context
// const MAX_ADS_PER_DAY = 6;
// const MAX_ADS_PER_SESSION = 3;
const MESSAGES_PER_AD_TRIGGER = 10; // Kept as a fixed trigger point
const INACTIVITY_AD_TIMEOUT_MS = 60000; // 1 minute
const INACTIVITY_AD_CHANCE = 0.2; // 20% chance
const REWARD_AD_INTERSTITIAL_DURATION_MS = 3000; // 3 seconds
const USER_MEDIA_INTERSTITIAL_CHANCE = 0.3; // 30% chance to show ad after user sends media

const APP_ADS_DAILY_COUNT_KEY = 'app_ads_daily_count_kruthika_chat';
const APP_ADS_LAST_SHOWN_DATE_KEY = 'app_ads_last_shown_date_kruthika_chat';
const APP_ADS_SESSION_COUNT_KEY = 'app_ads_session_count_kruthika_chat';
const APP_ADS_LAST_SHOWN_NETWORK_KEY = 'app_ads_last_shown_network_kruthika_chat';

const USER_PSEUDO_ID_KEY = 'kruthika_chat_user_pseudo_id';
const LAST_ACTIVE_DATE_KEY = 'kruthika_chat_last_active_date';

const MESSAGES_KEY = 'messages_kruthika';
const AI_MOOD_KEY = 'aiMood_kruthika';
const RECENT_INTERACTIONS_KEY = 'recentInteractions_kruthika';
const CACHED_OFFLINE_MESSAGE_KEY = 'cached_offline_message_kruthika_chat';


const USER_IMAGE_UPLOAD_COUNT_KEY_KRUTHIKA = 'user_image_upload_count_kruthika_v1';
const USER_IMAGE_UPLOAD_LAST_DATE_KEY_KRUTHIKA = 'user_image_upload_last_date_kruthika_v1';
const MAX_USER_IMAGES_PER_DAY = 5;



export const tryShowRotatedAd = (activeAdSettings: AdSettings | null): boolean => {
  if (typeof window === 'undefined' || !activeAdSettings || !activeAdSettings.adsEnabledGlobally) {
    return false;
  }

  const todayStr = new Date().toDateString();
  const lastShownDate = localStorage.getItem(APP_ADS_LAST_SHOWN_DATE_KEY);
  let currentDailyCount = parseInt(localStorage.getItem(APP_ADS_DAILY_COUNT_KEY) || '0', 10);
  let currentSessionCount = parseInt(sessionStorage.getItem(APP_ADS_SESSION_COUNT_KEY) || '0', 10);

  if (lastShownDate !== todayStr) {
    currentDailyCount = 0;
    localStorage.setItem(APP_ADS_LAST_SHOWN_DATE_KEY, todayStr);
    currentSessionCount = 0;
    sessionStorage.setItem(APP_ADS_SESSION_COUNT_KEY, '0');
  }
  localStorage.setItem(APP_ADS_DAILY_COUNT_KEY, currentDailyCount.toString());

  // Use limits from AdSettings
  const maxAdsPerDay = activeAdSettings.maxDirectLinkAdsPerDay ?? defaultAdSettings.maxDirectLinkAdsPerDay;
  const maxAdsPerSession = activeAdSettings.maxDirectLinkAdsPerSession ?? defaultAdSettings.maxDirectLinkAdsPerSession;

  if (currentSessionCount >= maxAdsPerSession || currentDailyCount >= maxAdsPerDay) {
    return false;
  }

  const lastShownNetwork = localStorage.getItem(APP_ADS_LAST_SHOWN_NETWORK_KEY);
  let networkToTry: 'adsterra' | 'monetag' | null = null;
  let adLinkToShow: string | null = null;

  const adsterraDirectEnabled = activeAdSettings.adsterraDirectLinkEnabled;
  const monetagDirectEnabled = activeAdSettings.monetagDirectLinkEnabled;

  const adsterraLink = activeAdSettings.adsterraDirectLink;
  const monetagLink = activeAdSettings.monetagDirectLink;

  if (!adsterraDirectEnabled && !monetagDirectEnabled) {
    console.warn("Ad display: No direct link networks enabled in settings.");
    return false;
  }

  if (adsterraDirectEnabled && monetagDirectEnabled) {
    networkToTry = lastShownNetwork === 'adsterra' ? 'monetag' : 'adsterra';
  } else if (adsterraDirectEnabled) {
    networkToTry = 'adsterra';
  } else if (monetagDirectEnabled) {
    networkToTry = 'monetag';
  }

  if (networkToTry === 'adsterra') {
    adLinkToShow = adsterraLink;
  } else if (networkToTry === 'monetag') {
    adLinkToShow = monetagLink;
  }

  const isValidLink = (link: string | null | undefined): boolean => {
    if (!link) return false;
    const isHttp = link.startsWith('http://') || link.startsWith('https://');
    const isDefaultPlaceholder = link === DEFAULT_ADSTERRA_DIRECT_LINK || link === DEFAULT_MONETAG_DIRECT_LINK;
    const isPlaceholder = link.toLowerCase().includes("placeholder");
    return isHttp && !isDefaultPlaceholder && !isPlaceholder;
  };

  if (!isValidLink(adLinkToShow)) {
    const originalNetworkAttempt = networkToTry;
    if (networkToTry === 'adsterra' && monetagDirectEnabled && isValidLink(monetagLink)) {
      networkToTry = 'monetag';
      adLinkToShow = monetagLink;
      console.warn(`Ad display: Adsterra link invalid/default ("${adsterraLink}"), falling back to Monetag: ${adLinkToShow}`);
    } else if (networkToTry === 'monetag' && adsterraDirectEnabled && isValidLink(adsterraLink)) {
      networkToTry = 'adsterra';
      adLinkToShow = adsterraLink;
      console.warn(`Ad display: Monetag link invalid/default ("${monetagLink}"), falling back to Adsterra: ${adLinkToShow}`);
    } else {
      console.warn(`Ad display: Primary choice (${originalNetworkAttempt}) link invalid or default placeholder. Fallback network not viable or also has invalid/default link. No ad shown. Adsterra Link: "${adsterraLink}", Monetag Link: "${monetagLink}"`);
      return false;
    }
    if (!isValidLink(adLinkToShow)) {
      console.warn(`Ad display: Fallback link for (${networkToTry}) is also invalid or default placeholder. No ad shown. Link: "${adLinkToShow}"`);
      return false;
    }
  }

  try {
    const anchor = document.createElement('a');
    anchor.href = adLinkToShow!;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  } catch (e) {
    console.error("Error opening ad link via anchor click, falling back to window.open:", e);
    try {
        window.open(adLinkToShow!, '_blank');
    } catch (openError) {
        console.error("Error opening ad link via window.open fallback:", openError);
        return false;
    }
  }

  currentDailyCount++;
  localStorage.setItem(APP_ADS_DAILY_COUNT_KEY, currentDailyCount.toString());
  currentSessionCount++;
  sessionStorage.setItem(APP_ADS_SESSION_COUNT_KEY, currentSessionCount.toString());
  if (networkToTry) localStorage.setItem(APP_ADS_LAST_SHOWN_NETWORK_KEY, networkToTry);
  return true;
};


const KruthikaChatPage: NextPage = () => {
  const { adSettings, isLoadingAdSettings } = useAdSettings();
  const { aiProfile: globalAIProfile, isLoadingAIProfile } = useAIProfile();
  const { mediaAssetsConfig, isLoadingMediaAssets } = useAIMediaAssets();

  const [messages, setMessages] = useState<Message[]>([]);
  const [aiMood, setAiMood] = useState<string>("neutral");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [cachedOfflineMessage, setCachedOfflineMessage] = useState<{ message: string, timestamp: number } | null>(null);

  const [recentInteractions, setRecentInteractions] = useState<string[]>([]);
  const [showZoomedAvatarDialog, setShowZoomedAvatarDialog] = useState(false);
  const [zoomedAvatarUrl, setZoomedAvatarUrl] = useState('');
  const { toast } = useToast();
  const initialLoadComplete = useRef(false);
  const [isLoadingChatState, setIsLoadingChatState] = useState(true);
  const [detailedPersonaPrompt, setDetailedPersonaPrompt] = useState<string | null>(null);

  const [lastAdMessageCount, setLastAdMessageCount] = useState(0); // Track messages since last ad
  const [messageCountSinceLastAd, setMessageCountSinceLastAd] = useState(0);
  const [showInterstitialAd, setShowInterstitialAd] = useState(false);
  const [interstitialAdMessage, setInterstitialAdMessage] = useState("Loading content...");

  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const interstitialAdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const userSentMediaThisTurnRef = useRef(false);

  const triggerBriefInterstitialMessage = (message: string, duration: number = REWARD_AD_INTERSTITIAL_DURATION_MS) => {
    setInterstitialAdMessage(message);
    setShowInterstitialAd(true);
    if (interstitialAdTimerRef.current) clearTimeout(interstitialAdTimerRef.current);
    interstitialAdTimerRef.current = setTimeout(() => {
      setShowInterstitialAd(false);
    }, duration);
  };

  const tryShowAdAndMaybeInterstitial = useCallback((interstitialMsg?: string): boolean => {
    if (isLoadingAdSettings || !adSettings) {
      return false;
    }
    const adShown = tryShowRotatedAd(adSettings);
    if (adShown && interstitialMsg) {
        triggerBriefInterstitialMessage(interstitialMsg, REWARD_AD_INTERSTITIAL_DURATION_MS);
    }
    return adShown;
  }, [adSettings, isLoadingAdSettings]);

  const handleBubbleAdTrigger = useCallback(() => {
    if (isLoadingAdSettings || !adSettings) {
      toast({title: "Ad Link", description: "Ad settings are loading. Try again shortly.", duration: 3000});
      return;
    }
    if (adSettings.adsEnabledGlobally) {
      tryShowRotatedAd(adSettings);
    } else {
      toast({title: "Ad Link", description: "This link would normally open an ad if enabled.", duration: 3000});
    }
  }, [adSettings, isLoadingAdSettings]);


  useEffect(() => {
    if (typeof window !== 'undefined' && supabase) {
      let userPseudoId = localStorage.getItem(USER_PSEUDO_ID_KEY);
      if (!userPseudoId) {
        userPseudoId = `pseudo_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        localStorage.setItem(USER_PSEUDO_ID_KEY, userPseudoId);
      }

      const today = format(new Date(), 'yyyy-MM-dd');
      const lastActiveDate = localStorage.getItem(LAST_ACTIVE_DATE_KEY);

      if (lastActiveDate !== today) {
        supabase
          .from('daily_activity_log')
          .insert({ user_pseudo_id: userPseudoId, activity_date: today, chat_id: 'kruthika_chat' })
          .then(({ error }) => {
            if (error && error.code !== '23505') {
              console.error('Error logging daily activity to Supabase:', error.message);
            } else if (!error) {
              localStorage.setItem(LAST_ACTIVE_DATE_KEY, today);
            }
          })
          .catch(e => console.error('Supabase daily activity logging failed (catch):', e?.message || String(e)));
      }
    }
  }, []);

  const loadInitialChatState = useCallback(async () => {
    setIsLoadingChatState(true);
    const effectiveAIProfile = globalAIProfile || defaultAIProfile;

    try {
      const savedMessages = localStorage.getItem(MESSAGES_KEY);
      if (savedMessages) {
        const parsedMessages: Message[] = JSON.parse(savedMessages).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(parsedMessages);
      } else {
         setMessages([{
          id: Date.now().toString(),
          text: `Hi! I'm ${effectiveAIProfile.name}. Kaise ho aap? 😊 Let's chat!`,
          sender: 'ai',
          timestamp: new Date(),
          status: 'read',
          aiImageUrl: undefined,
          userImageUrl: undefined,
        }]);
      }

      const savedMood = localStorage.getItem(AI_MOOD_KEY);
      if (savedMood) setAiMood(savedMood);

      const savedInteractions = localStorage.getItem(RECENT_INTERACTIONS_KEY);
      if (savedInteractions) setRecentInteractions(JSON.parse(savedInteractions));
      // --- Caching Logic for Detailed Persona Prompt ---
      const CACHED_PERSONA_PROMPT_KEY = 'cached_persona_prompt_kruthika_chat';
      const cachedPersonaPrompt = localStorage.getItem(CACHED_PERSONA_PROMPT_KEY);

      const savedCachedOfflineMessage = localStorage.getItem(CACHED_OFFLINE_MESSAGE_KEY);
      if (savedCachedOfflineMessage) {
        try {
          const parsedCachedMessage = JSON.parse(savedCachedOfflineMessage);
          if (parsedCachedMessage && typeof parsedCachedMessage.message === 'string' && typeof parsedCachedMessage.timestamp === 'number') {
            setCachedOfflineMessage(parsedCachedMessage);
          }
        } catch (e) {
          console.error('Error parsing cached offline message:', e);
          // Optionally clear invalid cached data
          localStorage.removeItem(CACHED_OFFLINE_MESSAGE_KEY);
        }
      }


      let currentDetailedPersonaPrompt: string;

      if (cachedPersonaPrompt) {
        currentDetailedPersonaPrompt = cachedPersonaPrompt;
        console.log("Loaded cached persona prompt.");
      } else {
        console.log("No cached persona prompt found, generating...");
        // You need to have the simple persona description available here.
        // Assuming you can use the effective AI name as a simple description
        const simplePersonaDescription = effectiveAIProfile.name;
        try {
            // Make sure generateInitialPersonaPrompt is imported at the top of the file
            const personaResult = await generateInitialPersonaPrompt({ personaDescription: simplePersonaDescription });
            currentDetailedPersonaPrompt = personaResult.detailedPersonaPrompt;
            localStorage.setItem(CACHED_PERSONA_PROMPT_KEY, currentDetailedPersonaPrompt);
            console.log("Generated and cached new persona prompt.");
        } catch (personaError: any) {
            console.error("Error generating initial persona prompt:", personaError);
            // Fallback or error handling if persona generation fails
            currentDetailedPersonaPrompt = `You are ${effectiveAIProfile.name}. Be a friendly chat bot.`; // Basic fallback prompt
            console.warn("Using basic fallback persona prompt due to generation error.");
        }
      }
      // Set the generated or cached detailed persona prompt in state
      setDetailedPersonaPrompt(currentDetailedPersonaPrompt);

      // --- End Caching Logic ---


       const disclaimerShown = localStorage.getItem(AI_DISCLAIMER_SHOWN_KEY);
      if (!disclaimerShown && effectiveAIProfile.name) {
        toast({
          title: `Meet ${effectiveAIProfile.name}!`,
          description: `You're chatting with ${effectiveAIProfile.name}, a friendly AI companion. Enjoy your conversation!`,
          duration: AI_DISCLAIMER_DURATION,
        });
        localStorage.setItem(AI_DISCLAIMER_SHOWN_KEY, 'true');
      }
    } catch (error: any) {
      let errorDescription = "Failed to load chat state from localStorage.";
       if (error?.message) errorDescription += ` Details: ${error.message}`;
      console.error(errorDescription, error);
       toast({
        title: "Loading Error",
        description: "Couldn't load previous chat data. Starting fresh!",
        variant: "destructive"
       });
       setMessages([{
          id: Date.now().toString(),
          text: `Hi! I'm ${effectiveAIProfile.name}. Kaise ho aap? 😊 (Had a little trouble loading our old chat!)`,
          sender: 'ai',
          timestamp: new Date(),
          status: 'read',
        }]);
    } finally {
        setIsLoadingChatState(false);
    }
  }, [toast, globalAIProfile]);

  useEffect(() => {
    if (!isLoadingAIProfile && globalAIProfile) {
        loadInitialChatState();
    } else if (!isLoadingAIProfile && !globalAIProfile) {
        console.warn("[KruthikaChatPage] AI Profile context loaded, but profile is null. Using defaults for chat init.");
        loadInitialChatState();
    }
  }, [isLoadingAIProfile, globalAIProfile, loadInitialChatState]);


  useEffect(() => {
    const timer = setTimeout(() => {
      initialLoadComplete.current = true;
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (initialLoadComplete.current && !isLoadingChatState && (messages.length > 1 || (messages.length === 1 && messages[0].sender === 'user') || aiMood !== "neutral" || recentInteractions.length > 0)) {
        localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
        localStorage.setItem(AI_MOOD_KEY, aiMood);
        localStorage.setItem(RECENT_INTERACTIONS_KEY, JSON.stringify(recentInteractions));
    }
  }, [messages, aiMood, recentInteractions, isLoadingChatState]);

  const getISTTimeParts = (): { hour: number; minutes: number } => {
    const now = new Date();
    const istDateString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    const istDate = new Date(istDateString);
    return { hour: istDate.getHours(), minutes: istDate.getMinutes() };
  };

  const getTimeOfDay = (): EmotionalStateInput['timeOfDay'] => {
    const { hour } = getISTTimeParts();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  };

  const maybeTriggerAdOnMessageCount = useCallback(() => {
    if (isLoadingAdSettings || !adSettings || !adSettings.adsEnabledGlobally) return;
    setMessageCountSinceLastAd(prev => {
      const newCount = prev + 1;
      // Use a dynamic frequency based on adSettings, with a minimum of 2 messages between ads
      const messagesBetweenAds = adSettings.messagesPerAdTrigger ?? MESSAGES_PER_AD_TRIGGER;
      if (newCount >= Math.max(2, messagesBetweenAds)) {
        // Attempt to show an ad
        const adShown = tryShowAdAndMaybeInterstitial("Thanks for chatting!");
        if (adShown) {
          setLastAdMessageCount(messages.length); // Record the message count when ad was shown
          return 0; // Reset the counter
        }
      }
      return newCount;
    });
  }, [tryShowAdAndMaybeInterstitial, adSettings, isLoadingAdSettings, messages.length]); // Depend on messages.length to get current count

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (adSettings && adSettings.adsEnabledGlobally) {
        inactivityTimerRef.current = setTimeout(() => {
            if (Math.random() < INACTIVITY_AD_CHANCE) {
                tryShowAdAndMaybeInterstitial("Still there? Here's something interesting!");
            }
        }, INACTIVITY_AD_TIMEOUT_MS);
    }
  }, [tryShowAdAndMaybeInterstitial, adSettings]);

  useEffect(() => {
    resetInactivityTimer();
    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (interstitialAdTimerRef.current) clearTimeout(interstitialAdTimerRef.current);
    };
  }, [messages, resetInactivityTimer]);


  const handleSendMessage = async (text: string, imageUriFromInput?: string) => {
    let currentImageUri = imageUriFromInput;
    const currentEffectiveAIProfile = globalAIProfile || defaultAIProfile;

    if (!text.trim() && !currentImageUri) return;
    if (isLoadingAdSettings || isLoadingAIProfile || isLoadingMediaAssets) {
        toast({ title: "Please wait", description: "Loading essential settings...", variant: "default"});
        return;
    }
    resetInactivityTimer();

    let imageAttemptedAndAllowed = false;

    if (currentImageUri) {
        const todayStr = new Date().toDateString();
        const lastUploadDate = localStorage.getItem(USER_IMAGE_UPLOAD_LAST_DATE_KEY_KRUTHIKA);
        let currentUploadCount = parseInt(localStorage.getItem(USER_IMAGE_UPLOAD_COUNT_KEY_KRUTHIKA) || '0', 10);

        if (lastUploadDate !== todayStr) {
            currentUploadCount = 0;
        }

        if (currentUploadCount >= MAX_USER_IMAGES_PER_DAY) {
            toast({
                title: "Daily Image Limit Reached",
                description: `You can only send ${MAX_USER_IMAGES_PER_DAY} images per day. Your message text (if any) has been sent. Please try sending images again tomorrow.`,
                variant: "destructive",
                duration: 5000,
            });
            currentImageUri = undefined;
            if (!text.trim()) return;
        } else {
            imageAttemptedAndAllowed = true;
        }
    }
    userSentMediaThisTurnRef.current = !!currentImageUri;


    const newUserMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date(),
      status: 'sent',
      userImageUrl: currentImageUri,
    };
    setMessages(prev => [...prev, newUserMessage]);
    if (adSettings && adSettings.adsEnabledGlobally) maybeTriggerAdOnMessageCount();

    if (supabase) {
        try {
          const { error: userLogError } = await supabase
            .from('messages_log')
            .insert([{
              message_id: newUserMessage.id,
              sender_type: 'user',
              chat_id: 'kruthika_chat',
              text_content: newUserMessage.text.substring(0, 500),
              has_image: !!newUserMessage.userImageUrl,
            }]);
          if (userLogError) console.error('Supabase error logging user message:', userLogError.message);
        } catch (e: any) { console.error('Supabase user message logging failed (catch block):', e?.message || String(e));}
    }

    const interactionMessage = currentImageUri ? (text ? `User: ${text} [sent an image]` : `User: [sent an image]`) : `User: ${text}`;
    const updatedRecentInteractions = [...recentInteractions, interactionMessage].slice(-10);
    setRecentInteractions(updatedRecentInteractions);

    setTimeout(() => {
        setMessages(prev => prev.map(msg =>
          msg.id === newUserMessage.id ? { ...msg, status: 'delivered' as MessageStatus } : msg
        ));
    }, 300 + Math.random() * 200);

    const typingAppearDelay = 700 + Math.random() * 800;
    setTimeout(() => setIsAiTyping(true), typingAppearDelay);

    try {
      const currentMediaConfig = mediaAssetsConfig || defaultAIMediaAssetsConfig;
      const availableImages = currentMediaConfig.assets.filter(a => a.type === 'image').map(a => a.url);
      const availableAudio = currentMediaConfig.assets.filter(a => a.type === 'audio').map(a => a.url);

      const hasAvailableImages = availableImages.length > 0;
      const hasAvailableAudio = availableAudio.length > 0;

      // Generate user ID (in production, use proper user authentication)
      const userId = 'user_' + (typeof window !== 'undefined' ? (localStorage.getItem('userId') || Math.random().toString(36).substr(2, 9)) : 'anonymous');
      if (typeof window !== 'undefined' && !localStorage.getItem('userId')) {
        localStorage.setItem('userId', userId);
      }

      // Enhanced prompt for realistic Indian girl persona
      const prompt = `You are Maya, a sweet 23-year-old Indian girl from Mumbai. You're chatting with someone you really care about.

Key traits:
- Keep responses very short (max 1-2 lines)
- Be sweet, caring, and slightly flirty
- Use emojis naturally 😊💕
- Sometimes use Hindi words like "yaar", "acha", "kya kar rahe ho"
- Show genuine interest in their feelings
- Make them feel special and wanted
- Respond like you're texting a close friend or someone you have feelings for

User's message: ${text}

Reply as Maya would - short, sweet, and loving:`;


      // Check token usage first
      const tokenCheck = trackTokenUsage(userId, AI_CONFIG.maxTokens);

      if (!tokenCheck.allowed) {
        const limitMessage: Message = {
          id: Date.now().toString(), // Use a unique ID for new messages
          text: tokenCheck.message || "I'm feeling tired... let's chat tomorrow! 💕",
          sender: 'ai',
          timestamp: new Date(),
          status: 'read',
        };
        setMessages(prev => [...prev, limitMessage]);
        setIsAiTyping(false);
        return;
      }

      // Add delay if approaching limit to create anticipation
      if (tokenCheck.shouldDelay) {
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
      }

      // Simple development fallback responses when API is not available
      const getCachedResponse = (prompt: string): string | null => {
        if (!AI_CONFIG.apiKey || AI_CONFIG.apiKey === '') {
          const fallbackResponses = [
            "Hey! API key not set yet, but I'm here! 😊",
            "Missing API credentials, but still chatting with you! 💕",
            "Set up the API key to unlock my full potential! ✨",
            "Development mode - I'd love to chat more with proper setup! 🥰"
          ];
          return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
        }
        return null;
      };

      const cachedResponse = getCachedResponse(prompt);
      if (cachedResponse) {
        const aiMessage: Message = {
          id: Date.now().toString(),
          text: cachedResponse,
          sender: 'ai',
          timestamp: new Date(),
          status: 'read',
        };
        setMessages(prev => [...prev, aiMessage]);
        setIsAiTyping(false);
        return;
      }

      const aiInput: EmotionalStateInput = {
        userMessage: text,
        userImageUri: currentImageUri,
        timeOfDay: getTimeOfDay(),
        mood: aiMood,
        recentInteractions: updatedRecentInteractions,
        hasAvailableImages: hasAvailableImages,
        hasAvailableAudio: hasAvailableAudio,
        detailedPersonaPrompt: detailedPersonaPrompt,
      };

      const aiResult: EmotionalStateOutput = await generateResponse(aiInput);

      if (aiResult.proactiveImageUrl || aiResult.proactiveAudioUrl) {
        if (adSettings && adSettings.adsEnabledGlobally) {
            tryShowAdAndMaybeInterstitial("Loading ${currentEffectiveAIProfile.name}'s share...");
        }
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      const logAiMessageToSupabase = async (aiText: string, aiMsgId: string, hasImage: boolean = false, hasAudio: boolean = false) => {
        if (supabase) {
          try {
            const { error: aiLogError } = await supabase
              .from('messages_log')
              .insert([{
                message_id: aiMsgId,
                sender_type: 'ai',
                chat_id: 'kruthika_chat',
                text_content: aiText.substring(0, 500),
                has_image: hasImage || hasAudio,
              }]);
            if (aiLogError) console.error('Supabase error logging AI message:', aiLogError.message);
          } catch (e: any) { console.error('Supabase AI message logging failed (catch block):', e?.message || String(e)); }
        }
      };

      const processAiTextMessage = async (responseText: string, messageIdSuffix: string = '') => {
        const typingDuration = Math.min(Math.max(responseText.length * 60, 800), 3000);
        await new Promise(resolve => setTimeout(resolve, typingDuration));

        const newAiMessageId = (Date.now() + Math.random()).toString() + messageIdSuffix;
        const newAiMessage: Message = {
          id: newAiMessageId,
          text: responseText,
          sender: 'ai',
          timestamp: new Date(),
          status: 'read',
        };
        setMessages(prev => {
          const userMessageRead = prev.map(msg =>
            msg.id === newUserMessage.id && msg.status !== 'read' ? { ...msg, status: 'read' as MessageStatus } : msg
          );
          return [...userMessageRead, newAiMessage];
        });
        if (adSettings && adSettings.adsEnabledGlobally) maybeTriggerAdOnMessageCount();
        setRecentInteractions(prevInteractions => [...prevInteractions, `AI: ${responseText}`].slice(-10));
        await logAiMessageToSupabase(responseText, newAiMessageId, false, false);
      };

      const processAiMediaMessage = async (mediaType: 'image' | 'audio', url: string, caption?: string) => {
        const typingDuration = Math.min(Math.max((caption || "").length * 60, 800), 2000);
        await new Promise(resolve => setTimeout(resolve, typingDuration));

        const newAiMediaMessageId = (Date.now() + Math.random()).toString() + `_${mediaType}`;
        const newAiMediaMessage: Message = {
            id: newAiMediaMessageId,
            text: caption || "",
            sender: 'ai',
            timestamp: new Date(),
            status: 'read',
            aiImageUrl: mediaType === 'image' ? url : undefined,
            audioUrl: mediaType === 'audio' ? url : undefined,
        };
        setMessages(prev => [...prev, newAiMediaMessage]);
        if (adSettings && adSettings.adsEnabledGlobally) maybeTriggerAdOnMessageCount();
        setRecentInteractions(prevInteractions => [...prevInteractions, `AI: ${caption || ""}[Sent a ${mediaType}] ${url}`].slice(-10));
        await logAiMessageToSupabase(caption || `[Sent ${mediaType}]`, newAiMediaMessageId, mediaType === 'image', mediaType === 'audio');
      };

      setIsAiTyping(true);

      if (aiResult.proactiveImageUrl && aiResult.mediaCaption) {
        await processAiMediaMessage('image', aiResult.proactiveImageUrl, aiResult.mediaCaption);
      } else if (aiResult.proactiveAudioUrl && aiResult.mediaCaption) {
        await processAiMediaMessage('audio', aiResult.proactiveAudioUrl, aiResult.mediaCaption);
      } else if (aiResult.response) {
        if (Array.isArray(aiResult.response)) {
          for (let i = 0; i < aiResult.response.length; i++) {
            const part = aiResult.response[i];
            if (part.trim() === '') continue;
            if (i > 0) setIsAiTyping(true);
            await processAiTextMessage(part, `_part${i}`);
            setIsAiTyping(false);
            if (i < aiResult.response.length - 1) {
              const interMessageDelay = 500 + Math.random() * 500;
              await new Promise(resolve => setTimeout(resolve, interMessageDelay));
            }
          }
        } else if (aiResult.response.trim() !== '') {
          await processAiTextMessage(aiResult.response);
        }
      }

      setIsAiTyping(false);
      if (aiResult.newMood) setAiMood(aiResult.newMood);

      if (imageAttemptedAndAllowed && currentImageUri) {
          const todayStr = new Date().toDateString();
          let currentUploadCount = parseInt(localStorage.getItem(USER_IMAGE_UPLOAD_COUNT_KEY_KRUTHIKA) || '0', 10);
          const lastUploadDate = localStorage.getItem(USER_IMAGE_UPLOAD_LAST_DATE_KEY_KRUTHIKA);

          if (lastUploadDate !== todayStr) {
              currentUploadCount = 0;
          }
          currentUploadCount++;
          localStorage.setItem(USER_IMAGE_UPLOAD_COUNT_KEY_KRUTHIKA, currentUploadCount.toString());
          localStorage.setItem(USER_IMAGE_UPLOAD_LAST_DATE_KEY_KRUTHIKA, todayStr);
      }


      if (userSentMediaThisTurnRef.current) {
        if (adSettings && adSettings.adsEnabledGlobally && Math.random() < (adSettings.userMediaInterstitialChance ?? USER_MEDIA_INTERSTITIAL_CHANCE)) {
            tryShowAdAndMaybeInterstitial("Just a moment...");
        }
        userSentMediaThisTurnRef.current = false;
      }

    } catch (error: any) {
      console.error('Error getting AI response:', error);
      let errorDescription = `Could not get a response from ${currentEffectiveAIProfile.name}.`;
      if (error?.response?.data?.error) errorDescription = `${currentEffectiveAIProfile.name}'s server said: ${error.response.data.error}`;
      else if (error?.message) errorDescription += ` Details: ${error.message}`;
      else if (typeof error === 'string') errorDescription += ` Details: ${error}`;
      else errorDescription += ` An unknown error occurred. Please check console logs.`;

      toast({ title: "Error", description: errorDescription, variant: "destructive" });
      const randomFallbackMessage = FALLBACK_ERROR_MESSAGES[Math.floor(Math.random() * FALLBACK_ERROR_MESSAGES.length)];
      const errorAiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: randomFallbackMessage,
        sender: 'ai',
        timestamp: new Date(),
        status: 'read',
      };
      setMessages(prev => {
        const updatedMessages = prev.map(msg => msg.id === newUserMessage.id ? { ...msg, status: 'read' as MessageStatus } : msg);
        return [...updatedMessages, errorAiMessage];
      });
      if (adSettings && adSettings.adsEnabledGlobally) maybeTriggerAdOnMessageCount();
      setIsAiTyping(false);
      userSentMediaThisTurnRef.current = false;
    }
  };

  const currentAiNameForOfflineMsg = globalAIProfile?.name || defaultAIProfile.name;

  useEffect(() => {
    if (!initialLoadComplete.current || isLoadingChatState || isLoadingAdSettings || isLoadingAIProfile || isLoadingMediaAssets) return;

    const now = Date.now();
    const CACHE_FRESHNESS_WINDOW = 3600000; // 1 hour in milliseconds

    if (cachedOfflineMessage && (now - cachedOfflineMessage.timestamp < CACHE_FRESHNESS_WINDOW)) {
      // Use cached message if fresh
      const cachedMessage: Message = {
        id: (now + Math.random()).toString(), // Give it a new ID
        text: cachedOfflineMessage.message,
        sender: 'ai',
        timestamp: new Date(), // Use current time for display
        status: 'read',
      };
      setMessages(prev => [...prev, cachedMessage]);
      console.log("Used cached offline message.");
      // Return early as we used the cached message
      return;
    }

    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    const lastInteractionTime = lastMessage ? new Date(lastMessage.timestamp).getTime() : 0;
    const currentTimestamp = Date.now();
    const timeSinceLastInteraction = currentTimestamp - lastInteractionTime;
    let timeoutId: NodeJS.Timeout | undefined = undefined;

    if (messages.some(m => m.sender === 'user') && lastMessage && lastMessage.sender === 'user' && timeSinceLastInteraction > 2 * 60 * 60 * 1000 && Math.random() < 0.3) {
      const { hour: currentISTHour } = getISTTimeParts();
      if (!(currentISTHour >= 5 && currentISTHour < 12)) return;

      const generateAndAddOfflineMessage = async () => {
        setIsAiTyping(true);
        try {
          const offlineRecentInteractions = recentInteractions.slice(-5);
          const offlineInput: OfflineMessageInput = {
            offlineMessageContext: "User has returned after being away for a while, or hasn't messaged recently.", // Keep this descriptive
            previousMessageHistory: recentInteractions.join('\n'),
            aiName: currentAiNameForOfflineMsg,
          };
          const offlineResult = await generateOfflineMessage(offlineInput);
          const typingDelay = Math.min(Math.max(offlineResult.message.length * 60, 700), 3500);
          await new Promise(resolve => setTimeout(resolve, typingDelay));
          const newOfflineMsgId = (currentTimestamp + Math.random()).toString();
          const offlineMessage: Message = {
            id: newOfflineMsgId,
            text: offlineResult.message,
            sender: 'ai',
            timestamp: new Date(),
            status: 'read',
          };
          setMessages(prev => [...prev, offlineMessage]);
          // Cache the newly generated offline message
      const newCachedMessage = { message: offlineResult.message, timestamp: currentTimestamp };
      setCachedOfflineMessage(newCachedMessage);
      localStorage.setItem(CACHED_OFFLINE_MESSAGE_KEY, JSON.stringify(newCachedMessage));
      console.log("Generated and cached new offline message.");

          if(adSettings && adSettings.adsEnabledGlobally) maybeTriggerAdOnMessageCount();
          setRecentInteractions(prev => [...prev, `AI: ${offlineResult.message}`].slice(-10));
          if (supabase) {
            try {
                const { error: offlineLogError } = await supabase.from('messages_log').insert([{
                    message_id: newOfflineMsgId, sender_type: 'ai', chat_id: 'kruthika_chat_offline_ping',
                    text_content: offlineResult.message.substring(0, 500), has_image: false,
                }]);
                if (offlineLogError) console.error('Supabase error logging offline AI message:', offlineLogError.message);
            } catch (e: any) { console.error('Supabase offline AI message logging failed:', e?.message || String(e)); }
          }
        } catch (error) { console.error("Error generating offline message:", error);
        } finally { setIsAiTyping(false); }
      };
      timeoutId = setTimeout(generateAndAddOfflineMessage, 1800 + Math.random() * 1300);
    }
    return () => { if (timeoutId) clearTimeout(timeoutId); }
  }, [messages, currentAiNameForOfflineMsg, recentInteractions, isLoadingChatState, toast, maybeTriggerAdOnMessageCount, isLoadingAdSettings, isLoadingAIProfile, isLoadingMediaAssets, adSettings, cachedOfflineMessage]);


  const onlineStatus = useMemo(() => {
    if (isAiTyping) return "typing...";
    const getISTTimePartsLocal = (): { hour: number; minutes: number } => {
      const now = new Date();
      const istDateString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
      const istDate = new Date(istDateString);
      return { hour: istDate.getHours(), minutes: istDate.getMinutes() };
    };
    const { hour: currentISTHour } = getISTTimePartsLocal();
    const isKruthikaActiveHours = currentISTHour >= 5 && currentISTHour < 12;
    const lastAiMessage = messages.slice().reverse().find(msg => msg.sender === 'ai');

    if (isKruthikaActiveHours) {
        if (lastAiMessage) {
            const now = new Date();
            const lastSeenTime = new Date(lastAiMessage.timestamp);
            const diffMs = now.getTime() - lastSeenTime.getTime();
            const diffMins = Math.round(diffMs / 60000);
            if (diffMins < 3) return "online";
        } else return "online";
    }
    if (lastAiMessage) {
      const now = new Date();
      const lastSeenTime = new Date(lastAiMessage.timestamp);
      const diffMs = now.getTime() - lastSeenTime.getTime();
      const diffMins = Math.round(diffMs / 60000);
      const todayISTString = new Date().toLocaleDateString("en-US", {timeZone: "Asia/Kolkata"});
      const lastSeenDateISTString = lastSeenTime.toLocaleDateString("en-US", {timeZone: "Asia/Kolkata"});
      if (diffMins < 1) return `last seen just now`;
      if (diffMins < 60) return `last seen ${diffMins}m ago`;
      if (todayISTString === lastSeenDateISTString) return `last seen today at ${lastSeenTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata', hour12: true })}`;
      else {
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        const yesterdayISTString = yesterday.toLocaleDateString("en-US", {timeZone: "Asia/Kolkata"});
        if (lastSeenDateISTString === yesterdayISTString) return `last seen yesterday at ${lastSeenTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata', hour12: true })}`;
        return `last seen ${lastSeenTime.toLocaleDateString([], { month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' })}`;
      }
    }
    if (isKruthikaActiveHours) return "online";
    if (currentISTHour >= 12 && currentISTHour < 17) return `probably busy, back in morning`;
    if (currentISTHour >= 17 && currentISTHour < 21) return `winding down, back tomorrow`;
    return `sleeping, back at 5 AM IST`;
  }, [messages, isAiTyping]);

  const handleOpenAvatarZoom = () => {
    if (isLoadingAIProfile || !globalAIProfile?.avatarUrl) return;
    setZoomedAvatarUrl(globalAIProfile.avatarUrl);
    setShowZoomedAvatarDialog(true);
  };

  const handleCallVideoClick = () => {
    if (isLoadingAdSettings || !adSettings) return;
    if (adSettings && adSettings.adsEnabledGlobally) {
        tryShowAdAndMaybeInterstitial("Connecting...");
    } else {
        toast({title: "Call Feature", description: "Calls are simulated and may trigger ads if enabled.", duration: 3000});
    }
  };

  const displayAIProfile = globalAIProfile || defaultAIProfile;

  if (isLoadingAIProfile || !globalAIProfile || isLoadingAdSettings || isLoadingMediaAssets || isLoadingChatState ) {
    return <div className="flex justify-center items-center h-screen bg-chat-bg-default text-foreground">Loading Kruthika's Chat...</div>;
  }

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto bg-chat-bg-default shadow-2xl">
      <ChatHeader
        aiName={displayAIProfile.name}
        aiAvatarUrl={displayAIProfile.avatarUrl}
        onlineStatus={onlineStatus}
        onAvatarClick={handleOpenAvatarZoom}
        onCallClick={handleCallVideoClick}
        onVideoClick={handleCallVideoClick}
      />
      <ChatView
        messages={messages}
        aiAvatarUrl={displayAIProfile.avatarUrl}
        aiName={displayAIProfile.name}
        isAiTyping={isAiTyping}
        onTriggerAd={handleBubbleAdTrigger}
      />

      {showInterstitialAd && (
        <SimulatedAdPlaceholder
          type="interstitial"
          onClose={() => {
            setShowInterstitialAd(false);
            if(interstitialAdTimerRef.current) clearTimeout(interstitialAdTimerRef.current);
          }}
          message={interstitialAdMessage}
          duration={REWARD_AD_INTERSTITIAL_DURATION_MS}
        />
      )}

      <BannerAdDisplay adType="standard" placementKey="chatViewBottomStandard" className="mx-auto w-full max-w-md" />

      <div className="my-1 mx-auto w-full max-w-md">
        <BannerAdDisplay adType="native" placementKey="chatViewBottomNative" />
      </div>


      <ChatInput onSendMessage={handleSendMessage} isAiTyping={isAiTyping} />

       <Dialog open={showZoomedAvatarDialog} onOpenChange={setShowZoomedAvatarDialog}>
          <DialogContent
            className="fixed left-[50%] top-[50%] z-50 grid w-[90vw] max-w-xs translate-x-[-50%] translate-y-[-50%] border bg-neutral-900 p-0 shadow-lg duration-200 sm:rounded-lg flex flex-col overflow-hidden aspect-square max-h-[90vw] sm:max-h-[70vh]"
          >
              <DialogHeader className="flex flex-row items-center space-x-2 p-3 bg-neutral-800/80 backdrop-blur-sm sticky top-0 z-10">
                <DialogClose asChild>
                  <Button variant="ghost" size="icon" className="text-neutral-300 hover:text-white h-9 w-9">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </DialogClose>
                <DialogTitle className="text-lg font-semibold text-white">{displayAIProfile.name}</DialogTitle>
              </DialogHeader>

              <div className="relative flex-1 w-full bg-black flex items-center justify-center overflow-hidden">
                {zoomedAvatarUrl && (
                  <Image
                    key={`zoomed-${zoomedAvatarUrl}`}
                    src={zoomedAvatarUrl}
                    alt={`${displayAIProfile.name}'s zoomed avatar`}
                    fill
                    style={{ objectFit: 'contain' }}
                    className="rounded-sm"
                    data-ai-hint="profile woman large"
                    priority={true}
                    unoptimized // For original quality as requested for status, applying here too
                  />
                )}
              </div>

              <DialogFooter className="p-3 bg-neutral-800/80 backdrop-blur-sm flex flex-row justify-around items-center border-t border-neutral-700 sticky bottom-0 z-10 mt-auto">
                <Button variant="ghost" size="icon" className="text-neutral-200 hover:text-white hover:bg-neutral-700/70 flex flex-col items-center h-auto p-2" onClick={() => setShowZoomedAvatarDialog(false)}>
                  <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="text-xs mt-1">Message</span>
                </Button>
                <Button variant="ghost" size="icon" className="text-neutral-200 hover:text-white hover:bg-neutral-700/70 flex flex-col items-center h-auto p-2" onClick={handleCallVideoClick}>
                  <Phone className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="text-xs mt-1">Audio</span>
                </Button>
                <Button variant="ghost" size="icon" className="text-neutral-200 hover:text-white hover:bg-neutral-700/70 flex flex-col items-center h-auto p-2" onClick={handleCallVideoClick}>
                  <Video className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="text-xs mt-1">Video</span>
                </Button>
                <Button variant="ghost" size="icon" className="text-neutral-200 hover:text-white hover:bg-neutral-700/70 flex flex-col items-center h-auto p-2" onClick={() => alert('View contact info - Not implemented')}>
                  <Info className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="text-xs mt-1">Info</span>
                </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
};

export default KruthikaChatPage;