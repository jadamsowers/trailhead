/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FamilyContact } from './FamilyContact';
/**
 * Schema for updating a signup - can update contact info and/or participants
 */
export type SignupUpdate = {
    /**
     * Updated family contact information
     */
    family_contact?: (FamilyContact | null);
    /**
     * Updated list of family member IDs (replaces existing participants)
     */
    family_member_ids?: (Array<string> | null);
};

