
export type Amenity = 'wifi' | 'power' | 'security';

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
  imageId: string;
  amenities: Amenity[];
  period: 'yr' | 'mo';
  createdAt: any; // Firestore ServerTimestamp
}
