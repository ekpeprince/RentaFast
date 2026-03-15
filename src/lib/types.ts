import type { FieldValue } from 'firebase/firestore';

export type Amenity = 'wifi' | 'power' | 'security';

export interface UserProfile {
  id: string;
  role: 'landlord' | 'tenant';
  displayName?: string;
  phoneNumber?: string;
  photoURL?: string;
  isVerified?: boolean;
}

export interface Property {
  id: string;
  landlordId: string;
  title: string;
  location: string;
  price: number;
  description: string;
  type: 'Short-let' | 'Flat' | 'Duplex' | 'Self-con' | 'Penthouse';
  beds: number;
  baths: number;
  imageUrls: string[];
  amenities: Amenity[];
  period: 'yr' | 'mo';
  createdAt: FieldValue; 
}

export interface Chat {
  id: string;
  participants: string[];
  propertyId: string;
  propertyTitle: string;
  lastMessage: string;
  updatedAt: FieldValue;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: FieldValue;
}

export interface Favorite {
  id: string;
  propertyId: string;
  savedAt: FieldValue;
}