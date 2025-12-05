/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ParentRegistrationRequest } from '../models/ParentRegistrationRequest';
import type { RegistrationResponse } from '../models/RegistrationResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class RegistrationService {
    /**
     * Register Parent
     * Register a new adult account.
     *
     * Note: This endpoint is deprecated. 
     * @param requestBody
     * @returns RegistrationResponse Successful Response
     * @throws ApiError
     */
    public static registerParentApiRegisterRegisterPost(
        requestBody: ParentRegistrationRequest,
    ): CancelablePromise<RegistrationResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/register/register',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
