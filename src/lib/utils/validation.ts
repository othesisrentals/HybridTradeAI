import { z } from 'zod';

/**
 * Common validation schemas using Zod
 */

// User validation
export const emailSchema = z.string().email('Invalid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number');

// Amount validation
export const amountSchema = z.number().positive('Amount must be positive');

export const currencyAmountSchema = z.object({
  amount: amountSchema,
  currency: z.string().length(3, 'Currency must be 3 characters'),
});

// Investment validation
export const investmentAmountSchema = (minAmount: number, maxAmount?: number) => {
  let schema = z.number().min(minAmount, `Minimum investment is ${minAmount / 100}`);
  
  if (maxAmount) {
    schema = schema.max(maxAmount, `Maximum investment is ${maxAmount / 100}`);
  }
  
  return schema;
};

// File validation
export const fileSchema = z.object({
  name: z.string(),
  size: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB'),
  type: z.string(),
});

export const imageFileSchema = fileSchema.extend({
  type: z.string().regex(/^image\/(jpeg|jpg|png|gif|webp)$/, 'Invalid image type'),
});

// Pagination
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

// Date range
export const dateRangeSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

// Helper functions
export function validateEmail(email: string): boolean {
  try {
    emailSchema.parse(email);
    return true;
  } catch {
    return false;
  }
}

export function validatePassword(password: string): boolean {
  try {
    passwordSchema.parse(password);
    return true;
  } catch {
    return false;
  }
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

export function sanitizeHtml(html: string): string {
  return html
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}
