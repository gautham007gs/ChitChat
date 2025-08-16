
import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import type { Message } from '@/types';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

interface ChatViewProps {
  messages: Message[];
  aiAvatarUrl: string;
  aiName: string;
  isAiTyping: boolean;
  onTriggerAd?: () => void;
}

const ChatView: React.FC<ChatViewProps> = ({ 
  messages, 
  aiAvatarUrl, 
  aiName, 
  isAiTyping, 
  onTriggerAd 
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  // Optimize message rendering by memoizing message bubbles
  const messageElements = useMemo(() => {
    return messages.map((msg) => (
      <MessageBubble 
        key={msg.id} 
        message={msg} 
        aiAvatarUrl={aiAvatarUrl} 
        aiName={aiName} 
        onTriggerAd={onTriggerAd}
      />
    ));
  }, [messages, aiAvatarUrl, aiName, onTriggerAd]);

  useEffect(() => {
    // Use requestAnimationFrame for smoother scrolling
    const scrollTimeout = requestAnimationFrame(() => {
      scrollToBottom();
    });

    return () => cancelAnimationFrame(scrollTimeout);
  }, [messages.length, scrollToBottom]);

  return (
    <div 
      ref={containerRef}
      className="flex-grow overflow-y-auto p-4 space-y-4 bg-chat-bg-default custom-scrollbar"
      style={{ 
        scrollBehavior: 'smooth',
        willChange: 'scroll-position'
      }}
    >
      {messageElements}
      {isAiTyping && <TypingIndicator avatarUrl={aiAvatarUrl} />}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default React.memo(ChatView);
