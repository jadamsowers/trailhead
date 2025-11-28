/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PatrolResponse } from './PatrolResponse';
export type TroopResponse = {
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
    id: string;
    created_at: string;
    updated_at: string;
    patrols?: Array<PatrolResponse>;
};

