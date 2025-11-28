/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request to move a participant to a different tenting group
 */
export type MoveTentingParticipantRequest = {
    /**
     * ID of the participant to move
     */
    participant_id: string;
    /**
     * ID of the tenting group to move to (None to remove from group)
     */
    target_tenting_group_id?: (string | null);
};

