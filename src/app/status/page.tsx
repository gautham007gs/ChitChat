
'use client';

import React from 'react';
import { useAIProfile } from '@/contexts/AIProfileContext';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function StatusPage() {
  const { aiProfile, isLoadingAIProfile } = useAIProfile();

  if (isLoadingAIProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-100 p-4">
      <div className="max-w-md mx-auto">
        <Card className="bg-white/80 backdrop-blur-sm shadow-xl">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <Avatar className="w-24 h-24 mx-auto mb-4 ring-4 ring-pink-200">
                <AvatarImage 
                  src={aiProfile?.avatarUrl} 
                  alt={aiProfile?.name || 'Profile'} 
                />
                <AvatarFallback className="text-2xl bg-pink-200">
                  {aiProfile?.name?.[0] || 'K'}
                </AvatarFallback>
              </Avatar>
              
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                {aiProfile?.name || 'Kruthika'}
              </h1>
              
              <Badge variant="secondary" className="mb-4 bg-green-100 text-green-700">
                ● Online
              </Badge>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <p className="text-lg text-gray-700 mb-2">
                  {aiProfile?.status || '🌸 Living my best life! Let\'s chat! 🌸'}
                </p>
              </div>

              {aiProfile?.statusStoryImageUrl && (
                <div className="rounded-lg overflow-hidden">
                  <img 
                    src={aiProfile.statusStoryImageUrl} 
                    alt="Status story" 
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}

              <div className="text-center">
                <p className="text-gray-600">
                  {aiProfile?.statusStoryText || 'Ask me anything! 💬'}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-center">
                  <a 
                    href="/maya-chat"
                    className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-full font-medium transition-colors duration-200 shadow-lg hover:shadow-xl"
                  >
                    💬 Start Chat
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
