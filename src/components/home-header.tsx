'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, PlusCircle, LayoutDashboard, MessageSquare, Heart, ShieldCheck, ClipboardList, Map as MapIcon, Sparkles, LogOut, User as UserIcon, Building2, Menu } from 'lucide-react';
import { useUser, useDoc, useFirestore, useMemoFirebase, useAuth } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { UserProfile } from '@/lib/types';

function UserGreeting() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();

  const profileRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: profile } = useDoc<UserProfile>(profileRef);

  if (isUserLoading) {
    return <Skeleton className="h-10 w-40" />;
  }

  if (!user) {
    return (
      <Link href="/" className="flex flex-col group">
        <h1 className="text-2xl font-black text-primary leading-none transition-colors group-hover:text-accent">RentaFast</h1>
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Cross River Marketplace</p>
      </Link>
    );
  }

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.push('/');
    } catch (error) {
      console.warn('Error signing out:', error);
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return names[0][0] + names[names.length - 1][0];
    }
    return name[0];
  };

  const emailPrefix = user.email?.split('@')[0] || 'User';
  const rawDisplayName = profile?.displayName || user.displayName || emailPrefix;
  const greetingName = rawDisplayName.split(' ')[0];
  const capitalizedGreetingName = greetingName.charAt(0).toUpperCase() + greetingName.slice(1);

  return (
    <div className="flex items-center gap-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="h-10 w-10 cursor-pointer border-2 border-primary/10 transition-transform hover:scale-105">
            <AvatarImage src={user.photoURL ?? ''} alt={rawDisplayName} />
            <AvatarFallback className="bg-secondary text-primary font-bold">{getInitials(rawDisplayName)}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{rawDisplayName}</p>
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/account" className="flex items-center cursor-pointer">
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Profile Settings</span>
            </Link>
          </DropdownMenuItem>
          {profile?.role === 'landlord' && (
            <DropdownMenuItem asChild>
              <Link href="/my-listings" className="flex items-center cursor-pointer">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>My Listings</span>
              </Link>
            </DropdownMenuItem>
          )}
          {profile?.role === 'admin' && (
            <DropdownMenuItem asChild>
              <Link href="/admin" className="flex items-center cursor-pointer">
                <ShieldCheck className="mr-2 h-4 w-4 text-accent" />
                <span>Admin Portal</span>
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <div className="hidden md:block">
        <h1 className="text-lg font-black text-primary leading-tight">Hello, {capitalizedGreetingName} 👋</h1>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Cross River Home Hunter</p>
      </div>
    </div>
  );
}

function AuthActions() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();

  const userProfileRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  if (isUserLoading) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="hidden sm:flex font-bold">
          <Link href="/marketplace">Marketplace</Link>
        </Button>
        <Button asChild variant="ghost" size="sm" className="hidden sm:flex">
          <Link href="/guides">Vibe Guides</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/login">Log In</Link>
        </Button>
        <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
          <Link href="/signup">Sign Up</Link>
        </Button>
      </div>
    );
  }

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.push('/');
    } catch (error) {
      console.warn('Error signing out:', error);
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return names[0][0] + names[names.length - 1][0];
    }
    return name[0];
  };

  const emailPrefix = user.email?.split('@')[0] || 'User';
  const rawDisplayName = userProfile?.displayName || user.displayName || emailPrefix;

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {/* Desktop navigation buttons */}
      <Button asChild variant="ghost" size="icon" title="Marketplace" className="hidden md:inline-flex text-primary hover:bg-primary/5">
        <Link href="/marketplace">
          <Building2 className="h-5 w-5" />
        </Link>
      </Button>

      <Button asChild variant="ghost" size="icon" title="Neighborhood Vibe Guides" className="hidden md:inline-flex text-accent hover:bg-accent/10">
        <Link href="/guides">
          <MapIcon className="h-5 w-5" />
        </Link>
      </Button>
      
      {userProfile?.role === 'tenant' && (
        <Button asChild variant="ghost" size="icon" title="AI Home Matcher" className="hidden md:inline-flex text-accent hover:bg-accent/10">
          <Link href="/matches">
            <Sparkles className="h-5 w-5" />
          </Link>
        </Button>
      )}

      {userProfile?.role === 'admin' && (
        <Button asChild variant="ghost" size="icon" title="Admin Portal" className="hidden md:inline-flex text-accent hover:bg-accent/10">
          <Link href="/admin">
            <ShieldCheck className="h-5 w-5" />
          </Link>
        </Button>
      )}

      <Button asChild variant="ghost" size="icon" title="Saved Properties" className="hidden md:inline-flex hover:bg-primary/5">
        <Link href="/favorites">
          <Heart className="h-5 w-5 text-primary" />
        </Link>
      </Button>

      {(userProfile?.role === 'landlord' || userProfile?.role === 'admin') && (
        <>
          <Button asChild variant="ghost" size="icon" title="Leads Dashboard" className="hidden md:inline-flex hover:bg-primary/5">
            <Link href="/leads">
              <ClipboardList className="h-5 w-5 text-primary" />
            </Link>
          </Button>
          <Button asChild variant="accent" size="sm" className="hidden md:inline-flex font-bold shadow-sm">
            <Link href="/new-listing">
              <PlusCircle className="mr-2 h-4 w-4" />
              List Home
            </Link>
          </Button>
        </>
      )}

      {/* Real-time core actions (always visible) */}
      <Button asChild variant="ghost" size="icon" title="Messages" className="hover:bg-primary/5">
        <Link href="/messages">
          <MessageSquare className="h-5 w-5 text-primary" />
        </Link>
      </Button>

      <Button variant="ghost" size="icon" className="relative hover:bg-primary/5">
        <Bell className="h-5 w-5 text-primary" />
        <span className="absolute top-2 right-2 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
        </span>
      </Button>

      {/* Mobile navigation sliding drawer */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden hover:bg-primary/5 text-primary" title="Navigation Menu">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[280px] sm:w-[320px] flex flex-col justify-between p-6 bg-background/95 backdrop-blur-md border-l">
          <div className="space-y-6">
            <SheetHeader className="text-left border-b pb-4">
              <SheetTitle className="text-2xl font-black text-primary tracking-tight">RentaFast</SheetTitle>
              <div className="flex items-center gap-3 mt-4">
                <Avatar className="h-10 w-10 border-2 border-primary/10">
                  <AvatarImage src={user.photoURL ?? ''} alt={rawDisplayName} />
                  <AvatarFallback className="bg-secondary text-primary font-bold">{getInitials(rawDisplayName)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-primary truncate">{rawDisplayName}</span>
                  <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                </div>
              </div>
            </SheetHeader>

            <nav className="flex flex-col gap-1.5 pt-2">
              <Button asChild variant="ghost" className="justify-start h-11 px-3 rounded-lg text-primary font-bold hover:bg-primary/5 hover:text-primary transition-all">
                <Link href="/marketplace">
                  <Building2 className="mr-3 h-4 w-4" />
                  Browse Marketplace
                </Link>
              </Button>

              <Button asChild variant="ghost" className="justify-start h-11 px-3 rounded-lg text-accent font-bold hover:bg-accent/5 hover:text-accent transition-all">
                <Link href="/guides">
                  <MapIcon className="mr-3 h-4 w-4" />
                  Neighborhood Guides
                </Link>
              </Button>

              {userProfile?.role === 'tenant' && (
                <Button asChild variant="ghost" className="justify-start h-11 px-3 rounded-lg text-accent font-bold hover:bg-accent/5 hover:text-accent transition-all">
                  <Link href="/matches">
                    <Sparkles className="mr-3 h-4 w-4" />
                    AI Home Matcher
                  </Link>
                </Button>
              )}

              {userProfile?.role === 'admin' && (
                <Button asChild variant="ghost" className="justify-start h-11 px-3 rounded-lg text-accent font-bold hover:bg-accent/5 hover:text-accent transition-all">
                  <Link href="/admin">
                    <ShieldCheck className="mr-3 h-4 w-4 text-accent" />
                    Admin Portal
                  </Link>
                </Button>
              )}

              <Button asChild variant="ghost" className="justify-start h-11 px-3 rounded-lg text-primary font-bold hover:bg-primary/5 hover:text-primary transition-all">
                <Link href="/favorites">
                  <Heart className="mr-3 h-4 w-4 text-primary" />
                  Saved Properties
                </Link>
              </Button>

              {(userProfile?.role === 'landlord' || userProfile?.role === 'admin') && (
                <>
                  <Button asChild variant="ghost" className="justify-start h-11 px-3 rounded-lg text-primary font-bold hover:bg-primary/5 hover:text-primary transition-all">
                    <Link href="/leads">
                      <ClipboardList className="mr-3 h-4 w-4 text-primary" />
                      Leads Dashboard
                    </Link>
                  </Button>
                  <Button asChild variant="accent" className="justify-start h-11 px-3 rounded-lg font-bold shadow-sm mt-1">
                    <Link href="/new-listing">
                      <PlusCircle className="mr-3 h-4 w-4" />
                      List a New Home
                    </Link>
                  </Button>
                </>
              )}

              <div className="border-t my-2" />

              <Button asChild variant="ghost" className="justify-start h-11 px-3 rounded-lg text-primary font-bold hover:bg-primary/5 hover:text-primary transition-all">
                <Link href="/account">
                  <UserIcon className="mr-3 h-4 w-4" />
                  Profile Settings
                </Link>
              </Button>
            </nav>
          </div>

          <div className="border-t pt-4">
            <Button onClick={handleSignOut} variant="ghost" className="w-full justify-start h-11 px-3 rounded-lg text-destructive hover:bg-destructive/5 hover:text-destructive font-bold transition-all">
              <LogOut className="mr-3 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function HomeHeader({ showBorder = true }: { showBorder?: boolean }) {
  return (
    <header className={cn(
      "flex items-center justify-between gap-4 py-4 w-full",
      showBorder && "border-b mb-6"
    )}>
      <UserGreeting />
      <AuthActions />
    </header>
  );
}