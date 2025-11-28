/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for adding a member to an eating group
 */
export type EatingGroupMemberCreate = {
    /**
     * ID of the participant
     */
    participant_id: string;
    /**
     * Whether this participant is a grubmaster for this group
     */
    is_grubmaster?: boolean;
};

