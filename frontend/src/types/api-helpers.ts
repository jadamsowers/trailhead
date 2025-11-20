/**
 * API Type Helpers
 * 
 * This file provides clean type exports from the OpenAPI-generated types.
 * It serves as an abstraction layer between the generated types and the application code.
 * 
 * Usage:
 * import { Trip, SignupCreate, SignupResponse } from './api-helpers';
 * 
 * Note: Run `npm run generate-types` to generate the base types from the backend OpenAPI spec.
 */

// Import from generated types (will be available after running generate-types script)
import type { components, paths } from './generated';

// ============================================================================
// Schema Types (from components.schemas)
// ============================================================================

export type Trip = components['schemas']['TripResponse'];
export type TripCreate = components['schemas']['TripCreate'];
export type TripUpdate = components['schemas']['TripUpdate'];
export type TripListResponse = components['schemas']['TripListResponse'];

export type SignupCreate = components['schemas']['SignupCreate'];
export type SignupResponse = components['schemas']['SignupResponse'];

export type ParticipantCreate = components['schemas']['ParticipantCreate'];
export type ParticipantResponse = components['schemas']['ParticipantResponse'];

export type FamilyContact = components['schemas']['FamilyContact'];
export type DietaryRestriction = components['schemas']['DietaryRestriction'];
export type Allergy = components['schemas']['Allergy'];

export type LoginRequest = components['schemas']['LoginRequest'];
export type TokenResponse = components['schemas']['TokenResponse'];
export type User = components['schemas']['UserResponse'];

// ============================================================================
// API Response Types (from paths)
// ============================================================================

// Trip endpoints
export type GetTripsResponse = paths['/api/trips']['get']['responses']['200']['content']['application/json'];
export type GetAvailableTripsResponse = paths['/api/trips/available']['get']['responses']['200']['content']['application/json'];
export type CreateTripResponse = paths['/api/trips']['post']['responses']['201']['content']['application/json'];
export type GetTripResponse = paths['/api/trips/{trip_id}']['get']['responses']['200']['content']['application/json'];

// Signup endpoints
export type CreateSignupResponse = paths['/api/signups']['post']['responses']['201']['content']['application/json'];
export type GetSignupResponse = paths['/api/signups/{signup_id}']['get']['responses']['200']['content']['application/json'];
export type GetTripSignupsResponse = paths['/api/trips/{trip_id}/signups']['get']['responses']['200']['content']['application/json'];

// Auth endpoints
export type LoginResponse = paths['/api/auth/login']['post']['responses']['200']['content']['application/json'];
export type GetCurrentUserResponse = paths['/api/auth/me']['get']['responses']['200']['content']['application/json'];

// ============================================================================
// Error Types
// ============================================================================

export type HTTPValidationError = components['schemas']['HTTPValidationError'];
export type ValidationError = components['schemas']['ValidationError'];

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Extract the request body type from a POST/PUT endpoint
 */
export type RequestBody<T> = T extends { requestBody: { content: { 'application/json': infer R } } } ? R : never;

/**
 * Extract the response type from an endpoint
 */
export type ResponseData<T> = T extends { responses: { 200: { content: { 'application/json': infer R } } } }
  ? R
  : T extends { responses: { 201: { content: { 'application/json': infer R } } } }
  ? R
  : never;

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if a response is an error
 */
export function isHTTPValidationError(error: unknown): error is HTTPValidationError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'detail' in error &&
    Array.isArray((error as HTTPValidationError).detail)
  );
}

/**
 * Type guard to check if a participant is a scout
 */
export function isScout(participant: ParticipantResponse): boolean {
  return participant.participant_type === 'scout';
}

/**
 * Type guard to check if a participant is an adult
 */
export function isAdult(participant: ParticipantResponse): boolean {
  return participant.participant_type === 'adult';
}