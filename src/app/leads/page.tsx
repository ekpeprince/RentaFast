'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, orderBy, doc, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
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

  // 1. Fetch current user's profile to confirm role
  const profileRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: profile, isLoading: isProfileLoading } = useDoc<UserProfile>(profileRef);

  // 2. Fetch leads ONLY if profile is loaded and user is authorized
  const leadsQuery = useMemoFirebase(
    () => {
      // Wait for everything to be ready
      if (!firestore || !user || isProfileLoading || !profile) return null;
      
      const applicationsRef = collection(firestore, 'applications');
      
      // Admins see everything
      if (profile.role === 'admin') {
        return query(applicationsRef, orderBy('createdAt', 'desc'));
      }
      
      // Landlords see ONLY their own, MUST use the filter to satisfy security rules
      if (profile.role === 'landlord') {
        return query(
          applicationsRef, 
          where('landlordId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
      }
      
      return null;
    },
    [firestore, user?.uid, profile?.role, isProfileLoading, profile]
  );
  
  const { data: leads, isLoading: isLeadsLoading, error: leadsError } = useCollection<Application>(leadsQuery);

  // 3. Fetch properties for performance stats
  const propertiesQuery = useMemoFirebase(
    () => {
      if (!firestore || !user || isProfileLoading || !profile) return null;
      if (profile.role !== 'landlord' && profile.role !== 'admin') return null;

      const propsRef = collection(firestore, 'properties');
      if (profile.role === 'admin') return query(propsRef, orderBy('createdAt', 'desc'));

      return query(
        propsRef,
        where('landlordId', '==', user.uid)
      );
    },
    [firestore, user?.uid, profile?.role, isProfileLoading, profile]
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
          description: 'Only landlords and admins can view the leads dashboard.',
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

  const [isStartingChatMap, setIsStartingChatMap] = useState<Record<string, boolean>>({});

  const handleStartChatWithTenant = async (lead: Application) => {
    if (!user || !firestore) return;
    
    setIsStartingChatMap(prev => ({ ...prev, [lead.id]: true }));
    try {
      const chatsRef = collection(firestore, 'chats');
      const q = query(
        chatsRef,
        where('participants', 'array-contains', user.uid),
        where('propertyId', '==', lead.propertyId)
      );
      
      const querySnapshot = await getDocs(q);
      let chatId = '';
      
      // Look for a chat that has the tenant as a participant
      const existingChat = querySnapshot.docs.find(doc => {
        const data = doc.data();
        return data.participants.includes(lead.tenantId);
      });
      
      if (existingChat) {
        chatId = existingChat.id;
      } else {
        const newChat = {
          participants: [user.uid, lead.tenantId],
          propertyId: lead.propertyId,
          propertyTitle: lead.propertyTitle || 'Property',
          lastMessage: 'Conversation started',
          updatedAt: serverTimestamp(),
        };
        const docRef = await addDoc(chatsRef, newChat);
        chatId = docRef.id;
      }
      
      router.push(`/chat/${chatId}`);
    } catch (err: any) {
      console.warn("Error starting chat from leads:", err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not connect with tenant. Please try again.',
      });
    } finally {
      setIsStartingChatMap(prev => ({ ...prev, [lead.id]: false }));
    }
  };

  const chartData = useMemo(() => {
    if (!properties) return [];
    return properties.map(p => {
      const title = p.title || 'Untitled Property';
      return {
        name: title.length > 15 ? title.substring(0, 12) + '...' : title,
        views: p.viewCount || 0,
        favorites: p.favoriteCount || 0,
      };
    }).sort((a, b) => b.views - a.views).slice(0, 5);
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
      case 'Tour Scheduled': return <Badge variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-100 border-none">Tour Scheduled</Badge>;
      case 'Accepted': return <Badge className="bg-green-500 hover:bg-green-600">Accepted</Badge>;
      case 'Rejected': return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="container mx-auto p-8 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Verifying access...</p>
      </div>
    );
  }

  if (leadsError) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h2 className="text-xl font-bold text-destructive">Dashboard Error</h2>
        <p className="text-muted-foreground mt-2">There was a problem loading your leads. Please refresh the page.</p>
        <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  if (!profile || (profile.role !== 'landlord' && profile.role !== 'admin')) return null;

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
        <p className="text-muted-foreground">Manage your Cross River rental applications and track performance.</p>
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
                <CardDescription>Visual stats for your active listings.</CardDescription>
              </div>
              <div className="flex gap-4">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Views</p>
                  <p className="text-xl font-bold text-primary">{totalStats.views}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Favs</p>
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
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="views" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={32} />
                    <Bar dataKey="favorites" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center border-2 border-dashed rounded-xl">
                  <p className="text-muted-foreground">No listing data available yet.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Market Insights</CardTitle>
            <CardDescription>Activity overview.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Eye className="h-4 w-4" /> Avg Views
                </span>
                <span className="font-bold">
                  {properties?.length ? Math.round(totalStats.views / properties.length) : 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Heart className="h-4 w-4" /> Avg Favs
                </span>
                <span className="font-bold">
                  {properties?.length ? (totalStats.favs / properties.length).toFixed(1) : 0}
                </span>
              </div>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm font-bold text-primary mb-1">Conversion Tip</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                If views are high but applications are low, consider updating your description with 'Magic Write' or reducing the price.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
            <CardDescription>Review tenant resumes and update status.</CardDescription>
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
                  <div key={lead.id} className="p-4 rounded-xl border bg-card hover:bg-muted/30 transition-all">
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-primary">{lead.tenantName}</h3>
                            {getStatusBadge(lead.status)}
                          </div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Property: <span className="text-foreground">{lead.propertyTitle}</span>
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
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pending">Pending</SelectItem>
                              <SelectItem value="Reviewing">Reviewing</SelectItem>
                              <SelectItem value="Tour Scheduled">Tour Scheduled</SelectItem>
                              <SelectItem value="Accepted">Accepted</SelectItem>
                              <SelectItem value="Rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Button 
                            variant="outline" 
                            size="icon" 
                            title="Chat with Tenant"
                            onClick={() => handleStartChatWithTenant(lead)}
                            disabled={isStartingChatMap[lead.id]}
                          >
                            {isStartingChatMap[lead.id] ? (
                              <Loader2 className="h-4 w-4 animate-spin text-accent" />
                            ) : (
                              <MessageSquare className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <TenantResume tenantId={lead.tenantId} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 border-2 border-dashed rounded-xl">
                <ClipboardList className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                <h3 className="text-xl font-bold">No applications yet</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                  Tenant applications for your listings in Cross River will appear here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
