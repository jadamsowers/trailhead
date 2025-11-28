/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request to send email notifications to eating groups
 */
export type EatingGroupEmailRequest = {
    /**
     * Specific groups to email (None for all)
     */
    eating_group_ids?: (Array<string> | null);
    /**
     * Include food budget information
     */
    include_budget_info?: boolean;
    /**
     * Include dietary restrictions
     */
    include_dietary_info?: boolean;
    /**
     * Custom message to include
     */
    custom_message?: (string | null);
};

