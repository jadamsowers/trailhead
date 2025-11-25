/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MeritBadgeSuggestion } from './MeritBadgeSuggestion';
import type { RequirementSuggestion } from './RequirementSuggestion';
/**
 * Schema for all suggestions for an outing
 */
export type OutingSuggestions = {
    /**
     * Suggested rank requirements
     */
    requirements: Array<RequirementSuggestion>;
    /**
     * Suggested merit badges
     */
    merit_badges: Array<MeritBadgeSuggestion>;
};

