export type Amenity = 'wifi' | 'power' | 'security';

export interface Property {
  id: string;
  title: string;
  location: string;
  price: number;
  period: 'yr' | 'mo';
  beds: number;
  baths: number;
  serviced: boolean;
  type: 'Short-let' | 'Flat' | 'Duplex' | 'Self-con' | 'Penthouse';
  imageId: string;
  description: string;
  amenities: Amenity[];
}

export const mockListings: Property[] = [
  {
    id: '1',
    title: '2 Bedroom Apartment, Lekki',
    location: 'Lekki Phase 1, Lagos',
    price: 3500000,
    period: 'yr',
    beds: 2,
    baths: 2,
    serviced: true,
    type: 'Flat',
    imageId: 'lekki-apartment',
    description: 'A stunning 2-bedroom serviced apartment located in the heart of Lekki Phase 1. Offers a serene environment with modern amenities and easy access to the city\'s commercial hubs.',
    amenities: ['wifi', 'power', 'security'],
  },
  {
    id: '2',
    title: '4 Bedroom Duplex, Ikeja',
    location: 'Ikeja GRA, Lagos',
    price: 5000000,
    period: 'yr',
    beds: 4,
    baths: 5,
    serviced: true,
    type: 'Duplex',
    imageId: 'ikeja-duplex',
    description: 'Luxurious and spacious 4-bedroom duplex in the exclusive Ikeja GRA. Perfect for families, featuring a private compound and top-notch security.',
    amenities: ['power', 'security'],
  },
  {
    id: '3',
    title: 'Luxury 3-Bedroom Flat',
    location: 'Maitama, Abuja',
    price: 4200000,
    period: 'yr',
    beds: 3,
    baths: 3,
    serviced: true,
    type: 'Flat',
    imageId: 'maitama-flat',
    description: 'Experience comfort and class in this premium 3-bedroom flat in Maitama. Comes fully serviced with uninterrupted power and high-speed internet.',
    amenities: ['wifi', 'power', 'security'],
  },
  {
    id: '4',
    title: 'Cozy Short-let Apartment',
    location: 'Yaba, Lagos',
    price: 800000,
    period: 'mo',
    beds: 1,
    baths: 1,
    serviced: true,
    type: 'Short-let',
    imageId: 'yaba-shortlet',
    description: 'A modern and cozy short-let apartment ideal for professionals and students in the vibrant Yaba area. Close to tech hubs and universities.',
    amenities: ['wifi', 'power'],
  },
  {
    id: '5',
    title: 'Executive 5-Bed Penthouse',
    location: 'Victoria Island, Lagos',
    price: 15000000,
    period: 'yr',
    beds: 5,
    baths: 6,
    serviced: true,
    type: 'Penthouse',
    imageId: 'victoria-island-penthouse',
    description: 'Unparalleled luxury in this executive 5-bedroom penthouse with breathtaking ocean views. Features premium fittings, a private elevator, and 24/7 concierge service.',
    amenities: ['wifi', 'power', 'security'],
  },
  {
    id: '6',
    title: 'Modern Studio Apartment',
    location: 'Ikate, Lekki',
    price: 1500000,
    period: 'yr',
    beds: 1,
    baths: 1,
    serviced: false,
    type: 'Self-con',
    imageId: 'lekki-studio',
    description: 'A clean and modern studio apartment (self-contained) in a secure estate in Ikate. Great for a single person or young couple starting out.',
    amenities: ['security'],
  },
];
