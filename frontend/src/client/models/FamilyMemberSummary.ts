/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Simplified schema for family member selection during signup
 */
export type FamilyMemberSummary = {
    id: string;
    name: string;
    member_type: string;
    troop_number?: (string | null);
    age?: (number | null);
    vehicle_capacity?: (number | null);
    has_youth_protection?: (boolean | null);
    youth_protection_expired?: (boolean | null);
};

