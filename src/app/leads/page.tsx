
'use client';

import { useEffect, useState, useMemo } from 'react';
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
import { 
  ClipboardList, 
  MessageSquare, 
  ArrowLeft, 
  User, 
  Calendar, 
  Loader2, 
  TrendingUp, 
  Eye, 
  Heart, 
  Briefcase, 
  MapPin, 
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { Application, UserProfile, Property } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from 'recharts';

function TenantResume({ tenantId }: { tenantId: string }) {
  const firestore = useFirestore();
  const tenantRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'users', tenantId) : null),
    [firestore, tenantId]
  );
  const { data: profile, isLoading } = useDoc<UserProfile>(tenantRef);
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading) return <Skeleton className="h-4 w-32" />;
  if (!profile) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full mt-3">
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2 text-accent flex items-center gap-1.5 hover:text-accent hover:bg-accent/5">
          <Info className="h-3.5 w-3.5" />
          {isOpen ? 'Hide Renter Resume' : 'View Renter Resume'}
          {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50 border">
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Occupation</p>
            <p className="text-sm font-semibold flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-primary" />
              {profile.occupation || 'Not specified'}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Current Location</p>
            <p className="text-sm font-semibold flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              {profile.residentCity || 'Not specified'}
            </p>
          </div>
          {profile.aboutMe && (
            <div className="col-span-full space-y-1">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">About the Tenant</p>
              <p className="text-sm text-muted-foreground italic leading-relaxed">
                "{profile.aboutMe}"
              </p>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

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
  // Guarded by profile role check and loading state to prevent unauthorized listing attempts
  const leadsQuery = useMemoFirebase(
    () => (firestore && user && profile && (profile.role === 'landlord' || profile.role === 'admin') ? query(
      collection(firestore, 'applications'), 
      where('landlordId', '==', user.uid),
      orderBy('createdAt', 'desc')
    ) : null),
    [firestore, user?.uid, profile]
  );
  const { data: leads, isLoading: isLeadsLoading, error: leadsError } = useCollection<Application>(leadsQuery);

  // 3. Fetch landlord's properties for performance insights
  const propertiesQuery = useMemoFirebase(
    () => (firestore && user && profile && (profile.role === 'landlord' || profile.role === 'admin') ? query(
      collection(firestore, 'properties'),
      where('landlordId', '==', user.uid)
    ) : null),
    [firestore, user?.uid, profile]
  );
  const { data: properties, isLoading: isPropertiesLoading } = useCollection<Property>(propertiesQuery);

  useEffect(() => {
    if (!isUserLoading && !isProfileLoading) {
      if (!user) {
        router.push('/login');
      } else if (profile && profile.role !== 'landlord' && profile.role !== 'admin') {
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

  const chartData = useMemo(() => {
    if (!properties) return [];
    return properties.map(p => ({
      name: p.title.length > 15 ? p.title.substring(0, 12) + '...' : p.title,
      views: p.viewCount || 0,
      favorites: p.favoriteCount || 0,
    })).sort((a, b) => b.views - a.views).slice(0, 5);
  }, [properties]);

  const totalStats = useMemo(() => {
    if (!properties) return { views: 0, favs: 0 };
    return properties.reduce((acc, p) => ({
      views: acc.views + (p.viewCount || 0),
      favs: acc.favs + (p.favoriteCount || 0)
    }), { views: 0, favs: 0 });
  }, [properties]);

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

  // If we have an error and we are not loading, it's likely a permission issue
  if (leadsError && !isLeadsLoading) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h2 className="text-xl font-bold text-destructive">Dashboard Error</h2>
        <p className="text-muted-foreground mt-2">There was a problem loading your leads. Please refresh the page or contact support.</p>
        <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  if (!profile || (profile.role !== 'landlord' && profile.role !== 'admin')) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
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
          <p className="text-muted-foreground">Track engagement and manage your Cross River rental applications.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-accent" />
                  Market Performance
                </CardTitle>
                <CardDescription>Views vs. Favorites for your top listings.</CardDescription>
              </div>
              <div className="flex gap-4">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Views</p>
                  <p className="text-xl font-bold text-primary">{totalStats.views}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Favorites</p>
                  <p className="text-xl font-bold text-accent">{totalStats.favs}</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {isPropertiesLoading ? (
                <Skeleton className="h-full w-full" />
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background border rounded-lg p-3 shadow-xl">
                              <p className="font-bold mb-2">{payload[0].payload.name}</p>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm">
                                  <div className="w-3 h-3 bg-primary rounded-sm" />
                                  <span className="text-muted-foreground">Views:</span>
                                  <span className="font-bold">{payload[0].value}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <div className="w-3 h-3 bg-accent rounded-sm" />
                                  <span className="text-muted-foreground">Favorites:</span>
                                  <span className="font-bold">{payload[1].value}</span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="views" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={32} />
                    <Bar dataKey="favorites" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center border-2 border-dashed rounded-xl">
                  <TrendingUp className="h-10 w-10 text-muted-foreground mb-2 opacity-20" />
                  <p className="text-muted-foreground">No property data available yet.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Insights</CardTitle>
            <CardDescription>Overview of listing activity.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Eye className="h-4 w-4" /> Average Views
                </span>
                <span className="font-bold">
                  {properties?.length ? Math.round(totalStats.views / properties.length) : 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Heart className="h-4 w-4" /> Average Favs
                </span>
                <span className="font-bold">
                  {properties?.length ? (totalStats.favs / properties.length).toFixed(1) : 0}
                </span>
              </div>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm font-bold text-primary mb-1">Market Tip</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Properties with high views but low applications might need a better price or more detailed description. Try using 'Magic Write' to improve your listing.
              </p>
            </div>
          </CardContent>
        </Card>
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
                    <div className="flex flex-col gap-1">
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
                      
                      {/* Integrated Renter Resume */}
                      <TenantResume tenantId={lead.tenantId} />
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
