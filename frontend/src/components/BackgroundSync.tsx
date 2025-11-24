
import { useUser } from '@clerk/clerk-react';
import { useEffect, useRef, useState } from 'react';
import { outingAPI, signupAPI, userAPI } from '../services/api';
import { SyncToast } from './Shared/SyncToast';
import { User } from '../types';

// LocalStorage keys
const OUTINGS_CACHE_KEY = 'cached_outings';
const ROSTER_CACHE_PREFIX = 'cached_roster_';

export const BackgroundSync: React.FC = () => {
  const { isSignedIn } = useUser();
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [backendUser, setBackendUser] = useState<User | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch user from backend to get role
  useEffect(() => {
    if (!isSignedIn) {
      setBackendUser(null);
      return;
    }

    const fetchUser = async () => {
      try {
        const user = await userAPI.getCurrentUser();
        setBackendUser(user);
        console.debug('BackgroundSync: Fetched user from backend', { role: user.role });
      } catch (error) {
        console.error('BackgroundSync: Failed to fetch user', error);
      }
    };

    fetchUser();
  }, [isSignedIn]);

  // Check if user has admin role from backend
  const isAdmin = backendUser?.role === 'admin';

  useEffect(() => {
    console.debug('BackgroundSync: Component mounted', { isSignedIn, isAdmin, role: backendUser?.role, userId: backendUser?.id });
    // Only run if user is signed in and is admin
    if (!isSignedIn || !backendUser || !isAdmin) {
      console.debug('BackgroundSync: Skipping sync, user not admin or not logged in', { role: backendUser?.role });
      return;
    }
    if (!navigator.onLine) {
      console.debug('BackgroundSync: Skipping sync, offline');
      return;
    }

    const doSync = async () => {
      console.debug('BackgroundSync: Sync started');
      try {
        // Always cache user object for offline admin detection
        if (backendUser) {
          localStorage.setItem('cached_user', JSON.stringify(backendUser));
          console.debug('BackgroundSync: cached_user updated');
        }
        // 1. Sync all outings
        const outings = await outingAPI.getAll();
        localStorage.setItem(OUTINGS_CACHE_KEY, JSON.stringify(outings));
        console.debug('BackgroundSync: Outings synced');

        // 2. Sync all rosters for each outing
        await Promise.all(
          outings.map(async (outing) => {
            const roster = await signupAPI.getByOuting(outing.id);
            localStorage.setItem(`${ROSTER_CACHE_PREFIX}${outing.id}`, JSON.stringify(roster));
          })
        );
        console.debug('BackgroundSync: Rosters synced');
        setToastMsg('Outings and rosters synced');
      } catch (err) {
        setToastMsg('Sync failed');
        console.error('BackgroundSync: Sync failed', err);
      }
      console.debug('BackgroundSync: Sync finished');
    };

    // Force immediate sync on mount
    setTimeout(doSync, 0);
    intervalRef.current = setInterval(doSync, 60 * 1000); // Every minute
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isSignedIn, isAdmin, backendUser]);

  return toastMsg ? <SyncToast message={toastMsg} /> : null;
};
