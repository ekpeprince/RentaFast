
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardList, MessageSquare, ArrowLeft, User, Calendar, Loader2 } from 'lucide-react';
import type { Application, UserProfile } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function LeadsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  // 1. Verify landlord status
  const profileRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: profile, isLoading: isProfileLoading } = useDoc<UserProfile>(profileRef);

  // 2. Fetch leads (applications where user is landlord)
  const leadsQuery = useMemoFirebase(
    () => (firestore && user ? query(
      collection(firestore, 'applications'), 
      where('landlordId', '==', user.uid),
      orderBy('createdAt', 'desc')
    ) : null),
    [firestore, user?.uid]
  );
  const { data: leads, isLoading: isLeadsLoading } = useCollection<Application>(leadsQuery);

  useEffect(() => {
    if (!isUserLoading && !isProfileLoading) {
      if (!user) {
        router.push('/login');
      } else if (profile?.role !== 'landlord' && profile?.role !== 'admin') {
        toast({
          variant: 'destructive',
          title: 'Access Denied',
          description: 'Only landlords can view the leads dashboard.',
        });
        router.push('/');
      }
    }
  }, [user, isUserLoading, isProfileLoading, profile, router, toast]);

  const handleUpdateStatus = (leadId: string, newStatus: Application['status']) => {
    if (!firestore) return;
    const leadRef = doc(firestore, 'applications', leadId);
    updateDocumentNonBlocking(leadRef, { status: newStatus });
    toast({
      title: 'Status Updated',
      description: `Lead status is now ${newStatus}.`,
    });
  };

  const getStatusBadge = (status: Application['status']) => {
    switch (status) {
      case 'Pending': return <Badge variant="secondary">Pending</Badge>;
      case 'Reviewing': return <Badge variant="outline" className="text-blue-500 border-blue-500">Reviewing</Badge>;
      case 'Tour Scheduled': return <Badge variant="accent">Tour Scheduled</Badge>;
      case 'Accepted': return <Badge className="bg-green-500 hover:bg-green-600">Accepted</Badge>;
      case 'Rejected': return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="container mx-auto p-8 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading leads...</p>
      </div>
    );
  }

  if (profile?.role !== 'landlord' && profile?.role !== 'admin') return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <Button asChild variant="ghost" className="-ml-2 mb-2">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
        <h1 className="text-3xl font-extrabold text-primary flex items-center gap-3">
          Leads Dashboard
          <ClipboardList className="h-8 w-8 text-accent" />
        </h1>
        <p className="text-muted-foreground">Track and manage your incoming rental applications.</p>
      </div>

      <div className="grid gap-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
            <CardDescription>View tenant details, move-in dates, and update application status.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLeadsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-lg" />
                ))}
              </div>
            ) : leads && leads.length > 0 ? (
              <div className="grid gap-4">
                {leads.map((lead) => (
                  <div key={lead.id} className="group p-4 rounded-xl border bg-card hover:bg-muted/30 transition-all shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-primary">{lead.tenantName}</h3>
                          {getStatusBadge(lead.status)}
                        </div>
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                          Interested in: <span className="text-foreground">{lead.propertyTitle}</span>
                        </p>
                        <div className="flex flex-wrap gap-4 pt-2">
                           <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>Move-in: {lead.moveInDate}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <User className="h-3.5 w-3.5" />
                            <span>Occupants: {lead.occupants}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Select 
                          value={lead.status} 
                          onValueChange={(val: Application['status']) => handleUpdateStatus(lead.id, val)}
                        >
                          <SelectTrigger className="w-[180px] h-10">
                            <SelectValue placeholder="Update Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Reviewing">Reviewing</SelectItem>
                            <SelectItem value="Tour Scheduled">Tour Scheduled</SelectItem>
                            <SelectItem value="Accepted">Accepted</SelectItem>
                            <SelectItem value="Rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button asChild variant="outline" size="icon" className="h-10 w-10" title="Open Chat">
                          <Link href={`/messages`}>
                            <MessageSquare className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 border-2 border-dashed rounded-xl">
                <ClipboardList className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                <h3 className="text-xl font-bold">No applications yet</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  When tenants use the "Rent Now" button on your listings, their applications will appear here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
