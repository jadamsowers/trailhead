# SWR Implementation Guide

## Overview

This project now uses [SWR (stale-while-revalidate)](https://swr.vercel.app/) for data fetching and caching. SWR provides automatic caching, revalidation, and optimistic updates for a better user experience.

## Benefits

1. **Automatic Caching** - API responses are cached and reused across components
2. **Background Revalidation** - Data stays fresh with automatic background updates
3. **Request Deduplication** - Multiple components requesting the same data share a single request
4. **Focus Revalidation** - Data refreshes when user returns to the tab
5. **Error Retry** - Built-in retry logic for failed requests
6. **Optimistic Updates** - UI updates immediately while API calls happen in background
7. **Better Performance** - Reduced API calls and faster perceived load times

## File Structure

```
frontend/src/
├── hooks/
│   └── useSWR.ts              # Custom SWR hooks for all API endpoints
├── utils/
│   └── swrHelpers.ts          # Utility functions for cache mutations
└── components/
    ├── Adult/
    │   └── FamilyManagement.tsx    # Example: Uses useFamilyMembers()
    └── Participant/
        └── SignupWizard.tsx        # Example: Uses multiple SWR hooks
```

## Available Hooks

### Outings

```typescript
import { useOutings, useAvailableOutings, useOuting } from '../hooks/useSWR';

// Get all outings
const { outings, isLoading, error, revalidate } = useOutings();

// Get only future outings
const { outings, isLoading, error, revalidate } = useAvailableOutings();

// Get specific outing by ID
const { outing, isLoading, error, revalidate } = useOuting(outingId);
```

### Family Members

```typescript
import { useFamilyMembers, useFamilySummary } from '../hooks/useSWR';

// Get all family members (full details)
const { familyMembers, total, isLoading, error, revalidate } = useFamilyMembers();

// Get family member summary (for signup selection)
const { familyMembers, isLoading, error, revalidate } = useFamilySummary(outingId);
```

### Signups

```typescript
import { useMySignups, useOutingSignups } from '../hooks/useSWR';

// Get current user's signups
const { signups, isLoading, error, revalidate } = useMySignups();

// Get signups for a specific outing
const { signups, isLoading, error, revalidate } = useOutingSignups(outingId);
```

### User

```typescript
import { useCurrentUser } from '../hooks/useSWR';

// Get current user information
const { user, isLoading, error, revalidate } = useCurrentUser();
```

## Cache Invalidation

After mutations (create, update, delete), invalidate the cache to trigger a refetch:

```typescript
import { 
    invalidateOutings,
    invalidateFamilyData,
    invalidateSignups,
    invalidateCurrentUser
} from '../hooks/useSWR';

// After creating/updating/deleting an outing
await invalidateOutings();

// After creating/updating/deleting a family member
await invalidateFamilyData();

// After creating/updating/deleting a signup
await invalidateSignups();

// After updating user contact info
await invalidateCurrentUser();

// Invalidate multiple caches at once
await Promise.all([
    invalidateSignups(),
    invalidateOutings(),
    invalidateFamilyData()
]);
```

## Optimistic Updates

For instant UI feedback, use optimistic updates:

```typescript
import { 
    optimisticUpdateSignup,
    optimisticRemoveSignup,
    optimisticUpdateOutingSignupCount
} from '../utils/swrHelpers';

// Example: Cancel signup with optimistic update
try {
    // Update UI immediately
    await optimisticRemoveSignup(signupId);
    await optimisticUpdateOutingSignupCount(outingId, -1);
    
    // Make API call
    await signupAPI.cancelSignup(signupId);
    
    // Revalidate to ensure consistency
    await invalidateSignups();
} catch (error) {
    // Rollback on error
    await invalidateSignups();
    console.error('Failed to cancel signup:', error);
}
```

## Configuration

SWR is configured in [`useSWR.ts`](../hooks/useSWR.ts:13-21) with these settings:

```typescript
export const swrConfig: SWRConfiguration = {
    revalidateOnFocus: true,        // Refresh when tab gains focus
    revalidateOnReconnect: true,    // Refresh when network reconnects
    dedupingInterval: 2000,         // Dedupe requests within 2 seconds
    errorRetryCount: 3,             // Retry failed requests 3 times
    errorRetryInterval: 5000,       // Wait 5 seconds between retries
    shouldRetryOnError: true,       // Enable automatic retry
    focusThrottleInterval: 30000,   // Throttle focus revalidation to 30s
};
```

## Migration Examples

### Before (Manual State Management)

```typescript
const [members, setMembers] = useState<FamilyMember[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
    const loadMembers = async () => {
        try {
            setLoading(true);
            const response = await familyAPI.getAll();
            setMembers(response.members);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    loadMembers();
}, []);

// After mutation
const handleDelete = async (id: string) => {
    await familyAPI.delete(id);
    await loadMembers(); // Manual refetch
};
```

### After (SWR)

```typescript
const { familyMembers: members, isLoading: loading, error } = useFamilyMembers();

// After mutation
const handleDelete = async (id: string) => {
    await familyAPI.delete(id);
    await invalidateFamilyData(); // Automatic refetch
};
```

## Best Practices

1. **Use Cache Keys Consistently** - Always use `CACHE_KEYS` from [`useSWR.ts`](../hooks/useSWR.ts:23-33)
2. **Invalidate After Mutations** - Always invalidate cache after create/update/delete
3. **Handle Loading States** - Check `isLoading` before rendering data
4. **Handle Errors** - Display error messages from `error` object
5. **Use Optimistic Updates** - For better UX on mutations
6. **Batch Invalidations** - Use `Promise.all()` when invalidating multiple caches
7. **Keep Diagnostic Logging** - Log data loading for debugging

## Debugging

Enable SWR DevTools in development:

```typescript
// In your browser console
localStorage.setItem('swr-devtools', 'true');
```

Check cache contents:

```typescript
import { getCachedData } from '../utils/swrHelpers';

const cachedOutings = getCachedData(CACHE_KEYS.outings);
console.log('Cached outings:', cachedOutings);
```

## Performance Tips

1. **Prefetch Data** - Load data before navigation:
   ```typescript
   import { prefetchData, CACHE_KEYS } from '../hooks/useSWR';
   
   // Prefetch before navigation
   await prefetchData(CACHE_KEYS.outings, () => outingAPI.getAll());
   ```

2. **Conditional Fetching** - Pass `null` to disable fetching:
   ```typescript
   // Only fetch if ID exists
   const { outing } = useOuting(selectedId || null);
   ```

3. **Revalidate Manually** - Force refresh when needed:
   ```typescript
   const { outings, revalidate } = useOutings();
   
   // Force refresh
   await revalidate();
   ```

## Testing

When testing components that use SWR:

```typescript
import { SWRConfig } from 'swr';

// Wrap component in test with custom cache
<SWRConfig value={{ provider: () => new Map() }}>
    <YourComponent />
</SWRConfig>
```

## Additional Resources

- [SWR Documentation](https://swr.vercel.app/)
- [SWR Examples](https://swr.vercel.app/examples/basic)
- [SWR API Reference](https://swr.vercel.app/docs/api)