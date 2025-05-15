// Umieść to w src/shared/types/firebase.ts

export type FirebaseTimestamp = {
  toDate: () => Date;
  seconds: number;
  nanoseconds: number;
};

// Typ dla danych użytkownika z Firebase
export type FirebaseUserData = {
  _id?: string;
  id?: string;
  email: string;
  passwordHash?: string;
  fullName: string;
  role: 'farmer' | 'consumer' | 'admin';
  phoneNumber: string;
  location?: {
    type?: string;
    coordinates?: [number, number];
    address?: string;
  };
  bio?: string;
  profileImage?: string;
  certificates?: string[];
  createdProducts?: string[];
  orders?: string[];
  reviews?: string[];
  localGroups?: string[];
  isVerified?: boolean;
  lastLoginAt?: FirebaseTimestamp | Date | string;
  createdAt?: FirebaseTimestamp | Date | string;
  updatedAt?: FirebaseTimestamp | Date | string;
  [key: string]: unknown; // Dodatkowe pola, które mogą się pojawić
};