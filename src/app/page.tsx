
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
    <main className="h-screen relative flex flex-col overflow-hidden bg-background">
      {/* Background Image with Global Overlay */}
      <div className="absolute inset-0 z-0">
        <Image 
          src={heroImage} 
          alt="Luxury home in Calabar" 
          fill 
          className="object-cover brightness-[0.5]"
          priority
          data-ai-hint="luxury villa"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
      </div>

      {/* Header Area - Subtle glass effect */}
      <div className="relative z-20 w-full bg-white/5 border-b border-white/10 shrink-0">
        <div className="container mx-auto px-4 py-2 sm:px-6 lg:px-8">
          <HomeHeader />
        </div>
      </div>

      {/* Hero Content Area */}
      <div className="flex-1 relative z-10 flex flex-col justify-center overflow-hidden">
        <div className="container px-4 mx-auto text-center space-y-6">
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Badge className="bg-accent text-white border-none px-4 py-1.5 text-xs font-bold uppercase tracking-widest shadow-lg">
              Now Live in Cross River
            </Badge>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-none text-white drop-shadow-2xl">
              Rent Smarter in <br/><span className="text-accent">Cross River State</span>
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto font-medium leading-relaxed drop-shadow-md">
              Find verified homes in Calabar, Ikom, and Ogoja with AI matching and local neighborhood vibe checks.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Button asChild size="lg" className="h-14 px-10 text-lg font-bold rounded-full shadow-2xl transition-transform hover:scale-105 active:scale-95 bg-primary hover:bg-primary/90">
              <Link href="/marketplace">
                <Search className="mr-2 h-5 w-5" />
                Browse Marketplace
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-14 px-10 text-lg font-bold rounded-full bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white transition-transform hover:scale-105 active:scale-95">
              <Link href="/guides">
                Explore Neighborhoods
              </Link>
            </Button>
          </div>

          {/* Quick Stats/Features */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-6">
             <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-black/40 text-[10px] sm:text-xs font-bold text-white shadow-xl">
               <ShieldCheck className="h-4 w-4 text-accent" /> 100% Verified
             </div>
             <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-black/40 text-[10px] sm:text-xs font-bold text-white shadow-xl">
               <Zap className="h-4 w-4 text-accent" /> Direct Contact
             </div>
             <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-black/40 text-[10px] sm:text-xs font-bold text-white shadow-xl">
               <Sparkles className="h-4 w-4 text-accent" /> AI Home Matcher
             </div>
          </div>
        </div>

        {/* Value Props - Removed blur to sharpen appearance */}
        <div className="container mx-auto px-4 mt-auto pb-8 hidden lg:block">
          <div className="grid grid-cols-3 gap-6">
            <Link href="/guides" className="group p-5 rounded-3xl bg-black/40 border border-white/10 hover:bg-black/60 transition-all flex items-start gap-4 shadow-2xl">
              <div className="h-12 w-12 shrink-0 rounded-2xl bg-primary/20 flex items-center justify-center text-accent">
                <MapPin className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-white">Vibe Guides</h3>
                <p className="text-[11px] text-white/70 leading-tight">Get an instant vibe check on local neighborhoods.</p>
              </div>
            </Link>

            <Link href="/matches" className="group p-5 rounded-3xl bg-black/40 border border-white/10 hover:bg-black/60 transition-all flex items-start gap-4 shadow-2xl">
              <div className="h-12 w-12 shrink-0 rounded-2xl bg-accent/20 flex items-center justify-center text-accent">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-white">Smart Matcher</h3>
                <p className="text-[11px] text-white/70 leading-tight">AI finds the perfect home based on your needs.</p>
              </div>
            </Link>

            <Link href="/new-listing" className="group p-5 rounded-3xl bg-black/40 border border-white/10 hover:bg-black/60 transition-all flex items-start gap-4 shadow-2xl">
              <div className="h-12 w-12 shrink-0 rounded-2xl bg-green-500/20 flex items-center justify-center text-green-400">
                <Building className="h-6 w-6" />
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
      <footer className="py-4 border-t border-white/10 bg-black/60 shrink-0 text-center relative z-20">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <p className="text-[10px] font-black text-white uppercase tracking-widest">RentaFast Cross River</p>
          <div className="hidden sm:flex gap-6 text-[10px] font-bold text-white/60 uppercase tracking-tighter">
             <Link href="/marketplace" className="hover:text-accent">Marketplace</Link>
             <Link href="/guides" className="hover:text-accent">Vibe Guides</Link>
             <Link href="/matches" className="hover:text-accent">Smart Match</Link>
          </div>
          <p className="text-[10px] text-white/40">© 2024</p>
        </div>
      </footer>
    </main>
  );
}
