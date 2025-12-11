import { mockListings, type Property } from './mock-data';

/**
 * Fetches all property listings.
 * This function currently returns mock data.
 * It can be replaced with a Firebase Firestore query.
 */
export async function fetchListings(): Promise<Property[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return Promise.resolve(mockListings);
}

/**
 * Fetches a single property listing by its ID.
 * This function currently returns mock data.
 * It can be replaced with a Firebase Firestore query.
 * @param id The ID of the property to fetch.
 */
export async function fetchListingById(id: string): Promise<Property | undefined> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  const property = mockListings.find((listing) => listing.id === id);
  return Promise.resolve(property);
}
