import useSWR, { SWRConfiguration, mutate } from 'swr';
import { outingAPI, familyAPI, signupAPI, userAPI } from '../services/api';
import {
    Outing,
    FamilyMemberListResponse,
    FamilyMemberSummary,
    SignupResponse,
    User,
} from '../types';

// SWR Configuration
export const swrConfig: SWRConfiguration = {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
    errorRetryCount: 3,
    errorRetryInterval: 5000,
    shouldRetryOnError: true,
    // Keep data fresh for 30 seconds before revalidating
    focusThrottleInterval: 30000,
};

// Cache Keys - centralized for easy management
export const CACHE_KEYS = {
    outings: '/outings',
    availableOutings: '/outings/available',
    outing: (id: string) => `/outings/${id}`,
    familyMembers: '/family',
    familySummary: (outingId?: string) => 
        outingId ? `/family/summary?outing_id=${outingId}` : '/family/summary',
    mySignups: '/signups/my-signups',
    outingSignups: (outingId: string) => `/outings/${outingId}/signups`,
    currentUser: '/auth/me',
} as const;

// Custom Hooks

/**
 * Fetch all outings with caching
 */
export function useOutings() {
    const { data, error, isLoading, mutate: revalidate } = useSWR<Outing[]>(
        CACHE_KEYS.outings,
        async () => {
            const outings = await outingAPI.getAll();
            return outings;
        },
        swrConfig
    );

    return {
        outings: data,
        isLoading,
        isError: error,
        error,
        revalidate,
    };
}

/**
 * Fetch available outings (future outings only)
 */
export function useAvailableOutings() {
    const { data, error, isLoading, mutate: revalidate } = useSWR<Outing[]>(
        CACHE_KEYS.availableOutings,
        async () => {
            const outings = await outingAPI.getAll();
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return outings.filter(outing => {
                const outingDate = new Date(outing.outing_date);
                outingDate.setHours(0, 0, 0, 0);
                return outingDate >= today;
            });
        },
        swrConfig
    );

    return {
        outings: data,
        isLoading,
        isError: error,
        error,
        revalidate,
    };
}

/**
 * Fetch a specific outing by ID
 */
export function useOuting(id: string | null) {
    const { data, error, isLoading, mutate: revalidate } = useSWR<Outing>(
        id ? CACHE_KEYS.outing(id) : null,
        async () => {
            if (!id) throw new Error('Outing ID is required');
            return await outingAPI.getById(id);
        },
        swrConfig
    );

    return {
        outing: data,
        isLoading,
        isError: error,
        error,
        revalidate,
    };
}

/**
 * Fetch all family members for the current user
 */
export function useFamilyMembers() {
    const { data, error, isLoading, mutate: revalidate } = useSWR<FamilyMemberListResponse>(
        CACHE_KEYS.familyMembers,
        async () => {
            return await familyAPI.getAll();
        },
        swrConfig
    );

    return {
        familyMembers: data?.members || [],
        total: data?.total || 0,
        isLoading,
        isError: error,
        error,
        revalidate,
    };
}

/**
 * Fetch family member summary (for signup selection)
 * @param outingId - Optional outing ID to check youth protection expiration
 */
export function useFamilySummary(outingId?: string) {
    const { data, error, isLoading, mutate: revalidate } = useSWR<FamilyMemberSummary[]>(
        CACHE_KEYS.familySummary(outingId),
        async () => {
            // Bypass localStorage cache to ensure fresh network response during debugging
            return await familyAPI.getSummary(outingId, true);
        },
        {
            ...swrConfig,
            // Revalidate when outingId changes
            revalidateOnMount: true,
        }
    );

    return {
        familyMembers: data || [],
        isLoading,
        isError: error,
        error,
        revalidate,
    };
}

/**
 * Fetch current user's signups
 */
export function useMySignups() {
    const { data, error, isLoading, mutate: revalidate } = useSWR<SignupResponse[]>(
        CACHE_KEYS.mySignups,
        async () => {
            return await signupAPI.getMySignups();
        },
        swrConfig
    );

    return {
        signups: data || [],
        isLoading,
        isError: error,
        error,
        revalidate,
    };
}

/**
 * Fetch signups for a specific outing
 */
export function useOutingSignups(outingId: string | null) {
    const { data, error, isLoading, mutate: revalidate } = useSWR<SignupResponse[]>(
        outingId ? CACHE_KEYS.outingSignups(outingId) : null,
        async () => {
            if (!outingId) throw new Error('Outing ID is required');
            return await signupAPI.getByOuting(outingId);
        },
        swrConfig
    );

    return {
        signups: data || [],
        isLoading,
        isError: error,
        error,
        revalidate,
    };
}

/**
 * Fetch current user information
 */
export function useCurrentUser() {
    const { data, error, isLoading, mutate: revalidate } = useSWR<User>(
        CACHE_KEYS.currentUser,
        async () => {
            return await userAPI.getCurrentUser();
        },
        swrConfig
    );

    return {
        user: data,
        isLoading,
        isError: error,
        error,
        revalidate,
    };
}

// Cache Mutation Utilities

/**
 * Invalidate and refetch all outings-related caches
 */
export async function invalidateOutings() {
    await Promise.all([
        mutate(CACHE_KEYS.outings),
        mutate(CACHE_KEYS.availableOutings),
    ]);
}

/**
 * Invalidate a specific outing cache
 */
export async function invalidateOuting(id: string) {
    await mutate(CACHE_KEYS.outing(id));
}

/**
 * Invalidate all family-related caches
 */
export async function invalidateFamilyData() {
    // Invalidate all family summary caches (with and without outing IDs)
    await Promise.all([
        mutate(CACHE_KEYS.familyMembers),
        mutate((key) => typeof key === 'string' && key.startsWith('/family/summary')),
    ]);
}

/**
 * Invalidate all signup-related caches
 */
export async function invalidateSignups() {
    await Promise.all([
        mutate(CACHE_KEYS.mySignups),
        mutate((key) => typeof key === 'string' && key.includes('/signups')),
    ]);
}

/**
 * Invalidate current user cache
 */
export async function invalidateCurrentUser() {
    await mutate(CACHE_KEYS.currentUser);
}

/**
 * Optimistically update outings cache after a mutation
 */
export async function updateOutingCache(
    outingId: string,
    updater: (outing: Outing) => Outing
) {
    // Update specific outing
    await mutate(
        CACHE_KEYS.outing(outingId),
        async (currentOuting?: Outing) => {
            if (!currentOuting) return currentOuting;
            return updater(currentOuting);
        },
        { revalidate: false }
    );

    // Update in outings list
    await mutate(
        CACHE_KEYS.outings,
        async (currentOutings?: Outing[]) => {
            if (!currentOutings) return currentOutings;
            return currentOutings.map(outing =>
                outing.id === outingId ? updater(outing) : outing
            );
        },
        { revalidate: false }
    );

    // Revalidate to ensure consistency
    await invalidateOutings();
}

/**
 * Clear all SWR caches
 */
export async function clearAllCaches() {
    await mutate(() => true, undefined, { revalidate: false });
}