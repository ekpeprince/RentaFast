'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ShieldAlert, UserCheck, UserX, Loader2, ArrowLeft, Search, ExternalLink, Check, X } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import type { UserProfile } from '@/lib/types';

export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Get current user's profile to verify admin status
  const currentUserRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: currentUserProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(currentUserRef);

  // 2. Fetch all landlords for verification
  // CRITICAL: Only fire the list query once we know the current user is an admin
  const landlordsQuery = useMemoFirebase(
    () => (firestore && currentUserProfile?.role === 'admin' ? query(collection(firestore, 'users'), where('role', '==', 'landlord')) : null),
    [firestore, currentUserProfile?.role]
  );
  const { data: users, isLoading: isUsersLoading } = useCollection<UserProfile>(landlordsQuery);

  useEffect(() => {
    if (!isUserLoading && !isProfileLoading) {
      if (!user) {
        router.push('/login');
      } else if (currentUserProfile?.role !== 'admin') {
        toast({
          variant: 'destructive',
          title: 'Access Denied',
          description: 'You do not have permission to view the admin portal.',
        });
        router.push('/');
      }
    }
  }, [user, isUserLoading, isProfileLoading, currentUserProfile, router, toast]);

  const handleVerify = (targetUser: UserProfile) => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', targetUser.id);
    updateDocumentNonBlocking(userRef, { 
      isVerified: true, 
      verificationStatus: 'verified' 
    });
    toast({
      title: 'Landlord Verified',
      description: `${targetUser.displayName || targetUser.id} is now a verified agent.`,
    });
  };

  const handleReject = (targetUser: UserProfile) => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', targetUser.id);
    updateDocumentNonBlocking(userRef, { 
      isVerified: false, 
      verificationStatus: 'rejected' 
    });
    toast({
      variant: 'destructive',
      title: 'Verification Rejected',
      description: `Rejected verification request for ${targetUser.displayName || targetUser.id}.`,
    });
  };

  const filteredUsers = users?.filter(u => 
    (u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     u.id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="container mx-auto p-8 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Verifying admin access...</p>
      </div>
    );
  }

  if (currentUserProfile?.role !== 'admin') {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Button asChild variant="ghost" className="-ml-2 mb-2">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Marketplace
            </Link>
          </Button>
          <h1 className="text-3xl font-extrabold text-primary flex items-center gap-3">
            Admin Verification Portal
            <ShieldCheck className="h-8 w-8 text-accent" />
          </h1>
          <p className="text-muted-foreground">Manage and verify landlord profiles to build marketplace trust in Cross River.</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="shadow-md">
          <CardHeader className="pb-3">
            <CardTitle>Landlord Registry</CardTitle>
            <CardDescription>Search and review verification documents from registered landlords.</CardDescription>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name or ID..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {isUsersLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : filteredUsers && filteredUsers.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-muted text-muted-foreground text-sm font-medium">
                    <tr>
                      <th className="px-4 py-3">Landlord Name</th>
                      <th className="px-4 py-3">Document</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredUsers.map((targetUser) => (
                      <tr key={targetUser.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-4">
                          <div className="font-bold">{targetUser.displayName || 'Unnamed Landlord'}</div>
                          <div className="text-xs text-muted-foreground font-mono">{targetUser.id}</div>
                        </td>
                        <td className="px-4 py-4">
                          {targetUser.verificationDocUrl ? (
                            <Button variant="outline" size="sm" asChild>
                              <a href={targetUser.verificationDocUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3.5 w-3.5 mr-2" />
                                View Doc
                              </a>
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">No doc uploaded</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {targetUser.isVerified ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-none flex w-fit items-center gap-1">
                              <UserCheck className="h-3 w-3" /> Verified
                            </Badge>
                          ) : targetUser.verificationStatus === 'pending' ? (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-none flex w-fit items-center gap-1">
                              <Clock className="h-3 w-3" /> Pending
                            </Badge>
                          ) : targetUser.verificationStatus === 'rejected' ? (
                            <Badge variant="destructive" className="flex w-fit items-center gap-1">
                              <UserX className="h-3 w-3" /> Rejected
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground flex w-fit items-center gap-1">
                              Unverified
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleReject(targetUser)}
                              disabled={targetUser.verificationStatus === 'rejected'}
                              className="text-destructive hover:bg-destructive/10"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => handleVerify(targetUser)}
                              disabled={targetUser.isVerified}
                              className="bg-accent hover:bg-accent/90"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-semibold">No landlords found</p>
                <p className="text-muted-foreground">Refine your search or wait for new registrations.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}