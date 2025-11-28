/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AutoAssignRequest } from '../models/AutoAssignRequest';
import type { EatingGroupCreate } from '../models/EatingGroupCreate';
import type { EatingGroupEmailRequest } from '../models/EatingGroupEmailRequest';
import type { EatingGroupListResponse } from '../models/EatingGroupListResponse';
import type { EatingGroupMemberCreate } from '../models/EatingGroupMemberCreate';
import type { EatingGroupMemberResponse } from '../models/EatingGroupMemberResponse';
import type { EatingGroupResponse } from '../models/EatingGroupResponse';
import type { EatingGroupUpdate } from '../models/EatingGroupUpdate';
import type { GrubmasterSummaryResponse } from '../models/GrubmasterSummaryResponse';
import type { MoveParticipantRequest } from '../models/MoveParticipantRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class GrubmasterService {
    /**
     * Get Grubmaster Summary
     * Get comprehensive grubmaster management summary for an outing.
     * Includes all participants, eating groups, and grubmaster requests.
     * @param outingId
     * @returns GrubmasterSummaryResponse Successful Response
     * @throws ApiError
     */
    public static getGrubmasterSummaryApiOutingsOutingIdGrubmasterGet(
        outingId: string,
    ): CancelablePromise<GrubmasterSummaryResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/outings/{outing_id}/grubmaster',
            path: {
                'outing_id': outingId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Eating Groups
     * Get all eating groups for an outing.
     * @param outingId
     * @returns EatingGroupListResponse Successful Response
     * @throws ApiError
     */
    public static getEatingGroupsApiOutingsOutingIdEatingGroupsGet(
        outingId: string,
    ): CancelablePromise<EatingGroupListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/outings/{outing_id}/eating-groups',
            path: {
                'outing_id': outingId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Eating Group
     * Create a new eating group for an outing.
     * @param outingId
     * @param requestBody
     * @returns EatingGroupResponse Successful Response
     * @throws ApiError
     */
    public static createEatingGroupApiOutingsOutingIdEatingGroupsPost(
        outingId: string,
        requestBody: EatingGroupCreate,
    ): CancelablePromise<EatingGroupResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/outings/{outing_id}/eating-groups',
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
     * Update Eating Group
     * Update an eating group.
     * @param outingId
     * @param eatingGroupId
     * @param requestBody
     * @returns EatingGroupResponse Successful Response
     * @throws ApiError
     */
    public static updateEatingGroupApiOutingsOutingIdEatingGroupsEatingGroupIdPut(
        outingId: string,
        eatingGroupId: string,
        requestBody: EatingGroupUpdate,
    ): CancelablePromise<EatingGroupResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/outings/{outing_id}/eating-groups/{eating_group_id}',
            path: {
                'outing_id': outingId,
                'eating_group_id': eatingGroupId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Eating Group
     * Delete an eating group.
     * @param outingId
     * @param eatingGroupId
     * @returns void
     * @throws ApiError
     */
    public static deleteEatingGroupApiOutingsOutingIdEatingGroupsEatingGroupIdDelete(
        outingId: string,
        eatingGroupId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/outings/{outing_id}/eating-groups/{eating_group_id}',
            path: {
                'outing_id': outingId,
                'eating_group_id': eatingGroupId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Add Member To Eating Group
     * Add a participant to an eating group.
     * @param outingId
     * @param eatingGroupId
     * @param requestBody
     * @returns EatingGroupMemberResponse Successful Response
     * @throws ApiError
     */
    public static addMemberToEatingGroupApiOutingsOutingIdEatingGroupsEatingGroupIdMembersPost(
        outingId: string,
        eatingGroupId: string,
        requestBody: EatingGroupMemberCreate,
    ): CancelablePromise<EatingGroupMemberResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/outings/{outing_id}/eating-groups/{eating_group_id}/members',
            path: {
                'outing_id': outingId,
                'eating_group_id': eatingGroupId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Move Participant
     * Move a participant to a different eating group or remove from all groups.
     * @param outingId
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static moveParticipantApiOutingsOutingIdMoveParticipantPost(
        outingId: string,
        requestBody: MoveParticipantRequest,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/outings/{outing_id}/move-participant',
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
     * Set Participant Grubmaster
     * Set or unset a participant as grubmaster for their eating group.
     * @param outingId
     * @param participantId
     * @param isGrubmaster
     * @returns any Successful Response
     * @throws ApiError
     */
    public static setParticipantGrubmasterApiOutingsOutingIdSetGrubmasterPost(
        outingId: string,
        participantId: string,
        isGrubmaster: boolean = true,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/outings/{outing_id}/set-grubmaster',
            path: {
                'outing_id': outingId,
            },
            query: {
                'participant_id': participantId,
                'is_grubmaster': isGrubmaster,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Auto Assign Eating Groups
     * Automatically assign participants to eating groups based on preferences.
     * Groups by patrol if requested, and tries to group similar dietary needs.
     * @param outingId
     * @param requestBody
     * @returns EatingGroupListResponse Successful Response
     * @throws ApiError
     */
    public static autoAssignEatingGroupsApiOutingsOutingIdAutoAssignPost(
        outingId: string,
        requestBody: AutoAssignRequest,
    ): CancelablePromise<EatingGroupListResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/outings/{outing_id}/auto-assign',
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
     * Send Eating Group Emails
     * Generate email content for eating groups.
     * Returns mailto links for each group's grubmaster with group details.
     * @param outingId
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static sendEatingGroupEmailsApiOutingsOutingIdSendEatingGroupEmailsPost(
        outingId: string,
        requestBody: EatingGroupEmailRequest,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/outings/{outing_id}/send-eating-group-emails',
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
