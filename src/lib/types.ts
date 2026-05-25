
import type { FieldValue } from 'firebase/firestore';

export type Amenity = 'wifi' | 'power' | 'security';

export interface UserProfile {
  id: string;
  role: 'landlord' | 'tenant' | 'admin';
  displayName?: string;
  phoneNumber?: string;
  photoURL?: string;
  isVerified?: boolean;
  verificationDocUrl?: string;
  verificationStatus?: 'unverified' | 'pending' | 'verified' | 'rejected';
  aboutMe?: string;
  occupation?: string;
  residentCity?: string;
  preferences?: string;
  isPremium?: boolean;
  viewedProperties?: string[];
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
  viewCount?: number;
  favoriteCount?: number;
  averageRating?: number;
  reviewCount?: number;
  createdAt: FieldValue; 
}

export interface Review {
  id: string;
  reviewerId: string;
  reviewerName: string;
  rating: number;
  comment: string;
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

export interface Application {
  id: string;
  propertyId: string;
  propertyTitle: string;
  landlordId: string;
  tenantId: string;
  tenantName: string;
  status: 'Pending' | 'Reviewing' | 'Tour Scheduled' | 'Accepted' | 'Rejected' | 'PaidInEscrow' | 'Released' | 'Disputed';
  moveInDate: string;
  occupants: number;
  createdAt: FieldValue;
}
