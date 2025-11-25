/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request to check in participants
 */
export type CheckInCreate = {
    /**
     * List of participant IDs to check in
     */
    participant_ids: Array<string>;
    /**
     * Name or email of person performing check-in
     */
    checked_in_by: string;
};

