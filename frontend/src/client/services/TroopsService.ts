/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PatrolCreate } from '../models/PatrolCreate';
import type { PatrolListResponse } from '../models/PatrolListResponse';
import type { PatrolResponse } from '../models/PatrolResponse';
import type { PatrolUpdate } from '../models/PatrolUpdate';
import type { TroopCreate } from '../models/TroopCreate';
import type { TroopListResponse } from '../models/TroopListResponse';
import type { TroopResponse } from '../models/TroopResponse';
import type { TroopUpdate } from '../models/TroopUpdate';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TroopsService {
    /**
     * List Troops
     * @param skip
     * @param limit
     * @returns TroopListResponse Successful Response
     * @throws ApiError
     */
    public static listTroopsApiTroopsGet(
        skip?: number,
        limit: number = 100,
    ): CancelablePromise<TroopListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/troops',
            query: {
                'skip': skip,
                'limit': limit,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Troop
     * @param requestBody
     * @returns TroopResponse Successful Response
     * @throws ApiError
     */
    public static createTroopApiTroopsPost(
        requestBody: TroopCreate,
    ): CancelablePromise<TroopResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/troops',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Troop
     * @param troopId
     * @returns TroopResponse Successful Response
     * @throws ApiError
     */
    public static getTroopApiTroopsTroopIdGet(
        troopId: string,
    ): CancelablePromise<TroopResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/troops/{troop_id}',
            path: {
                'troop_id': troopId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Troop
     * @param troopId
     * @param requestBody
     * @returns TroopResponse Successful Response
     * @throws ApiError
     */
    public static updateTroopApiTroopsTroopIdPut(
        troopId: string,
        requestBody: TroopUpdate,
    ): CancelablePromise<TroopResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/troops/{troop_id}',
            path: {
                'troop_id': troopId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Troop
     * @param troopId
     * @returns void
     * @throws ApiError
     */
    public static deleteTroopApiTroopsTroopIdDelete(
        troopId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/troops/{troop_id}',
            path: {
                'troop_id': troopId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Patrols
     * @param troopId
     * @param skip
     * @param limit
     * @returns PatrolListResponse Successful Response
     * @throws ApiError
     */
    public static listPatrolsApiTroopsTroopIdPatrolsGet(
        troopId: string,
        skip?: number,
        limit: number = 100,
    ): CancelablePromise<PatrolListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/troops/{troop_id}/patrols',
            path: {
                'troop_id': troopId,
            },
            query: {
                'skip': skip,
                'limit': limit,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Patrol
     * @param requestBody
     * @returns PatrolResponse Successful Response
     * @throws ApiError
     */
    public static createPatrolApiPatrolsPost(
        requestBody: PatrolCreate,
    ): CancelablePromise<PatrolResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/patrols',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Patrol
     * @param patrolId
     * @param requestBody
     * @returns PatrolResponse Successful Response
     * @throws ApiError
     */
    public static updatePatrolApiPatrolsPatrolIdPut(
        patrolId: string,
        requestBody: PatrolUpdate,
    ): CancelablePromise<PatrolResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/patrols/{patrol_id}',
            path: {
                'patrol_id': patrolId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Patrol
     * @param patrolId
     * @returns void
     * @throws ApiError
     */
    public static deletePatrolApiPatrolsPatrolIdDelete(
        patrolId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/patrols/{patrol_id}',
            path: {
                'patrol_id': patrolId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
