/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request to move a participant to a different eating group
 */
export type MoveParticipantRequest = {
    /**
     * ID of the participant to move
     */
    participant_id: string;
    /**
     * ID of the eating group to move to (None to remove from group)
     */
    target_eating_group_id?: (string | null);
    /**
     * Whether to set/unset as grubmaster
     */
    is_grubmaster?: (boolean | null);
};

