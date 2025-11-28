// Shared age and member-type inference utilities for family members.
// Follows business rules:
// - Under 10 years old: invalid (cannot be scout yet)
// - 10-17: scout
// - 18+: adult (must have youth protection training)
// Dates expected as ISO (YYYY-MM-DD).

export type InferredMemberType = "scout" | "adult";

export interface MemberFormShape {
  date_of_birth: string; // ISO date (required for inference)
  has_youth_protection: boolean;
  youth_protection_expiration: string | null | undefined;
  member_type?: InferredMemberType; // optional incoming
}

export interface ValidationResult {
  age: number | null;
  inferredType: InferredMemberType | null;
  errors: string[];
}

// Calculate age based on local time (year/month/day precision).
export const calculateAge = (isoDate?: string): number | null => {
  if (!isoDate) return null;
  const dob = new Date(isoDate);
  if (isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return age;
};

// Infer member type from age.
export const inferMemberType = (age: number | null): InferredMemberType | null => {
  if (age === null) return null;
  return age >= 18 ? "adult" : "scout";
};

// Perform full validation and inference.
export const validateMemberForm = (form: MemberFormShape): ValidationResult => {
  const errors: string[] = [];
  const age = calculateAge(form.date_of_birth);
  if (age === null) {
    errors.push("Date of Birth is required and must be a valid date.");
    return { age, inferredType: null, errors };
  }
  if (age < 10) {
    errors.push(
      "Scouts must either be at least 11 years old, or be at least 10 years old and having completed fifth grade."
    );
  }
  const inferredType = inferMemberType(age);
  if (inferredType === "adult" && !form.has_youth_protection) {
    errors.push(
      "Youth Protection Training is required for all adults attending outings."
    );
  }
  return { age, inferredType, errors };
};
