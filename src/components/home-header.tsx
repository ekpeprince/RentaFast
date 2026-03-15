
'use client';

import Link from 'next/link';
import { Bell, PlusCircle, LayoutDashboard, MessageSquare } from 'lucide-react';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserProfile } from '@/lib/types';

function UserGreeting() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const profileRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: profile } = useDoc<UserProfile>(profileRef);

  if (isUserLoading) {
    return <Skeleton className="h-8 w-48" />;
  }

  if (!user) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-primary">Welcome to RentaFast</h1>
        <p className="text-muted-foreground">Let's find your new home.</p>
      </div>
    );
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return names[0][0] + names[names.length - 1][0];
    }
    return name[0];
  };

  const displayName = profile?.displayName || user.displayName || 'User';

  return (
    <div className="flex items-center gap-4">
      <Link href="/account">
        <Avatar className="h-12 w-12 cursor-pointer border-2 border-primary/10">
          <AvatarImage src={user.photoURL ?? ''} alt={displayName} />
          <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="hidden sm:block">
        <h1 className="text-xl font-bold text-primary">Hello, {displayName} 👋</h1>
        <p className="text-sm text-muted-foreground">Find your next home.</p>
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
        <Button asChild variant="outline">
          <Link href="/login">Log In</Link>
        </Button>
        <Button asChild>
          <Link href="/signup">Sign Up</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {userProfile?.role === 'landlord' && (
        <>
          <Button asChild variant="ghost" size="icon" className="hidden sm:flex" title="My Listings">
            <Link href="/my-listings">
              <LayoutDashboard className="h-5 w-5 text-primary" />
            </Link>
          </Button>
          <Button asChild variant="accent" size="sm" className="hidden sm:flex">
            <Link href="/new-listing">
              <PlusCircle className="mr-2 h-4 w-4" />
              List
            </Link>
          </Button>
        </>
      )}
      <Button asChild variant="ghost" size="icon" title="Messages">
        <Link href="/messages">
          <MessageSquare className="h-5 w-5 text-primary" />
        </Link>
      </Button>
      <Button variant="ghost" size="icon" className="relative">
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
    <header className="flex items-center justify-between gap-4 py-2">
      <UserGreeting />
      <AuthActions />
    </header>
  );
}
