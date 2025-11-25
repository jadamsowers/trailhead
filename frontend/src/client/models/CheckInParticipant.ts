/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Participant information for check-in display
 */
export type CheckInParticipant = {
    id: string;
    signup_id: string;
    name: string;
    member_type: string;
    family_name: string;
    patrol_name?: (string | null);
    troop_number?: (string | null);
    is_checked_in?: boolean;
    checked_in_at?: (string | null);
    checked_in_by?: (string | null);
};

