'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, ArrowLeft, Loader2 } from 'lucide-react';
import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, documentId } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import PropertyCard from '@/components/property-card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Property, Favorite } from '@/lib/types';

export default function FavoritesPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  // Fetch the user's favorites list
  const favoritesQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'users', user.uid, 'favorites')) : null),
    [firestore, user?.uid]
  );
  const { data: favorites, isLoading: isFavoritesLoading } = useCollection<Favorite>(favoritesQuery);

  // Extract property IDs from favorites
  const favoritePropertyIds = favorites?.map(f => f.propertyId) || [];

  // Fetch the actual property documents for those IDs
  const propertiesQuery = useMemoFirebase(() => {
    if (!firestore || favoritePropertyIds.length === 0) return null;
    // Firestore "in" query limits to 10-30 depending on SDK, but let's assume standard small list for now
    // If it's more than 30, we'd need to chunk it.
    return query(collection(firestore, 'properties'), where(documentId(), 'in', favoritePropertyIds.slice(0, 30)));
  }, [firestore, favoritePropertyIds.join(',')]);

  const { data: listings, isLoading: isPropertiesLoading } = useCollection<Property>(propertiesQuery);

  const isLoading = isUserLoading || isFavoritesLoading || (favoritePropertyIds.length > 0 && isPropertiesLoading);

  if (!user && !isUserLoading) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button asChild variant="ghost" className="mb-2 -ml-2">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
          Saved Homes
          <Heart className="h-7 w-7 text-accent fill-accent" />
        </h1>
        <p className="text-muted-foreground">Properties you've saved to your favorites.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-56 w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : listings && listings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {listings.map((listing) => (
            <Link key={listing.id} href={`/property/${listing.id}`}>
              <PropertyCard listing={listing} />
            </Link>
          ))}
        </div>
      ) : (
        <Card className="border-dashed py-16">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <div className="h-20 w-20 rounded-full bg-accent/10 flex items-center justify-center mb-6">
               <Heart className="h-10 w-10 text-accent" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Your wishlist is empty</h2>
            <p className="text-muted-foreground max-w-sm mb-8">
              Save properties you love by clicking the heart icon on any listing.
            </p>
            <Button asChild variant="default" size="lg" className="rounded-full px-8">
              <Link href="/">Start Browsing</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}