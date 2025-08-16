
"use client";

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Image as ImageIcon, Camera, Smile, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ChatInputProps {
  onSendMessage: (text: string, imageUri?: string) => void;
  isAiTyping: boolean;
}

const MAX_MESSAGE_LENGTH = 1000;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isAiTyping }) => {
  const [message, setMessage] = useState('');
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const canSend = useMemo(() => {
    return (message.trim().length > 0 || selectedImageUri) && !isAiTyping && !isUploading;
  }, [message, selectedImageUri, isAiTyping, isUploading]);

  const handleSend = useCallback(() => {
    if (!canSend) return;

    const textToSend = message.trim();
    if (!textToSend && !selectedImageUri) return;

    onSendMessage(textToSend, selectedImageUri || undefined);
    setMessage('');
    setSelectedImageUri(null);
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [message, selectedImageUri, onSendMessage, canSend]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    
    reader.onload = (event) => {
      setSelectedImageUri(event.target?.result as string);
      setIsUploading(false);
    };
    
    reader.onerror = () => {
      toast({
        title: "Upload failed",
        description: "Failed to process the image. Please try again.",
        variant: "destructive",
      });
      setIsUploading(false);
    };
    
    reader.readAsDataURL(file);
  }, [toast]);

  const removeImage = useCallback(() => {
    setSelectedImageUri(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const adjustTextareaHeight = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }, []);

  const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_MESSAGE_LENGTH) {
      setMessage(value);
      adjustTextareaHeight(e);
    }
  }, [adjustTextareaHeight]);

  return (
    <div className="border-t border-border bg-background p-4">
      {selectedImageUri && (
        <div className="mb-3 relative inline-block">
          <img
            src={selectedImageUri}
            alt="Selected"
            className="max-w-32 max-h-32 rounded-lg object-cover border"
          />
          <Button
            onClick={removeImage}
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => fileInputRef.current?.click()}
            disabled={isAiTyping || isUploading}
          >
            {isUploading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <ImageIcon className="h-5 w-5" />
            )}
          </Button>
        </div>

        <div className="flex-grow relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleMessageChange}
            onKeyDown={handleKeyPress}
            placeholder={isAiTyping ? "Maya is typing..." : "Type a message..."}
            disabled={isAiTyping}
            className={cn(
              "min-h-[44px] max-h-[120px] resize-none pr-12 scrollbar-thin",
              "focus:ring-2 focus:ring-primary focus:border-transparent"
            )}
            style={{ lineHeight: '1.5' }}
          />
          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
            {message.length}/{MAX_MESSAGE_LENGTH}
          </div>
        </div>

        <Button
          onClick={handleSend}
          disabled={!canSend}
          size="icon"
          className={cn(
            "h-11 w-11 transition-all duration-200",
            canSend 
              ? "bg-primary hover:bg-primary/90 scale-100" 
              : "bg-muted scale-95 opacity-50"
          )}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default React.memo(ChatInput);
