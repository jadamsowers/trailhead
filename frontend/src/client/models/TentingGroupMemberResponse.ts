/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for tenting group member response
 */
export type TentingGroupMemberResponse = {
    /**
     * ID of the participant
     */
    participant_id: string;
    id: string;
    created_at: string;
    /**
     * Name of the participant
     */
    participant_name?: (string | null);
    /**
     * Age of the participant
     */
    age?: (number | null);
    /**
     * Gender of the participant
     */
    gender?: (string | null);
    /**
     * Patrol name of the participant
     */
    patrol_name?: (string | null);
};

