// API Response Types matching backend schemas

export interface Place {
  id: string;
  name: string;
  address: string;
  google_maps_url?: string;
  created_at: string;
  updated_at: string;
}

export interface PlaceCreate {
  name: string;
  address: string;
  google_maps_url?: string;
}

export interface Outing {
  id: string;
  name: string;
  outing_date: string;
  end_date?: string;
  location: string;
  description: string;
  max_participants: number;
  capacity_type: "fixed" | "vehicle";
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
  drop_off_time?: string;
  drop_off_location?: string;
  pickup_time?: string;
  pickup_location?: string;
  cost?: number;
  gear_list?: string;
  signups_close_at?: string;
  cancellation_deadline?: string;
  signups_closed?: boolean;
  are_signups_closed?: boolean;
  created_at: string;
  updated_at: string;
  icon?: string;
  // Address fields with Place relationships
  outing_address?: string;
  outing_place_id?: string;
  outing_place?: Place;
  pickup_address?: string;
  pickup_place_id?: string;
  pickup_place?: Place;
  dropoff_address?: string;
  dropoff_place_id?: string;
  dropoff_place?: Place;
}

export interface OutingCreate {
  name: string;
  outing_date: string;
  end_date?: string;
  location: string;
  description: string;
  max_participants: number;
  capacity_type: "fixed" | "vehicle";
  is_overnight: boolean;
  outing_lead_name?: string;
  outing_lead_email?: string;
  outing_lead_phone?: string;
  drop_off_time?: string;
  drop_off_location?: string;
  pickup_time?: string;
  pickup_location?: string;
  cost?: number;
  gear_list?: string;
  signups_close_at?: string;
  cancellation_deadline?: string;
  signups_closed?: boolean;
  icon?: string;
  // Address fields with Place relationships
  outing_address?: string;
  outing_place_id?: string;
  pickup_address?: string;
  pickup_place_id?: string;
  dropoff_address?: string;
  dropoff_place_id?: string;
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
  "vegetarian",
  "vegan",
  "gluten-free",
  "dairy-free",
  "nut-free",
  "kosher",
  "halal",
  "other",
] as const;

export const ALLERGY_TYPES = [
  "peanuts",
  "tree_nuts",
  "dairy",
  "eggs",
  "soy",
  "wheat",
  "fish",
  "shellfish",
  "bee_stings",
  "medication",
  "other",
] as const;

export const ALLERGY_SEVERITIES = ["mild", "moderate", "severe"] as const;

// Form state types
export interface ParticipantFormData {
  full_name: string;
  participant_type: "scout" | "adult";
  gender: "male" | "female" | "other";
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
    severity: "mild" | "moderate" | "severe";
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
  role: "admin" | "outing-admin" | "participant" | "adult";
  is_active?: boolean;
  is_initial_admin?: boolean;
  initial_setup_complete?: boolean;
  phone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  youth_protection_expiration?: string;
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
  member_type: "adult" | "scout";
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
  member_type: "adult" | "scout";
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
  member_type: "adult" | "scout";
  troop_number?: string;
  age?: number;
  vehicle_capacity?: number;
  has_youth_protection?: boolean;
  youth_protection_expired?: boolean;
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

// Check-in Types
export interface CheckInParticipant {
  id: string;
  signup_id: string;
  name: string;
  member_type: "scout" | "adult";
  family_name: string;
  patrol_name?: string;
  troop_number?: string;
  is_checked_in: boolean;
  checked_in_at?: string;
  checked_in_by?: string;
}

export interface CheckInSummary {
  outing_id: string;
  outing_name: string;
  outing_date: string;
  total_participants: number;
  checked_in_count: number;
  participants: CheckInParticipant[];
}

export interface CheckInCreate {
  participant_ids: string[];
  checked_in_by: string;
}

export interface CheckInResponse {
  message: string;
  checked_in_count: number;
  participant_ids: string[];
  checked_in_at: string;
}

export interface CheckInExportRow {
  participant_name: string;
  member_type: string;
  family_name: string;
  patrol_name?: string;
  troop_number?: string;
  checked_in: boolean;
  checked_in_at?: string;
  checked_in_by?: string;
}

// Scouting Requirements Types
export interface RankRequirement {
  id: string;
  rank: string;
  requirement_number: string;
  requirement_text: string;
  keywords: string[];
  category: string;
  created_at: string;
  updated_at: string;
}

export interface MeritBadge {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  eagle_required?: boolean;
  created_at: string;
  updated_at: string;
}

export interface RequirementSuggestion {
  id: string;
  rank: string;
  requirement_number: string;
  description: string;
  match_score: number;
  matched_keywords: string[];
}

export interface MeritBadgeSuggestion {
  id: string;
  name: string;
  description?: string;
  eagle_required: boolean;
  match_score: number;
  matched_keywords: string[];
}

export interface OutingSuggestions {
  requirements: RequirementSuggestion[];
  merit_badges: MeritBadgeSuggestion[];
}

export interface OutingRequirementCreate {
  rank_requirement_id: string;
  notes?: string;
}

export interface OutingMeritBadgeCreate {
  merit_badge_id: string;
  notes?: string;
}

export interface OutingRequirement {
  id: string;
  outing_id: string;
  rank_requirement_id: string;
  notes?: string;
  created_at: string;
  requirement: RankRequirement;
}

export interface OutingMeritBadge {
  id: string;
  outing_id: string;
  merit_badge_id: string;
  notes?: string;
  created_at: string;
  merit_badge: MeritBadge;
}

// Packing List Types
export interface PackingListTemplate {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface PackingListTemplateItem {
  id: string;
  template_id: string;
  name: string;
  quantity: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PackingListTemplateWithItems extends PackingListTemplate {
  items: PackingListTemplateItem[];
}

export interface PackingListTemplateListResponse {
  items: PackingListTemplate[];
  total: number;
}

export interface OutingPackingList {
  id: string;
  outing_id: string;
  template_id?: string;
  template?: PackingListTemplate;
  items: OutingPackingListItem[];
  created_at: string;
}

export interface OutingPackingListItem {
  id: string;
  outing_packing_list_id: string;
  name: string;
  quantity: number;
  checked: boolean;
  created_at: string;
  updated_at: string;
}

export interface OutingPackingListCreate {
  template_id?: string;
}

export interface OutingPackingListItemCreate {
  name: string;
  quantity: number;
  checked?: boolean;
}

export interface OutingPackingListItemUpdate {
  name?: string;
  quantity?: number;
  checked?: boolean;
}

// Outing Update Email Draft Types
export interface OutingUpdateEmailDraft {
  subject: string;
  body: string;
  changed_fields: string[];
}

export interface OutingUpdateResponse {
  outing: Outing;
  email_draft?: OutingUpdateEmailDraft | null;
}
