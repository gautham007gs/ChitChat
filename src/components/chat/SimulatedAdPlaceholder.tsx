
"use client";

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface SimulatedAdPlaceholderProps {
  type: 'banner' | 'interstitial' | 'native';
  onClose?: () => void;
  message?: string;
  duration?: number;
  className?: string;
}

const SimulatedAdPlaceholder: React.FC<SimulatedAdPlaceholderProps> = ({
  type,
  onClose,
  message = "Loading content...",
  duration = 3000,
  className = ""
}) => {
  useEffect(() => {
    if (type === 'interstitial' && duration && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [type, duration, onClose]);

  if (type === 'interstitial') {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-sm mx-4 text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full mx-auto mb-4 animate-pulse"></div>
            <p className="text-gray-700">{message}</p>
          </div>
          {onClose && (
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (type === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-blue-400 to-purple-500 text-white p-4 text-center ${className}`}>
        <p className="text-sm">{message}</p>
        {onClose && (
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="ml-2 text-white hover:text-gray-200"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  // Native ad
  return (
    <div className={`bg-gray-100 border rounded-lg p-4 ${className}`}>
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg"></div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{message}</p>
          <p className="text-xs text-gray-500">Sponsored content</p>
        </div>
        {onClose && (
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default SimulatedAdPlaceholder;
