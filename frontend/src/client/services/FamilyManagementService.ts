/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FamilyMemberCreate } from '../models/FamilyMemberCreate';
import type { FamilyMemberListResponse } from '../models/FamilyMemberListResponse';
import type { FamilyMemberResponse } from '../models/FamilyMemberResponse';
import type { FamilyMemberSummary } from '../models/FamilyMemberSummary';
import type { FamilyMemberUpdate } from '../models/FamilyMemberUpdate';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class FamilyManagementService {
    /**
     * List Family Members
     * Get all family members for the current user.
     * Returns a list of family members with their dietary preferences and allergies.
     * @returns FamilyMemberListResponse Successful Response
     * @throws ApiError
     */
    public static listFamilyMembersApiFamilyGet(): CancelablePromise<FamilyMemberListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/family/',
        });
    }
    /**
     * Create Family Member
     * Create a new family member.
     * Includes dietary preferences and allergies.
     * @param requestBody
     * @returns FamilyMemberResponse Successful Response
     * @throws ApiError
     */
    public static createFamilyMemberApiFamilyPost(
        requestBody: FamilyMemberCreate,
    ): CancelablePromise<FamilyMemberResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/family/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Family Members Summary
     * Get a simplified list of family members for selection during signup.
     * Returns basic information without detailed medical/dietary data.
     *
     * If outing_id is provided, youth protection expiration is checked against
     * the outing's end date (or outing date if no end date). Otherwise, it's
     * checked against today's date.
     * @param outingId
     * @returns FamilyMemberSummary Successful Response
     * @throws ApiError
     */
    public static listFamilyMembersSummaryApiFamilySummaryGet(
        outingId?: string,
    ): CancelablePromise<Array<FamilyMemberSummary>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/family/summary',
            query: {
                'outing_id': outingId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Family Member
     * Get a specific family member by ID.
     * Only returns members belonging to the current user.
     * @param memberId
     * @returns FamilyMemberResponse Successful Response
     * @throws ApiError
     */
    public static getFamilyMemberApiFamilyMemberIdGet(
        memberId: string,
    ): CancelablePromise<FamilyMemberResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/family/{member_id}',
            path: {
                'member_id': memberId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Family Member
     * Update an existing family member.
     * Only the owner can update their family members.
     * @param memberId
     * @param requestBody
     * @returns FamilyMemberResponse Successful Response
     * @throws ApiError
     */
    public static updateFamilyMemberApiFamilyMemberIdPut(
        memberId: string,
        requestBody: FamilyMemberUpdate,
    ): CancelablePromise<FamilyMemberResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/family/{member_id}',
            path: {
                'member_id': memberId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Family Member
     * Delete a family member.
     * Only the owner can delete their family members.
     * @param memberId
     * @returns void
     * @throws ApiError
     */
    public static deleteFamilyMemberApiFamilyMemberIdDelete(
        memberId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/family/{member_id}',
            path: {
                'member_id': memberId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
