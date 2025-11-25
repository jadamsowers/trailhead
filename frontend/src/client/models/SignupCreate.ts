/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FamilyContact } from './FamilyContact';
/**
 * Schema for creating a signup with family member IDs
 */
export type SignupCreate = {
    /**
     * ID of the outing to sign up for
     */
    outing_id: string;
    /**
     * Family contact information
     */
    family_contact: FamilyContact;
    /**
     * List of family member IDs to sign up (at least one required)
     */
    family_member_ids: Array<string>;
};

