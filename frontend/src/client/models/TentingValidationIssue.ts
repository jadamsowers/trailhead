/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * A validation issue with a tenting group
 */
export type TentingValidationIssue = {
    tenting_group_id: string;
    tenting_group_name: string;
    /**
     * Type of issue: age_gap, gender_mismatch, group_size
     */
    issue_type: string;
    message: string;
    /**
     * Severity: warning, error
     */
    severity?: string;
};

