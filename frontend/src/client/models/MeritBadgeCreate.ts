/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for creating a new merit badge
 */
export type MeritBadgeCreate = {
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
};

