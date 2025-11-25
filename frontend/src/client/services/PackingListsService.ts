/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OutingPackingListCreate } from '../models/OutingPackingListCreate';
import type { OutingPackingListItemCreate } from '../models/OutingPackingListItemCreate';
import type { OutingPackingListItemResponse } from '../models/OutingPackingListItemResponse';
import type { OutingPackingListItemUpdate } from '../models/OutingPackingListItemUpdate';
import type { OutingPackingListResponse } from '../models/OutingPackingListResponse';
import type { PackingListTemplateListResponse } from '../models/PackingListTemplateListResponse';
import type { PackingListTemplateWithItemsResponse } from '../models/PackingListTemplateWithItemsResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PackingListsService {
    /**
     * List Templates
     * Get all packing list templates.
     *
     * Public endpoint - no authentication required.
     * @param skip
     * @param limit
     * @returns PackingListTemplateListResponse Successful Response
     * @throws ApiError
     */
    public static listTemplatesApiPackingListsTemplatesGet(
        skip?: number,
        limit: number = 100,
    ): CancelablePromise<PackingListTemplateListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/packing-lists/templates',
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
     * Get Template
     * Get a single packing list template with its items.
     *
     * Public endpoint - no authentication required.
     * @param templateId
     * @returns PackingListTemplateWithItemsResponse Successful Response
     * @throws ApiError
     */
    public static getTemplateApiPackingListsTemplatesTemplateIdGet(
        templateId: string,
    ): CancelablePromise<PackingListTemplateWithItemsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/packing-lists/templates/{template_id}',
            path: {
                'template_id': templateId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Outing Packing List
     * Add a packing list to an outing.
     *
     * Requires authentication. If template_id is provided, items will be copied from the template.
     * @param outingId
     * @param requestBody
     * @returns OutingPackingListResponse Successful Response
     * @throws ApiError
     */
    public static createOutingPackingListApiPackingListsOutingsOutingIdPackingListsPost(
        outingId: string,
        requestBody: OutingPackingListCreate,
    ): CancelablePromise<OutingPackingListResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/packing-lists/outings/{outing_id}/packing-lists',
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
     * Get Outing Packing Lists
     * Get all packing lists for an outing.
     *
     * Requires authentication.
     * @param outingId
     * @returns OutingPackingListResponse Successful Response
     * @throws ApiError
     */
    public static getOutingPackingListsApiPackingListsOutingsOutingIdPackingListsGet(
        outingId: string,
    ): CancelablePromise<Array<OutingPackingListResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/packing-lists/outings/{outing_id}/packing-lists',
            path: {
                'outing_id': outingId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Outing Packing List
     * Delete an outing packing list.
     *
     * Requires authentication.
     * @param outingId
     * @param packingListId
     * @returns void
     * @throws ApiError
     */
    public static deleteOutingPackingListApiPackingListsOutingsOutingIdPackingListsPackingListIdDelete(
        outingId: string,
        packingListId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/packing-lists/outings/{outing_id}/packing-lists/{packing_list_id}',
            path: {
                'outing_id': outingId,
                'packing_list_id': packingListId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Add Packing List Item
     * Add a custom item to an outing packing list.
     *
     * Requires authentication.
     * @param outingId
     * @param packingListId
     * @param requestBody
     * @returns OutingPackingListItemResponse Successful Response
     * @throws ApiError
     */
    public static addPackingListItemApiPackingListsOutingsOutingIdPackingListsPackingListIdItemsPost(
        outingId: string,
        packingListId: string,
        requestBody: OutingPackingListItemCreate,
    ): CancelablePromise<OutingPackingListItemResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/packing-lists/outings/{outing_id}/packing-lists/{packing_list_id}/items',
            path: {
                'outing_id': outingId,
                'packing_list_id': packingListId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Packing List Item
     * Update a packing list item (quantity, checked status, etc.).
     *
     * Requires authentication.
     * @param outingId
     * @param itemId
     * @param requestBody
     * @returns OutingPackingListItemResponse Successful Response
     * @throws ApiError
     */
    public static updatePackingListItemApiPackingListsOutingsOutingIdPackingListsItemsItemIdPatch(
        outingId: string,
        itemId: string,
        requestBody: OutingPackingListItemUpdate,
    ): CancelablePromise<OutingPackingListItemResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/packing-lists/outings/{outing_id}/packing-lists/items/{item_id}',
            path: {
                'outing_id': outingId,
                'item_id': itemId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Packing List Item
     * Delete a packing list item.
     *
     * Requires authentication.
     * @param outingId
     * @param itemId
     * @returns void
     * @throws ApiError
     */
    public static deletePackingListItemApiPackingListsOutingsOutingIdPackingListsItemsItemIdDelete(
        outingId: string,
        itemId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/packing-lists/outings/{outing_id}/packing-lists/items/{item_id}',
            path: {
                'outing_id': outingId,
                'item_id': itemId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
