/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AutoAssignTentingRequest } from '../models/AutoAssignTentingRequest';
import type { MoveTentingParticipantRequest } from '../models/MoveTentingParticipantRequest';
import type { TentingGroupCreate } from '../models/TentingGroupCreate';
import type { TentingGroupListResponse } from '../models/TentingGroupListResponse';
import type { TentingGroupMemberCreate } from '../models/TentingGroupMemberCreate';
import type { TentingGroupMemberResponse } from '../models/TentingGroupMemberResponse';
import type { TentingGroupResponse } from '../models/TentingGroupResponse';
import type { TentingGroupUpdate } from '../models/TentingGroupUpdate';
import type { TentingSummaryResponse } from '../models/TentingSummaryResponse';
import type { TentingValidationIssue } from '../models/TentingValidationIssue';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TentingService {
    /**
     * Get Tenting Summary
     * Get comprehensive tenting management summary for an outing.
     * Includes all scouts, tenting groups, and validation issues.
     * @param outingId
     * @returns TentingSummaryResponse Successful Response
     * @throws ApiError
     */
    public static getTentingSummaryApiOutingsOutingIdTentingGet(
        outingId: string,
    ): CancelablePromise<TentingSummaryResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/outings/{outing_id}/tenting',
            path: {
                'outing_id': outingId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Validate Tenting Assignments
     * Validate all tenting assignments for an outing against Scouting America policies.
     * Returns a list of validation issues.
     * @param outingId
     * @param maxAgeDifference
     * @returns TentingValidationIssue Successful Response
     * @throws ApiError
     */
    public static validateTentingAssignmentsApiOutingsOutingIdTentingValidateGet(
        outingId: string,
        maxAgeDifference: number = 2,
    ): CancelablePromise<Array<TentingValidationIssue>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/outings/{outing_id}/tenting/validate',
            path: {
                'outing_id': outingId,
            },
            query: {
                'max_age_difference': maxAgeDifference,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Tenting Groups
     * Get all tenting groups for an outing.
     * @param outingId
     * @returns TentingGroupListResponse Successful Response
     * @throws ApiError
     */
    public static getTentingGroupsApiOutingsOutingIdTentingGroupsGet(
        outingId: string,
    ): CancelablePromise<TentingGroupListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/outings/{outing_id}/tenting-groups',
            path: {
                'outing_id': outingId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Tenting Group
     * Create a new tenting group for an outing.
     * @param outingId
     * @param requestBody
     * @returns TentingGroupResponse Successful Response
     * @throws ApiError
     */
    public static createTentingGroupApiOutingsOutingIdTentingGroupsPost(
        outingId: string,
        requestBody: TentingGroupCreate,
    ): CancelablePromise<TentingGroupResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/outings/{outing_id}/tenting-groups',
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
     * Update Tenting Group
     * Update a tenting group.
     * @param outingId
     * @param tentingGroupId
     * @param requestBody
     * @returns TentingGroupResponse Successful Response
     * @throws ApiError
     */
    public static updateTentingGroupApiOutingsOutingIdTentingGroupsTentingGroupIdPut(
        outingId: string,
        tentingGroupId: string,
        requestBody: TentingGroupUpdate,
    ): CancelablePromise<TentingGroupResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/outings/{outing_id}/tenting-groups/{tenting_group_id}',
            path: {
                'outing_id': outingId,
                'tenting_group_id': tentingGroupId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Tenting Group
     * Delete a tenting group.
     * @param outingId
     * @param tentingGroupId
     * @returns void
     * @throws ApiError
     */
    public static deleteTentingGroupApiOutingsOutingIdTentingGroupsTentingGroupIdDelete(
        outingId: string,
        tentingGroupId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/outings/{outing_id}/tenting-groups/{tenting_group_id}',
            path: {
                'outing_id': outingId,
                'tenting_group_id': tentingGroupId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Add Member To Tenting Group
     * Add a participant to a tenting group.
     * @param outingId
     * @param tentingGroupId
     * @param requestBody
     * @returns TentingGroupMemberResponse Successful Response
     * @throws ApiError
     */
    public static addMemberToTentingGroupApiOutingsOutingIdTentingGroupsTentingGroupIdMembersPost(
        outingId: string,
        tentingGroupId: string,
        requestBody: TentingGroupMemberCreate,
    ): CancelablePromise<TentingGroupMemberResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/outings/{outing_id}/tenting-groups/{tenting_group_id}/members',
            path: {
                'outing_id': outingId,
                'tenting_group_id': tentingGroupId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Move Tenting Participant
     * Move a participant to a different tenting group or remove from all groups.
     * @param outingId
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static moveTentingParticipantApiOutingsOutingIdMoveTentingParticipantPost(
        outingId: string,
        requestBody: MoveTentingParticipantRequest,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/outings/{outing_id}/move-tenting-participant',
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
     * Auto Assign Tenting Groups
     * Automatically assign scouts to tenting groups based on Scouting America policies.
     * - Scouts must be within max_age_difference years of each other
     * - Scouts of different genders cannot share a tent
     * - Prefers keeping patrol members together
     * - Groups of 2-3 (2 preferred, 3 if odd number of scouts)
     * @param outingId
     * @param requestBody
     * @returns TentingGroupListResponse Successful Response
     * @throws ApiError
     */
    public static autoAssignTentingGroupsApiOutingsOutingIdAutoAssignTentingPost(
        outingId: string,
        requestBody: AutoAssignTentingRequest,
    ): CancelablePromise<TentingGroupListResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/outings/{outing_id}/auto-assign-tenting',
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
}
