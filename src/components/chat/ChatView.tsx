
import React, { useEffect, useRef } from 'react';
import type { Message } from '@/types';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

// Consider implementing list virtualization (e.g., with react-window) for better performance with very large message lists.

interface ChatViewProps {
  messages: Message[];
  aiAvatarUrl: string;
  aiName: string;
  isAiTyping: boolean;
  onTriggerAd?: () => void; // New prop for handling ad clicks from bubbles
}

const ChatView: React.FC<ChatViewProps> = ({ messages, aiAvatarUrl, aiName, isAiTyping, onTriggerAd }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages.length]); // Scroll to bottom when a new message is added

  return (
    <div 
      className="flex-grow overflow-y-auto p-4 space-y-4 bg-chat-bg-default custom-scrollbar"
    >
      {messages.map((msg) => (
        <MessageBubble 
            key={msg.id} 
            message={msg} 
            aiAvatarUrl={aiAvatarUrl} 
            aiName={aiName} 
            onTriggerAd={onTriggerAd} // Pass down the callback
        />
      ))}
      {isAiTyping && <TypingIndicator avatarUrl={aiAvatarUrl} />}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatView;
    
