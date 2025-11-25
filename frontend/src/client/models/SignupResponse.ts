/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ParticipantResponse } from './ParticipantResponse';
/**
 * Schema for signup response
 */
export type SignupResponse = {
    id: string;
    outing_id: string;
    family_contact_name: string;
    family_contact_email: string;
    family_contact_phone: string;
    participants: Array<ParticipantResponse>;
    participant_count: number;
    scout_count: number;
    adult_count: number;
    created_at: string;
    /**
     * Warning messages about Scouting America requirements
     */
    warnings?: Array<string>;
};

