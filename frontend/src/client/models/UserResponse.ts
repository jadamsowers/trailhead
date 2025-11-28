/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for user response
 */
export type UserResponse = {
    id: string;
    email: string;
    full_name: string;
    role?: string;
    is_initial_admin?: boolean;
    initial_setup_complete?: boolean;
    phone?: (string | null);
    emergency_contact_name?: (string | null);
    emergency_contact_phone?: (string | null);
    youth_protection_expiration?: (string | null);
};

