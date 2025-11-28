/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TentingGroupResponse } from './TentingGroupResponse';
import type { TentingSummaryParticipant } from './TentingSummaryParticipant';
/**
 * Summary of tenting assignments for an outing
 */
export type TentingSummaryResponse = {
    outing_id: string;
    outing_name: string;
    participants?: Array<TentingSummaryParticipant>;
    tenting_groups?: Array<TentingGroupResponse>;
    /**
     * Number of scouts not in a tenting group
     */
    unassigned_count?: number;
    /**
     * Total number of scouts (non-adults)
     */
    scout_count?: number;
};

