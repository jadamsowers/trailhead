/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CheckInParticipant } from './CheckInParticipant';
/**
 * Summary of check-in status for an outing
 */
export type CheckInSummary = {
    outing_id: string;
    outing_name: string;
    outing_date: string;
    total_participants: number;
    checked_in_count: number;
    participants: Array<CheckInParticipant>;
};

