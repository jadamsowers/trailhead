/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OutingCreate } from '../models/OutingCreate';
import type { OutingListResponse } from '../models/OutingListResponse';
import type { OutingResponse } from '../models/OutingResponse';
import type { OutingUpdate } from '../models/OutingUpdate';
import type { OutingUpdateResponse } from '../models/OutingUpdateResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class OutingsService {
    /**
     * Get Available Outings
     * Get all outings with available spots (public endpoint).
     * No authentication required.
     * @returns OutingListResponse Successful Response
     * @throws ApiError
     */
    public static getAvailableOutingsApiOutingsAvailableGet(): CancelablePromise<OutingListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/outings/available',
        });
    }
    /**
     * Get All Outings
     * Get all outings (public endpoint).
     * Includes outings that are full.
     * @param skip
     * @param limit
     * @returns OutingListResponse Successful Response
     * @throws ApiError
     */
    public static getAllOutingsApiOutingsGet(
        skip?: number,
        limit: number = 100,
    ): CancelablePromise<OutingListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/outings',
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
     * Create Outing
     * Create a new outing (admin or outing-admin).
     * @param requestBody
     * @returns OutingResponse Successful Response
     * @throws ApiError
     */
    public static createOutingApiOutingsPost(
        requestBody: OutingCreate,
    ): CancelablePromise<OutingResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/outings',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Outing
     * Get a specific outing by ID.
     * @param outingId
     * @returns OutingResponse Successful Response
     * @throws ApiError
     */
    public static getOutingApiOutingsOutingIdGet(
        outingId: string,
    ): CancelablePromise<OutingResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/outings/{outing_id}',
            path: {
                'outing_id': outingId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Outing
     * Update an outing (admin or outing-admin).
     * Ensures a proper before/after diff by cloning the original state before mutation.
     * @param outingId
     * @param requestBody
     * @returns OutingUpdateResponse Successful Response
     * @throws ApiError
     */
    public static updateOutingApiOutingsOutingIdPut(
        outingId: string,
        requestBody: OutingUpdate,
    ): CancelablePromise<OutingUpdateResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/outings/{outing_id}',
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
     * Delete Outing
     * Delete an outing (admin or outing-admin).
     * Can only delete outings with no signups.
     * @param outingId
     * @returns void
     * @throws ApiError
     */
    public static deleteOutingApiOutingsOutingIdDelete(
        outingId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/outings/{outing_id}',
            path: {
                'outing_id': outingId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Close Signups
     * Manually close signups for an outing (admin or outing-admin).
     * @param outingId
     * @returns OutingResponse Successful Response
     * @throws ApiError
     */
    public static closeSignupsApiOutingsOutingIdCloseSignupsPost(
        outingId: string,
    ): CancelablePromise<OutingResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/outings/{outing_id}/close-signups',
            path: {
                'outing_id': outingId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Open Signups
     * Manually open signups for an outing (admin or outing-admin).
     * This will override the automatic closure date if set.
     * @param outingId
     * @returns OutingResponse Successful Response
     * @throws ApiError
     */
    public static openSignupsApiOutingsOutingIdOpenSignupsPost(
        outingId: string,
    ): CancelablePromise<OutingResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/outings/{outing_id}/open-signups',
            path: {
                'outing_id': outingId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Outing Signups
     * Get all signups for a specific outing (admin or outing-admin).
     * @param outingId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getOutingSignupsApiOutingsOutingIdSignupsGet(
        outingId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/outings/{outing_id}/signups',
            path: {
                'outing_id': outingId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Outing Handout
     * Generate a PDF handout for the outing (public endpoint).
     * @param outingId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getOutingHandoutApiOutingsOutingIdHandoutGet(
        outingId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/outings/{outing_id}/handout',
            path: {
                'outing_id': outingId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
