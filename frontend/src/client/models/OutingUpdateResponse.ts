/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OutingResponse } from './OutingResponse';
import type { OutingUpdateEmailDraft } from './OutingUpdateEmailDraft';
/**
 * Response for outing update including email draft
 */
export type OutingUpdateResponse = {
    outing: OutingResponse;
    /**
     * Email draft if changes occurred
     */
    email_draft?: (OutingUpdateEmailDraft | null);
};

