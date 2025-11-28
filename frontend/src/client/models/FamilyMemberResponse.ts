/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AllergyResponse } from './AllergyResponse';
import type { DietaryPreferenceResponse } from './DietaryPreferenceResponse';
/**
 * Schema for family member response
 */
export type FamilyMemberResponse = {
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
    troop_id?: (string | null);
    patrol_id?: (string | null);
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
    id: string;
    user_id: string;
    dietary_preferences?: Array<DietaryPreferenceResponse>;
    allergies?: Array<AllergyResponse>;
    created_at: string;
    updated_at: string;
};

