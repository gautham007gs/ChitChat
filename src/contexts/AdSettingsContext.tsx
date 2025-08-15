
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { AdSettings } from '@/types';
import { AD_SETTINGS_CONFIG_KEY } from '@/types'; // Corrected import path
import { defaultAdSettings } from '@/config/ai'; // defaultAdSettings is still from config/ai
import { supabase } from '@/lib/supabaseClient';

interface AdSettingsContextType {
  adSettings: AdSettings | null;
  isLoadingAdSettings: boolean;
  fetchAdSettings: () => Promise<void>; // Allow manual refetch if needed
}

const CACHED_AD_SETTINGS_KEY = 'cached_ad_settings_kruthika_chat';

const AdSettingsContext = createContext<AdSettingsContextType | undefined>(undefined);

export const AdSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [adSettings, setAdSettings] = useState<AdSettings | null>(null);
  const [isLoadingAdSettings, setIsLoadingAdSettings] = useState(true);

  const fetchAdSettings = async () => {
    setIsLoadingAdSettings(true);
    if (!supabase) {
      console.warn("Supabase client not available for fetching ad settings. Using defaults.");
      setAdSettings(defaultAdSettings);
      setIsLoadingAdSettings(false);
      return;
    }
    
    // --- Caching Logic ---
    // Check for cached settings first
    if (typeof window !== 'undefined') {
      const cachedSettings = localStorage.getItem(CACHED_AD_SETTINGS_KEY);
      if (cachedSettings) {
        try {
          setAdSettings(JSON.parse(cachedSettings) as AdSettings);
        } catch (e) { console.error("Failed to parse cached ad settings", e); } // Handle potential parsing errors
      }
      // Note: The cache is read on mount for faster initial load.
      // The latest settings are always fetched from Supabase afterward.
      // Consider implementing a cache invalidation strategy (e.g., using versions or real-time updates)
      // if immediate updates across active sessions are required.
    }

    try {
      const { data, error } = await supabase
        .from('app_configurations')
        .select('settings')
        .eq('id', AD_SETTINGS_CONFIG_KEY)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116: ' relazione «app_configurations» non trovata o nessuna riga corrisponde al filtro' (no rows found)
        console.error('Error fetching ad settings from Supabase:', error);
        setAdSettings(defaultAdSettings); // Fallback to defaults on error
      } else if (data && data.settings) {
        // Merge fetched settings with defaults to ensure all keys are present
        // Ensure fetched settings override defaults where keys match.
        const mergedSettings = { ...defaultAdSettings, ...(data.settings as Partial<AdSettings>) }; // Cast as Partial<AdSettings> for safety
        localStorage.setItem(CACHED_AD_SETTINGS_KEY, JSON.stringify(mergedSettings)); // Cache the fetched settings
        setAdSettings(mergedSettings);
      } else {
        // No settings found in Supabase, use defaults (admin might save them later)
        setAdSettings(defaultAdSettings);
      }
    } catch (e) {
      console.error('Unexpected error fetching ad settings:', e);
      setAdSettings(defaultAdSettings); // Fallback to defaults
    } finally {
      setIsLoadingAdSettings(false);
    }
  };

  useEffect(() => {
    fetchAdSettings();
  }, []);

  return (
    <AdSettingsContext.Provider value={{ adSettings, isLoadingAdSettings, fetchAdSettings }}>
      {children}
    </AdSettingsContext.Provider>
  );
};

export const useAdSettings = (): AdSettingsContextType => {
  const context = useContext(AdSettingsContext);
  if (context === undefined) {
    throw new Error('useAdSettings must be used within an AdSettingsProvider');
  }
  return context;
};
