import { collection, getDocs, getDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import type { Property } from './types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

/**
 * Fetches all property listings from Firestore.
 */
export async function fetchListings(): Promise<Property[]> {
  const propertiesCol = collection(firestore, 'properties');
  try {
    const snapshot = await getDocs(propertiesCol);

    const listings = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Ensure all fields of Property type are present
        title: data.title || '',
        location: data.location || '',
        price: data.price || 0,
        period: data.period || 'yr',
        beds: data.beds || 0,
        baths: data.baths || 0,
        serviced: data.serviced || false,
        type: data.type || 'Flat',
        imageId: data.imageId || '',
        description: data.description || '',
        amenities: data.amenities || [],
      } as Property;
    });

    return listings;
  } catch (serverError: any) {
    if (serverError.code === 'permission-denied') {
      const permissionError = new FirestorePermissionError({
        path: propertiesCol.path,
        operation: 'list',
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
    }
    // Return empty array or re-throw a different error for other issues
    return [];
  }
}

/**
 * Fetches a single property listing by its ID from Firestore.
 * @param id The ID of the property to fetch.
 */
export async function fetchListingById(id: string): Promise<Property | undefined> {
  const docRef = doc(firestore, 'properties', id);
  try {
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        title: data.title || '',
        location: data.location || '',
        price: data.price || 0,
        period: data.period || 'yr',
        beds: data.beds || 0,
        baths: data.baths || 0,
        serviced: data.serviced || false,
        type: data.type || 'Flat',
        imageId: data.imageId || '',
        description: data.description || '',
        amenities: data.amenities || [],
      } as Property;
    } else {
      return undefined;
    }
  } catch (serverError: any) {
    if (serverError.code === 'permission-denied') {
      const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: 'get',
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
    }
    return undefined;
  }
}

/**
 * Creates a new property listing in Firestore.
 * @param values The property data.
 * @param user The authenticated user creating the listing.
 */
export function createListing(
  values: Omit<Property, 'id' | 'landlordId' | 'createdAt'>,
  user: { uid: string }
) {
  const propertiesCol = collection(firestore, 'properties');
  const newListingData = {
    ...values,
    landlordId: user.uid,
    createdAt: serverTimestamp(),
  };

  // Use the non-blocking function for optimistic UI updates and proper error handling
  addDocumentNonBlocking(propertiesCol, newListingData);
}
