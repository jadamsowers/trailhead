/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ChangeLogEntry = {
    id: string;
    /**
     * Type of entity: outing|signup|participant|place|requirement
     */
    entity_type: string;
    /**
     * UUID of entity affected
     */
    entity_id?: (string | null);
    /**
     * Operation type: create|update|delete
     */
    op_type: string;
    /**
     * Incrementing version per entity
     */
    version: number;
    /**
     * Optional 64-char hash of serialized entity payload
     */
    payload_hash?: (string | null);
    created_at: string;
};

