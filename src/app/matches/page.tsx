
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Save, Loader2, ArrowLeft, Home, Heart, MapPin } from 'lucide-react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { matchHomes, type MatchHomesOutput } from '@/ai/flows/match-homes';
import PropertyCard from '@/components/property-card';
import Link from 'next/link';
import type { UserProfile, Property } from '@/lib/types';

export default function SmartMatchesPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [preferences, setPreferences] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [aiMatches, setAiMatches] = useState<MatchHomesOutput['matches']>([]);

  // 1. Load User Profile for preferences
  const profileRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: profile, isLoading: isProfileLoading } = useDoc<UserProfile>(profileRef);

  // 2. Load all properties to match against
  const propertiesQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'properties'), orderBy('createdAt', 'desc')) : null),
    [firestore]
  );
  const { data: listings, isLoading: isListingsLoading } = useCollection<Property>(propertiesQuery);

  useEffect(() => {
    if (profile?.preferences) {
      setPreferences(profile.preferences);
    }
  }, [profile]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleSavePreferences = async () => {
    if (!user || !firestore) return;
    setIsSaving(true);
    const userRef = doc(firestore, 'users', user.uid);
    updateDocumentNonBlocking(userRef, { preferences });
    toast({
      title: 'Wishlist Saved',
      description: 'Your home preferences have been updated.',
    });
    setIsSaving(false);
    
    // Trigger match after saving
    handleRunMatch();
  };

  const handleRunMatch = async () => {
    if (!preferences || !listings || listings.length === 0) return;
    
    setIsMatching(true);
    try {
      const result = await matchHomes({
        preferences,
        listings: listings.map(l => ({
          id: l.id,
          title: l.title,
          location: l.location,
          price: l.price,
          description: l.description,
          type: l.type,
          beds: l.beds,
          baths: l.baths,
          amenities: l.amenities || [],
        })),
      });
      
      setAiMatches(result.matches.sort((a, b) => b.score - a.score));
    } catch (error) {
      console.warn('Match error:', error);
      toast({
        variant: 'destructive',
        title: 'Matching Failed',
        description: 'AI couldn\'t analyze matches right now.',
      });
    } finally {
      setIsMatching(false);
    }
  };

  // Combine AI match data with real property documents
  const matchedProperties = useMemo(() => {
    if (!listings || aiMatches.length === 0) return [];
    return aiMatches
      .map(match => {
        const prop = listings.find(l => l.id === match.id);
        if (!prop) return null;
        return { ...prop, aiMatch: match };
      })
      .filter((p): p is (Property & { aiMatch: MatchHomesOutput['matches'][0] }) => p !== null);
  }, [listings, aiMatches]);

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="container mx-auto p-8 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Initializing AI Home Matcher...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Button asChild variant="ghost" className="-ml-2 mb-2">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <h1 className="text-3xl font-extrabold text-primary flex items-center gap-3">
            Smart Home Matcher
            <Sparkles className="h-8 w-8 text-accent" />
          </h1>
          <p className="text-muted-foreground">Tell the AI what you're looking for, and we'll find your perfect Cross River home.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Preferences Input */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-lg border-accent/20">
            <CardHeader className="bg-accent/5">
              <CardTitle className="text-lg flex items-center gap-2">
                <Heart className="h-4 w-4 text-accent fill-accent" />
                Your Home Wishlist
              </CardTitle>
              <CardDescription>
                Describe your ideal house in plain English.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <Textarea 
                placeholder="e.g., I'm a student looking for a self-con near UNICAL Etta Agbo. I need steady power for my projects and it should be under 200k..."
                className="min-h-[150px] text-sm leading-relaxed"
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
              />
            </CardContent>
            <CardFooter className="flex flex-col gap-2 pt-0">
              <Button 
                onClick={handleSavePreferences} 
                className="w-full font-bold" 
                disabled={isSaving || !preferences}
              >
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save & Match
              </Button>
              <p className="text-[10px] text-center text-muted-foreground">
                AI Matcher works best with detailed descriptions of location, budget, and lifestyle.
              </p>
            </CardFooter>
          </Card>

          <Card className="bg-primary text-primary-foreground border-none">
            <CardHeader>
              <CardTitle className="text-sm">Why use AI Matcher?</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-3 opacity-90">
              <p>• Saves hours of manual scrolling.</p>
              <p>• Understands context like "near the Port" or "safe for families".</p>
              <p>• Provides personalized reasons for every recommendation.</p>
            </CardContent>
          </Card>
        </div>

        {/* Right: AI Match Results */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-primary flex items-center gap-2">
              Best Fits for You
              {aiMatches.length > 0 && <Badge variant="secondary" className="rounded-full">{aiMatches.length}</Badge>}
            </h2>
            {isMatching && (
              <div className="flex items-center gap-2 text-sm text-accent animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin" />
                AI is analyzing listings...
              </div>
            )}
          </div>

          {matchedProperties.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {matchedProperties.map((prop) => (
                <div key={prop.id} className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <Link href={`/property/${prop.id}`}>
                    <PropertyCard listing={prop} />
                  </Link>
                  <div className="p-3 rounded-xl bg-accent/5 border border-accent/10 relative">
                     <div className="absolute -top-2 -left-1">
                        <Badge className="bg-accent text-white border-none shadow-sm text-[10px] py-0">
                           {prop.aiMatch.score}% Match
                        </Badge>
                     </div>
                     <p className="text-[11px] text-muted-foreground leading-relaxed italic mt-1">
                       <Sparkles className="h-3 w-3 inline mr-1 text-accent" />
                       "{prop.aiMatch.reason}"
                     </p>
                  </div>
                </div>
              ))}
            </div>
          ) : isMatching ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[1, 2].map(i => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-48 w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 border-4 border-dashed rounded-3xl bg-muted/20 opacity-40">
               <div className="p-6 bg-white rounded-full shadow-inner mb-6">
                 <Home className="h-16 w-16 text-muted-foreground" />
               </div>
               <h3 className="text-xl font-bold text-primary">No Matches Yet</h3>
               <p className="text-sm text-muted-foreground max-w-xs mt-2">
                 Describe your dream home in the wishlist box and click "Save & Match" to see personalized results.
               </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
