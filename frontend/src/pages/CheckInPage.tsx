import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from "@stackframe/stack";
import { checkInAPI } from '../services/api';
import { CheckInSummary, CheckInParticipant } from '../types';

const CheckInPage: React.FC = () => {
    const { outingId } = useParams<{ outingId: string }>();
    const navigate = useNavigate();
    const user = useUser();
    const [summary, setSummary] = useState<CheckInSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'scouts' | 'adults' | 'checked-in' | 'not-checked-in'>('all');

    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOffline(false);
            syncData();
        };
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Initial sync check
        if (navigator.onLine) {
            syncData();
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const syncData = async () => {
        try {
            setIsSyncing(true);
            const result = await checkInAPI.syncOfflineData();
            if (result.synced > 0) {
                await loadCheckInData();
            }
        } catch (err) {
            console.error('Sync failed:', err);
        } finally {
            setIsSyncing(false);
        }
    };

    useEffect(() => {
        loadCheckInData();
    }, [outingId]);

    const loadCheckInData = async () => {
        if (!outingId) return;

        try {
            setLoading(true);
            setError(null);
            const data = await checkInAPI.getCheckInStatus(outingId);
            console.log('Check-in data received:', data);
            setSummary(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load check-in data');
            console.error('Error loading check-in data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async (participantIds: string[]) => {
        if (!outingId || !user) return;

        try {
            await checkInAPI.checkInParticipants(outingId, {
                participant_ids: participantIds,
                checked_in_by: user.fullName || user.primaryEmailAddress?.emailAddress || 'Unknown'
            });
            await loadCheckInData();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to check in participants');
            console.error('Error checking in:', err);
        }
    };

    // Removed setUsingOfflineCache(false); as it is not defined or used
    const handleUndoCheckIn = async (participantId: string) => {
        if (!outingId) return;

        try {
            await checkInAPI.undoCheckIn(outingId, participantId);
            await loadCheckInData();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to undo check-in');
            console.error('Error undoing check-in:', err);
        }
    };

    const handleExport = async () => {
        if (!outingId || !summary) return;

        try {
            const blob = await checkInAPI.exportCheckInCSV(outingId);
            const filename = `checkin_${summary.outing_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
            checkInAPI.downloadCSV(blob, filename);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to export data');
            console.error('Error exporting:', err);
        }
    };


    const getFilteredParticipants = (): CheckInParticipant[] => {
        if (!summary) return [];

        let filtered = summary.participants;

        // Apply type filter
        if (filterType === 'scouts') {
            filtered = filtered.filter(p => p.member_type === 'scout');
        } else if (filterType === 'adults') {
            filtered = filtered.filter(p => p.member_type === 'adult');
        } else if (filterType === 'checked-in') {
            filtered = filtered.filter(p => p.is_checked_in);
        } else if (filterType === 'not-checked-in') {
            filtered = filtered.filter(p => !p.is_checked_in);
        }

        // Apply search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(term) ||
                p.family_name.toLowerCase().includes(term) ||
                p.patrol_name?.toLowerCase().includes(term) ||
                p.troop_number?.toLowerCase().includes(term)
            );
        }

        // Sort: Adults first, then Scouts, then alphabetical by Last Name, then First Name
        return [...filtered].sort((a, b) => {
            // 1. Member Type (Adults first)
            if (a.member_type !== b.member_type) {
                return a.member_type.localeCompare(b.member_type);
            }
            // Removed unused offline/cached warning for usingOfflineCache

            // 2. Last Name
            const getNameParts = (name: string) => (name || '').trim().split(/\s+/);
            const partsA = getNameParts(a.name);
            const partsB = getNameParts(b.name);

            const lastA = partsA.length > 0 ? partsA[partsA.length - 1] : '';
            const lastB = partsB.length > 0 ? partsB[partsB.length - 1] : '';

            const lastCompare = lastA.localeCompare(lastB);
            if (lastCompare !== 0) return lastCompare;

            // 3. First Name (Full string fallback)
            return (a.name || '').localeCompare(b.name || '');
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
                        style={{ borderColor: 'var(--color-primary)' }}></div>
                    <p style={{ color: 'var(--text-secondary)' }}>Loading check-in data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="p-6 rounded-lg" style={{
                    backgroundColor: 'var(--alert-error-bg)',
                    border: '1px solid var(--alert-error-border)',
                    color: 'var(--alert-error-text)'
                }}>
                    <h2 className="text-xl font-bold mb-2">Error</h2>
                    <p>{error}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="mt-4 px-4 py-2 rounded"
                        style={{
                            backgroundColor: 'var(--btn-primary-bg)',
                            color: 'var(--btn-primary-text)'
                        }}
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (!summary) {
        return null;
    }

    const filteredParticipants = getFilteredParticipants();

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Offline/Sync Status Banner */}
            {(isOffline || isSyncing) && (
                <div className="mb-6 p-4 rounded-lg flex items-center justify-between" style={{
                    backgroundColor: isOffline ? 'var(--alert-warning-bg)' : 'var(--alert-info-bg)',
                    border: `1px solid ${isOffline ? 'var(--alert-warning-border)' : 'var(--alert-info-border)'}`,
                    color: isOffline ? 'var(--alert-warning-text)' : 'var(--alert-info-text)'
                }}>
                    <div className="flex items-center gap-2">
                        <span className="text-xl">{isOffline ? '📡' : '🔄'}</span>
                        <span className="font-semibold">
                            {isOffline ? 'Offline Mode' : 'Syncing Data...'}
                        </span>
                    </div>
                    <div className="text-sm">
                        {isOffline
                            ? 'Changes will be saved locally and synced when online.'
                            : 'Please wait while we update the server.'}
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="mb-4 px-4 py-2 rounded flex items-center gap-2"
                    style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-light)'
                    }}
                >
                    ← Back
                </button>

                <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    Check-in: {summary.outing_name}
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    {new Date(summary.outing_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-lg" style={{
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--border-light)'
                }}>
                    <div className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
                        {summary.checked_in_count} / {summary.total_participants}
                    </div>
                    <div style={{ color: 'var(--text-secondary)' }}>Checked In</div>
                </div>

                <div className="p-4 rounded-lg" style={{
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--border-light)'
                }}>
                    <div className="text-2xl font-bold" style={{ color: 'var(--color-success)' }}>
                        {Math.round((summary.checked_in_count / summary.total_participants) * 100)}%
                    </div>
                    <div style={{ color: 'var(--text-secondary)' }}>Complete</div>
                </div>

                <div className="p-4 rounded-lg" style={{
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--border-light)'
                }}>
                    <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        {summary.total_participants - summary.checked_in_count}
                    </div>
                    <div style={{ color: 'var(--text-secondary)' }}>Remaining</div>
                </div>
            </div>

            {/* Actions */}
            <div className="mb-6 flex flex-wrap gap-4">
                <button
                    onClick={handleExport}
                    className="px-6 py-3 rounded-lg font-semibold"
                    style={{
                        backgroundColor: 'var(--btn-secondary-bg)',
                        color: 'var(--btn-secondary-text)'
                    }}
                >
                    <span aria-hidden="true">📥</span> Export CSV
                </button>
            </div>

            {/* Filters */}
            <div className="mb-6 flex flex-col md:flex-row gap-4">
                <input
                    type="text"
                    placeholder="Search by name, family, patrol, or troop..."
                    aria-label="Search participants"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-lg"
                    style={{
                        backgroundColor: 'var(--input-bg)',
                        color: 'var(--input-text)',
                        border: '1px solid var(--input-border)'
                    }}
                />

                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    aria-label="Filter participants"
                    className="px-4 py-2 rounded-lg"
                    style={{
                        backgroundColor: 'var(--input-bg)',
                        color: 'var(--input-text)',
                        border: '1px solid var(--input-border)'
                    }}
                >
                    <option value="all">All Participants</option>
                    <option value="scouts">Scouts Only</option>
                    <option value="adults">Adults Only</option>
                    <option value="checked-in">Checked In</option>
                    <option value="not-checked-in">Not Checked In</option>
                </select>
            </div>

            {/* Participants List */}
            <div className="rounded-lg overflow-hidden" style={{
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border-light)'
            }}>
                <div className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
                    {/* Adults Section */}
                    {filteredParticipants.filter(p => p.member_type === 'adult').length > 0 && (
                        <>
                            <div className="p-3 font-bold text-sm uppercase tracking-wider" style={{
                                backgroundColor: 'var(--bg-tertiary)',
                                color: 'var(--text-secondary)',
                                borderBottom: '1px solid var(--border-light)'
                            }}>
                                Adults ({filteredParticipants.filter(p => p.member_type === 'adult').length})
                            </div>
                            {filteredParticipants
                                .filter(p => p.member_type === 'adult')
                                .map(participant => (
                                    <div
                                        key={participant.id}
                                        onClick={() => participant.is_checked_in ? handleUndoCheckIn(participant.id) : handleCheckIn([participant.id])}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                participant.is_checked_in ? handleUndoCheckIn(participant.id) : handleCheckIn([participant.id]);
                                            }
                                        }}
                                        role="checkbox"
                                        aria-checked={participant.is_checked_in}
                                        tabIndex={0}
                                        className="p-4 flex items-center gap-4 hover:bg-opacity-50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        style={{
                                            backgroundColor: participant.is_checked_in
                                                ? 'var(--alert-success-bg)'
                                                : 'transparent'
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={participant.is_checked_in}
                                            readOnly
                                            tabIndex={-1}
                                            aria-hidden="true"
                                            className="cursor-pointer"
                                            style={{ width: '1.5rem', height: '1.5rem' }}
                                        />

                                        <div className="flex-1">
                                            <div className="font-semibold text-lg">
                                                {participant.name || 'Unknown Name'}
                                                {participant.is_checked_in && (
                                                    <span className="ml-2 text-sm" style={{ color: 'var(--color-success)' }}>
                                                        ✓ Checked In
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                {participant.family_name}
                                                {participant.member_type === 'scout' && participant.patrol_name && (
                                                    <> • Patrol: {participant.patrol_name}</>
                                                )}
                                                {participant.troop_number && (
                                                    <> • Troop {participant.troop_number}</>
                                                )}
                                            </div>
                                            {participant.is_checked_in && participant.checked_in_at && (
                                                <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                                                    Checked in at {new Date(participant.checked_in_at).toLocaleTimeString()}
                                                    {participant.checked_in_by && ` by ${participant.checked_in_by}`}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                        </>
                    )}

                    {/* Scouts Section */}
                    {filteredParticipants.filter(p => p.member_type === 'scout').length > 0 && (
                        <>
                            <div className="p-3 font-bold text-sm uppercase tracking-wider" style={{
                                backgroundColor: 'var(--bg-tertiary)',
                                color: 'var(--text-secondary)',
                                borderBottom: '1px solid var(--border-light)',
                                borderTop: filteredParticipants.some(p => p.member_type === 'adult') ? '1px solid var(--border-light)' : 'none'
                            }}>
                                Scouts ({filteredParticipants.filter(p => p.member_type === 'scout').length})
                            </div>
                            {filteredParticipants
                                .filter(p => p.member_type === 'scout')
                                .map(participant => (
                                    <div
                                        key={participant.id}
                                        onClick={() => participant.is_checked_in ? handleUndoCheckIn(participant.id) : handleCheckIn([participant.id])}
                                        className="p-4 flex items-center gap-4 hover:bg-opacity-50 transition-colors cursor-pointer"
                                        style={{
                                            backgroundColor: participant.is_checked_in
                                                ? 'var(--alert-success-bg)'
                                                : 'transparent'
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={participant.is_checked_in}
                                            readOnly
                                            className="cursor-pointer"
                                            style={{ width: '1.5rem', height: '1.5rem' }}
                                        />

                                        <div className="flex-1">
                                            <div className="font-semibold text-lg">
                                                {participant.name || 'Unknown Name'}
                                                {participant.is_checked_in && (
                                                    <span className="ml-2 text-sm" style={{ color: 'var(--color-success)' }}>
                                                        ✓ Checked In
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                {participant.family_name}
                                                {participant.member_type === 'scout' && participant.patrol_name && (
                                                    <> • Patrol: {participant.patrol_name}</>
                                                )}
                                                {participant.troop_number && (
                                                    <> • Troop {participant.troop_number}</>
                                                )}
                                            </div>
                                            {participant.is_checked_in && participant.checked_in_at && (
                                                <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                                                    Checked in at {new Date(participant.checked_in_at).toLocaleTimeString()}
                                                    {participant.checked_in_by && ` by ${participant.checked_in_by}`}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                        </>
                    )}
                </div>

                {filteredParticipants.length === 0 && (
                    <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>
                        No participants found matching your filters.
                    </div>
                )}
            </div>
        </div>
    );
};

export default CheckInPage;
