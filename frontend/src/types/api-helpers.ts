/**
 * API Type Helpers
 *
 * This file provides clean type exports from the OpenAPI-generated types.
 * It serves as an abstraction layer between the generated types and the application code.
 *
 * Usage:
 * import { Outing, SignupCreate, SignupResponse } from './api-helpers';
 *
 * Note: Run `npm run generate-types` to generate the base types from the backend OpenAPI spec.
 */

// Import from generated types (will be available after running generate-types script)
// Fallback lightweight interfaces while OpenAPI generated types are unavailable or schema names have changed.
// Replace with: import type { components, paths } from './generated'; after running `npm run generate-types`.

// Minimal Outing interface used across the app (keeps TS happy when OpenAPI schemas differ)
export interface Outing {
  id: string;
  name: string;
  outing_date: string;
  end_date?: string | null;
  location: string;
  description?: string | null;
  icon?: string | null;
  cost?: number | string | null;
  capacity_type?: "fixed" | "vehicle";
  max_participants?: number | null;
  signup_count?: number;
  available_spots?: number;
  total_vehicle_capacity?: number;
  is_full?: boolean;
  needs_two_deep_leadership?: boolean;
  needs_female_leader?: boolean;
  needs_more_drivers?: boolean;
  gear_list?: string | null;
  drop_off_time?: string | null;
  drop_off_location?: string | null;
  pickup_time?: string | null;
  pickup_location?: string | null;
}

// Basic signup types (trimmed)
export interface SignupParticipant {
  id: string;
  name: string;
  is_adult: boolean;
  vehicle_capacity: number;
  troop_number?: string | null;
  age?: number | string | null;
}

export interface SignupResponse {
  id: string;
  outing_id: string;
  participant_count: number;
  adult_count: number;
  scout_count: number;
  family_contact_email: string;
  family_contact_phone: string;
  family_contact_name?: string; // added for edit flow convenience
  participants: SignupParticipant[];
  warnings?: string[];
}

export interface SignupCreate {
  outing_id: string;
  family_contact: {
    email: string;
    phone: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
  };
  family_member_ids: string[];
}

// User + token types (trimmed)
export interface User {
  id: string;
  email: string;
  phone?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in?: number;
}

// Error helpers
export interface ValidationErrorItem {
  loc: (string | number)[];
  msg: string;
  type: string;
}
export interface HTTPValidationError {
  detail: ValidationErrorItem[];
}

export type LoginRequest = {
  email: string;
  password: string;
};

// Type Guards
export function isHTTPValidationError(
  error: unknown
): error is HTTPValidationError {
  return (
    typeof error === "object" &&
    error !== null &&
    "detail" in error &&
    Array.isArray((error as HTTPValidationError).detail)
  );
}

export function isScout(participant: SignupParticipant): boolean {
  return !participant.is_adult;
}

export function isAdult(participant: SignupParticipant): boolean {
  return participant.is_adult;
}

// NOTE: When generated OpenAPI types are restored, remove this fallback file or
// reconcile interfaces to match backend schema names.
