// src/shared/utils/dateUtils.ts
import { type FirebaseTimestamp } from '../types/firebase';

/**
 * Format a date with different levels of detail
 * @param date - The date to format
 * @param format - The format to use (default: 'long')
 * @returns Formatted date string or empty string if invalid
 */
export const formatDate = (
  date: Date | string | number | FirebaseTimestamp | unknown,
  format: 'long' | 'short' | 'datetime' | 'time' = 'long'
): string => {
  if (!date) return '';
  
  const dateObj: Date | null = convertToDate(date);
  if (!dateObj) return '';
  
  try {
    switch (format) {
      case 'long':
        return new Intl.DateTimeFormat('pl-PL', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }).format(dateObj);
      
      case 'short':
        return new Intl.DateTimeFormat('pl-PL', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(dateObj);
      
      case 'datetime':
        return new Intl.DateTimeFormat('pl-PL', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).format(dateObj);
      
      case 'time':
        return new Intl.DateTimeFormat('pl-PL', {
          hour: '2-digit',
          minute: '2-digit'
        }).format(dateObj);
      
      default:
        return new Intl.DateTimeFormat('pl-PL').format(dateObj);
    }
  } catch (error) {
    console.warn('Error formatting date:', error);
    return '';
  }
};

/**
 * Convert any date-like value to a JavaScript Date object
 * @param value - The value to convert
 * @returns A Date object or null if conversion failed
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
 * Format a relative time (e.g., "2 hours ago", "yesterday")
 * @param date - The date to format relative to now
 * @returns Relative time string
 */
export const formatRelativeTime = (
  date: Date | string | number | FirebaseTimestamp | unknown
): string => {
  const dateObj = convertToDate(date);
  if (!dateObj) return '';
  
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSeconds < 60) {
    return 'przed chwilą';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} ${getDeclension(diffMinutes, 'minuta', 'minuty', 'minut')} temu`;
  } else if (diffHours < 24) {
    return `${diffHours} ${getDeclension(diffHours, 'godzina', 'godziny', 'godzin')} temu`;
  } else if (diffDays < 7) {
    return `${diffDays} ${getDeclension(diffDays, 'dzień', 'dni', 'dni')} temu`;
  } else {
    return formatDate(dateObj, 'long');
  }
};

/**
 * Get the correct Polish declension based on the number
 */
function getDeclension(number: number, singular: string, plural1: string, plural2: string): string {
  if (number === 1) {
    return singular;
  } else if ((number % 10 >= 2 && number % 10 <= 4) && 
             (number % 100 < 10 || number % 100 >= 20)) {
    return plural1;
  } else {
    return plural2;
  }
}

/**
 * Check if a date is valid
 */
export const isValidDate = (date: unknown): boolean => {
  return convertToDate(date) !== null;
};