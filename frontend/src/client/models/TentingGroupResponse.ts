/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TentingGroupMemberResponse } from './TentingGroupMemberResponse';
/**
 * Schema for tenting group response
 */
export type TentingGroupResponse = {
    /**
     * Name of the tenting group (e.g., 'Tent 1')
     */
    name: string;
    /**
     * Notes about the tenting group
     */
    notes?: (string | null);
    id: string;
    outing_id: string;
    members?: Array<TentingGroupMemberResponse>;
    /**
     * Number of members in the group
     */
    member_count?: number;
    created_at: string;
    updated_at: string;
};

