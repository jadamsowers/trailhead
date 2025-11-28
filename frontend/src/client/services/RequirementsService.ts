/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MeritBadgeCreate } from '../models/MeritBadgeCreate';
import type { MeritBadgeResponse } from '../models/MeritBadgeResponse';
import type { MeritBadgeUpdate } from '../models/MeritBadgeUpdate';
import type { OutingMeritBadgeCreate } from '../models/OutingMeritBadgeCreate';
import type { OutingMeritBadgeResponse } from '../models/OutingMeritBadgeResponse';
import type { OutingMeritBadgeUpdate } from '../models/OutingMeritBadgeUpdate';
import type { OutingRequirementCreate } from '../models/OutingRequirementCreate';
import type { OutingRequirementResponse } from '../models/OutingRequirementResponse';
import type { OutingRequirementUpdate } from '../models/OutingRequirementUpdate';
import type { OutingSuggestions } from '../models/OutingSuggestions';
import type { ParticipantProgressCreate } from '../models/ParticipantProgressCreate';
import type { ParticipantProgressResponse } from '../models/ParticipantProgressResponse';
import type { ParticipantProgressUpdate } from '../models/ParticipantProgressUpdate';
import type { PreviewSuggestionsRequest } from '../models/PreviewSuggestionsRequest';
import type { RankRequirementCreate } from '../models/RankRequirementCreate';
import type { RankRequirementResponse } from '../models/RankRequirementResponse';
import type { RankRequirementUpdate } from '../models/RankRequirementUpdate';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class RequirementsService {
    /**
     * List Rank Requirements
     * Get all rank requirements with optional filtering by rank and category (async)
     * @param skip
     * @param limit
     * @param rank
     * @param category
     * @returns RankRequirementResponse Successful Response
     * @throws ApiError
     */
    public static listRankRequirementsApiRequirementsRankRequirementsGet(
        skip?: number,
        limit: number = 100,
        rank?: (string | null),
        category?: (string | null),
    ): CancelablePromise<Array<RankRequirementResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/requirements/rank-requirements',
            query: {
                'skip': skip,
                'limit': limit,
                'rank': rank,
                'category': category,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Rank Requirement
     * Create a new rank requirement (admin only, async)
     * @param requestBody
     * @returns RankRequirementResponse Successful Response
     * @throws ApiError
     */
    public static createRankRequirementApiRequirementsRankRequirementsPost(
        requestBody: RankRequirementCreate,
    ): CancelablePromise<RankRequirementResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/requirements/rank-requirements',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Rank Requirement
     * Get a specific rank requirement by ID (async)
     * @param requirementId
     * @returns RankRequirementResponse Successful Response
     * @throws ApiError
     */
    public static getRankRequirementApiRequirementsRankRequirementsRequirementIdGet(
        requirementId: string,
    ): CancelablePromise<RankRequirementResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/requirements/rank-requirements/{requirement_id}',
            path: {
                'requirement_id': requirementId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Rank Requirement
     * Update a rank requirement (admin only, async)
     * @param requirementId
     * @param requestBody
     * @returns RankRequirementResponse Successful Response
     * @throws ApiError
     */
    public static updateRankRequirementApiRequirementsRankRequirementsRequirementIdPut(
        requirementId: string,
        requestBody: RankRequirementUpdate,
    ): CancelablePromise<RankRequirementResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/requirements/rank-requirements/{requirement_id}',
            path: {
                'requirement_id': requirementId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Rank Requirement
     * Delete a rank requirement (admin only, async)
     * @param requirementId
     * @returns void
     * @throws ApiError
     */
    public static deleteRankRequirementApiRequirementsRankRequirementsRequirementIdDelete(
        requirementId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/requirements/rank-requirements/{requirement_id}',
            path: {
                'requirement_id': requirementId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Merit Badges
     * Get all merit badges (async)
     * @param skip
     * @param limit
     * @returns MeritBadgeResponse Successful Response
     * @throws ApiError
     */
    public static listMeritBadgesApiRequirementsMeritBadgesGet(
        skip?: number,
        limit: number = 100,
    ): CancelablePromise<Array<MeritBadgeResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/requirements/merit-badges',
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
     * Create Merit Badge
     * Create a new merit badge (admin only, async)
     * @param requestBody
     * @returns MeritBadgeResponse Successful Response
     * @throws ApiError
     */
    public static createMeritBadgeApiRequirementsMeritBadgesPost(
        requestBody: MeritBadgeCreate,
    ): CancelablePromise<MeritBadgeResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/requirements/merit-badges',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Merit Badge
     * Get a specific merit badge by ID (async)
     * @param badgeId
     * @returns MeritBadgeResponse Successful Response
     * @throws ApiError
     */
    public static getMeritBadgeApiRequirementsMeritBadgesBadgeIdGet(
        badgeId: string,
    ): CancelablePromise<MeritBadgeResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/requirements/merit-badges/{badge_id}',
            path: {
                'badge_id': badgeId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Merit Badge
     * Update a merit badge (admin only, async)
     * @param badgeId
     * @param requestBody
     * @returns MeritBadgeResponse Successful Response
     * @throws ApiError
     */
    public static updateMeritBadgeApiRequirementsMeritBadgesBadgeIdPut(
        badgeId: string,
        requestBody: MeritBadgeUpdate,
    ): CancelablePromise<MeritBadgeResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/requirements/merit-badges/{badge_id}',
            path: {
                'badge_id': badgeId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Merit Badge
     * Delete a merit badge (admin only, async)
     * @param badgeId
     * @returns void
     * @throws ApiError
     */
    public static deleteMeritBadgeApiRequirementsMeritBadgesBadgeIdDelete(
        badgeId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/requirements/merit-badges/{badge_id}',
            path: {
                'badge_id': badgeId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Outing Requirements
     * Get all requirements for a specific outing (async)
     * @param outingId
     * @returns OutingRequirementResponse Successful Response
     * @throws ApiError
     */
    public static listOutingRequirementsApiRequirementsOutingsOutingIdRequirementsGet(
        outingId: string,
    ): CancelablePromise<Array<OutingRequirementResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/requirements/outings/{outing_id}/requirements',
            path: {
                'outing_id': outingId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Add Requirement To Outing
     * Add a requirement to an outing (admin only, async)
     * @param outingId
     * @param requestBody
     * @returns OutingRequirementResponse Successful Response
     * @throws ApiError
     */
    public static addRequirementToOutingApiRequirementsOutingsOutingIdRequirementsPost(
        outingId: string,
        requestBody: OutingRequirementCreate,
    ): CancelablePromise<OutingRequirementResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/requirements/outings/{outing_id}/requirements',
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
     * Update Outing Requirement
     * Update notes for an outing requirement (admin only, async)
     * @param outingRequirementId
     * @param requestBody
     * @returns OutingRequirementResponse Successful Response
     * @throws ApiError
     */
    public static updateOutingRequirementApiRequirementsOutingsRequirementsOutingRequirementIdPut(
        outingRequirementId: string,
        requestBody: OutingRequirementUpdate,
    ): CancelablePromise<OutingRequirementResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/requirements/outings/requirements/{outing_requirement_id}',
            path: {
                'outing_requirement_id': outingRequirementId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Remove Requirement From Outing
     * Remove a requirement from an outing (admin only, async)
     * @param outingRequirementId
     * @returns void
     * @throws ApiError
     */
    public static removeRequirementFromOutingApiRequirementsOutingsRequirementsOutingRequirementIdDelete(
        outingRequirementId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/requirements/outings/requirements/{outing_requirement_id}',
            path: {
                'outing_requirement_id': outingRequirementId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Outing Merit Badges
     * Get all merit badges for a specific outing (async)
     * @param outingId
     * @returns OutingMeritBadgeResponse Successful Response
     * @throws ApiError
     */
    public static listOutingMeritBadgesApiRequirementsOutingsOutingIdMeritBadgesGet(
        outingId: string,
    ): CancelablePromise<Array<OutingMeritBadgeResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/requirements/outings/{outing_id}/merit-badges',
            path: {
                'outing_id': outingId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Add Merit Badge To Outing
     * Add a merit badge to an outing (admin only, async)
     * @param outingId
     * @param requestBody
     * @returns OutingMeritBadgeResponse Successful Response
     * @throws ApiError
     */
    public static addMeritBadgeToOutingApiRequirementsOutingsOutingIdMeritBadgesPost(
        outingId: string,
        requestBody: OutingMeritBadgeCreate,
    ): CancelablePromise<OutingMeritBadgeResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/requirements/outings/{outing_id}/merit-badges',
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
     * Update Outing Merit Badge
     * Update notes for an outing merit badge (admin only, async)
     * @param outingBadgeId
     * @param requestBody
     * @returns OutingMeritBadgeResponse Successful Response
     * @throws ApiError
     */
    public static updateOutingMeritBadgeApiRequirementsOutingsMeritBadgesOutingBadgeIdPut(
        outingBadgeId: string,
        requestBody: OutingMeritBadgeUpdate,
    ): CancelablePromise<OutingMeritBadgeResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/requirements/outings/merit-badges/{outing_badge_id}',
            path: {
                'outing_badge_id': outingBadgeId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Remove Merit Badge From Outing
     * Remove a merit badge from an outing (admin only, async)
     * @param outingBadgeId
     * @returns void
     * @throws ApiError
     */
    public static removeMeritBadgeFromOutingApiRequirementsOutingsMeritBadgesOutingBadgeIdDelete(
        outingBadgeId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/requirements/outings/merit-badges/{outing_badge_id}',
            path: {
                'outing_badge_id': outingBadgeId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Participant Progress
     * Get all progress records for a participant (async)
     * @param familyMemberId
     * @returns ParticipantProgressResponse Successful Response
     * @throws ApiError
     */
    public static listParticipantProgressApiRequirementsParticipantsFamilyMemberIdProgressGet(
        familyMemberId: string,
    ): CancelablePromise<Array<ParticipantProgressResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/requirements/participants/{family_member_id}/progress',
            path: {
                'family_member_id': familyMemberId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Record Participant Progress
     * Record progress for a participant (admin only, async)
     * @param familyMemberId
     * @param requestBody
     * @returns ParticipantProgressResponse Successful Response
     * @throws ApiError
     */
    public static recordParticipantProgressApiRequirementsParticipantsFamilyMemberIdProgressPost(
        familyMemberId: string,
        requestBody: ParticipantProgressCreate,
    ): CancelablePromise<ParticipantProgressResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/requirements/participants/{family_member_id}/progress',
            path: {
                'family_member_id': familyMemberId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Participant Progress
     * Update a participant progress record (admin only, async)
     * @param progressId
     * @param requestBody
     * @returns ParticipantProgressResponse Successful Response
     * @throws ApiError
     */
    public static updateParticipantProgressApiRequirementsProgressProgressIdPut(
        progressId: string,
        requestBody: ParticipantProgressUpdate,
    ): CancelablePromise<ParticipantProgressResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/requirements/progress/{progress_id}',
            path: {
                'progress_id': progressId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Participant Progress
     * Delete a participant progress record (admin only, async)
     * @param progressId
     * @returns void
     * @throws ApiError
     */
    public static deleteParticipantProgressApiRequirementsProgressProgressIdDelete(
        progressId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/requirements/progress/{progress_id}',
            path: {
                'progress_id': progressId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Preview Suggestions
     * Get suggested rank requirements and merit badges based on outing name and description
     * before the outing is created. This is used in the outing creation wizard.
     *
     * NOTE: This endpoint returns nested objects matching the frontend's
     * `RequirementSuggestion` and `MeritBadgeSuggestion` types where each
     * suggestion includes the full requirement / merit badge object.
     * @param requestBody
     * @param minScore
     * @param maxRequirements
     * @param maxMeritBadges
     * @returns OutingSuggestions Successful Response
     * @throws ApiError
     */
    public static getPreviewSuggestionsApiRequirementsRequirementsPreviewSuggestionsPost(
        requestBody: PreviewSuggestionsRequest,
        minScore: number = 0.02,
        maxRequirements: number = 10,
        maxMeritBadges: number = 10,
    ): CancelablePromise<OutingSuggestions> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/requirements/requirements/preview-suggestions',
            query: {
                'min_score': minScore,
                'max_requirements': maxRequirements,
                'max_merit_badges': maxMeritBadges,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Suggestions For Outing
     * Get suggested rank requirements and merit badges for an outing
     * based on keywords in the outing name and description
     * @param outingId
     * @param minScore
     * @param maxRequirements
     * @param maxMeritBadges
     * @returns OutingSuggestions Successful Response
     * @throws ApiError
     */
    public static getSuggestionsForOutingApiRequirementsOutingsOutingIdSuggestionsGet(
        outingId: string,
        minScore: number = 0.02,
        maxRequirements: number = 10,
        maxMeritBadges: number = 10,
    ): CancelablePromise<OutingSuggestions> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/requirements/outings/{outing_id}/suggestions',
            path: {
                'outing_id': outingId,
            },
            query: {
                'min_score': minScore,
                'max_requirements': maxRequirements,
                'max_merit_badges': maxMeritBadges,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
