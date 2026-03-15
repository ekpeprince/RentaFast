'use client';

import Link from 'next/link';
import HomeHeader from '@/components/home-header';
import { Button } from '@/components/ui/button';
import { MapPin, Sparkles, ShieldCheck, ArrowRight, Building, Users, Zap, Search } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function Home() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'calabar-villa')?.imageUrl || '';

  return (
    <main className="min-h-screen pb-20">
      <div className="container mx-auto px-4 py-2 sm:px-6 lg:px-8">
        <HomeHeader />
      </div>

      {/* Hero Section */}
      <section className="relative h-[600px] w-full flex items-center justify-center overflow-hidden mb-16">
        <Image 
          src={heroImage} 
          alt="Luxury home in Calabar" 
          fill 
          className="object-cover brightness-[0.4]"
          priority
          data-ai-hint="luxury villa"
        />
        <div className="container relative z-10 px-4 text-center text-white space-y-8">
          <div className="space-y-4">
            <Badge className="bg-accent text-white border-none px-4 py-1 text-sm font-bold uppercase tracking-widest animate-bounce">
              Now Live in Cross River
            </Badge>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight">
              Rent Smarter in <br/><span className="text-accent">Cross River State</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto font-medium">
              Find verified homes in Calabar, Ikom, and Ogoja with AI matching and local neighborhood vibe checks.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="h-16 px-10 text-xl font-bold rounded-full shadow-2xl transition-transform hover:scale-105 active:scale-95">
              <Link href="/marketplace">
                <Search className="mr-2 h-6 w-6" />
                Browse Marketplace
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-16 px-10 text-xl font-bold rounded-full bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 hover:text-white transition-transform hover:scale-105 active:scale-95">
              <Link href="/guides">
                Explore Neighborhoods
              </Link>
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-8 text-sm font-bold">
             <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-black/20">
               <ShieldCheck className="h-5 w-5 text-accent" /> 100% Verified Agents
             </div>
             <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-black/20">
               <Zap className="h-5 w-5 text-accent" /> No Middleman Drama
             </div>
             <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-black/20">
               <Sparkles className="h-5 w-5 text-accent" /> AI Home Matcher
             </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
        
        {/* Value Props */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="group flex flex-col items-center text-center p-8 rounded-3xl bg-muted/30 border transition-all hover:shadow-xl hover:-translate-y-1">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
              <MapPin className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-black mb-3 text-primary">Regional Guides</h3>
            <p className="text-muted-foreground leading-relaxed">Moving to Calabar? Get an instant "Vibe Check" on any local neighborhood before you visit.</p>
            <Button asChild variant="link" className="mt-4 text-accent font-bold text-lg">
              <Link href="/guides">Check the Vibe <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>

          <div className="group flex flex-col items-center text-center p-8 rounded-3xl bg-muted/30 border transition-all hover:shadow-xl hover:-translate-y-1">
            <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-6 group-hover:bg-accent group-hover:text-white transition-colors">
              <Sparkles className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-black mb-3 text-primary">Smart AI Matcher</h3>
            <p className="text-muted-foreground leading-relaxed">Tell RentaFast what you're looking for and let our AI find the perfect home in seconds.</p>
            <Button asChild variant="link" className="mt-4 text-accent font-bold text-lg">
              <Link href="/matches">Try Smart Match <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>

          <div className="group flex flex-col items-center text-center p-8 rounded-3xl bg-muted/30 border transition-all hover:shadow-xl hover:-translate-y-1">
            <div className="h-16 w-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-6 group-hover:bg-green-600 group-hover:text-white transition-colors">
              <Users className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-black mb-3 text-primary">Direct Contact</h3>
            <p className="text-muted-foreground leading-relaxed">Forget the stress. Chat directly with verified landlords and property managers across Cross River.</p>
            <Button asChild variant="link" className="mt-4 text-accent font-bold text-lg">
              <Link href="/marketplace">Start Searching <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </section>

        {/* Call to Action for Landlords */}
        <section className="relative rounded-[2.5rem] bg-primary overflow-hidden p-12 md:p-20 text-white">
           <div className="absolute top-0 right-0 p-8 opacity-10">
              <Building className="h-64 w-64" />
           </div>
           <div className="relative z-10 max-w-2xl">
              <h2 className="text-4xl md:text-5xl font-black mb-6">List Your Property in Cross River</h2>
              <p className="text-xl text-white/80 mb-10 leading-relaxed">
                Reach thousands of verified tenants in Calabar, Ikom, and Ogoja. Use AI to write your descriptions and track your listing performance.
              </p>
              <div className="flex flex-wrap gap-4">
                 <Button asChild size="lg" variant="accent" className="h-14 px-8 text-lg font-bold rounded-xl shadow-lg">
                    <Link href="/new-listing">List Your Home Now</Link>
                 </Button>
                 <Button asChild size="lg" variant="outline" className="h-14 px-8 text-lg font-bold rounded-xl border-white/20 hover:bg-white/10 hover:text-white">
                    <Link href="/leads">View Your Leads</Link>
                 </Button>
              </div>
           </div>
        </section>

        {/* Footer info */}
        <footer className="pt-12 border-t text-center space-y-4">
           <h2 className="text-2xl font-black text-primary">RentaFast</h2>
           <p className="text-muted-foreground max-w-md mx-auto">
             Building the future of property rentals in Cross River State, Nigeria. One verified home at a time.
           </p>
           <div className="flex items-center justify-center gap-8 py-8">
              <Link href="/marketplace" className="text-sm font-bold text-muted-foreground hover:text-primary">Marketplace</Link>
              <Link href="/guides" className="text-sm font-bold text-muted-foreground hover:text-primary">Vibe Guides</Link>
              <Link href="/matches" className="text-sm font-bold text-muted-foreground hover:text-primary">Smart Matches</Link>
           </div>
           <p className="text-xs text-muted-foreground/50 pb-8">© 2024 RentaFast. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}

import { Badge } from '@/components/ui/badge';
