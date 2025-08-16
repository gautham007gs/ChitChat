"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import AppHeader from '@/components/AppHeader';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { AIProfile } from '@/types';
import { defaultAIProfile } from '@/config/ai';
import { MessageSquarePlus, MessageCircle } from 'lucide-react';
import BannerAdDisplay from '@/components/chat/BannerAdDisplay';
import { useAIProfile } from '@/contexts/AIProfileContext'; 
import { cn } from '@/lib/utils';

const ChatListPage: React.FC = () => {
  const { aiProfile: globalAIProfile, isLoadingAIProfile } = useAIProfile(); 
  const [lastMessageTime, setLastMessageTime] = useState<string>("9:15 AM");
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();

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

  const handleChatClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsNavigating(true);

    // Preload and navigate immediately
    router.prefetch('/maya-chat');
    router.push('/maya-chat');
  }, [router]);

  const getLastMessage = useMemo(() => {
    const messages = localStorage.getItem('messages_kruthika');
    if (messages) {
      try {
        const parsed = JSON.parse(messages);
        const lastMsg = parsed[parsed.length - 1];
        return lastMsg?.text || `Click to chat with ${currentGlobalAIProfile.name}!`;
      } catch (e) {
        return `Click to chat with ${currentGlobalAIProfile.name}!`;
      }
    }
    return `Click to chat with ${currentGlobalAIProfile.name}!`;
  }, [currentGlobalAIProfile.name]);

  if (isLoadingAIProfile) { 
    return (
      <div className="flex flex-col h-screen max-w-3xl mx-auto bg-background shadow-2xl">
        <AppHeader title="Chats" />
        <div className="flex-grow flex items-center justify-center text-muted-foreground">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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

          {/* Quick Chat Card */}
          <div 
            onClick={handleChatClick}
            className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:bg-card/80 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
          >
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Avatar className="w-16 h-16 border-2 border-primary/20">
                  <AvatarImage 
                    src={currentGlobalAIProfile.avatarUrl} 
                    alt={currentGlobalAIProfile.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-lg font-bold">
                    {currentGlobalAIProfile.name?.charAt(0)?.toUpperCase() || 'M'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-background rounded-full"></div>
              </div>

              <div className="flex-grow min-w-0">
                <h2 className="text-lg font-semibold text-foreground">
                  {currentGlobalAIProfile.name}
                </h2>
                <p className="text-sm text-muted-foreground truncate">
                  {getLastMessage}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600">Online now</span>
                </div>
              </div>

              <div className="flex flex-col items-center text-xs text-muted-foreground">
                <span>{lastMessageTime}</span>
                <MessageCircle className="w-6 h-6 text-primary mt-2" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button 
              onClick={handleChatClick}
              disabled={isNavigating}
              className="block w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl text-center disabled:opacity-50"
            >
              <div className="flex items-center justify-center gap-3">
                {isNavigating ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <MessageSquarePlus className="w-5 h-5" />
                )}
                {isNavigating ? 'Opening Chat...' : `Start Chatting with ${currentGlobalAIProfile.name}`}
              </div>
            </button>

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