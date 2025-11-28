/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for recording participant progress
 */
export type ParticipantProgressCreate = {
    /**
     * ID of the rank requirement
     */
    rank_requirement_id: string;
    /**
     * ID of the outing where this was completed
     */
    outing_id?: (string | null);
    /**
     * Whether the requirement is completed
     */
    completed?: boolean;
    /**
     * Notes about completion
     */
    notes?: (string | null);
};

