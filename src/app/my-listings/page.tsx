'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2, PlusCircle, ArrowLeft } from 'lucide-react';
import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import PropertyCard from '@/components/property-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { Property } from '@/lib/types';

export default function MyListingsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const listingsQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'properties'), where('landlordId', '==', user.uid)) : null),
    [firestore, user?.uid]
  );
  
  const { data: listings, isLoading } = useCollection<Property>(listingsQuery);

  const handleDelete = (listingId: string) => {
    if (!firestore) return;
    
    if (confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      const docRef = doc(firestore, 'properties', listingId);
      deleteDocumentNonBlocking(docRef);
      toast({
        title: 'Listing deleted',
        description: 'The property has been removed from the platform.',
      });
    }
  };

  if (isUserLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Button asChild variant="ghost" className="mb-2 -ml-2">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-primary">My Listings</h1>
          <p className="text-muted-foreground">Manage the properties you've listed on RentaFast.</p>
        </div>
        <Button asChild variant="accent">
          <Link href="/new-listing">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Listing
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full rounded-xl" />
          ))}
        </div>
      ) : listings && listings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {listings.map((listing) => (
            <div key={listing.id} className="relative group">
              <Link href={`/property/${listing.id}`}>
                <PropertyCard listing={listing} />
              </Link>
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  variant="destructive" 
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDelete(listing.id);
                  }}
                  className="shadow-lg"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="border-dashed py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <p className="text-xl font-semibold mb-2">You haven't listed any properties yet.</p>
            <p className="text-muted-foreground mb-6">Start earning by listing your first property on RentaFast.</p>
            <Button asChild variant="accent">
              <Link href="/new-listing">List Your First Property</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
