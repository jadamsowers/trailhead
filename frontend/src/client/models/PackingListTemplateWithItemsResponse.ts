/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PackingListTemplateItemResponse } from './PackingListTemplateItemResponse';
/**
 * Schema for packing list template with items
 */
export type PackingListTemplateWithItemsResponse = {
    name: string;
    description?: (string | null);
    id: string;
    created_at: string;
    updated_at: string;
    items?: Array<PackingListTemplateItemResponse>;
};

