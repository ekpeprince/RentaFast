'use client';

import { useState } from 'react';
import { Sparkles, MapPin, ArrowLeft, Loader2, Info, GraduationCap, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { NIGERIAN_LOCATIONS } from '@/lib/locations';
import { generateNeighborhoodGuide, type NeighborhoodOutput } from '@/ai/flows/generate-neighborhood-guide';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function NeighborhoodGuidesPage() {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [guide, setGuide] = useState<NeighborhoodOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGetGuide = async (loc: string) => {
    setSelectedLocation(loc);
    setGuide(null);
    setIsLoading(true);
    try {
      const result = await generateNeighborhoodGuide({ location: loc });
      setGuide(result);
    } catch (error) {
      console.warn('Failed to get neighborhood guide:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Grouping locations by hub (Calabar, Ikom, etc.)
  const hubGroups: Record<string, string[]> = {
    "Calabar Area": NIGERIAN_LOCATIONS.filter(l => l.startsWith("Calabar")),
    "Ikom Area": NIGERIAN_LOCATIONS.filter(l => l.startsWith("Ikom")),
    "Ogoja Area": NIGERIAN_LOCATIONS.filter(l => l.startsWith("Ogoja")),
    "Obudu Area": NIGERIAN_LOCATIONS.filter(l => l.startsWith("Obudu")),
    "Ugep/Yakurr": NIGERIAN_LOCATIONS.filter(l => l.startsWith("Ugep")),
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <Button asChild variant="ghost" className="-ml-2 mb-2">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
        <h1 className="text-3xl font-extrabold text-primary flex items-center gap-3">
          Cross River Vibe Guides
          <Sparkles className="h-8 w-8 text-accent" />
        </h1>
        <p className="text-muted-foreground mt-2">
          Moving to a new area? Get an AI-powered "Vibe Check" on Cross River neighborhoods to find your perfect fit.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar: Location List */}
        <div className="md:col-span-1 space-y-8">
          {Object.entries(hubGroups).map(([groupName, locations]) => (
            <div key={groupName} className="space-y-3">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b pb-2">{groupName}</h3>
              <div className="flex flex-col gap-1">
                {locations.map(loc => (
                  <button
                    key={loc}
                    onClick={() => handleGetGuide(loc)}
                    className={`text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                      selectedLocation === loc 
                        ? 'bg-primary text-white shadow-md font-bold' 
                        : 'hover:bg-accent/5 hover:text-accent'
                    }`}
                  >
                    {loc.split(' - ')[1] || loc}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Main Content: AI Guide Display */}
        <div className="md:col-span-2">
          {selectedLocation ? (
            <Card className="border-accent/10 shadow-2xl min-h-[500px] overflow-hidden">
              <div className="h-2 bg-accent" />
              <CardHeader className="bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-accent" />
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{selectedLocation}</span>
                </div>
                <CardTitle className="text-2xl font-black text-primary">Neighborhood Vibe Check</CardTitle>
                <CardDescription>Powered by RentaFast Local AI Insights</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                    <div className="relative">
                       <Loader2 className="h-12 w-12 animate-spin text-accent" />
                       <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-accent/40 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-primary">Asking the Locals...</p>
                      <p className="text-sm text-muted-foreground">Gathering vibe data for {selectedLocation.split(' - ')[1] || selectedLocation}</p>
                    </div>
                  </div>
                ) : guide ? (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                    <section className="space-y-3">
                      <h4 className="text-sm font-bold text-primary flex items-center gap-2 uppercase tracking-wider">
                        <Coffee className="h-4 w-4 text-accent" /> The Lifestyle Vibe
                      </h4>
                      <p className="text-lg text-muted-foreground leading-relaxed italic border-l-4 border-accent/20 pl-4 py-1">
                        "{guide.vibe}"
                      </p>
                    </section>

                    <section className="space-y-3">
                      <h4 className="text-sm font-bold text-primary flex items-center gap-2 uppercase tracking-wider">
                        <GraduationCap className="h-4 w-4 text-accent" /> Perfect For
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {guide.bestFor.map((item) => (
                          <Badge key={item} variant="secondary" className="px-3 py-1 bg-primary/5 text-primary border-none font-bold">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </section>

                    <section className="space-y-3">
                      <h4 className="text-sm font-bold text-primary flex items-center gap-2 uppercase tracking-wider">
                        <Info className="h-4 w-4 text-accent" /> Notable Highlights
                      </h4>
                      <div className="p-4 rounded-xl bg-accent/5 text-muted-foreground leading-relaxed border border-accent/10">
                        {guide.highlights}
                      </div>
                    </section>

                    <div className="pt-8 border-t flex items-center gap-3 text-xs text-muted-foreground/60 italic">
                       <Sparkles className="h-3 w-3" />
                       This overview is AI-generated based on local property market trends and neighborhood data.
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 border-4 border-dashed rounded-3xl opacity-30 bg-muted/20">
               <div className="p-6 bg-white rounded-full shadow-inner mb-6">
                 <MapPin className="h-16 w-16 text-muted-foreground" />
               </div>
               <h3 className="text-2xl font-black text-primary">Discover Cross River</h3>
               <p className="text-muted-foreground max-w-xs mt-2">
                 Select a neighborhood from the sidebar to get an instant AI-powered vibe check on your next potential home.
               </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
