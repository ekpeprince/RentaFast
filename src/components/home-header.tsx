'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, PlusCircle, LayoutDashboard, MessageSquare, Heart, ShieldCheck, ClipboardList, Map as MapIcon, Sparkles, LogOut, User as UserIcon, Building2 } from 'lucide-react';
import { useUser, useDoc, useFirestore, useMemoFirebase, useAuth } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
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

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <Button asChild variant="ghost" size="icon" title="Marketplace" className="text-primary hover:bg-primary/5">
        <Link href="/marketplace">
          <Building2 className="h-5 w-5" />
        </Link>
      </Button>

      <Button asChild variant="ghost" size="icon" title="Neighborhood Vibe Guides" className="text-accent hover:bg-accent/10">
        <Link href="/guides">
          <MapIcon className="h-5 w-5" />
        </Link>
      </Button>
      
      {userProfile?.role === 'tenant' && (
        <Button asChild variant="ghost" size="icon" title="AI Home Matcher" className="text-accent hover:bg-accent/10">
          <Link href="/matches">
            <Sparkles className="h-5 w-5" />
          </Link>
        </Button>
      )}

      {userProfile?.role === 'admin' && (
        <Button asChild variant="ghost" size="icon" title="Admin Portal" className="text-accent hover:bg-accent/10">
          <Link href="/admin">
            <ShieldCheck className="h-5 w-5" />
          </Link>
        </Button>
      )}

      <Button asChild variant="ghost" size="icon" title="Saved Properties" className="hover:bg-primary/5">
        <Link href="/favorites">
          <Heart className="h-5 w-5 text-primary" />
        </Link>
      </Button>

      {(userProfile?.role === 'landlord' || userProfile?.role === 'admin') && (
        <>
          <Button asChild variant="ghost" size="icon" title="Leads Dashboard" className="hover:bg-primary/5">
            <Link href="/leads">
              <ClipboardList className="h-5 w-5 text-primary" />
            </Link>
          </Button>
          <Button asChild variant="accent" size="sm" className="hidden sm:flex font-bold shadow-sm">
            <Link href="/new-listing">
              <PlusCircle className="mr-2 h-4 w-4" />
              List Home
            </Link>
          </Button>
        </>
      )}

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
    </div>
  );
}

export default function HomeHeader() {
  return (
    <header className="flex items-center justify-between gap-4 py-4 border-b mb-6">
      <UserGreeting />
      <AuthActions />
    </header>
  );
}