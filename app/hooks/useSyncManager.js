'use client';

import { useMemo } from 'react';
import { storageStore } from '../stores/storageStore';

// Re-export from dailyEarnings for backward compatibility
export { normalizeFundDailyEarningsScoped } from '../lib/dailyEarnings';

/**
 * Stub — Supabase sync has been replaced by useApiSync.
 * Returns noop values so page.jsx doesn't need major refactoring.
 */
export function useSyncManager() {
  const storageHelper = useMemo(() => storageStore, []);

  return {
    isSyncing: false,
    lastSyncTime: null,
    scheduleSync: () => {},
    syncUserConfig: () => {},
    fetchCloudConfig: () => {},
    applyCloudConfig: () => {},
    handleSyncLocalConfig: () => {},
    triggerCustomSettingsSync: () => {},
    skipSyncRef: { current: false },
    deviceConflictModalOpenRef: { current: false },
    storageHelper,
  };
}
