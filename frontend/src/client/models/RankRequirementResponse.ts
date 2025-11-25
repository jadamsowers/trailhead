/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for rank requirement response
 */
export type RankRequirementResponse = {
    /**
     * Scout rank (Scout, Tenderfoot, Second Class, First Class)
     */
    rank: string;
    /**
     * Requirement number (e.g., '1a', '2b', '3')
     */
    requirement_number: string;
    /**
     * Full description of the requirement
     */
    requirement_text: string;
    /**
     * Keywords for matching with outings
     */
    keywords?: (Array<string> | null);
    /**
     * Category (e.g., Camping, Hiking, First Aid)
     */
    category?: (string | null);
    id: string;
    created_at: string;
    updated_at: string;
};

