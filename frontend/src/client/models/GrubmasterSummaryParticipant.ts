/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Summary of a participant for grubmaster management
 */
export type GrubmasterSummaryParticipant = {
    participant_id: string;
    name: string;
    patrol_name?: (string | null);
    troop_number?: (string | null);
    grubmaster_interest?: boolean;
    grubmaster_reason?: (string | null);
    dietary_restrictions?: Array<string>;
    allergies?: Array<string>;
    eating_group_id?: (string | null);
    eating_group_name?: (string | null);
    is_grubmaster?: boolean;
};

