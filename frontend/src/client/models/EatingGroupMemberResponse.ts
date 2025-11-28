/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for eating group member response
 */
export type EatingGroupMemberResponse = {
    /**
     * ID of the participant
     */
    participant_id: string;
    /**
     * Whether this participant is a grubmaster for this group
     */
    is_grubmaster?: boolean;
    id: string;
    created_at: string;
    /**
     * Name of the participant
     */
    participant_name?: (string | null);
    /**
     * Patrol name of the participant
     */
    patrol_name?: (string | null);
    /**
     * Dietary restrictions
     */
    dietary_restrictions?: Array<string>;
    /**
     * Allergies
     */
    allergies?: Array<string>;
};

