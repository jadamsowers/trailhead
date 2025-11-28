/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RankRequirementResponse } from './RankRequirementResponse';
/**
 * Schema for participant progress response
 */
export type ParticipantProgressResponse = {
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
    id: string;
    family_member_id: string;
    created_at: string;
    updated_at: string;
    requirement?: (RankRequirementResponse | null);
};

