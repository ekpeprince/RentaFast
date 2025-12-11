'use client';

import Link from 'next/link';
import { Bell, PlusCircle } from 'lucide-react';
import { useUser, useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

function UserGreeting() {
  const { user, isUserLoading } = useUser();

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

  return (
    <div className="flex items-center gap-4">
      <Link href="/account">
        <Avatar className="h-12 w-12 cursor-pointer">
          <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
          <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
        </Avatar>
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-primary">Hello, {user.displayName || 'User'} 👋</h1>
        <p className="text-muted-foreground">Let's find your new home.</p>
      </div>
    </div>
  );
}

function AuthActions() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userProfileRef = user ? doc(firestore, 'users', user.uid) : null;
  const { data: userProfile } = useDoc<{ role: 'landlord' | 'tenant' }>(userProfileRef);

  if (isUserLoading) {
    return <Skeleton className="h-10 w-24" />;
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
    <div className="flex items-center gap-2">
      {userProfile?.role === 'landlord' && (
        <Button asChild variant="accent">
          <Link href="/new-listing">
            <PlusCircle className="mr-2 h-4 w-4" />
            List a Property
          </Link>
        </Button>
      )}
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-6 w-6 text-primary" />
        <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent"></span>
        </span>
        <span className="sr-only">View notifications</span>
      </Button>
    </div>
  );
}

export default function HomeHeader() {
  return (
    <header className="flex items-center justify-between">
      <UserGreeting />
      <AuthActions />
    </header>
  );
}
