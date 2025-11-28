/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request to auto-assign participants to eating groups
 */
export type AutoAssignRequest = {
    /**
     * Minimum group size
     */
    group_size_min?: number;
    /**
     * Maximum group size
     */
    group_size_max?: number;
    /**
     * Try to keep patrol members together
     */
    keep_patrols_together?: boolean;
    /**
     * Try to group by dietary preferences
     */
    group_by_dietary?: boolean;
};

