// shared/utils/index.ts

import { APP_SETTINGS } from '../constants';

/**
 * Formatowanie ceny w PLN
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(price);
};

/**
 * Formatowanie daty
 */
export const formatDate = (date: Date | string): string => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pl-PL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(dateObj);
};

/**
 * Formatowanie krótkiej daty (DD.MM.YYYY)
 */
export const formatShortDate = (date: Date | string): string => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(dateObj);
};

/**
 * Obliczanie odległości między dwoma punktami geograficznymi w kilometrach
 * Wykorzystuje formułę Haversine
 */
export const calculateDistance = (
  lat1: number, lon1: number, 
  lat2: number, lon2: number
): number => {
  const R = 6371; // Promień Ziemi w km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Odległość w km
  return Math.round(distance * 10) / 10; // Zaokrąglenie do 1 miejsca po przecinku
};

/**
 * Konwersja stopni na radiany
 */
const deg2rad = (deg: number): number => {
  return deg * (Math.PI/180);
};

/**
 * Formatowanie odległości
 */
export const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }
  return `${distance.toFixed(1)} km`;
};

/**
 * Obliczanie śladu węglowego zamówienia na podstawie odległości i produktów
 */
export const calculateCarbonFootprint = (
  distanceKm: number, 
  weightKg: number, 
  isLocalProduction: boolean = false,
  hasEcoCertificate: boolean = false
): number => {
  const { KM_PER_KG_CO2, LOCAL_PRODUCTION_MULTIPLIER, ECO_CERTIFICATE_MULTIPLIER } = 
    APP_SETTINGS.CARBON_FOOTPRINT_FACTORS;
  
  let footprint = distanceKm * weightKg * KM_PER_KG_CO2;
  
  // Zastosuj mnożniki dla lokalnej produkcji i certyfikatów eko
  if (isLocalProduction) {
    footprint *= LOCAL_PRODUCTION_MULTIPLIER;
  }
  
  if (hasEcoCertificate) {
    footprint *= ECO_CERTIFICATE_MULTIPLIER;
  }
  
  return Math.round(footprint * 100) / 100; // Zaokrąglenie do 2 miejsc po przecinku
};

/**
 * Formatowanie śladu węglowego
 */
export const formatCarbonFootprint = (footprint: number): string => {
  return `${footprint.toFixed(2)} kg CO₂`;
};

/**
 * Generowanie losowego ID śledzenia
 */
export const generateTrackingId = (): string => {
  const timestamp = new Date().getTime().toString(36);
  const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `EKO-${timestamp}-${randomChars}`;
};

/**
 * Skracanie tekstu do określonej długości z wielokropkiem
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

/**
 * Walidacja formatu email
 */
export const isValidEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Walidacja formatu numeru telefonu (polski)
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  // Polski numer telefonu: 9 cyfr, może być pogrupowany spacjami lub myślnikami
  const regex = /^(?:\+48|48)?[\s-]?(?:\d[\s-]?){9}$/;
  return regex.test(phone);
};

/**
 * Walidacja formatu kodu pocztowego (polski)
 */
export const isValidPostalCode = (postalCode: string): boolean => {
  // Polski kod pocztowy: 5 cyfr w formacie XX-XXX
  const regex = /^\d{2}-\d{3}$/;
  return regex.test(postalCode);
};

/**
 * Tworzenie przyjaznego dla URL sluga z tekstu
 */
export const createSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/ą/g, 'a')
    .replace(/ć/g, 'c')
    .replace(/ę/g, 'e')
    .replace(/ł/g, 'l')
    .replace(/ń/g, 'n')
    .replace(/ó/g, 'o')
    .replace(/ś/g, 's')
    .replace(/ź/g, 'z')
    .replace(/ż/g, 'z')
    .replace(/\s+/g, '-')
    .replace(/[^\w\\-]+/g, '')
    .replace(/\\-\\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

/**
 * Funkcja opóźnienia (do celów testowych)
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Sprawdzenie czy ciąg znaków jest poprawnym JSON
 */
export const isValidJSON = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch  {
    return false;
  }
};