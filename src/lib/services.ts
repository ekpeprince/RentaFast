
import { collection, getDocs, getDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import type { Property } from './types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
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
      // For server-side rendering, we cannot use the client-side error emitter.
      // Instead, we throw a standard error that Next.js will catch.
      // This will be displayed on the server logs and in the browser console during development.
      throw new Error(`Firestore Permission Denied: You do not have permission to list properties at '${propertiesCol.path}'.`);
    }
    // For other errors, we can log them and return an empty array or re-throw.
    console.error('Error fetching listings:', serverError);
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
       // For server-side rendering, throw a standard error.
       throw new Error(`Firestore Permission Denied: You do not have permission to get the document at '${docRef.path}'.`);
    }
    console.error(`Error fetching listing ${id}:`, serverError);
    return undefined;
  }
}

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
  const propertiesCol = collection(firestore, 'properties');
  const newListingData = {
    ...values,
    landlordId: user.uid,
    createdAt: serverTimestamp(),
  };

  // Use the non-blocking function for optimistic UI updates and proper error handling on the client.
  addDocumentNonBlocking(propertiesCol, newListingData);
}
