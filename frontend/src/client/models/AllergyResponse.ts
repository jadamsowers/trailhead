/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for allergy response
 */
export type AllergyResponse = {
    /**
     * Allergy type (e.g., peanuts, shellfish)
     */
    allergy: string;
    /**
     * Severity level (mild, moderate, severe, life-threatening)
     */
    severity?: (string | null);
    id: string;
};

