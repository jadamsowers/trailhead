/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChangeLogDeltaResponse } from '../models/ChangeLogDeltaResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class OfflineService {
    /**
     * Get Bulk Offline Data
     * Get all offline data in a single request.
     * Returns user info, all outings, and all rosters.
     * This endpoint is optimized for offline sync to reduce request count.
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getBulkOfflineDataApiOfflineDataGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/offline/data',
        });
    }
    /**
     * Get Change Deltas
     * Incremental change log entries with keyset pagination & basic permission scoping.
     *
     * Non-admin users receive only public entity types (outing, place); admin receives all.
     * @param since ISO8601 timestamp; ignored if cursor provided
     * @param cursor UUID cursor of last item received
     * @param limit Max change log entries
     * @param entityTypes Comma-separated list of entity types to restrict (admin only)
     * @returns ChangeLogDeltaResponse Successful Response
     * @throws ApiError
     */
    public static getChangeDeltasApiOfflineDeltasGet(
        since?: (string | null),
        cursor?: (string | null),
        limit: number = 200,
        entityTypes?: (string | null),
    ): CancelablePromise<ChangeLogDeltaResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/offline/deltas',
            query: {
                'since': since,
                'cursor': cursor,
                'limit': limit,
                'entity_types': entityTypes,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
