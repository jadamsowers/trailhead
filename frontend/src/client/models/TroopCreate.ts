/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type TroopCreate = {
    /**
     * Troop number identifier (e.g., 123)
     */
    number: string;
    /**
     * Chartering organization
     */
    charter_org?: (string | null);
    /**
     * Usual meeting location
     */
    meeting_location?: (string | null);
    /**
     * Regular meeting day (e.g., Tuesday)
     */
    meeting_day?: (string | null);
    /**
     * Administrative notes
     */
    notes?: (string | null);
    /**
     * Treasurer email for receipt submission
     */
    treasurer_email?: (string | null);
};

