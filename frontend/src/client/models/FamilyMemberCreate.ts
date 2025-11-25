/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AllergyCreate } from './AllergyCreate';
/**
 * Schema for creating a family member
 */
export type FamilyMemberCreate = {
    /**
     * Full name
     */
    name: string;
    /**
     * Member type: 'adult' or 'scout'
     */
    member_type: string;
    /**
     * Date of birth (required for scouts)
     */
    date_of_birth?: (string | null);
    /**
     * Troop number
     */
    troop_number?: (string | null);
    /**
     * Patrol name (for scouts)
     */
    patrol_name?: (string | null);
    /**
     * Youth protection training status (for adults)
     */
    has_youth_protection?: boolean;
    /**
     * SAFE Youth Training certificate expiration date (for adults)
     */
    youth_protection_expiration?: (string | null);
    /**
     * Vehicle passenger capacity excluding driver (for adults)
     */
    vehicle_capacity?: number;
    /**
     * Medical notes or conditions
     */
    medical_notes?: (string | null);
    /**
     * List of dietary preferences
     */
    dietary_preferences?: Array<string>;
    /**
     * List of allergies
     */
    allergies?: Array<AllergyCreate>;
};

