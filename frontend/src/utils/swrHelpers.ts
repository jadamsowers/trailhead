/**
 * SWR Helper Utilities
 * 
 * This file provides utility functions for working with SWR cache mutations
 * and optimistic updates across the application.
 */

import { mutate } from 'swr';
import { CACHE_KEYS } from '../hooks/useSWR';
import { Outing, FamilyMember, SignupResponse } from '../types';

/**
 * Optimistically update a signup in the cache before the API call completes
 * This provides instant UI feedback while the actual update happens in the background
 */
export async function optimisticUpdateSignup(
    signupId: string,
    updater: (signup: SignupResponse) => SignupResponse
) {
    // Update in my signups list
    await mutate(
        CACHE_KEYS.mySignups,
        async (currentSignups?: SignupResponse[]) => {
            if (!currentSignups) return currentSignups;
            return currentSignups.map(signup =>
                signup.id === signupId ? updater(signup) : signup
            );
        },
        { revalidate: false }
    );
}

/**
 * Optimistically add a new signup to the cache
 */
export async function optimisticAddSignup(newSignup: SignupResponse) {
    await mutate(
        CACHE_KEYS.mySignups,
        async (currentSignups?: SignupResponse[]) => {
            if (!currentSignups) return [newSignup];
            return [...currentSignups, newSignup];
        },
        { revalidate: false }
    );
}

/**
 * Optimistically remove a signup from the cache
 */
export async function optimisticRemoveSignup(signupId: string) {
    await mutate(
        CACHE_KEYS.mySignups,
        async (currentSignups?: SignupResponse[]) => {
            if (!currentSignups) return currentSignups;
            return currentSignups.filter(signup => signup.id !== signupId);
        },
        { revalidate: false }
    );
}

/**
 * Optimistically update a family member in the cache
 */
export async function optimisticUpdateFamilyMember(
    memberId: string,
    updater: (member: FamilyMember) => FamilyMember
) {
    await mutate(
        CACHE_KEYS.familyMembers,
        async (currentData?: { members: FamilyMember[]; total: number }) => {
            if (!currentData) return currentData;
            return {
                ...currentData,
                members: currentData.members.map(member =>
                    member.id === memberId ? updater(member) : member
                ),
            };
        },
        { revalidate: false }
    );
}

/**
 * Optimistically add a new family member to the cache
 */
export async function optimisticAddFamilyMember(newMember: FamilyMember) {
    await mutate(
        CACHE_KEYS.familyMembers,
        async (currentData?: { members: FamilyMember[]; total: number }) => {
            if (!currentData) return { members: [newMember], total: 1 };
            return {
                members: [...currentData.members, newMember],
                total: currentData.total + 1,
            };
        },
        { revalidate: false }
    );
}

/**
 * Optimistically remove a family member from the cache
 */
export async function optimisticRemoveFamilyMember(memberId: string) {
    await mutate(
        CACHE_KEYS.familyMembers,
        async (currentData?: { members: FamilyMember[]; total: number }) => {
            if (!currentData) return currentData;
            return {
                members: currentData.members.filter(member => member.id !== memberId),
                total: currentData.total - 1,
            };
        },
        { revalidate: false }
    );
}

/**
 * Optimistically update an outing's signup count
 * Useful when a signup is added or removed
 */
export async function optimisticUpdateOutingSignupCount(
    outingId: string,
    delta: number
) {
    const updateOuting = (outing: Outing) => ({
        ...outing,
        signup_count: Math.max(0, outing.signup_count + delta),
        available_spots: Math.max(0, (outing.available_spots || 0) - delta),
    });

    // Update in outings list
    await mutate(
        CACHE_KEYS.outings,
        async (currentOutings?: Outing[]) => {
            if (!currentOutings) return currentOutings;
            return currentOutings.map(outing =>
                outing.id === outingId ? updateOuting(outing) : outing
            );
        },
        { revalidate: false }
    );

    // Update in available outings list
    await mutate(
        CACHE_KEYS.availableOutings,
        async (currentOutings?: Outing[]) => {
            if (!currentOutings) return currentOutings;
            return currentOutings.map(outing =>
                outing.id === outingId ? updateOuting(outing) : outing
            );
        },
        { revalidate: false }
    );

    // Update specific outing cache
    await mutate(
        CACHE_KEYS.outing(outingId),
        async (currentOuting?: Outing) => {
            if (!currentOuting) return currentOuting;
            return updateOuting(currentOuting);
        },
        { revalidate: false }
    );
}

/**
 * Prefetch data for a specific cache key
 * Useful for preloading data before navigation
 */
export async function prefetchData<T>(
    key: string,
    fetcher: () => Promise<T>
) {
    await mutate(key, fetcher, { revalidate: false });
}

/**
 * Check if data exists in cache
 */
export function isCached(key: string): boolean {
    // This is a simple check - in production you might want to use SWR's cache directly
    return typeof window !== 'undefined' && key in (window as any).__SWR_CACHE__;
}

/**
 * Get cached data without triggering a fetch
 */
export function getCachedData<T>(key: string): T | undefined {
    if (typeof window === 'undefined') return undefined;
    const cache = (window as any).__SWR_CACHE__;
    return cache?.[key]?.data;
}

/**
 * Batch multiple cache mutations together
 * Useful when you need to update multiple related caches atomically
 */
export async function batchMutate(mutations: Array<() => Promise<void>>) {
    await Promise.all(mutations.map(mutation => mutation()));
}

/**
 * Rollback helper for optimistic updates
 * Call this in a catch block to revert optimistic changes
 */
export async function rollbackOptimisticUpdate(keys: string[]) {
    await Promise.all(keys.map(key => mutate(key)));
}