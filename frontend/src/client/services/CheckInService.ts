/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CheckInCreate } from '../models/CheckInCreate';
import type { CheckInResponse } from '../models/CheckInResponse';
import type { CheckInSummary } from '../models/CheckInSummary';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CheckInService {
    /**
     * Get Checkin Status
     * Get check-in status for an outing
     * Shows all participants and who has been checked in
     * Requires authentication (admin or outing leader)
     * @param outingId
     * @returns CheckInSummary Successful Response
     * @throws ApiError
     */
    public static getCheckinStatusApiOutingsOutingIdCheckinGet(
        outingId: string,
    ): CancelablePromise<CheckInSummary> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/outings/{outing_id}/checkin',
            path: {
                'outing_id': outingId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Check In Participants
     * Check in one or more participants for an outing
     * Requires authentication (admin or outing leader)
     * @param outingId
     * @param requestBody
     * @returns CheckInResponse Successful Response
     * @throws ApiError
     */
    public static checkInParticipantsApiOutingsOutingIdCheckinPost(
        outingId: string,
        requestBody: CheckInCreate,
    ): CancelablePromise<CheckInResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/outings/{outing_id}/checkin',
            path: {
                'outing_id': outingId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Reset All Checkins
     * Reset all check-ins for an outing (remove all check-in records)
     * Requires authentication (admin only)
     * @param outingId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static resetAllCheckinsApiOutingsOutingIdCheckinDelete(
        outingId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/outings/{outing_id}/checkin',
            path: {
                'outing_id': outingId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Undo Checkin
     * Undo a check-in (remove check-in record)
     * Requires authentication (admin or outing leader)
     * @param outingId
     * @param participantId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static undoCheckinApiOutingsOutingIdCheckinParticipantIdDelete(
        outingId: string,
        participantId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/outings/{outing_id}/checkin/{participant_id}',
            path: {
                'outing_id': outingId,
                'participant_id': participantId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Export Checkin Data
     * Export check-in data as CSV
     * Includes all participants and their check-in status
     * Requires authentication (admin or outing leader)
     * @param outingId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static exportCheckinDataApiOutingsOutingIdCheckinExportGet(
        outingId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/outings/{outing_id}/checkin/export',
            path: {
                'outing_id': outingId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
