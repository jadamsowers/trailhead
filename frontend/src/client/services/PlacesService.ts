/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PlaceCreate } from '../models/PlaceCreate';
import type { PlaceResponse } from '../models/PlaceResponse';
import type { PlaceUpdate } from '../models/PlaceUpdate';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PlacesService {
    /**
     * List Places
     * Get all places with optional search filter
     * @param skip
     * @param limit
     * @param search Search by name or address
     * @returns PlaceResponse Successful Response
     * @throws ApiError
     */
    public static listPlacesApiPlacesGet(
        skip?: number,
        limit: number = 100,
        search?: (string | null),
    ): CancelablePromise<Array<PlaceResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/places',
            query: {
                'skip': skip,
                'limit': limit,
                'search': search,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Place
     * Create a new place (admin only)
     * @param requestBody
     * @returns PlaceResponse Successful Response
     * @throws ApiError
     */
    public static createPlaceApiPlacesPost(
        requestBody: PlaceCreate,
    ): CancelablePromise<PlaceResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/places',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Place
     * Get a specific place by ID
     * @param placeId
     * @returns PlaceResponse Successful Response
     * @throws ApiError
     */
    public static getPlaceApiPlacesPlaceIdGet(
        placeId: string,
    ): CancelablePromise<PlaceResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/places/{place_id}',
            path: {
                'place_id': placeId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Place
     * Update a place (admin only)
     * @param placeId
     * @param requestBody
     * @returns PlaceResponse Successful Response
     * @throws ApiError
     */
    public static updatePlaceApiPlacesPlaceIdPut(
        placeId: string,
        requestBody: PlaceUpdate,
    ): CancelablePromise<PlaceResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/places/{place_id}',
            path: {
                'place_id': placeId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Place
     * Delete a place (admin only)
     * @param placeId
     * @returns void
     * @throws ApiError
     */
    public static deletePlaceApiPlacesPlaceIdDelete(
        placeId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/places/{place_id}',
            path: {
                'place_id': placeId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Search Places
     * Search places by name (for autocomplete)
     * @param name
     * @param limit Maximum number of results
     * @returns PlaceResponse Successful Response
     * @throws ApiError
     */
    public static searchPlacesApiPlacesSearchNameGet(
        name: string,
        limit: number = 10,
    ): CancelablePromise<Array<PlaceResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/places/search/{name}',
            path: {
                'name': name,
            },
            query: {
                'limit': limit,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
