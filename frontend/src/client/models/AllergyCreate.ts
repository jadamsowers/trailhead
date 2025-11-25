/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for creating an allergy
 */
export type AllergyCreate = {
    /**
     * Allergy type (e.g., peanuts, shellfish)
     */
    allergy: string;
    /**
     * Severity level (mild, moderate, severe, life-threatening)
     */
    severity?: (string | null);
};

