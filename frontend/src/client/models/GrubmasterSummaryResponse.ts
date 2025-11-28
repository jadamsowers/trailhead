/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EatingGroupResponse } from './EatingGroupResponse';
import type { GrubmasterSummaryParticipant } from './GrubmasterSummaryParticipant';
/**
 * Summary of grubmaster assignments for an outing
 */
export type GrubmasterSummaryResponse = {
    outing_id: string;
    outing_name: string;
    food_budget_per_person?: (number | null);
    meal_count?: (number | null);
    budget_type?: (string | null);
    total_budget?: (number | null);
    treasurer_email?: (string | null);
    participants?: Array<GrubmasterSummaryParticipant>;
    eating_groups?: Array<EatingGroupResponse>;
    /**
     * Number of participants not in an eating group
     */
    unassigned_count?: number;
    /**
     * Number of participants requesting to be grubmaster
     */
    grubmaster_requests_count?: number;
};

