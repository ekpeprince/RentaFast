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
import { Button } from '@/components/ui/button';
import { MapPin, Sparkles, ShieldCheck, Search, ArrowRight, Building, Users, Zap } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

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
      <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-3xl bg-muted/20">
        <Building className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
        <p className="text-xl font-semibold text-muted-foreground">No properties found in this area</p>
        <p className="text-muted-foreground mb-6">Try adjusting your filters or be the first to list a home here!</p>
        <Button asChild variant="outline">
          <Link href="/new-listing">List Your Property</Link>
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

export default function Home() {
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [minBeds, setMinBeds] = useState<number>(0);

  const heroImage = PlaceHolderImages.find(img => img.id === 'calabar-villa')?.imageUrl || '';

  return (
    <main className="min-h-screen pb-20">
      <div className="container mx-auto px-4 py-2 sm:px-6 lg:px-8">
        <HomeHeader />
      </div>

      {/* Hero Section */}
      <section className="relative h-[500px] w-full flex items-center justify-center overflow-hidden mb-12">
        <Image 
          src={heroImage} 
          alt="Luxury home in Calabar" 
          fill 
          className="object-cover brightness-[0.4]"
          priority
          data-ai-hint="luxury villa"
        />
        <div className="container relative z-10 px-4 text-center text-white space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl font-black tracking-tight">
              Find Your Perfect Home in <span className="text-accent">Cross River</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
              The smartest way to rent in Calabar, Ikom, and Ogoja. Verified agents, AI-powered matching, and local neighborhood guides.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto w-full">
            <PropertySearch 
              searchQuery={searchQuery} 
              setSearchQuery={setSearchQuery}
              maxPrice={maxPrice}
              setMaxPrice={setMaxPrice}
              minBeds={minBeds}
              setMinBeds={setMinBeds}
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium">
             <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full">
               <ShieldCheck className="h-4 w-4 text-accent" /> Verified Agents
             </div>
             <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full">
               <Zap className="h-4 w-4 text-accent" /> Instant Messaging
             </div>
             <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full">
               <Sparkles className="h-4 w-4 text-accent" /> AI Matching
             </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Value Props */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-muted/30">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-bold mb-2">Know the Neighborhood</h3>
            <p className="text-sm text-muted-foreground">Moving to Calabar? Get AI vibe checks on every local area before you visit.</p>
            <Button asChild variant="link" className="mt-2 text-accent">
              <Link href="/guides">Explore Guides <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>

          <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-muted/30">
            <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-lg font-bold mb-2">Smart AI Matching</h3>
            <p className="text-sm text-muted-foreground">Tell the AI what you're looking for and let it find your dream home for you.</p>
            <Button asChild variant="link" className="mt-2 text-accent">
              <Link href="/matches">Try AI Matcher <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>

          <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-muted/30">
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-bold mb-2">Direct Contact</h3>
            <p className="text-sm text-muted-foreground">No middlemen drama. Chat directly with verified landlords and property managers.</p>
            <Button asChild variant="link" className="mt-2 text-accent">
              <Link href="/signup">Join RentaFast <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
        </section>

        {/* Marketplace Section */}
        <section id="marketplace" className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-primary">Marketplace</h2>
              <p className="text-muted-foreground font-medium">Browse verified listings across Cross River State.</p>
            </div>
            <div className="w-full md:w-auto">
              <CategoryFilters 
                activeCategory={categoryFilter}
                setActiveCategory={setCategoryFilter}
              />
            </div>
          </div>

          <Suspense fallback={<ListingsSkeleton />}>
            <ListingsGrid 
              categoryFilter={categoryFilter} 
              searchQuery={searchQuery} 
              maxPrice={maxPrice}
              minBeds={minBeds}
            />
          </Suspense>
        </section>
      </div>
    </main>
  );
}
