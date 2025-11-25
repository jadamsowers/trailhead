/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for participant response
 */
export type ParticipantResponse = {
    id: string;
    name: string;
    age: (number | null);
    participant_type: string;
    is_adult: boolean;
    gender: (string | null);
    troop_number: (string | null);
    patrol_name: (string | null);
    has_youth_protection: boolean;
    vehicle_capacity: number;
    dietary_restrictions: Array<string>;
    allergies: Array<string>;
    medical_notes: (string | null);
    created_at: string;
};

