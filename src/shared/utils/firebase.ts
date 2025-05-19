// src/shared/utils/firebase.ts
import { type FirebaseTimestamp } from '../types/firebase';

/**
 * Converts a Firebase Timestamp or any date-like value to a JavaScript Date
 * Safely handles different date formats including Firebase Timestamp objects
 */
export const convertToDate = (
  value: Date | string | number | FirebaseTimestamp | unknown
): Date | null => {
  if (!value) return null;
  
  try {
    // Handle Firebase Timestamp objects
    if (typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function') {
      return (value as FirebaseTimestamp).toDate();
    }
    
    // Handle Date objects
    if (value instanceof Date) {
      return value;
    }
    
    // Handle string or number (timestamp)
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      // Check if valid date
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    console.warn('Invalid date value:', value);
    return null;
  } catch (error) {
    console.error('Error converting to date:', error);
    return null;
  }
};

/**
 * Safely access nested properties from Firestore documents
 * Handles undefined and null values gracefully
 */
export const safeGet = <T>(
  obj: Record<string, unknown> | unknown, 
  path: string, 
  defaultValue: T
): T => {
  if (!obj || typeof obj !== 'object') return defaultValue;
  
  const parts = path.split('.');
  let current: unknown = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return defaultValue;
    }
    current = (current as Record<string, unknown>)[part];
  }
  
  return (current === undefined || current === null) ? defaultValue : current as T;
};

/**
 * Type guard to check if an object is a Firebase Timestamp
 */
export const isFirebaseTimestamp = (value: unknown): value is FirebaseTimestamp => {
  return (
    typeof value === 'object' && 
    value !== null && 
    'toDate' in value && 
    typeof (value as Record<string, unknown>).toDate === 'function' &&
    'seconds' in value &&
    'nanoseconds' in value
  );
};