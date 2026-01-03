/**
 * Shared input validation utilities for Edge Functions
 */

// Date format regex for YYYY-MM-DD
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: string;
}

/**
 * Validates a date string in YYYY-MM-DD format
 */
export function validateDateFormat(date: string | undefined | null): ValidationResult {
  if (!date) {
    return { valid: true, sanitized: undefined };
  }

  if (typeof date !== 'string') {
    return { valid: false, error: 'Date must be a string' };
  }

  // Trim and check format
  const trimmed = date.trim();
  if (!DATE_REGEX.test(trimmed)) {
    return { valid: false, error: 'Invalid date format. Use YYYY-MM-DD' };
  }

  // Check if it's a valid calendar date
  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) {
    return { valid: false, error: 'Invalid date value' };
  }

  // Check if date is not too far in the future (allow 1 day buffer for timezone differences)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 59, 999);
  if (parsed > tomorrow) {
    return { valid: false, error: 'Date cannot be more than 1 day in the future' };
  }

  // Check if date is not too old (max 2 years ago)
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  if (parsed < twoYearsAgo) {
    return { valid: false, error: 'Date cannot be more than 2 years in the past' };
  }

  return { valid: true, sanitized: trimmed };
}

/**
 * Validates a date range
 */
export function validateDateRange(startDate: string | undefined, endDate: string | undefined): ValidationResult {
  const startValidation = validateDateFormat(startDate);
  if (!startValidation.valid) {
    return { valid: false, error: `Start date: ${startValidation.error}` };
  }

  const endValidation = validateDateFormat(endDate);
  if (!endValidation.valid) {
    return { valid: false, error: `End date: ${endValidation.error}` };
  }

  if (startValidation.sanitized && endValidation.sanitized) {
    const start = new Date(startValidation.sanitized);
    const end = new Date(endValidation.sanitized);
    
    if (start > end) {
      return { valid: false, error: 'Start date cannot be after end date' };
    }

    // Check max range (1 year)
    const maxRangeDays = 365;
    const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > maxRangeDays) {
      return { valid: false, error: `Date range cannot exceed ${maxRangeDays} days` };
    }
  }

  return { valid: true };
}

/**
 * Sanitizes a string to prevent injection
 */
export function sanitizeString(input: string | undefined | null, maxLength: number = 1000): string {
  if (!input) return '';
  if (typeof input !== 'string') return '';
  
  // Trim, limit length, remove dangerous characters
  return input
    .trim()
    .substring(0, maxLength)
    .replace(/[<>'"`;]/g, '');
}

/**
 * Validates UUID format
 */
export function validateUUID(uuid: string | undefined | null): ValidationResult {
  if (!uuid) {
    return { valid: false, error: 'UUID is required' };
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(uuid)) {
    return { valid: false, error: 'Invalid UUID format' };
  }

  return { valid: true, sanitized: uuid.toLowerCase() };
}

/**
 * Creates a validation error response
 */
export function validationErrorResponse(message: string, corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}
