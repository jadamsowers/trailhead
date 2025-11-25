/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AllergyCreate } from './AllergyCreate';
/**
 * Schema for updating a family member
 */
export type FamilyMemberUpdate = {
    name?: (string | null);
    date_of_birth?: (string | null);
    troop_number?: (string | null);
    patrol_name?: (string | null);
    has_youth_protection?: (boolean | null);
    youth_protection_expiration?: (string | null);
    vehicle_capacity?: (number | null);
    medical_notes?: (string | null);
    dietary_preferences?: (Array<string> | null);
    allergies?: (Array<AllergyCreate> | null);
};

