/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MeritBadgeResponse } from './MeritBadgeResponse';
/**
 * Schema for outing merit badge response with full badge details
 */
export type OutingMeritBadgeResponse = {
    id: string;
    outing_id: string;
    merit_badge_id: string;
    notes: (string | null);
    created_at: string;
    merit_badge: MeritBadgeResponse;
};

