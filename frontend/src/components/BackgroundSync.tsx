import { useUser } from "@stackframe/stack";
import { useEffect, useRef, useState } from "react";
import { offlineAPI } from "../services/api";
import { SyncToast } from "./Shared/SyncToast";
import { User } from "../types";

// LocalStorage keys
const OUTINGS_CACHE_KEY = "cached_outings";
const ROSTER_CACHE_PREFIX = "cached_roster_";

export const BackgroundSync: React.FC = () => {
  const { isSignedIn, isLoaded } = useUser();
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [backendUser, setBackendUser] = useState<User | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch user from backend to get role
  useEffect(() => {
    // Wait for Stack Auth to be fully loaded
    if (!isLoaded) {
      console.debug("BackgroundSync: Waiting for Stack Auth to load");
      return;
    }

    if (!isSignedIn) {
      console.debug("BackgroundSync: User not signed in");
      setBackendUser(null);
      return;
    }

    const fetchUser = async () => {
      try {
        console.debug("BackgroundSync: Fetching user from backend");
        // Use bulk data endpoint to get user info
        const data = await offlineAPI.getBulkData();
        setBackendUser(data.user);
        console.debug("BackgroundSync: Fetched user from backend", {
          role: data.user.role,
        });
      } catch (error) {
        console.error("BackgroundSync: Failed to fetch user", error);
      }
    };

    fetchUser();
  }, [isSignedIn, isLoaded]);

  // Check if user has admin role from backend
  const isAdmin = backendUser?.role === "admin";

  useEffect(() => {
    console.debug("BackgroundSync: Component mounted", {
      isSignedIn,
      isAdmin,
      role: backendUser?.role,
      userId: backendUser?.id,
    });
    // Only run if user is signed in and is admin
    if (!isSignedIn || !backendUser || !isAdmin) {
      console.debug(
        "BackgroundSync: Skipping sync, user not admin or not logged in",
        { role: backendUser?.role }
      );
      return;
    }
    if (!navigator.onLine) {
      console.debug("BackgroundSync: Skipping sync, offline");
      return;
    }

    const doSync = async () => {
      console.debug("BackgroundSync: Sync started");
      try {
        // Fetch all data in a single request
        const data = await offlineAPI.getBulkData();
        
        // Cache user object for offline admin detection
        localStorage.setItem("cached_user", JSON.stringify(data.user));
        console.debug("BackgroundSync: cached_user updated");
        
        // Cache outings
        localStorage.setItem(OUTINGS_CACHE_KEY, JSON.stringify(data.outings));
        console.debug("BackgroundSync: Outings synced");

        // Cache rosters
        for (const [outingId, roster] of Object.entries(data.rosters)) {
          localStorage.setItem(
            `${ROSTER_CACHE_PREFIX}${outingId}`,
            JSON.stringify(roster)
          );
        }
        console.debug("BackgroundSync: Rosters synced");
        
        setToastMsg("Outings and rosters synced");
      } catch (err) {
        setToastMsg("Sync failed");
        console.error("BackgroundSync: Sync failed", err);
      }
      console.debug("BackgroundSync: Sync finished");
    };

    // Force immediate sync on mount
    setTimeout(doSync, 0);
    // Sync every 5 minutes instead of every minute
    intervalRef.current = setInterval(doSync, 5 * 60 * 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isSignedIn, isAdmin, backendUser]);

  return toastMsg ? <SyncToast message={toastMsg} /> : null;
};

