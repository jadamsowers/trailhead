/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UpdateUserRoleRequest } from '../models/UpdateUserRoleRequest';
import type { UserContactUpdate } from '../models/UserContactUpdate';
import type { UserResponse } from '../models/UserResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthService {
    /**
     * Get Current User Info
     * Get current authenticated user information including contact details.
     * Rate limit: 30 requests per minute per IP.
     * @returns UserResponse Successful Response
     * @throws ApiError
     */
    public static getCurrentUserInfoApiAuthMeGet(): CancelablePromise<UserResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/auth/me',
        });
    }
    /**
     * Update Contact Info
     * Update current user's contact information.
     * This serves as the default contact info for signups.
     * @param requestBody
     * @returns UserResponse Successful Response
     * @throws ApiError
     */
    public static updateContactInfoApiAuthMeContactPatch(
        requestBody: UserContactUpdate,
    ): CancelablePromise<UserResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/auth/me/contact',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Mark Initial Setup Complete
     * Mark the current user's initial setup as complete.
     * @returns UserResponse Successful Response
     * @throws ApiError
     */
    public static markInitialSetupCompleteApiAuthMeInitialSetupCompletePost(): CancelablePromise<UserResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/me/initial-setup/complete',
        });
    }
    /**
     * Sync User Role
     * Rate limit: 10 requests per minute per IP.
     * @returns any Successful Response
     * @throws ApiError
     */
    public static syncUserRoleApiAuthSyncRolePost(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/sync-role',
        });
    }
    /**
     * List Users
     * List all users in the system. Admin only.
     * @returns UserResponse Successful Response
     * @throws ApiError
     */
    public static listUsersApiAuthUsersGet(): CancelablePromise<Array<UserResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/auth/users',
        });
    }
    /**
     * Update User Role
     * Update a user's role. Admin only.
     * Cannot demote the initial admin.
     * @param userId
     * @param requestBody
     * @returns UserResponse Successful Response
     * @throws ApiError
     */
    public static updateUserRoleApiAuthUsersUserIdRolePatch(
        userId: string,
        requestBody: UpdateUserRoleRequest,
    ): CancelablePromise<UserResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/auth/users/{user_id}/role',
            path: {
                'user_id': userId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
