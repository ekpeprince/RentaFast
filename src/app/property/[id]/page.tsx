import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Wifi, Zap, ShieldCheck } from 'lucide-react';
import { fetchListingById } from '@/lib/services';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AmenityIcon from '@/components/amenity-icon';
import type { Amenity } from '@/lib/mock-data';

export default async function PropertyPage({ params }: { params: { id: string } }) {
  const property = await fetchListingById(params.id);

  if (!property) {
    notFound();
  }

  const image = PlaceHolderImages.find((img) => img.id === property.imageId);

  return (
    <div className="relative min-h-screen pb-28">
      <div className="relative h-72 w-full sm:h-96">
        {image && (
          <Image
            src={image.imageUrl}
            alt={property.title}
            fill
            className="object-cover"
            priority
            data-ai-hint={image.imageHint}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="container mx-auto -mt-16 px-4 sm:px-6 lg:px-8">
        <div className="relative space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-primary">{property.title}</CardTitle>
                  <p className="text-muted-foreground mt-1">{property.location}</p>
                </div>
                <p className="text-2xl font-bold text-accent mt-2 sm:mt-0">
                  {formatCurrency(property.price)}/{property.period}
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <h3 className="text-lg font-semibold text-primary mb-2">Description</h3>
              <p className="text-muted-foreground">{property.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-primary">Amenities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {property.amenities.map((amenity) => (
                  <AmenityIcon key={amenity} amenity={amenity} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-10 border-t bg-background/90 p-4 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-center gap-4">
          <Button variant="default" className="w-full">
            Chat with Agent
          </Button>
          <Button variant="accent" className="w-full">
            Rent Now
          </Button>
        </div>
      </div>
    </div>
  );
}
