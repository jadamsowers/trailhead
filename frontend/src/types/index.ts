// API Response Types matching backend schemas

export interface Outing {
    id: string;
    name: string;
    outing_date: string;
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
    outing_lead_name?: string;
    outing_lead_email?: string;
    outing_lead_phone?: string;
    created_at: string;
    updated_at: string;
}

export interface OutingCreate {
    name: string;
    outing_date: string;
    end_date?: string;
    location: string;
    description: string;
    max_participants: number;
    capacity_type: 'fixed' | 'vehicle';
    is_overnight: boolean;
    outing_lead_name?: string;
    outing_lead_email?: string;
    outing_lead_phone?: string;
}

export interface FamilyContact {
    email: string;
    phone: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
}

// Participant response from backend
export interface ParticipantResponse {
    id: string;
    name: string;
    age: number | null;
    participant_type: string;
    is_adult: boolean;
    gender: string | null;
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
    outing_id: string;
    family_contact: FamilyContact;
    family_member_ids: string[];
}

export interface SignupResponse {
    id: string;
    outing_id: string;
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
    outing: Outing;
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
    outing_id: string;
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
    role: 'admin' | 'user' | 'adult';
    is_active?: boolean;
    is_initial_admin?: boolean;
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
    member_type: 'adult' | 'scout';
    date_of_birth?: string;
    troop_number?: string;
    patrol_name?: string;
    has_youth_protection: boolean;
    youth_protection_expiration?: string;
    vehicle_capacity: number;
    medical_notes?: string;
    dietary_preferences: DietaryPreference[];
    allergies: FamilyMemberAllergy[];
    created_at: string;
    updated_at: string;
}

export interface FamilyMemberCreate {
    name: string;
    member_type: 'adult' | 'scout';
    date_of_birth?: string;
    troop_number?: string;
    patrol_name?: string;
    has_youth_protection?: boolean;
    youth_protection_expiration?: string;
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
    youth_protection_expiration?: string;
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
    member_type: 'adult' | 'scout';
    troop_number?: string;
    age?: number;
}

export interface FamilyMemberListResponse {
    members: FamilyMember[];
    total: number;
}

// Registration types
export interface AdultRegistrationRequest {
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