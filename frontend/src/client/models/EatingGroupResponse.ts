/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EatingGroupMemberResponse } from './EatingGroupMemberResponse';
/**
 * Schema for eating group response
 */
export type EatingGroupResponse = {
    /**
     * Name of the eating group
     */
    name: string;
    /**
     * Notes about the eating group
     */
    notes?: (string | null);
    id: string;
    outing_id: string;
    members?: Array<EatingGroupMemberResponse>;
    /**
     * Number of members in the group
     */
    member_count?: number;
    /**
     * Number of grubmasters in the group
     */
    grubmaster_count?: number;
    created_at: string;
    updated_at: string;
};

