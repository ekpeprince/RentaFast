
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarIcon, Users, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { Property, UserProfile } from '@/lib/types';

interface RentNowDialogProps {
  property: Property;
  trigger: React.ReactNode;
}

export default function RentNowDialog({ property, trigger }: RentNowDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState<Date>();
  const [occupants, setOccupants] = useState('1');

  // Fetch current user's profile for their name
  const profileRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: profile } = useDoc<UserProfile>(profileRef);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore) {
      router.push('/login');
      return;
    }

    if (!date) {
      toast({
        title: "Missing Information",
        description: "Please select an expected move-in date.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Find or create a chat
      const chatsRef = collection(firestore, 'chats');
      const q = query(
        chatsRef, 
        where('participants', 'array-contains', user.uid),
        where('propertyId', '==', property.id)
      );
      
      const querySnapshot = await getDocs(q);
      let chatId = '';

      if (!querySnapshot.empty) {
        chatId = querySnapshot.docs[0].id;
      } else {
        const newChat = {
          participants: [user.uid, property.landlordId],
          propertyId: property.id,
          propertyTitle: property.title,
          lastMessage: 'Rental Application Sent',
          updatedAt: serverTimestamp(),
        };
        const docRef = await addDoc(chatsRef, newChat);
        chatId = docRef.id;
      }

      // 2. Create the formal Application record
      await addDoc(collection(firestore, 'applications'), {
        propertyId: property.id,
        propertyTitle: property.title,
        landlordId: property.landlordId,
        tenantId: user.uid,
        tenantName: profile?.displayName || user.email || 'Anonymous Tenant',
        status: 'Pending',
        moveInDate: format(date, 'yyyy-MM-dd'),
        occupants: parseInt(occupants),
        createdAt: serverTimestamp(),
      });

      // 3. Send the structured application message to chat
      const applicationText = `🏠 RENTAL APPLICATION SENT\n\nProperty: ${property.title}\nExpected Move-in: ${format(date, 'PPP')}\nOccupants: ${occupants}\n\nI am interested in renting this property and would like to discuss next steps.`;

      await addDoc(collection(firestore, 'chats', chatId, 'messages'), {
        senderId: user.uid,
        text: applicationText,
        createdAt: serverTimestamp(),
      });

      toast({
        title: "Application Sent!",
        description: "The landlord has been notified and can view your application in their dashboard.",
      });

      setOpen(false);
      router.push(`/chat/${chatId}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send application.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary">Rent Now</DialogTitle>
            <DialogDescription>
              Submit a formal application for <span className="font-semibold text-foreground">{property.title}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-bold">Expected Move-in Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal h-12",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="occupants" className="text-sm font-bold">Number of Occupants</Label>
              <div className="relative">
                <Users className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="occupants"
                  type="number"
                  min="1"
                  className="pl-10 h-12"
                  value={occupants}
                  onChange={(e) => setOccupants(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Application"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
