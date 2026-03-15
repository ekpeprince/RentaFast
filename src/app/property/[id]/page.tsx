
'use client';

import { notFound, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Wifi, Zap, ShieldCheck, BedDouble, Bath, Building } from 'lucide-react';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AmenityIcon from '@/components/amenity-icon';
import type { Property } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';

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
      // Check if a chat already exists between these two for this property
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
        // Create new chat
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

  const imageUrl = property.imageUrls && property.imageUrls.length > 0 
    ? property.imageUrls[0] 
    : (PlaceHolderImages.find((img) => img.id === 'lekki-apartment') || PlaceHolderImages[0]).imageUrl;

  return (
    <div className="relative min-h-screen pb-28">
      <div className="relative h-72 w-full sm:h-96">
        <Image
          src={imageUrl}
          alt={property.title}
          fill
          className="object-cover"
          priority
        />
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
            <CardContent className="space-y-6">
               <div className="flex items-center gap-6 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" />
                  <span>{property.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BedDouble className="h-5 w-5 text-primary" />
                  <span>{property.beds} Beds</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bath className="h-5 w-5 text-primary" />
                  <span>{property.baths} Baths</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">Description</h3>
                <p className="text-muted-foreground">{property.description}</p>
              </div>
               {property.amenities && property.amenities.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-primary mb-2">Amenities</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {property.amenities.map((amenity) => (
                      <AmenityIcon key={amenity} amenity={amenity} />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-10 border-t bg-background/90 p-4 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-center gap-4 max-w-2xl">
          <Button 
            onClick={handleStartChat} 
            disabled={isStartingChat || user?.uid === property.landlordId}
            variant="default" 
            className="w-full h-12 text-lg font-semibold shadow-lg"
          >
            {isStartingChat ? 'Connecting...' : user?.uid === property.landlordId ? 'Your Listing' : 'Chat with Agent'}
          </Button>
          <Button variant="accent" className="w-full h-12 text-lg font-semibold shadow-lg">
            Rent Now
          </Button>
        </div>
      </div>
    </div>
  );
}
