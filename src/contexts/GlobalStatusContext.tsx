
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { AdminStatusDisplay, ManagedContactStatus } from '@/types';
import { ADMIN_OWN_STATUS_CONFIG_KEY, MANAGED_DEMO_CONTACTS_CONFIG_KEY } from '@/types';
import { adminStatusConfig, managedContactsConfig } from '@/config/ai';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

interface GlobalStatusContextType {
  adminOwnStatus: AdminStatusDisplay | null;
  managedDemoContacts: ManagedContactStatus[] | null;
  isLoadingGlobalStatuses: boolean;
  fetchGlobalStatuses: () => Promise<void>;
}

const GlobalStatusContext = createContext<GlobalStatusContextType | undefined>(undefined);

export const GlobalStatusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [adminOwnStatus, setAdminOwnStatus] = useState<AdminStatusDisplay | null>(null);
  const [managedDemoContacts, setManagedDemoContacts] = useState<ManagedContactStatus[] | null>(null);
  const [isLoadingGlobalStatuses, setIsLoadingGlobalStatuses] = useState(true);
  const { toast } = useToast();

  const fetchGlobalStatuses = useCallback(async () => {
    setIsLoadingGlobalStatuses(true);
    if (!supabase) {
      console.warn("Supabase client not available for fetching global statuses. Using defaults.");
      setAdminOwnStatus(adminStatusConfig);
      setManagedDemoContacts(managedContactsConfig);
      setIsLoadingGlobalStatuses(false);
      return;
    }

    try {
      // Fetch Admin's Own Status
      const { data: adminStatusData, error: adminStatusError } = await supabase
        .from('app_configurations')
        .select('settings')
        .eq('id', ADMIN_OWN_STATUS_CONFIG_KEY)
        .single();

      if (adminStatusError && adminStatusError.code !== 'PGRST116') {
        console.error('Error fetching admin own status from Supabase:', adminStatusError);
        setAdminOwnStatus(adminStatusConfig);
      } else if (adminStatusData && adminStatusData.settings) {
        setAdminOwnStatus({ ...adminStatusConfig, ...(adminStatusData.settings as AdminStatusDisplay) });
      } else {
        setAdminOwnStatus(adminStatusConfig);
      }

      // Fetch Managed Demo Contacts
      const { data: demoContactsData, error: demoContactsError } = await supabase
        .from('app_configurations')
        .select('settings')
        .eq('id', MANAGED_DEMO_CONTACTS_CONFIG_KEY)
        .single();

      if (demoContactsError && demoContactsError.code !== 'PGRST116') {
        console.error('Error fetching managed demo contacts from Supabase:', demoContactsError);
        setManagedDemoContacts(managedContactsConfig);
      } else if (demoContactsData && Array.isArray(demoContactsData.settings)) {
        const fetchedContacts = demoContactsData.settings as ManagedContactStatus[];
        setManagedDemoContacts(fetchedContacts);
      } else {
        setManagedDemoContacts(managedContactsConfig);
      }

    } catch (error) {
      console.error('Unexpected error fetching global statuses:', error);
      setAdminOwnStatus(adminStatusConfig);
      setManagedDemoContacts(managedContactsConfig);
    } finally {
      setIsLoadingGlobalStatuses(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchGlobalStatuses();
  }, [fetchGlobalStatuses]);

  return (
    <GlobalStatusContext.Provider value={{
      adminOwnStatus,
      managedDemoContacts,
      isLoadingGlobalStatuses,
      fetchGlobalStatuses
    }}>
      {children}
    </GlobalStatusContext.Provider>
  );
};

export const useGlobalStatus = (): GlobalStatusContextType => {
  const context = useContext(GlobalStatusContext);
  if (context === undefined) {
    throw new Error('useGlobalStatus must be used within a GlobalStatusProvider');
  }
  return context;
};
