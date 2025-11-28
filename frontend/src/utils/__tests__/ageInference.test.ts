import { describe, it, expect } from 'vitest';
import { calculateAge, inferMemberType, validateMemberForm } from '../ageInference';

// Helper to build ISO date for a given age offset
const isoForAge = (years: number) => {
  const now = new Date();
  const d = new Date(now.getFullYear() - years, now.getMonth(), now.getDate());
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
};

describe('ageInference utilities', () => {
  it('calculateAge returns null for invalid date', () => {
    expect(calculateAge('')).toBeNull();
    expect(calculateAge('not-a-date')).toBeNull();
  });

  it('calculateAge returns correct age for boundary', () => {
    const iso10 = isoForAge(10);
    const age10 = calculateAge(iso10);
    expect(age10).toBe(10);
  });

  it('infers scout for age 10 and adult for age 18', () => {
    expect(inferMemberType(10)).toBe('scout');
    expect(inferMemberType(17)).toBe('scout');
    expect(inferMemberType(18)).toBe('adult');
  });

  it('validateMemberForm flags too-young (<10)', () => {
    const iso9 = isoForAge(9);
    const result = validateMemberForm({
      date_of_birth: iso9,
      has_youth_protection: false,
      youth_protection_expiration: null,
    });
    expect(result.errors.some(e => e.toLowerCase().includes('scouts'))).toBe(true);
  });

  it('validateMemberForm requires YPT for adult', () => {
    const iso18 = isoForAge(18);
    const result = validateMemberForm({
      date_of_birth: iso18,
      has_youth_protection: false,
      youth_protection_expiration: null,
    });
    expect(result.errors.some(e => e.toLowerCase().includes('youth protection'))).toBe(true);
  });

  it('validateMemberForm passes for adult with YPT', () => {
    const iso18 = isoForAge(18);
    const result = validateMemberForm({
      date_of_birth: iso18,
      has_youth_protection: true,
      youth_protection_expiration: isoForAge(0), // today as placeholder
    });
    expect(result.errors).toHaveLength(0);
    expect(result.inferredType).toBe('adult');
  });

  it('validateMemberForm passes for scout age', () => {
    const iso12 = isoForAge(12);
    const result = validateMemberForm({
      date_of_birth: iso12,
      has_youth_protection: false,
      youth_protection_expiration: null,
    });
    expect(result.errors.length).toBe(0);
    expect(result.inferredType).toBe('scout');
  });
});
