/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for creating a tenting group
 */
export type TentingGroupCreate = {
    /**
     * Name of the tenting group (e.g., 'Tent 1')
     */
    name: string;
    /**
     * Notes about the tenting group
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

