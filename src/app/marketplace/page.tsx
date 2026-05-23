'use client';

import { Suspense, useState, useMemo } from 'react';
import Link from 'next/link';
import HomeHeader from '@/components/home-header';
import PropertySearch from '@/components/property-search';
import CategoryFilters from '@/components/category-filters';
import PropertyCard from '@/components/property-card';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Property } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { collection, query, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Building, ArrowLeft } from 'lucide-react';

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
        (listing.title || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || 
        (listing.location || '').toLowerCase().includes((searchQuery || '').toLowerCase());
      
      const matchesPrice = maxPrice === null || (listing.price || 0) <= maxPrice;
      const matchesBeds = (listing.beds || 0) >= minBeds;
      
      return matchesCategory && matchesSearch && matchesPrice && matchesBeds;
    });
  }, [listings, categoryFilter, searchQuery, maxPrice, minBeds]);

  if (isLoading) {
    return <ListingsSkeleton />;
  }

  if (filteredListings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-3xl bg-muted/20">
        <Building className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
        <p className="text-xl font-semibold text-muted-foreground">No properties found matching your criteria</p>
        <p className="text-muted-foreground mb-6">Try adjusting your filters or search for a different area in Cross River.</p>
        <Button asChild variant="outline">
          <Link href="/marketplace">Clear Filters</Link>
        </Button>
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

export default function MarketplacePage() {
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [minBeds, setMinBeds] = useState<number>(0);

  return (
    <main className="min-h-screen pb-20">
      <div className="container mx-auto px-4 py-2 sm:px-6 lg:px-8">
        <HomeHeader />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2 text-muted-foreground">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Landing
              </Link>
            </Button>
            <h1 className="text-3xl font-black text-primary">Cross River Marketplace</h1>
            <p className="text-muted-foreground">Discover verified homes across Calabar, Ikom, Ogoja and beyond.</p>
          </div>
          
          <div className="w-full md:w-auto">
            <PropertySearch 
              searchQuery={searchQuery} 
              setSearchQuery={setSearchQuery}
              maxPrice={maxPrice}
              setMaxPrice={setMaxPrice}
              minBeds={minBeds}
              setMinBeds={setMinBeds}
            />
          </div>
        </div>

        <div className="border-t pt-6 space-y-8">
          <div className="flex items-center justify-between">
            <CategoryFilters 
              activeCategory={categoryFilter}
              setActiveCategory={setCategoryFilter}
            />
          </div>

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
