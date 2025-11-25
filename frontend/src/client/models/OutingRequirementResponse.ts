/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RankRequirementResponse } from './RankRequirementResponse';
/**
 * Schema for outing requirement response with full requirement details
 */
export type OutingRequirementResponse = {
    id: string;
    outing_id: string;
    rank_requirement_id: string;
    notes: (string | null);
    created_at: string;
    requirement: RankRequirementResponse;
};

