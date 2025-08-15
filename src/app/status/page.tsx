
'use client';

import React, { useState, useEffect } from 'react';
import { useAIProfile } from '@/contexts/AIProfileContext';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye, Heart, MessageCircle, MoreVertical, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import Image from 'next/image';

export default function StatusPage() {
  const { aiProfile, isLoadingAIProfile } = useAIProfile();
  const router = useRouter();
  const [timeAgo, setTimeAgo] = useState('2h ago');
  const [viewingStory, setViewingStory] = useState(false);

  useEffect(() => {
    // Simulate different time stamps
    const times = ['1h ago', '2h ago', '3h ago', '5h ago', '1d ago'];
    setTimeAgo(times[Math.floor(Math.random() * times.length)]);
  }, []);

  if (isLoadingAIProfile) {
    return (
      <div className="flex flex-col h-screen max-w-3xl mx-auto bg-background shadow-2xl">
        <AppHeader title="Status" />
        <div className="flex-grow flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading status...</p>
          </div>
        </div>
      </div>
    );
  }

  const displayName = aiProfile?.name || 'Maya';
  const displayAvatar = aiProfile?.avatarUrl || 'https://i.postimg.cc/52S3BZrM/images-10.jpg';
  const displayStatus = aiProfile?.status || '🌸 Living my best life! Let\'s chat! 🌸';

  if (viewingStory) {
    return (
      <div className="flex flex-col h-screen max-w-3xl mx-auto bg-black relative overflow-hidden">
        {/* Story Progress Bar */}
        <div className="absolute top-4 left-4 right-4 z-20">
          <div className="h-1 bg-gray-600 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>

        {/* Story Header */}
        <div className="absolute top-8 left-4 right-4 z-20 flex items-center justify-between pt-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 border-2 border-white">
              <AvatarImage src={displayAvatar} alt={displayName} />
              <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-600 text-white font-semibold">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-white font-semibold text-sm">{displayName}</p>
              <p className="text-white/80 text-xs">{timeAgo}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <MoreVertical className="h-5 w-5 text-white" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewingStory(false)}
              className="text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Story Image */}
        <div className="flex-1 relative">
          <Image
            src={displayAvatar}
            alt="Story"
            fill
            className="object-cover"
            priority
          />
          
          {/* Story Text Overlay */}
          <div className="absolute bottom-20 left-6 right-6 z-10">
            <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-4">
              <p className="text-white text-lg font-medium text-center">
                {displayStatus}
              </p>
            </div>
          </div>
        </div>

        {/* Story Actions */}
        <div className="absolute bottom-6 left-6 right-6 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
                <Heart className="h-5 w-5 mr-2" />
                Like
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={() => router.push('/maya-chat')}
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Reply
              </Button>
            </div>
            <div className="flex items-center space-x-2 text-white/80 text-sm">
              <Eye className="h-4 w-4" />
              <span>127</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto bg-background">
      <AppHeader title="Status" />
      
      <div className="flex-1 p-4 space-y-6">
        {/* My Status Section */}
        <div>
          <h2 className="text-lg font-semibold mb-3 text-muted-foreground">Recent updates</h2>
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setViewingStory(true)}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Avatar className="h-16 w-16 ring-2 ring-green-500 ring-offset-2">
                    <AvatarImage src={displayAvatar} alt={displayName} />
                    <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-600 text-white font-semibold text-lg">
                      {displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Badge className="absolute -bottom-1 -right-1 bg-green-500 text-white px-1.5 py-0.5 text-xs">
                    New
                  </Badge>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg truncate">{displayName}</h3>
                    <span className="text-sm text-muted-foreground">{timeAgo}</span>
                  </div>
                  <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                    {displayStatus}
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-1 text-muted-foreground text-xs">
                      <Eye className="h-4 w-4" />
                      <span>127 views</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Tap to view
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Button */}
        <div className="flex justify-center">
          <Button 
            onClick={() => router.push('/maya-chat')}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-3 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            Start Chatting with {displayName}
          </Button>
        </div>

        {/* Empty State for Other Status */}
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
            <Eye className="h-12 w-12 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-medium mb-2">No other status updates</h3>
          <p className="text-muted-foreground text-sm max-w-sm">
            When your friends post status updates, you'll see them here.
          </p>
        </div>
      </div>
    </div>
  );
}
