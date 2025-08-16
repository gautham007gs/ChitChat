"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import AppHeader from '@/components/AppHeader';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { AIProfile } from '@/types';
import { defaultAIProfile } from '@/config/ai';
import { MessageSquarePlus } from 'lucide-react';
import BannerAdDisplay from '@/components/chat/BannerAdDisplay';
import { useAIProfile } from '@/contexts/AIProfileContext'; 
import { cn } from '@/lib/utils';

const ChatListItem: React.FC<{ profile: AIProfile; lastMessage?: string; timestamp?: string; unreadCount?: number; }> = React.memo(({
  profile,
  lastMessage,
  timestamp = "",
  unreadCount,
}) => {
  const displayLastMessage = lastMessage || `Click to chat with ${profile.name}!`;

  const avatarUrlToUse = React.useMemo(() => {
    if (profile.avatarUrl && typeof profile.avatarUrl === 'string' && profile.avatarUrl.trim() !== '' && 
        (profile.avatarUrl.startsWith('http') || profile.avatarUrl.startsWith('data:'))) {
      return profile.avatarUrl;
    }
    return defaultAIProfile.avatarUrl;
  }, [profile.avatarUrl]);

  const handleAvatarError = React.useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error(`ChatListItem - AvatarImage load error for ${profile.name}. URL: ${avatarUrlToUse}`, e);
  }, [profile.name, avatarUrlToUse]);

  return (
    <Link href="/maya-chat" legacyBehavior>
      <a className="flex items-center p-3 bg-transparent hover:bg-secondary/50 cursor-pointer border-b border-border transition-colors">
        <div
          className={cn(
            "relative rounded-full mr-4 shrink-0",
            profile.name === "Kruthika" && "border-2 border-primary p-0.5" 
          )}
           key={`avatar-wrapper-${profile.name}-${avatarUrlToUse || 'default_wrapper_key_cli'}`}
        >
          <Avatar 
            className="h-12 w-12" 
            key={`avatar-comp-${profile.name}-${avatarUrlToUse || 'default_avatar_comp_key_cli'}`}
          >
            <AvatarImage 
              src={avatarUrlToUse || undefined} 
              alt={profile.name} 
              data-ai-hint="profile woman" 
              key={`chat-list-item-avatar-img-${profile.name}-${avatarUrlToUse || 'no_avatar_fallback_img_cli'}`}
              onError={handleAvatarError}
            />
            <AvatarFallback>{(profile.name || "K").charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-grow overflow-hidden min-w-0">
          <h2 className="font-semibold text-md truncate text-foreground">{profile.name}</h2>
          <p className="text-sm text-muted-foreground truncate">{displayLastMessage}</p>
        </div>
        <div className="flex flex-col items-end text-xs ml-2 shrink-0">
          <span className="text-muted-foreground mb-1">{timestamp}</span>
          {unreadCount && unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs font-semibold">
              {unreadCount}
            </span>
          )}
        </div>
      </a>
    </Link>
  );
});


const ChatListPage: React.FC = () => {
  const { aiProfile: globalAIProfile, isLoadingAIProfile } = useAIProfile(); 
  const [lastMessageTime, setLastMessageTime] = useState<string>("9:15 AM");

  useEffect(() => {
    const getLastMessageTime = () => {
      const lastInteraction = localStorage.getItem('messages_kruthika');
      if (lastInteraction) {
        try {
          const messagesArray = JSON.parse(lastInteraction);
          const lastMsg = messagesArray[messagesArray.length - 1];
          if (lastMsg?.timestamp) {
            const date = new Date(lastMsg.timestamp);
            const today = new Date();
            return date.toDateString() === today.toDateString() 
              ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
              : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
          }
        } catch (e) { console.warn("Could not parse last message time", e); }
      }
      return "9:15 AM";
    };

    setLastMessageTime(getLastMessageTime());
  }, []); 

  const currentGlobalAIProfile = useMemo(() => 
    globalAIProfile || defaultAIProfile, 
    [globalAIProfile]
  );

  const handleChatClick = useCallback(() => {
    // Preload chat page for faster navigation
    if (typeof window !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = '/maya-chat';
      document.head.appendChild(link);
    }
  }, []);


  if (isLoadingAIProfile) { 
    return (
      <div className="flex flex-col h-screen max-w-3xl mx-auto bg-background shadow-2xl">
        <AppHeader title="Chats" />
        <div className="flex-grow flex items-center justify-center text-muted-foreground">
          Loading Kruthika's profile...
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background text-foreground">
        <AppHeader />
        <main className="container mx-auto px-4 py-6 max-w-md space-y-6">
          <BannerAdDisplay adType="banner" className="mb-4" />

          <div className="text-center space-y-4">
            <div 
              className="relative cursor-pointer group"
              onClick={handleChatClick}
            >
              <Avatar className="w-24 h-24 mx-auto border-4 border-primary/20 transition-all duration-200 group-hover:border-primary/40 group-hover:scale-105">
                <AvatarImage 
                  src={currentGlobalAIProfile.avatarUrl} 
                  alt={currentGlobalAIProfile.name}
                  className="object-cover"
                />
                <AvatarFallback className="text-2xl font-bold">
                  {currentGlobalAIProfile.name?.charAt(0)?.toUpperCase() || 'M'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-background rounded-full"></div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                {currentGlobalAIProfile.name}
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {currentGlobalAIProfile.description}
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Online now
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Link 
              href="/maya-chat" 
              onClick={handleChatClick}
              className="block w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl text-center"
            >
              <div className="flex items-center justify-center gap-3">
                <MessageSquarePlus className="w-5 h-5" />
                Start Chatting with {currentGlobalAIProfile.name}
              </div>
            </Link>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-card border border-border rounded-lg p-4 text-center space-y-2">
                <h3 className="font-semibold text-foreground">Interests</h3>
                <div className="flex flex-wrap gap-1 justify-center">
                  {currentGlobalAIProfile.interests?.slice(0, 3).map((interest, index) => (
                    <span 
                      key={index}
                      className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-4 text-center space-y-2">
                <h3 className="font-semibold text-foreground">Language</h3>
                <p className="text-muted-foreground text-xs">
                  {currentGlobalAIProfile.language || 'English'}
                </p>
              </div>
            </div>
          </div>

          <BannerAdDisplay adType="native-banner" className="mt-6" />
        </main>
      </div>
    </>
  );
};

export default ChatListPage;