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
  // Food budget fields for grubmaster
  food_budget_per_person?: number;
  meal_count?: number;
  budget_type?: "total" | "per_meal";
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
  // Food budget fields for grubmaster
  food_budget_per_person?: number;
  meal_count?: number;
  budget_type?: "total" | "per_meal";
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
  grubmaster_interest?: boolean;
  grubmaster_reason?: string;
  created_at: string;
}

export interface GrubmasterRequestItem {
  family_member_id: string;
  grubmaster_interest: boolean;
  grubmaster_reason?: string;
}

export interface SignupCreate {
  outing_id: string;
  family_contact: FamilyContact;
  family_member_ids: string[];
  grubmaster_requests?: GrubmasterRequestItem[];
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
  // Adding DOB so client can re-infer member type consistently across components
  date_of_birth?: string;
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

// Grubmaster Types
export interface EatingGroupMember {
  id: string;
  participant_id: string;
  is_grubmaster: boolean;
  created_at: string;
  participant_name?: string;
  patrol_name?: string;
  dietary_restrictions: string[];
  allergies: string[];
}

export interface EatingGroup {
  id: string;
  outing_id: string;
  name: string;
  notes?: string;
  members: EatingGroupMember[];
  member_count: number;
  grubmaster_count: number;
  created_at: string;
  updated_at: string;
}

export interface EatingGroupCreate {
  outing_id: string;
  name: string;
  notes?: string;
  member_ids?: string[];
}

export interface EatingGroupUpdate {
  name?: string;
  notes?: string;
}

export interface GrubmasterSummaryParticipant {
  participant_id: string;
  name: string;
  patrol_name?: string;
  troop_number?: string;
  grubmaster_interest: boolean;
  grubmaster_reason?: string;
  dietary_restrictions: string[];
  allergies: string[];
  eating_group_id?: string;
  eating_group_name?: string;
  is_grubmaster: boolean;
}

export interface GrubmasterSummaryResponse {
  outing_id: string;
  outing_name: string;
  food_budget_per_person?: number;
  meal_count?: number;
  budget_type?: string;
  total_budget?: number;
  treasurer_email?: string;
  participants: GrubmasterSummaryParticipant[];
  eating_groups: EatingGroup[];
  unassigned_count: number;
  grubmaster_requests_count: number;
}

export interface MoveParticipantRequest {
  participant_id: string;
  target_eating_group_id?: string;
  is_grubmaster?: boolean;
}

export interface AutoAssignRequest {
  group_size_min?: number;
  group_size_max?: number;
  keep_patrols_together?: boolean;
  group_by_dietary?: boolean;
}

export interface EatingGroupEmailRequest {
  eating_group_ids?: string[];
  include_budget_info?: boolean;
  include_dietary_info?: boolean;
  custom_message?: string;
}

export const GRUBMASTER_REASONS = [
  { value: "rank_requirement", label: "Rank Requirement" },
  { value: "cooking_merit_badge", label: "Cooking Merit Badge" },
  { value: "just_because", label: "Just Because - I Like to Cook!" },
] as const;

// Tenting Types
export interface TentingGroupMember {
  id: string;
  participant_id: string;
  created_at: string;
  participant_name?: string;
  age?: number;
  gender?: string;
  patrol_name?: string;
}

export interface TentingGroup {
  id: string;
  outing_id: string;
  name: string;
  notes?: string;
  members: TentingGroupMember[];
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface TentingGroupCreate {
  outing_id: string;
  name: string;
  notes?: string;
  member_ids?: string[];
}

export interface TentingGroupUpdate {
  name?: string;
  notes?: string;
}

export interface TentingSummaryParticipant {
  participant_id: string;
  name: string;
  age?: number;
  gender?: string;
  patrol_name?: string;
  troop_number?: string;
  is_adult: boolean;
  tenting_group_id?: string;
  tenting_group_name?: string;
}

export interface TentingSummaryResponse {
  outing_id: string;
  outing_name: string;
  participants: TentingSummaryParticipant[];
  tenting_groups: TentingGroup[];
  unassigned_count: number;
  scout_count: number;
}

export interface MoveTentingParticipantRequest {
  participant_id: string;
  target_tenting_group_id?: string;
}

export interface TentingValidationIssue {
  tenting_group_id: string;
  tenting_group_name: string;
  issue_type: string;
  message: string;
  severity: string;
}

export interface AutoAssignTentingRequest {
  tent_size_min?: number;
  tent_size_max?: number;
  keep_patrols_together?: boolean;
  max_age_difference?: number;
}

// Troop Types
export interface TroopResponse {
  id: string;
  number: string;
  charter_org?: string;
  meeting_location?: string;
  meeting_day?: string;
  notes?: string;
  treasurer_email?: string;
  created_at: string;
  updated_at: string;
  patrols: PatrolResponse[];
}

export interface PatrolResponse {
  id: string;
  troop_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
