
'use client';

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import type { Property } from './types';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

/**
 * Creates a new property listing in Firestore.
 * This function should be called from a client component.
 * @param values The property data.
 * @param user The authenticated user creating the listing.
 */
export function createListing(
  values: Omit<Property, 'id' | 'landlordId' | 'createdAt'>,
  user: { uid: string }
) {
  if (!firestore) {
    throw new Error('Firestore is not initialized');
  }
  const propertiesCol = collection(firestore, 'properties');
  const newListingData = {
    ...values,
    landlordId: user.uid,
    createdAt: serverTimestamp(),
  };

  // Use the non-blocking function for optimistic UI updates and proper error handling on the client.
  addDocumentNonBlocking(propertiesCol, newListingData);
}
