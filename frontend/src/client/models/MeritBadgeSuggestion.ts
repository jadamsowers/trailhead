/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Flattened schema for suggested merit badges.
 *
 * Returns badge name and description plus match metadata.
 */
export type MeritBadgeSuggestion = {
    /**
     * Badge UUID for selection
     */
    id: string;
    /**
     * Merit badge name
     */
    name: string;
    /**
     * Merit badge description
     */
    description?: (string | null);
    /**
     * Eagle-required badge indicator
     */
    eagle_required?: boolean;
    /**
     * Relevance score (0-1)
     */
    match_score: number;
    /**
     * Keywords that matched
     */
    matched_keywords: Array<string>;
};

