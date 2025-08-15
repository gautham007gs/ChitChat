
'use client';

import React, { useState, useEffect } from 'react';
import { useAIProfile } from '@/contexts/AIProfileContext';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye, Heart, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import Image from 'next/image';

export default function StatusPage() {
  const { aiProfile, isLoadingAIProfile } = useAIProfile();
  const router = useRouter();
  const [timeAgo, setTimeAgo] = useState('2h');

  useEffect(() => {
    // Simulate different time stamps
    const times = ['1h', '2h', '3h', '5h', '1d'];
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

  const statusStories = [
    {
      id: 1,
      user: aiProfile?.name || 'Kruthika',
      avatar: aiProfile?.avatarUrl || '',
      time: timeAgo,
      image: aiProfile?.statusStoryImageUrl || '',
      text: aiProfile?.statusStoryText || aiProfile?.status || '🌸 Living my best life! Let\'s chat! 🌸',
      views: Math.floor(Math.random() * 50) + 10,
      isOwn: true
    }
  ];

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto bg-background shadow-2xl">
      <AppHeader title="Status" />
      
      <div className="flex-grow overflow-y-auto custom-scrollbar">
        <div className="p-4 space-y-4">
          {/* My Status Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-foreground">Recent updates</h2>
            
            {statusStories.map((story) => (
              <Card key={story.id} className="bg-card border-border overflow-hidden">
                <CardContent className="p-0">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 pb-2">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10 ring-2 ring-primary ring-offset-2">
                          <AvatarImage src={story.avatar} alt={story.user} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {story.user[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {story.isOwn && (
                          <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
                            <div className="w-2 h-2 bg-background rounded-full"></div>
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{story.user}</h3>
                        <p className="text-sm text-muted-foreground">{story.time} ago</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      ● Online
                    </Badge>
                  </div>

                  {/* Status Image */}
                  {story.image && (
                    <div className="relative w-full h-64 bg-black">
                      <Image
                        src={story.image}
                        alt="Status"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}

                  {/* Status Text */}
                  <div className="p-4">
                    <p className="text-foreground mb-3">{story.text}</p>
                    
                    {/* Status Stats */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Eye className="h-4 w-4" />
                          <span>{story.views}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Heart className="h-4 w-4" />
                          <span>{Math.floor(story.views * 0.3)}</span>
                        </div>
                      </div>
                      <div className="text-xs">
                        Today {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="px-4 pb-4 pt-2 border-t border-border">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push('/maya-chat')}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Reply
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="px-3"
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Call to Action */}
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold mb-2 text-foreground">Start a conversation!</h3>
              <p className="text-muted-foreground mb-4">
                {aiProfile?.name} is online and ready to chat with you.
              </p>
              <Button 
                onClick={() => router.push('/maya-chat')}
                className="bg-primary hover:bg-primary/90"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
