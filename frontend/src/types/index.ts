// API Response Types matching backend schemas

export interface Trip {
    id: string;
    name: string;
    trip_date: string;
    end_date?: string;
    location: string;
    description: string;
    max_participants: number;
    capacity_type: 'fixed' | 'vehicle';
    signup_count: number;
    available_spots: number;
    is_full: boolean;
    total_vehicle_capacity: number;
    needs_more_drivers: boolean;
    adult_count: number;
    needs_two_deep_leadership: boolean;
    needs_female_leader: boolean;
    is_overnight: boolean;
    trip_lead_name?: string;
    trip_lead_email?: string;
    trip_lead_phone?: string;
    created_at: string;
    updated_at: string;
}

export interface TripCreate {
    name: string;
    trip_date: string;
    end_date?: string;
    location: string;
    description: string;
    max_participants: number;
    capacity_type: 'fixed' | 'vehicle';
    is_overnight: boolean;
    trip_lead_name?: string;
    trip_lead_email?: string;
    trip_lead_phone?: string;
}

export interface FamilyContact {
    email: string;
    phone: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
}

export interface DietaryRestriction {
    restriction_type: string;
    notes?: string;
}

export interface Allergy {
    allergy_type: string;
    severity: 'mild' | 'moderate' | 'severe';
    notes?: string;
}

export interface ParticipantBase {
    full_name: string;
    participant_type: 'scout' | 'adult';
    gender: 'male' | 'female' | 'other';
    age?: number;
    troop_number?: string;
    patrol?: string;
    dietary_restrictions: DietaryRestriction[];
    allergies: Allergy[];
}

export interface ScoutParticipant extends ParticipantBase {
    participant_type: 'scout';
    age: number;
    troop_number: string;
    patrol?: string;
}

export interface AdultParticipant extends ParticipantBase {
    participant_type: 'adult';
    vehicle_capacity?: number;
}

export type Participant = ScoutParticipant | AdultParticipant;

// Participant response from backend (different from create)
export interface ParticipantResponse {
    id: string;
    name: string;
    age: number;
    participant_type: 'scout' | 'adult';
    is_adult: boolean;
    gender: 'male' | 'female' | 'other';
    troop_number: string | null;
    patrol_name: string | null;
    has_youth_protection: boolean;
    vehicle_capacity: number;
    dietary_restrictions: string[];
    allergies: string[];
    medical_notes: string | null;
    created_at: string;
}

export interface SignupCreate {
    trip_id: string;
    family_contact: FamilyContact;
    participants: Participant[];
}

export interface SignupResponse {
    id: string;
    trip_id: string;
    family_contact_name: string;
    family_contact_email: string;
    family_contact_phone: string;
    participants: ParticipantResponse[];
    participant_count: number;
    scout_count: number;
    adult_count: number;
    created_at: string;
    warnings: string[];
}

export interface SignupWithDetails extends SignupResponse {
    trip: Trip;
}

// Common dietary restrictions and allergies
export const DIETARY_RESTRICTIONS = [
    'vegetarian',
    'vegan',
    'gluten-free',
    'dairy-free',
    'nut-free',
    'kosher',
    'halal',
    'other'
] as const;

export const ALLERGY_TYPES = [
    'peanuts',
    'tree_nuts',
    'dairy',
    'eggs',
    'soy',
    'wheat',
    'fish',
    'shellfish',
    'bee_stings',
    'medication',
    'other'
] as const;

export const ALLERGY_SEVERITIES = ['mild', 'moderate', 'severe'] as const;

// Form state types
export interface ParticipantFormData {
    full_name: string;
    participant_type: 'scout' | 'adult';
    gender: 'male' | 'female' | 'other';
    age: string;
    troop_number: string;
    patrol: string;
    has_youth_protection_training: boolean;
    vehicle_capacity: string;
    dietary_restrictions: {
        [key: string]: boolean;
    };
    dietary_notes: string;
    allergies: {
        type: string;
        severity: 'mild' | 'moderate' | 'severe';
        notes: string;
    }[];
}

export interface SignupFormData {
    trip_id: string;
    email: string;
    phone: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
    participants: ParticipantFormData[];
}

// API Error Response
export interface APIError {
    detail: string;
}

// Authentication types
export interface LoginRequest {
    email: string;
    password: string;
}

export interface TokenResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

export interface User {
    id: string;
    email: string;
    full_name: string;
    role: 'admin' | 'user' | 'parent';
    is_active: boolean;
}

// Family Management Types
export interface DietaryPreference {
    id: string;
    preference: string;
}

export interface FamilyMemberAllergy {
    id: string;
    allergy: string;
    severity?: string;
}

export interface FamilyMember {
    id: string;
    user_id: string;
    name: string;
    member_type: 'parent' | 'scout';
    date_of_birth?: string;
    troop_number?: string;
    patrol_name?: string;
    has_youth_protection: boolean;
    vehicle_capacity: number;
    medical_notes?: string;
    dietary_preferences: DietaryPreference[];
    allergies: FamilyMemberAllergy[];
    created_at: string;
    updated_at: string;
}

export interface FamilyMemberCreate {
    name: string;
    member_type: 'parent' | 'scout';
    date_of_birth?: string;
    troop_number?: string;
    patrol_name?: string;
    has_youth_protection?: boolean;
    vehicle_capacity?: number;
    medical_notes?: string;
    dietary_preferences?: string[];
    allergies?: {
        allergy: string;
        severity?: string;
    }[];
}

export interface FamilyMemberUpdate {
    name?: string;
    date_of_birth?: string;
    troop_number?: string;
    patrol_name?: string;
    has_youth_protection?: boolean;
    vehicle_capacity?: number;
    medical_notes?: string;
    dietary_preferences?: string[];
    allergies?: {
        allergy: string;
        severity?: string;
    }[];
}

export interface FamilyMemberSummary {
    id: string;
    name: string;
    member_type: 'parent' | 'scout';
    troop_number?: string;
    age?: number;
}

export interface FamilyMemberListResponse {
    members: FamilyMember[];
    total: number;
}

// Registration types
export interface ParentRegistrationRequest {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
}

export interface RegistrationResponse {
    message: string;
    user_id: string;
    email: string;
}