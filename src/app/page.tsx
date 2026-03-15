'use client';

import Link from 'next/link';
import HomeHeader from '@/components/home-header';
import { Button } from '@/components/ui/button';
import { MapPin, Sparkles, ShieldCheck, Building, Zap, Search } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Badge } from '@/components/ui/badge';

export default function Home() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'calabar-villa')?.imageUrl || '';

  return (
    <main className="h-screen flex flex-col overflow-hidden bg-background">
      <div className="container mx-auto px-4 py-2 sm:px-6 lg:px-8 shrink-0">
        <HomeHeader />
      </div>

      <div className="flex-1 relative flex flex-col justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <Image 
            src={heroImage} 
            alt="Luxury home in Calabar" 
            fill 
            className="object-cover brightness-[0.4]"
            priority
            data-ai-hint="luxury villa"
          />
          {/* Sharper overlay to prevent 'blurry' look at the bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
        </div>

        {/* Hero Content */}
        <div className="container relative z-10 px-4 mx-auto text-center space-y-6">
          <div className="space-y-3">
            <Badge className="bg-accent text-white border-none px-4 py-1 text-xs font-bold uppercase tracking-widest">
              Now Live in Cross River
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-none text-white">
              Rent Smarter in <br/><span className="text-accent">Cross River State</span>
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto font-medium leading-relaxed">
              Find verified homes in Calabar, Ikom, and Ogoja with AI matching and local neighborhood vibe checks.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="h-14 px-8 text-lg font-bold rounded-full shadow-2xl transition-transform hover:scale-105 active:scale-95">
              <Link href="/marketplace">
                <Search className="mr-2 h-5 w-5" />
                Browse Marketplace
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg font-bold rounded-full bg-white/10 border-white/40 text-white hover:bg-white/20 hover:text-white transition-transform hover:scale-105 active:scale-95">
              <Link href="/guides">
                Explore Neighborhoods
              </Link>
            </Button>
          </div>

          {/* Quick Stats/Features */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/20 bg-black/60 text-[10px] sm:text-xs font-bold text-white">
               <ShieldCheck className="h-4 w-4 text-accent" /> 100% Verified
             </div>
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/20 bg-black/60 text-[10px] sm:text-xs font-bold text-white">
               <Zap className="h-4 w-4 text-accent" /> Direct Contact
             </div>
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/20 bg-black/60 text-[10px] sm:text-xs font-bold text-white">
               <Sparkles className="h-4 w-4 text-accent" /> AI Home Matcher
             </div>
          </div>
        </div>

        {/* Minimized Value Props (Footer-aligned) - Removed backdrop-blur for clarity */}
        <div className="container mx-auto px-4 mt-auto pb-8 relative z-10 hidden md:block">
          <div className="grid grid-cols-3 gap-6">
            <Link href="/guides" className="group p-4 rounded-2xl bg-black/40 border border-white/10 hover:bg-black/60 transition-all flex items-start gap-4">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/20 flex items-center justify-center text-accent">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-white">Vibe Guides</h3>
                <p className="text-[11px] text-white/70 leading-tight">Get an instant vibe check on local neighborhoods.</p>
              </div>
            </Link>

            <Link href="/matches" className="group p-4 rounded-2xl bg-black/40 border border-white/10 hover:bg-black/60 transition-all flex items-start gap-4">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-white">Smart Matcher</h3>
                <p className="text-[11px] text-white/70 leading-tight">AI finds the perfect home based on your needs.</p>
              </div>
            </Link>

            <Link href="/new-listing" className="group p-4 rounded-2xl bg-black/40 border border-white/10 hover:bg-black/60 transition-all flex items-start gap-4">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400">
                <Building className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-white">List Property</h3>
                <p className="text-[11px] text-white/70 leading-tight">Reach verified tenants in Calabar & Ikom.</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Ultra-compact Footer */}
      <footer className="py-3 border-t bg-background shrink-0 text-center">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <p className="text-[10px] font-black text-primary uppercase tracking-widest">RentaFast Cross River</p>
          <div className="flex gap-4 text-[10px] font-bold text-muted-foreground/60 uppercase">
             <span>Marketplace</span>
             <span>Vibe Guides</span>
             <span>Smart Match</span>
          </div>
          <p className="text-[10px] text-muted-foreground/40">© 2024</p>
        </div>
      </footer>
    </main>
  );
}
