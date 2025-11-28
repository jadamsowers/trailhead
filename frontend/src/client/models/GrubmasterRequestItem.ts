/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for grubmaster request per family member
 */
export type GrubmasterRequestItem = {
    /**
     * ID of the family member
     */
    family_member_id: string;
    /**
     * Whether this scout wants to be a grubmaster
     */
    grubmaster_interest?: boolean;
    /**
     * Reason: rank_requirement, cooking_merit_badge, just_because
     */
    grubmaster_reason?: (string | null);
};

