/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for creating an eating group
 */
export type EatingGroupCreate = {
    /**
     * Name of the eating group
     */
    name: string;
    /**
     * Notes about the eating group
     */
    notes?: (string | null);
    /**
     * ID of the outing
     */
    outing_id: string;
    /**
     * Optional list of participant IDs to add initially
     */
    member_ids?: (Array<string> | null);
};

