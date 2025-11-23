/**
 * SWR Usage Examples
 * 
 * This file demonstrates various patterns for using SWR in the application.
 * These are example components showing best practices.
 */

import React, { useState } from 'react';
import {
    useOutings,
    useAvailableOutings,
    useFamilyMembers,
    useMySignups,
    useOuting,
    invalidateOutings,
    invalidateFamilyData,
    invalidateSignups,
    CACHE_KEYS
} from '../hooks/useSWR';
import {
    optimisticRemoveSignup,
    optimisticUpdateOutingSignupCount,
    rollbackOptimisticUpdate
} from '../utils/swrHelpers';
import { outingAPI, familyAPI, signupAPI } from '../services/api';

/**
 * Example 1: Basic Data Fetching
 * Shows how to fetch and display data with loading and error states
 */
export const BasicFetchExample: React.FC = () => {
    const { outings, isLoading, error } = useOutings();

    if (isLoading) return <div>Loading outings...</div>;
    if (error) return <div>Error: {error.message}</div>;
    if (!outings) return <div>No data</div>;

    return (
        <div>
            <h2>Outings ({outings.length})</h2>
            <ul>
                {outings.map(outing => (
                    <li key={outing.id}>{outing.name}</li>
                ))}
            </ul>
        </div>
    );
};

/**
 * Example 2: Manual Revalidation
 * Shows how to manually trigger a data refresh
 */
export const ManualRevalidationExample: React.FC = () => {
    const { outings, isLoading, revalidate } = useOutings();

    const handleRefresh = async () => {
        console.log('🔄 Manually refreshing outings...');
        await revalidate();
        console.log('✅ Outings refreshed');
    };

    return (
        <div>
            <button onClick={handleRefresh} disabled={isLoading}>
                {isLoading ? 'Refreshing...' : 'Refresh Outings'}
            </button>
            <div>Outings: {outings?.length || 0}</div>
        </div>
    );
};

/**
 * Example 3: Mutation with Cache Invalidation
 * Shows how to perform a mutation and invalidate the cache
 */
export const MutationExample: React.FC = () => {
    const { familyMembers, isLoading } = useFamilyMembers();
    const [deleting, setDeleting] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleDelete = async (memberId: string) => {
        try {
            setDeleting(memberId);
            setError(null);
            
            console.log('🗑️ Deleting family member:', memberId);
            
            // Perform the mutation
            await familyAPI.delete(memberId);
            
            console.log('✅ Deleted, invalidating cache...');
            
            // Invalidate cache to trigger refetch
            await invalidateFamilyData();
            
            console.log('✅ Cache invalidated');
        } catch (err: any) {
            console.error('❌ Delete failed:', err);
            setError(err.message || 'Failed to delete');
        } finally {
            setDeleting(null);
        }
    };

    if (isLoading) return <div>Loading...</div>;

    return (
        <div>
            {error && <div style={{ color: 'red' }}>{error}</div>}
            <ul>
                {familyMembers.map(member => (
                    <li key={member.id}>
                        {member.name}
                        <button
                            onClick={() => handleDelete(member.id)}
                            disabled={deleting === member.id}
                        >
                            {deleting === member.id ? 'Deleting...' : 'Delete'}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

/**
 * Example 4: Optimistic Updates
 * Shows how to update UI immediately while API call happens in background
 */
export const OptimisticUpdateExample: React.FC = () => {
    const { signups } = useMySignups();
    const [canceling, setCanceling] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleCancelSignup = async (signupId: string, outingId: string) => {
        try {
            setCanceling(signupId);
            setError(null);
            
            console.log('🚀 Optimistically removing signup from UI...');
            
            // Update UI immediately (optimistic update)
            await optimisticRemoveSignup(signupId);
            await optimisticUpdateOutingSignupCount(outingId, -1);
            
            console.log('📡 Making API call...');
            
            // Make the actual API call
            await signupAPI.cancelSignup(signupId);
            
            console.log('✅ API call succeeded, revalidating...');
            
            // Revalidate to ensure consistency
            await Promise.all([
                invalidateSignups(),
                invalidateOutings()
            ]);
            
            console.log('✅ Complete');
        } catch (err: any) {
            console.error('❌ Failed, rolling back optimistic update...');
            
            // Rollback optimistic update on error
            await rollbackOptimisticUpdate([
                CACHE_KEYS.mySignups,
                CACHE_KEYS.outings,
                CACHE_KEYS.availableOutings
            ]);
            
            setError(err.message || 'Failed to cancel signup');
        } finally {
            setCanceling(null);
        }
    };

    return (
        <div>
            {error && <div style={{ color: 'red' }}>{error}</div>}
            <ul>
                {signups?.map(signup => (
                    <li key={signup.id}>
                        Signup for outing {signup.outing_id}
                        <button
                            onClick={() => handleCancelSignup(signup.id, signup.outing_id)}
                            disabled={canceling === signup.id}
                        >
                            {canceling === signup.id ? 'Canceling...' : 'Cancel'}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

/**
 * Example 5: Multiple Data Sources
 * Shows how to use multiple SWR hooks in a single component
 */
export const MultipleDataSourcesExample: React.FC = () => {
    const { outings, isLoading: outingsLoading } = useAvailableOutings();
    const { familyMembers, isLoading: familyLoading } = useFamilyMembers();
    const { signups, isLoading: signupsLoading } = useMySignups();

    const isLoading = outingsLoading || familyLoading || signupsLoading;

    if (isLoading) return <div>Loading data...</div>;

    return (
        <div>
            <h2>Dashboard</h2>
            <div>
                <h3>Available Outings: {outings?.length || 0}</h3>
                <h3>Family Members: {familyMembers?.length || 0}</h3>
                <h3>My Signups: {signups?.length || 0}</h3>
            </div>
        </div>
    );
};

/**
 * Example 6: Conditional Fetching
 * Shows how to conditionally fetch data based on state
 */
export const ConditionalFetchingExample: React.FC = () => {
    const [selectedOutingId, setSelectedOutingId] = useState<string | null>(null);
    
    // Only fetch when an outing is selected (pass null to disable)
    const { outing, isLoading } = useOuting(selectedOutingId);

    return (
        <div>
            <button onClick={() => setSelectedOutingId('some-id')}>
                Select Outing
            </button>
            <button onClick={() => setSelectedOutingId(null)}>
                Clear Selection
            </button>
            
            {selectedOutingId && (
                <div>
                    {isLoading ? (
                        <div>Loading outing details...</div>
                    ) : outing ? (
                        <div>
                            <h3>{outing.name}</h3>
                            <p>{outing.description}</p>
                        </div>
                    ) : (
                        <div>No outing found</div>
                    )}
                </div>
            )}
        </div>
    );
};

/**
 * Example 7: Batch Invalidation
 * Shows how to invalidate multiple caches at once
 */
export const BatchInvalidationExample: React.FC = () => {
    const [refreshing, setRefreshing] = useState(false);

    const handleRefreshAll = async () => {
        try {
            setRefreshing(true);
            console.log('🔄 Refreshing all data...');
            
            // Invalidate multiple caches at once
            await Promise.all([
                invalidateOutings(),
                invalidateFamilyData(),
                invalidateSignups()
            ]);
            
            console.log('✅ All data refreshed');
        } catch (err) {
            console.error('❌ Refresh failed:', err);
        } finally {
            setRefreshing(false);
        }
    };

    return (
        <div>
            <button onClick={handleRefreshAll} disabled={refreshing}>
                {refreshing ? 'Refreshing All Data...' : 'Refresh All Data'}
            </button>
        </div>
    );
};

/**
 * Example 8: Error Handling
 * Shows comprehensive error handling patterns
 */
export const ErrorHandlingExample: React.FC = () => {
    const { outings, isLoading, error, revalidate } = useOutings();

    if (isLoading) {
        return <div>Loading outings...</div>;
    }

    if (error) {
        return (
            <div style={{ padding: '20px', backgroundColor: '#ffebee', borderRadius: '4px' }}>
                <h3 style={{ color: '#c62828' }}>Error Loading Outings</h3>
                <p>{error.message}</p>
                <button onClick={() => revalidate()}>
                    Try Again
                </button>
            </div>
        );
    }

    if (!outings || outings.length === 0) {
        return <div>No outings available</div>;
    }

    return (
        <div>
            <h2>Outings</h2>
            <ul>
                {outings.map(outing => (
                    <li key={outing.id}>{outing.name}</li>
                ))}
            </ul>
        </div>
    );
};
