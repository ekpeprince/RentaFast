'use client';

import Link from 'next/link';
import { Suspense, useState, useMemo } from 'react';
import HomeHeader from '@/components/home-header';
import PropertySearch from '@/components/property-search';
import CategoryFilters from '@/components/category-filters';
import PropertyCard from '@/components/property-card';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Property } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { collection, query, orderBy } from 'firebase/firestore';

function ListingsGrid({ 
  categoryFilter, 
  searchQuery,
  maxPrice,
  minBeds
}: { 
  categoryFilter: string; 
  searchQuery: string;
  maxPrice: number | null;
  minBeds: number;
}) {
  const firestore = useFirestore();

  const listingsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'properties'), orderBy('createdAt', 'desc')) : null),
    [firestore]
  );
  const { data: listings, isLoading } = useCollection<Property>(listingsQuery);

  const filteredListings = useMemo(() => {
    if (!listings) return [];
    
    return listings.filter((listing) => {
      const matchesCategory = categoryFilter === 'All' || listing.type === categoryFilter;
      const matchesSearch = 
        listing.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        listing.location.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPrice = maxPrice === null || listing.price <= maxPrice;
      const matchesBeds = listing.beds >= minBeds;
      
      return matchesCategory && matchesSearch && matchesPrice && matchesBeds;
    });
  }, [listings, categoryFilter, searchQuery, maxPrice, minBeds]);

  if (isLoading) {
    return <ListingsSkeleton />;
  }

  if (filteredListings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-xl font-semibold text-muted-foreground">No properties found</p>
        <p className="text-muted-foreground">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredListings.map((listing) => (
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
  const [searchQuery, setSearchQuery] = useState('');
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [minBeds, setMinBeds] = useState<number>(0);

  return (
    <main className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <HomeHeader />
        <PropertySearch 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
          minBeds={minBeds}
          setMinBeds={setMinBeds}
        />
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
            <ListingsGrid 
              categoryFilter={categoryFilter} 
              searchQuery={searchQuery} 
              maxPrice={maxPrice}
              minBeds={minBeds}
            />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
