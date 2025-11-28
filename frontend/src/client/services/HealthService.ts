/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class HealthService {
    /**
     * Health Check
     * Health check endpoint - checks DB connectivity, tables, and migration status.
     * @returns any Successful Response
     * @throws ApiError
     */
    public static healthCheckApiHealthGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/health',
        });
    }
    /**
     * Readiness Check
     * Readiness check endpoint - returns 200 if DB and tables are ready, 503 otherwise.
     * @returns any Successful Response
     * @throws ApiError
     */
    public static readinessCheckApiReadyGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/ready',
        });
    }
}
