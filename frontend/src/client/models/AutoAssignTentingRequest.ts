/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request to auto-assign participants to tenting groups
 */
export type AutoAssignTentingRequest = {
    /**
     * Minimum scouts per tent
     */
    tent_size_min?: number;
    /**
     * Maximum scouts per tent
     */
    tent_size_max?: number;
    /**
     * Try to keep patrol members together
     */
    keep_patrols_together?: boolean;
    /**
     * Maximum age difference between tentmates
     */
    max_age_difference?: number;
};

