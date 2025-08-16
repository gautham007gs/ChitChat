import React, { useEffect, useRef, useMemo, useContext, useCallback } from 'react';
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

  // Placeholder for handleSendMessage, assuming it's defined elsewhere or will be added.
  // The provided changes suggest it should be memoized with useCallback.
  // If handleSendMessage was intended to be part of this component's logic,
  // it would typically be defined here. For now, we'll assume it's managed
  // in a parent component or context based on the provided snippets referencing `aiProfile`.
  // Since `aiProfile` is not defined in this component's props or context,
  // and the changes attempt to close a useCallback for `handleSendMessage`
  // with `[messages, aiProfile]`, this implies `handleSendMessage` is either
  // defined in a parent or imported, and its definition here would be a guess.
  // The provided changes only modify imports and add useCallback wrappers,
  // not define the function itself. Therefore, the original structure of ChatView
  // is maintained regarding the absence of handleSendMessage definition.

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