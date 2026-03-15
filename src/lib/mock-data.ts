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
    title: 'Luxury 3 Bedroom Flat',
    location: 'GRA Phase 2, Port Harcourt',
    price: 3500000,
    period: 'yr',
    beds: 3,
    baths: 3,
    serviced: true,
    type: 'Flat',
    imageId: 'lekki-apartment',
    description: 'A stunning 3-bedroom serviced apartment located in the prestigious GRA Phase 2. Offers a serene environment with 24/7 security and easy access to the city center.',
    amenities: ['wifi', 'power', 'security'],
  },
  {
    id: '2',
    title: '5 Bedroom Detached Duplex',
    location: 'Shelter Afrique, Uyo',
    price: 5000000,
    period: 'yr',
    beds: 5,
    baths: 6,
    serviced: true,
    type: 'Duplex',
    imageId: 'ikeja-duplex',
    description: 'Executive 5-bedroom duplex in the secure Shelter Afrique estate. Perfect for high-profile residents, featuring large grounds and modern finishes.',
    amenities: ['power', 'security'],
  },
  {
    id: '3',
    title: 'Modern 2-Bedroom Flat',
    location: 'State Housing Estate, Calabar',
    price: 1800000,
    period: 'yr',
    beds: 2,
    baths: 2,
    serviced: false,
    type: 'Flat',
    imageId: 'maitama-flat',
    description: 'Clean and well-maintained 2-bedroom flat in the heart of Calabar. Quiet neighborhood with steady water supply.',
    amenities: ['security'],
  },
  {
    id: '4',
    title: 'Cozy Short-let Studio',
    location: 'GRA, Benin City',
    price: 45000,
    period: 'mo',
    beds: 1,
    baths: 1,
    serviced: true,
    type: 'Short-let',
    imageId: 'yaba-shortlet',
    description: 'Fully furnished short-let studio in Benin City. Ideal for business travelers, featuring high-speed WiFi and air conditioning.',
    amenities: ['wifi', 'power'],
  },
  {
    id: '5',
    title: 'Executive 4-Bed Penthouse',
    location: 'Trans Amadi, Port Harcourt',
    price: 8000000,
    period: 'yr',
    beds: 4,
    baths: 5,
    serviced: true,
    type: 'Penthouse',
    imageId: 'victoria-island-penthouse',
    description: 'Premium penthouse apartment in the Trans Amadi industrial hub. Offers luxury living with panoramic views of the city.',
    amenities: ['wifi', 'power', 'security'],
  },
  {
    id: '6',
    title: 'Serviced Studio Apartment',
    location: 'GRA, Asaba',
    price: 1200000,
    period: 'yr',
    beds: 1,
    baths: 1,
    serviced: true,
    type: 'Self-con',
    imageId: 'lekki-studio',
    description: 'Modern studio apartment in a serviced complex in Asaba. Includes dedicated parking and 24/7 power.',
    amenities: ['security', 'power'],
  },
];
