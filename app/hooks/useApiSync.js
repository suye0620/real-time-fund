'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useStorageStore, storageStore } from '../stores/storageStore';
import { fetchAllState, uploadState, isApiConfigured } from '../lib/apiClient';

const SYNC_KEYS = [
  'funds', 'favorites', 'groups', 'collapsedCodes', 'collapsedTrends',
  'collapsedEarnings', 'refreshMs', 'holdings', 'groupHoldings',
  'pendingTrades', 'transactions', 'dcaPlans', 'customSettings',
  'fundDailyEarnings', 'tags',
];

export function useApiSync() {
  const [ready, setReady] = useState(!isApiConfigured());
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  const syncDebounceRef = useRef(null);
  const dirtyKeysRef = useRef(new Set());
  const skipSyncRef = useRef(false);

  // On mount: pull all state from API and prime localStorage
  useEffect(() => {
    if (!isApiConfigured()) return;

    (async () => {
      try {
        setIsSyncing(true);
        const allState = await fetchAllState();
        skipSyncRef.current = true;
        for (const key of SYNC_KEYS) {
          if (key in allState && allState[key] !== undefined && allState[key] !== null) {
            const val = typeof allState[key] === 'string' ? allState[key] : JSON.stringify(allState[key]);
            storageStore.setItem(key, val);
          }
        }
        skipSyncRef.current = false;
        setLastSyncTime(new Date().toISOString());
      } catch (err) {
        console.warn('Failed to fetch state from API, using local data:', err.message);
      } finally {
        setIsSyncing(false);
        setReady(true);
      }
    })();
  }, []);

  // Inject onSync callback into storageStore
  const { setOnSync } = useStorageStore();

  useEffect(() => {
    if (!isApiConfigured()) return;

    const triggerSync = (key) => {
      if (key === '__clear__') return;
      if (skipSyncRef.current) return;

      dirtyKeysRef.current.add(key);

      if (syncDebounceRef.current) clearTimeout(syncDebounceRef.current);
      syncDebounceRef.current = setTimeout(async () => {
        const keysToSync = new Set(dirtyKeysRef.current);
        dirtyKeysRef.current.clear();

        for (const k of keysToSync) {
          try {
            const val = storageStore.getItem(k);
            if (val !== null && val !== undefined) {
              await uploadState(k, JSON.stringify(val));
            }
          } catch (err) {
            console.warn(`Failed to sync ${k} to API:`, err.message);
          }
        }
      }, 2000);
    };

    setOnSync(triggerSync);
  }, [setOnSync]);

  const manualSync = useCallback(async () => {
    if (!isApiConfigured()) return;
    setIsSyncing(true);
    try {
      // Push all local data first
      for (const key of SYNC_KEYS) {
        try {
          const val = storageStore.getItem(key);
          if (val !== null && val !== undefined) {
            await uploadState(key, JSON.stringify(val));
          }
        } catch { /* continue */ }
      }
      // Then pull
      const allState = await fetchAllState();
      skipSyncRef.current = true;
      for (const key of SYNC_KEYS) {
        if (key in allState && allState[key] !== undefined && allState[key] !== null) {
          const val = typeof allState[key] === 'string' ? allState[key] : JSON.stringify(allState[key]);
          storageStore.setItem(key, val);
        }
      }
      skipSyncRef.current = false;
      setLastSyncTime(new Date().toISOString());
    } catch (err) {
      console.warn('Manual sync failed:', err.message);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return { ready, isSyncing, lastSyncTime, manualSync };
}
