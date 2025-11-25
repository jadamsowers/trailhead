/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OutingPackingListItemResponse } from './OutingPackingListItemResponse';
import type { PackingListTemplateResponse } from './PackingListTemplateResponse';
/**
 * Schema for outing packing list responses
 */
export type OutingPackingListResponse = {
    id: string;
    outing_id: string;
    template_id?: (string | null);
    template?: (PackingListTemplateResponse | null);
    items?: Array<OutingPackingListItemResponse>;
    created_at: string;
};

