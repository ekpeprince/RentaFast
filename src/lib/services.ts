import { collection, getDocs, getDoc, doc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import type { Property } from '@/lib/mock-data';

/**
 * Fetches all property listings from Firestore.
 */
export async function fetchListings(): Promise<Property[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const propertiesCol = collection(firestore, 'properties');
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
}

/**
 * Fetches a single property listing by its ID from Firestore.
 * @param id The ID of the property to fetch.
 */
export async function fetchListingById(id: string): Promise<Property | undefined> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const docRef = doc(firestore, 'properties', id);
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
}
