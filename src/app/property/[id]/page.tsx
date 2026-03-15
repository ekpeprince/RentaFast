'use client';

import { notFound, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Wifi, Zap, ShieldCheck, BedDouble, Bath, Building, ArrowLeft } from 'lucide-react';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import AmenityIcon from '@/components/amenity-icon';
import type { Property } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import Link from 'next/link';

function PropertyDetailsSkeleton() {
  return (
    <div className="relative min-h-screen pb-28">
       <Skeleton className="h-72 w-full sm:h-96" />
        <div className="container mx-auto -mt-16 px-4 sm:px-6 lg:px-8">
          <div className="relative space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <Skeleton className="h-8 w-80 mb-2" />
                    <Skeleton className="h-5 w-48" />
                  </div>
                  <Skeleton className="h-8 w-32 mt-2 sm:mt-0" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-40 mb-2" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
    </div>
  )
}

export default function PropertyPage({ params }: { params: { id: string } }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [isStartingChat, setIsStartingChat] = useState(false);

  const propertyRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'properties', params.id) : null),
    [firestore, params.id]
  );
  const { data: property, isLoading } = useDoc<Property>(propertyRef);

  const handleStartChat = async () => {
    if (!user || !firestore || !property) {
      if (!user) router.push('/login');
      return;
    }

    setIsStartingChat(true);

    try {
      const chatsRef = collection(firestore, 'chats');
      const q = query(
        chatsRef, 
        where('participants', 'array-contains', user.uid),
        where('propertyId', '==', property.id)
      );
      
      const querySnapshot = await getDocs(q);
      let chatId = '';

      if (!querySnapshot.empty) {
        chatId = querySnapshot.docs[0].id;
      } else {
        const newChat = {
          participants: [user.uid, property.landlordId],
          propertyId: property.id,
          propertyTitle: property.title,
          lastMessage: 'Conversation started',
          updatedAt: serverTimestamp(),
        };
        const docRef = await addDoc(chatsRef, newChat);
        chatId = docRef.id;
      }

      router.push(`/chat/${chatId}`);
    } catch (error) {
      console.error('Error starting chat:', error);
    } finally {
      setIsStartingChat(false);
    }
  };

  if (isLoading) {
    return <PropertyDetailsSkeleton />;
  }

  if (!property) {
    notFound();
  }

  const propertyImages = property.imageUrls && property.imageUrls.length > 0 
    ? property.imageUrls 
    : [(PlaceHolderImages.find((img) => img.id === 'lekki-apartment') || PlaceHolderImages[0]).imageUrl];

  return (
    <div className="relative min-h-screen pb-28 bg-muted/5">
      <div className="absolute top-4 left-4 z-20">
        <Button asChild variant="secondary" size="icon" className="rounded-full shadow-lg bg-white/80 backdrop-blur-sm">
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
      </div>

      <div className="relative h-72 w-full sm:h-[500px] bg-black">
        <Carousel className="w-full h-full">
          <CarouselContent>
            {propertyImages.map((url, index) => (
              <CarouselItem key={index} className="relative h-72 sm:h-[500px] w-full">
                <Image
                  src={url}
                  alt={`${property.title} - Image ${index + 1}`}
                  fill
                  className="object-cover"
                  priority={index === 0}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          {propertyImages.length > 1 && (
            <>
              <CarouselPrevious className="left-4" />
              <CarouselNext className="right-4" />
            </>
          )}
        </Carousel>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
      </div>

      <div className="container mx-auto -mt-20 px-4 sm:px-6 lg:px-8">
        <div className="relative space-y-6">
          <Card className="shadow-xl border-none">
            <CardHeader className="p-8">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-2">
                  <CardTitle className="text-3xl font-extrabold text-primary">{property.title}</CardTitle>
                  <p className="text-lg text-muted-foreground">{property.location}</p>
                </div>
                <div className="flex flex-col items-end">
                  <p className="text-3xl font-black text-accent">
                    {formatCurrency(property.price)}
                  </p>
                  <p className="text-sm font-medium text-muted-foreground capitalize">per {property.period === 'yr' ? 'year' : 'month'}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-8">
               <div className="flex flex-wrap items-center gap-8 py-6 border-y">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Building className="h-6 w-6 text-primary" />
                  </div>
                  <span className="font-bold text-lg">{property.type}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <BedDouble className="h-6 w-6 text-primary" />
                  </div>
                  <span className="font-bold text-lg">{property.beds} Bedrooms</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Bath className="h-6 w-6 text-primary" />
                  </div>
                  <span className="font-bold text-lg">{property.baths} Bathrooms</span>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-primary mb-4">About this property</h3>
                <p className="text-muted-foreground leading-relaxed text-lg whitespace-pre-wrap">
                  {property.description}
                </p>
              </div>

               {property.amenities && property.amenities.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-primary mb-4">Amenities</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {property.amenities.map((amenity) => (
                      <AmenityIcon key={amenity} amenity={amenity as any} />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/95 backdrop-blur-md p-4 pb-safe shadow-2xl">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl">
          <div className="hidden sm:block">
            <p className="text-sm text-muted-foreground font-medium">Interested in this property?</p>
            <p className="text-xl font-bold text-primary">{formatCurrency(property.price)} <span className="text-sm font-normal text-muted-foreground">/{property.period}</span></p>
          </div>
          <div className="flex gap-4 w-full sm:w-auto">
            <Button 
              onClick={handleStartChat} 
              disabled={isStartingChat || user?.uid === property.landlordId}
              variant="outline" 
              className="flex-1 sm:px-8 h-12 text-lg font-bold border-2"
            >
              {isStartingChat ? 'Connecting...' : user?.uid === property.landlordId ? 'Your Listing' : 'Message Agent'}
            </Button>
            <Button variant="accent" className="flex-1 sm:px-8 h-12 text-lg font-bold shadow-lg">
              Rent Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
