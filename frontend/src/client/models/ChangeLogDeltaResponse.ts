/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChangeLogEntry } from './ChangeLogEntry';
export type ChangeLogDeltaResponse = {
    items: Array<ChangeLogEntry>;
    has_more: boolean;
    /**
     * Cursor for next page (last item's id)
     */
    next_cursor?: (string | null);
    /**
     * Timestamp of last item returned or server now if empty
     */
    latest_timestamp: string;
};

