/**
 * Phone number formatting and validation utilities
 * Supports US phone numbers in various formats
 */

/**
 * Format a phone number to (XXX) XXX-XXXX format
 * @param value - Raw phone number input
 * @returns Formatted phone number string
 */
export const formatPhoneNumber = (value: string): string => {
    // Remove all non-numeric characters
    const cleaned = value.replace(/\D/g, '');
    
    // Don't format if empty
    if (!cleaned) return '';
    
    // Format based on length
    if (cleaned.length <= 3) {
        return cleaned;
    } else if (cleaned.length <= 6) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    } else {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
};

/**
 * Validate a US phone number
 * @param phone - Phone number to validate
 * @returns true if valid, false otherwise
 */
export const isValidPhoneNumber = (phone: string): boolean => {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // US phone numbers should be exactly 10 digits
    return cleaned.length === 10;
};

/**
 * Get the raw phone number (digits only)
 * @param phone - Formatted phone number
 * @returns Phone number with only digits
 */
export const getRawPhoneNumber = (phone: string): string => {
    return phone.replace(/\D/g, '');
};

/**
 * Format phone number for display (read-only contexts)
 * @param phone - Phone number to format
 * @returns Formatted phone number or original if invalid
 */
export const displayPhoneNumber = (phone: string | undefined | null): string => {
    if (!phone) return '';
    
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
    
    // Return original if not a valid 10-digit number
    return phone;
};

/**
 * Handle phone input change with automatic formatting
 * @param e - React change event
 * @param setter - State setter function
 */
export const handlePhoneChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (value: string) => void
): void => {
    const formatted = formatPhoneNumber(e.target.value);
    setter(formatted);
};

/**
 * Validate phone number and return error message if invalid
 * @param phone - Phone number to validate
 * @param fieldName - Name of the field for error message
 * @returns Error message or null if valid
 */
export const validatePhoneWithMessage = (phone: string, fieldName: string = 'Phone number'): string | null => {
    if (!phone || phone.trim() === '') {
        return `${fieldName} is required`;
    }
    
    if (!isValidPhoneNumber(phone)) {
        return `${fieldName} must be a valid 10-digit US phone number`;
    }
    
    return null;
};