/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Flattened schema for suggested rank requirements.
 *
 * Returns only the fields requested by the client plus match metadata.
 */
export type RequirementSuggestion = {
    /**
     * Requirement UUID for selection
     */
    id: string;
    /**
     * Scout rank
     */
    rank: string;
    /**
     * Requirement number (e.g. '1a')
     */
    requirement_number: string;
    /**
     * Full requirement description
     */
    description: string;
    /**
     * Relevance score (0-1)
     */
    match_score: number;
    /**
     * Keywords that matched
     */
    matched_keywords: Array<string>;
};

