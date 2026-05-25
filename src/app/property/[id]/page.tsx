'use client';

export const dynamic = 'force-dynamic';

import * as React from 'react';
import { notFound, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ShieldCheck, BedDouble, Bath, Building, ArrowLeft, Phone, User as UserIcon, Eye, Star, Loader2, Crown, Lock, RefreshCw, CreditCard, CheckCircle2, ChevronDown } from 'lucide-react';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, collection, query, where, getDocs, addDoc, serverTimestamp, increment, updateDoc } from 'firebase/firestore';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Badge } from '@/components/ui/badge';
import AmenityIcon from '@/components/amenity-icon';
import RentNowDialog from '@/components/rent-now-dialog';
import ReviewSection from '@/components/review-section';
import type { Property, UserProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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

export default function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;
  
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [showPaystack, setShowPaystack] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'options' | 'card' | 'transfer' | 'success'>('options');

  const FREE_VIEW_LIMIT = 3;

  const propertyRef = useMemoFirebase(
    () => (firestore && id ? doc(firestore, 'properties', id) : null),
    [firestore, id]
  );
  const { data: property, isLoading } = useDoc<Property>(propertyRef);

  // Fetch logged in user's profile
  const userProfileRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  // Fetch landlord info
  const landlordRef = useMemoFirebase(
    () => (firestore && property ? doc(firestore, 'users', property.landlordId) : null),
    [firestore, property?.landlordId]
  );
  const { data: landlord, isLoading: isLandlordLoading } = useDoc<UserProfile>(landlordRef);

  const viewedList = userProfile?.viewedProperties || [];
  const isPremium = userProfile?.isPremium === true;
  const hasViewedCurrent = viewedList.includes(id);
  const uniqueViewsCount = viewedList.length;

  // Lock status calculation: free tenants, view count >= limit, and has not viewed current
  const isLocked = !isProfileLoading && 
                   userProfile?.role === 'tenant' && 
                   !isPremium && 
                   uniqueViewsCount >= FREE_VIEW_LIMIT && 
                   !hasViewedCurrent;

  // Track unique property views in Firestore
  useEffect(() => {
    if (firestore && user && userProfile && userProfile.role === 'tenant' && !isProfileLoading && !isLoading && property) {
      if (!hasViewedCurrent && (uniqueViewsCount < FREE_VIEW_LIMIT || isPremium)) {
        const docRef = doc(firestore, 'users', user.uid);
        const updatedList = [...viewedList, id];
        updateDoc(docRef, {
          viewedProperties: updatedList
        }).catch((err) => console.warn("Failed to record view history:", err));
      }
    }
  }, [firestore, user, userProfile, isProfileLoading, isLoading, id, hasViewedCurrent, uniqueViewsCount, isPremium, property]);

  // Increment public view count on mount (only for unlocked profiles)
  useEffect(() => {
    if (firestore && id && !isLocked) {
      const docRef = doc(firestore, 'properties', id);
      updateDocumentNonBlocking(docRef, {
        viewCount: increment(1)
      });
    }
  }, [firestore, id, isLocked]);

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
      console.warn('Error starting chat:', error);
    } finally {
      setIsStartingChat(false);
    }
  };

  const handleUpgradePremium = async () => {
    if (!firestore || !user) return;
    setIsPaying(true);
    
    setTimeout(async () => {
      setIsPaying(false);
      setPaymentStep('success');
      
      setTimeout(async () => {
        try {
          const docRef = doc(firestore, 'users', user.uid);
          await updateDoc(docRef, {
            isPremium: true
          });
          
          setShowPaystack(false);
          setPaymentStep('options');
          
          toast({
            title: "Premium Upgraded! 👑",
            description: "You now have unlimited listing views and premium matchmaking.",
          });
        } catch (error: any) {
          toast({
            title: "Error",
            description: error.message || "Failed to upgrade profile.",
            variant: "destructive"
          });
        }
      }, 2000);
    }, 2500);
  };

  // If loading, show skeleton.
  if (isLoading || isProfileLoading || (firestore && !propertyRef)) {
    return <PropertyDetailsSkeleton />;
  }

  // Definitively check for non-existent property AFTER loading is complete.
  if (!isLoading && property === null) {
    notFound();
    return null;
  }

  // At this point, property must be defined.
  if (!property) return <PropertyDetailsSkeleton />;

  const propertyImages = property.imageUrls && property.imageUrls.length > 0 
    ? property.imageUrls 
    : [(PlaceHolderImages.find((img) => img.id === 'mcc-apartment') || PlaceHolderImages[0]).imageUrl];

  const isOwner = user?.uid === property.landlordId;

  return (
    <div className="relative min-h-screen pb-28 bg-muted/5">
      <div className="absolute top-4 left-4 z-20">
        <Button asChild variant="secondary" size="icon" className="rounded-full shadow-lg bg-white/80 backdrop-blur-sm">
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
      </div>

      {/* Property image background carousel (blurred if locked) */}
      <div className={cn(
        "relative h-72 w-full sm:h-[500px] bg-black transition-all duration-500",
        isLocked && "blur-md pointer-events-none"
      )}>
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
              <CarouselPrevious className="left-12" />
              <CarouselNext className="right-12" />
            </>
          )}
        </Carousel>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
      </div>

      <div className="container mx-auto -mt-20 px-4 sm:px-6 lg:px-8 relative">
        {/* PREMIUM PAYWALL CARD */}
        {isLocked && (
          <div className="absolute inset-x-4 z-30 flex justify-center pt-24 pb-12 animate-in fade-in duration-500">
            <Card className="w-full max-w-[480px] h-fit border-2 border-amber-500/20 shadow-2xl bg-background/95 backdrop-blur-md rounded-3xl overflow-hidden text-center p-8 space-y-6">
              <div className="mx-auto h-14 w-14 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner">
                <Crown className="h-7 w-7 text-amber-500 animate-pulse" />
              </div>
              
              <div className="space-y-2">
                <Badge variant="outline" className="border-amber-500/30 text-amber-600 bg-amber-500/5 px-3 py-1 font-black uppercase text-[10px] tracking-widest">
                  RentaFast Premium
                </Badge>
                <h2 className="text-2xl font-black text-primary tracking-tight">Unlock Unlimited Listings</h2>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                  You've viewed your free limit of <span className="font-bold text-foreground">3 properties</span>. Upgrade to Premium for unlimited detailed access in Cross River.
                </p>
              </div>

              <div className="border-y py-4 space-y-3 text-left max-w-xs mx-auto">
                <div className="flex items-center gap-3 text-xs text-foreground font-bold">
                  <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">✓</div>
                  <span>Unlimited verified property detail views</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-foreground font-bold">
                  <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">✓</div>
                  <span>Priority AI Matcher recommendations</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-foreground font-bold">
                  <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">✓</div>
                  <span>Direct landlord agent phone contact</span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <Button 
                  onClick={() => {
                    setPaymentStep('options');
                    setShowPaystack(true);
                  }}
                  className="w-full h-12 text-sm font-black rounded-2xl bg-amber-500 hover:bg-amber-600 text-white shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Upgrade to Premium (₦3,000 / mo)
                </Button>
                <p className="text-[9px] text-muted-foreground">Secured payment via Paystack. Cancel anytime.</p>
              </div>
            </Card>
          </div>
        )}

        {/* Detailed property content layout (blurred if locked) */}
        <div className={cn(
          "relative grid grid-cols-1 lg:grid-cols-3 gap-8 transition-all duration-500",
          isLocked && "blur-xl pointer-events-none select-none"
        )}>
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-xl border-none">
              <CardHeader className="p-8">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="bg-primary/5 text-primary border-none">
                        <Eye className="h-3 w-3 mr-1" /> {property.viewCount || 0} views
                      </Badge>
                      {property.reviewCount ? (
                         <Badge variant="secondary" className="bg-accent/10 text-accent border-none font-bold">
                          <Star className="h-3 w-3 mr-1 fill-accent" /> {property.reviewCount} Reviews
                        </Badge>
                      ) : null}
                    </div>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {property.amenities.map((amenity) => (
                        <AmenityIcon key={amenity} amenity={amenity as any} />
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-8 border-t">
                  <ReviewSection propertyId={id} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Listed by</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLandlordLoading ? (
                  <Skeleton className="h-12 w-full" />
                ) : landlord ? (
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg flex items-center gap-1">
                        {landlord.displayName || 'Property Agent'}
                        {landlord.isVerified && <ShieldCheck className="h-4 w-4 text-accent" />}
                      </h4>
                      {landlord.isVerified && <p className="text-xs text-accent font-bold">Verified Agent</p>}
                    </div>
                  </div>
                ) : null}
                
                <div className="pt-4 space-y-2">
                  <Button 
                    className="w-full h-12 text-lg font-bold" 
                    variant="default"
                    onClick={handleStartChat}
                    disabled={isStartingChat || isOwner}
                  >
                    {isStartingChat ? 'Connecting...' : 'Message Agent'}
                  </Button>
                  {landlord?.phoneNumber && (
                    <Button variant="outline" className="w-full h-12" asChild>
                      <a href={`tel:${landlord.phoneNumber}`}>
                        <Phone className="mr-2 h-4 w-4" />
                        Call Agent
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary text-primary-foreground">
              <CardHeader>
                <CardTitle className="text-lg">Security First</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm opacity-90">Always visit the property in person before making any payments. Report any suspicious listings.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Floating purchase checkout footer (blurred if locked) */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t bg-white/95 backdrop-blur-md p-4 pb-safe shadow-2xl transition-all duration-500",
        isLocked && "blur-lg pointer-events-none select-none"
      )}>
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl">
          <div className="hidden sm:block">
            <p className="text-sm text-muted-foreground font-medium">Interested in this property?</p>
            <p className="text-xl font-bold text-primary">{formatCurrency(property.price)} <span className="text-sm font-normal text-muted-foreground">/{property.period}</span></p>
          </div>
          <div className="flex gap-4 w-full sm:w-auto">
            <Button 
              onClick={handleStartChat} 
              disabled={isStartingChat || isOwner}
              variant="outline" 
              className="flex-1 sm:px-8 h-12 text-lg font-bold border-2"
            >
              {isStartingChat ? 'Connecting...' : isOwner ? 'Your Listing' : 'Message Agent'}
            </Button>
            
            {!isOwner ? (
              <RentNowDialog 
                property={property}
                trigger={
                  <Button variant="accent" className="flex-1 sm:px-8 h-12 text-lg font-bold shadow-lg">
                    Rent Now
                  </Button>
                }
              />
            ) : (
              <Button variant="accent" className="flex-1 sm:px-8 h-12 text-lg font-bold shadow-lg" disabled>
                Your Listing
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* HIGH FIDELITY PAYSTACK PREMIUM SUBSCRIPTION SIMULATION MODAL */}
      {showPaystack && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-300">
          <Card className="w-full max-w-[400px] border shadow-2xl bg-white rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200 text-left">
            {/* Paystack Teal-Green Header */}
            <div className="bg-[#011b33] p-5 text-white flex items-center justify-between border-b border-emerald-950">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-emerald-500 flex items-center justify-center font-black text-white text-xs">P</div>
                <div className="flex flex-col">
                  <span className="text-xs text-emerald-400 font-extrabold uppercase tracking-wider">Secured by Paystack</span>
                  <span className="text-[10px] text-white/70 font-semibold truncate max-w-[180px]">{user?.email}</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sm font-black text-emerald-400">₦3,000</span>
                <span className="text-[9px] text-white/50">Premium Upgrade</span>
              </div>
            </div>

            {/* Paystack Checkout Screen */}
            <div className="p-6 space-y-6">
              {paymentStep === 'options' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-700">Choose your payment method</h3>
                  <div className="grid grid-cols-1 gap-2.5">
                    <button 
                      onClick={() => setPaymentStep('card')}
                      className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/10 text-left transition-all"
                    >
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-3">
                        <CreditCard className="h-4 w-4 text-emerald-500" /> Pay with Card
                      </span>
                      <ChevronDown className="-rotate-90 h-4 w-4 text-slate-400" />
                    </button>
                    
                    <button 
                      onClick={() => setPaymentStep('transfer')}
                      className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/10 text-left transition-all"
                    >
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-3">
                        <RefreshCw className="h-4 w-4 text-emerald-500" /> Pay with Bank Transfer
                      </span>
                      <ChevronDown className="-rotate-90 h-4 w-4 text-slate-400" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-center gap-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-widest pt-2">
                    <Lock className="h-3 w-3 text-emerald-500" /> 256-bit Encrypted Transaction
                  </div>
                </div>
              )}

              {paymentStep === 'card' && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Card Number</label>
                      <Input placeholder="5399 2384 1029 4821" className="h-10 text-sm tracking-widest bg-slate-50 border-slate-200" defaultValue="5399 4321 8890 1209" disabled={isPaying} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Expiry Date</label>
                        <Input placeholder="12/28" className="h-10 text-sm tracking-wide bg-slate-50 border-slate-200 text-center" defaultValue="09/29" disabled={isPaying} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">CVV</label>
                        <Input placeholder="123" className="h-10 text-sm tracking-widest bg-slate-50 border-slate-200 text-center" defaultValue="388" disabled={isPaying} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button onClick={() => setPaymentStep('options')} variant="outline" className="flex-1 h-11 text-xs font-bold border-slate-200" disabled={isPaying}>
                      Back
                    </Button>
                    <Button onClick={handleUpgradePremium} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 text-xs shadow-md" disabled={isPaying}>
                      {isPaying ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : "Pay ₦3,000"}
                    </Button>
                  </div>
                </div>
              )}

              {paymentStep === 'transfer' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Transfer Subscription Fee to</span>
                    <div className="space-y-1">
                      <span className="text-lg font-black text-slate-800 tracking-wider">9928173491</span>
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">WEMA BANK / PAYSTACK PREMIUM</span>
                    </div>
                    <p className="text-[9px] text-slate-400 leading-normal">This temporary account is generated specifically for your RentaFast Premium subscription upgrade.</p>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button onClick={() => setPaymentStep('options')} variant="outline" className="flex-1 h-11 text-xs font-bold border-slate-200" disabled={isPaying}>
                      Back
                    </Button>
                    <Button onClick={handleUpgradePremium} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 text-xs shadow-md" disabled={isPaying}>
                      {isPaying ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : "I've completed transfer"}
                    </Button>
                  </div>
                </div>
              )}

              {paymentStep === 'success' && (
                <div className="py-8 flex flex-col items-center justify-center gap-4 text-center animate-in zoom-in-95 duration-200">
                  <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="h-10 w-10 text-emerald-600 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-800">Upgrade Completed!</h4>
                    <p className="text-xs text-slate-500 mt-1">Welcome to RentaFast Premium.</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
