import Image from 'next/image';
import { Heart, BedDouble, Bath } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Property } from '@/lib/mock-data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { formatCurrency } from '@/lib/utils';
import { Button } from './ui/button';

interface PropertyCardProps {
  listing: Property;
}

export default function PropertyCard({ listing }: PropertyCardProps) {
  const image = PlaceHolderImages.find((img) => img.id === listing.imageId);

  return (
    <Card className="overflow-hidden group transition-all duration-300 hover:shadow-xl">
      <div className="relative">
        <div className="aspect-w-4 aspect-h-3 w-full">
          {image && (
            <Image
              src={image.imageUrl}
              alt={listing.title}
              fill
              className="object-cover transform transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              data-ai-hint={image.imageHint}
            />
          )}
        </div>
        <div className="absolute top-0 left-0 p-2">
          <Badge variant="accent" className="text-sm font-bold">
            {formatCurrency(listing.price)}/{listing.period}
          </Badge>
        </div>
        <div className="absolute top-0 right-0 p-2">
          <Button size="icon" variant="ghost" className="rounded-full h-10 w-10 bg-white/30 backdrop-blur-sm hover:bg-white/50">
            <Heart className="h-5 w-5 text-white" />
          </Button>
        </div>
      </div>
      <CardContent className="p-4 space-y-1">
        <h3 className="font-bold text-lg text-primary truncate">{listing.title}</h3>
        <p className="text-sm text-muted-foreground">{listing.location}</p>
        <div className="flex items-center gap-4 pt-2 text-muted-foreground text-sm">
          <div className="flex items-center gap-1.5">
            <BedDouble className="h-4 w-4" />
            <span>{listing.beds} Beds</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Bath className="h-4 w-4" />
            <span>{listing.baths} Baths</span>
          </div>
          {listing.serviced && (
            <Badge variant="secondary" className="font-normal">Serviced</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
