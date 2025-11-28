/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EmailListResponse } from '../models/EmailListResponse';
import type { EmailSendRequest } from '../models/EmailSendRequest';
import type { SignupCreate } from '../models/SignupCreate';
import type { SignupListResponse } from '../models/SignupListResponse';
import type { SignupResponse } from '../models/SignupResponse';
import type { SignupUpdate } from '../models/SignupUpdate';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SignupsService {
    /**
     * Create Signup
     * Create a new signup for an outing using family member IDs.
     * Rate limit: 5 signups per minute per IP.
     *
     * Scouting America Requirements enforced:
     * - Minimum 2 adults required per outing
     * - If female youth present, at least 1 female adult leader required
     * - Adults must have youth protection training for overnight outings
     * @param requestBody
     * @returns SignupResponse Successful Response
     * @throws ApiError
     */
    public static createSignupApiSignupsPost(
        requestBody: SignupCreate,
    ): CancelablePromise<SignupResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/signups',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Signups
     * List all signups (admin only).
     * Optionally filter by outing_id.
     * @param outingId
     * @param skip
     * @param limit
     * @returns SignupListResponse Successful Response
     * @throws ApiError
     */
    public static listSignupsApiSignupsGet(
        outingId?: string,
        skip?: number,
        limit: number = 100,
    ): CancelablePromise<SignupListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/signups',
            query: {
                'outing_id': outingId,
                'skip': skip,
                'limit': limit,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get My Signups
     * Get all signups for the current user.
     * Returns signups where any participant's family member belongs to the current user.
     * @returns SignupResponse Successful Response
     * @throws ApiError
     */
    public static getMySignupsApiSignupsMySignupsGet(): CancelablePromise<Array<SignupResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/signups/my-signups',
        });
    }
    /**
     * Update Signup
     * Update a signup's contact information and/or participants.
     * Users can only update their own signups. Admins can update any signup.
     * @param signupId
     * @param requestBody
     * @returns SignupResponse Successful Response
     * @throws ApiError
     */
    public static updateSignupApiSignupsSignupIdPut(
        signupId: string,
        requestBody: SignupUpdate,
    ): CancelablePromise<SignupResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/signups/{signup_id}',
            path: {
                'signup_id': signupId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Signup
     * Get a specific signup by ID.
     * Users can view their own signups. Admins can view any signup.
     * @param signupId
     * @returns SignupResponse Successful Response
     * @throws ApiError
     */
    public static getSignupApiSignupsSignupIdGet(
        signupId: string,
    ): CancelablePromise<SignupResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/signups/{signup_id}',
            path: {
                'signup_id': signupId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Cancel Signup
     * Cancel a signup.
     * Users can cancel their own signups. Admins can cancel any signup.
     * @param signupId
     * @returns void
     * @throws ApiError
     */
    public static cancelSignupApiSignupsSignupIdDelete(
        signupId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/signups/{signup_id}',
            path: {
                'signup_id': signupId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Export Outing Roster Pdf
     * Export outing roster as PDF file with checkboxes for check-in (admin only).
     * Returns an attractive, printable PDF document for outing leaders.
     * @param outingId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static exportOutingRosterPdfApiSignupsOutingsOutingIdExportPdfGet(
        outingId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/signups/outings/{outing_id}/export-pdf',
            path: {
                'outing_id': outingId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Outing Emails
     * Get all unique email addresses from signups for an outing (admin only).
     * Returns a list of family contact emails for communication purposes.
     * @param outingId
     * @returns EmailListResponse Successful Response
     * @throws ApiError
     */
    public static getOutingEmailsApiSignupsOutingsOutingIdEmailsGet(
        outingId: string,
    ): CancelablePromise<EmailListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/signups/outings/{outing_id}/emails',
            path: {
                'outing_id': outingId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Send Email To Participants
     * Send an email to all participants of an outing (admin only).
     *
     * Note: This endpoint returns the email list and message details.
     * The actual email sending should be handled by the frontend or an external service.
     * This is a placeholder that provides the necessary data for email composition.
     * @param outingId
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static sendEmailToParticipantsApiSignupsOutingsOutingIdSendEmailPost(
        outingId: string,
        requestBody: EmailSendRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/signups/outings/{outing_id}/send-email',
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
