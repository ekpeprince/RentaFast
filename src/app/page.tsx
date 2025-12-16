
'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import HomeHeader from '@/components/home-header';
import PropertySearch from '@/components/property-search';
import CategoryFilters from '@/components/category-filters';
import PropertyCard from '@/components/property-card';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Property } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { collection, query, orderBy } from 'firebase/firestore';

function ListingsGrid({ categoryFilter }: { categoryFilter: string }) {
  const firestore = useFirestore();

  const listingsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'properties'), orderBy('createdAt', 'desc')) : null),
    [firestore]
  );
  const { data: listings, isLoading } = useCollection<Property>(listingsQuery);

  if (isLoading) {
    return <ListingsSkeleton />;
  }
  
  const filteredListings =
    categoryFilter === 'All'
      ? listings
      : listings?.filter((listing) => listing.type === categoryFilter);


  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredListings?.map((listing) => (
        <Link key={listing.id} href={`/property/${listing.id}`}>
          <PropertyCard listing={listing} />
        </Link>
      ))}
    </div>
  );
}

function ListingsSkeleton() {
  return (
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
  );
}

export default function Home() {
  const [categoryFilter, setCategoryFilter] = useState('All');

  return (
    <main className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <HomeHeader />
        <PropertySearch />
        <div>
          <h2 className="text-xl font-bold text-primary mb-4">Categories</h2>
          <CategoryFilters 
            activeCategory={categoryFilter}
            setActiveCategory={setCategoryFilter}
          />
        </div>
        <div>
          <h2 className="text-xl font-bold text-primary mb-4">Fresh on the Market</h2>
          <Suspense fallback={<ListingsSkeleton />}>
            <ListingsGrid categoryFilter={categoryFilter} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
