"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'; // Added useCallback
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
  const [isLoadingAdSettings, setIsLoadingAdSettings] = useState(true); // Renamed from isLoading to isLoadingAdSettings for clarity

  const fetchAdSettings = useCallback(async () => {
    setIsLoadingAdSettings(true);
    try {
      // Check if Supabase is properly configured
      if (!supabase || typeof supabase.from !== 'function') {
        console.warn("Supabase not properly configured, using default ad settings.");
        setAdSettings(defaultAdSettings);
        return;
      }

      const { data, error } = await supabase
        .from('app_configurations')
        .select('settings')
        .eq('id', 'ad_settings_kruthika_chat_v1')
        .single();

      if (error) {
        console.error("Supabase error fetching ad settings:", error.message);
        setAdSettings(defaultAdSettings);
      } else if (data?.settings) {
        const adSettingsData = data.settings as AdSettings;
        setAdSettings(adSettingsData);
      } else {
        console.warn("No ad settings data returned from Supabase, using default.");
        setAdSettings(defaultAdSettings);
      }
    } catch (err) {
      console.error("Unexpected error fetching ad settings:", err);
      setAdSettings(defaultAdSettings);
    } finally {
      setIsLoadingAdSettings(false);
    }
  }, []); // Added dependency array

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