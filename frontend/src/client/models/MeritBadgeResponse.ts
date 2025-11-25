/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for merit badge response
 */
export type MeritBadgeResponse = {
    /**
     * Merit badge name
     */
    name: string;
    /**
     * Brief description of the merit badge
     */
    description?: (string | null);
    /**
     * Keywords for matching with outings
     */
    keywords?: (Array<string> | null);
    /**
     * Whether the merit badge is Eagle-required
     */
    eagle_required?: (boolean | null);
    id: string;
    created_at: string;
    updated_at: string;
};

