import { FormField } from '../types';

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const isValidPassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/(?=.*[@$!%*?&])/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate required field
 */
export const isRequired = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

/**
 * Validate field based on form field configuration
 */
export const validateField = (value: any, field: FormField): string | null => {
  // Required validation
  if (field.required && !isRequired(value)) {
    return `${field.label} is required`;
  }

  // Skip other validations if field is empty and not required
  if (!field.required && !isRequired(value)) {
    return null;
  }

  // Type-specific validations
  switch (field.type) {
    case 'email':
      if (!isValidEmail(value)) {
        return 'Please enter a valid email address';
      }
      break;

    case 'number':
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return `${field.label} must be a valid number`;
      }
      if (field.validation?.min !== undefined && numValue < field.validation.min) {
        return `${field.label} must be at least ${field.validation.min}`;
      }
      if (field.validation?.max !== undefined && numValue > field.validation.max) {
        return `${field.label} must be no more than ${field.validation.max}`;
      }
      break;

    case 'text':
    case 'textarea':
      if (field.validation?.pattern && !field.validation.pattern.test(value)) {
        return field.validation.message || `${field.label} format is invalid`;
      }
      break;
  }

  return null;
};

/**
 * Validate entire form
 */
export const validateForm = (values: Record<string, any>, fields: FormField[]): Record<string, string> => {
  const errors: Record<string, string> = {};

  fields.forEach(field => {
    const error = validateField(values[field.name], field);
    if (error) {
      errors[field.name] = error;
    }
  });

  return errors;
};

/**
 * Check if form is valid
 */
export const isFormValid = (errors: Record<string, string>): boolean => {
  return Object.keys(errors).length === 0;
};

/**
 * Validate athlete code format
 */
export const isValidAthleteCode = (code: string): boolean => {
  // Athlete codes should be alphanumeric, 3-10 characters
  const athleteCodeRegex = /^[A-Za-z0-9]{3,10}$/;
  return athleteCodeRegex.test(code);
};

/**
 * Validate date format
 */
export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && date.toISOString().startsWith(dateString.slice(0, 10));
};

/**
 * Validate date range
 */
export const isValidDateRange = (startDate: string, endDate: string): boolean => {
  if (!isValidDate(startDate) || !isValidDate(endDate)) return false;

  const start = new Date(startDate);
  const end = new Date(endDate);

  return start <= end;
};

/**
 * Sanitize string input
 */
export const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

/**
 * Validate file upload
 */
export const validateFileUpload = (file: File, options: {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
}): { isValid: boolean; error?: string } => {
  // Check file size
  if (options.maxSize && file.size > options.maxSize) {
    return {
      isValid: false,
      error: `File size must be less than ${Math.round(options.maxSize / 1024 / 1024)}MB`
    };
  }

  // Check file type
  if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type not allowed. Allowed types: ${options.allowedTypes.join(', ')}`
    };
  }

  return { isValid: true };
};