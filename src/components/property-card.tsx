
'use client';

import Image from 'next/image';
import { Heart, BedDouble, Bath, Loader2, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Property, Favorite } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { Button } from './ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp, increment } from 'firebase/firestore';
import { setDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface PropertyCardProps {
  listing: Property;
}

export default function PropertyCard({ listing }: PropertyCardProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isToggling, setIsToggling] = useState(false);

  // Use the first uploaded image, or a placeholder if none exist.
  const imageUrl = listing.imageUrls && listing.imageUrls.length > 0 
    ? listing.imageUrls[0] 
    : (PlaceHolderImages.find((img) => img.id === 'lekki-apartment') || PlaceHolderImages[0]).imageUrl;

  const imageHint = listing.imageUrls && listing.imageUrls.length > 0
    ? 'user uploaded'
    : 'modern apartment';

  // Check if this property is favorited by the current user
  const favoriteRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid, 'favorites', listing.id) : null),
    [user, firestore, listing.id]
  );
  const { data: favorite, isLoading: isFavoriteLoading } = useDoc<Favorite>(favoriteRef);

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user || !firestore) {
      toast({
        title: "Sign in required",
        description: "Log in to save your favorite properties.",
        variant: "destructive"
      });
      return;
    }

    if (!favoriteRef) return;

    setIsToggling(true);
    const listingRef = doc(firestore, 'properties', listing.id);

    if (favorite) {
      deleteDocumentNonBlocking(favoriteRef);
      updateDocumentNonBlocking(listingRef, {
        favoriteCount: increment(-1)
      });
      toast({
        title: "Removed from saved",
        description: "The property has been removed from your list.",
      });
    } else {
      setDocumentNonBlocking(favoriteRef, {
        propertyId: listing.id,
        savedAt: serverTimestamp(),
      }, { merge: true });
      updateDocumentNonBlocking(listingRef, {
        favoriteCount: increment(1)
      });
      toast({
        title: "Saved to favorites",
        description: "You can view this property later in your Saved list.",
      });
    }
    setIsToggling(false);
  };

  return (
    <Card className="overflow-hidden group transition-all duration-300 hover:shadow-xl relative h-full flex flex-col">
      <div className="relative">
        <div className="aspect-w-4 aspect-h-3 w-full h-48">
          <Image
            src={imageUrl}
            alt={listing.title}
            fill
            className="object-cover transform transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            data-ai-hint={imageHint}
          />
        </div>
        <div className="absolute top-0 left-0 p-2 flex flex-col gap-1">
          <Badge className="bg-accent text-white hover:bg-accent border-none text-sm font-bold shadow-sm">
            {formatCurrency(listing.price)}/{listing.period}
          </Badge>
          <Badge variant="secondary" className="text-[10px] bg-black/50 text-white border-none backdrop-blur-sm w-fit">
            <Eye className="h-3 w-3 mr-1" /> {listing.viewCount || 0}
          </Badge>
        </div>
        <div className="absolute top-0 right-0 p-2 z-10">
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={handleToggleFavorite}
            disabled={isFavoriteLoading || isToggling}
            className={cn(
              "rounded-full h-10 w-10 backdrop-blur-sm transition-colors",
              favorite 
                ? "bg-accent/80 hover:bg-accent/90" 
                : "bg-white/30 hover:bg-white/50"
            )}
          >
            {isFavoriteLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            ) : (
              <Heart 
                className={cn(
                  "h-5 w-5 transition-all",
                  favorite ? "fill-white text-white scale-110" : "text-white"
                )} 
              />
            )}
          </Button>
        </div>
      </div>
      <CardContent className="p-4 space-y-1 flex-1">
        <h3 className="font-bold text-lg text-primary truncate">{listing.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-1">{listing.location}</p>
        <div className="flex items-center gap-4 pt-2 text-muted-foreground text-sm">
          <div className="flex items-center gap-1.5">
            <BedDouble className="h-4 w-4" />
            <span>{listing.beds} Beds</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Bath className="h-4 w-4" />
            <span>{listing.baths} Baths</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
