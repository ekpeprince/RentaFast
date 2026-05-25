'use client';

export const dynamic = 'force-dynamic';

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useRouter, notFound } from 'next/navigation';
import { Send, ArrowLeft, ShieldCheck, CheckCircle2, AlertTriangle, CreditCard, Lock, ChevronDown, ChevronUp, Loader2, RefreshCw } from 'lucide-react';
import { useUser, useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy, serverTimestamp, addDoc, updateDoc, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { Chat, Message, Property, UserProfile } from '@/lib/types';

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;
  
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [newMessage, setNewMessage] = useState('');
  const [showPaystack, setShowPaystack] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'options' | 'card' | 'transfer' | 'success'>('options');
  const [checklistOpen, setChecklistOpen] = useState(false);
  
  // Checklist states
  const [checkedWater, setCheckedWater] = useState(false);
  const [checkedPower, setCheckedPower] = useState(false);
  const [checkedKeys, setCheckedKeys] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  // Fetch Chat
  const chatRef = useMemoFirebase(
    () => (firestore && id ? doc(firestore, 'chats', id) : null),
    [firestore, id]
  );
  const { data: chat, isLoading: isChatLoading } = useDoc<Chat>(chatRef);

  // Fetch logged in user's profile to identify role
  const profileRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: profile } = useDoc<UserProfile>(profileRef);

  // Fetch parent property details for rent pricing
  const propertyRef = useMemoFirebase(
    () => (firestore && chat ? doc(firestore, 'properties', chat.propertyId) : null),
    [firestore, chat]
  );
  const { data: property } = useDoc<Property>(propertyRef);

  // Fetch applications for this property
  const applicationsQuery = useMemoFirebase(
    () => (firestore && chat ? query(collection(firestore, 'applications'), where('propertyId', '==', chat.propertyId)) : null),
    [firestore, chat]
  );
  const { data: applications, isLoading: isAppsLoading } = useCollection<any>(applicationsQuery);

  // Filter application related to the active chat participants
  const activeApplication = React.useMemo(() => {
    if (!applications || !chat) return null;
    return applications.find((app: any) => chat.participants.includes(app.tenantId));
  }, [applications, chat]);

  // Fetch Messages
  const messagesQuery = useMemoFirebase(
    () => (firestore && id ? query(collection(firestore, 'chats', id, 'messages'), orderBy('createdAt', 'asc')) : null),
    [firestore, id]
  );
  const { data: messages, isLoading: isMessagesLoading } = useCollection<Message>(messagesQuery);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(price);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !firestore || !chat || !id) return;

    const messageData = {
      senderId: user.uid,
      text: newMessage.trim(),
      createdAt: serverTimestamp(),
    };

    setNewMessage('');

    await addDoc(collection(firestore, 'chats', id, 'messages'), messageData);

    await updateDoc(doc(firestore, 'chats', id), {
      lastMessage: newMessage.trim(),
      updatedAt: serverTimestamp(),
    });
  };

  // Escrow triggers
  const handleUpdateStatus = async (newStatus: string, systemMessageText: string) => {
    if (!firestore || !activeApplication || !chat || !user) return;

    try {
      // 1. Update Application status
      await updateDoc(doc(firestore, 'applications', activeApplication.id), {
        status: newStatus,
      });

      // 2. Add System log message to Chat
      await addDoc(collection(firestore, 'chats', id, 'messages'), {
        senderId: 'system',
        text: systemMessageText,
        createdAt: serverTimestamp(),
      });

      // 3. Update Chat lastMessage
      await updateDoc(doc(firestore, 'chats', id), {
        lastMessage: systemMessageText,
        updatedAt: serverTimestamp(),
      });

      toast({
        title: "Escrow Status Updated",
        description: `Rental status is now: ${newStatus}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update status.",
        variant: "destructive"
      });
    }
  };

  const handleSimulatePayment = async () => {
    setIsPaying(true);
    setTimeout(async () => {
      setIsPaying(false);
      setPaymentStep('success');
      
      // Complete payment registration after checking checkmark
      setTimeout(async () => {
        setShowPaystack(false);
        setPaymentStep('options');
        
        const priceLabel = property ? formatPrice(property.price) : '₦3,500,000';
        await handleUpdateStatus(
          'PaidInEscrow',
          `💳 platform fee & rent secured in Trust Escrow: ${priceLabel} paid by tenant. Funds are securely frozen until inspections are verified.`
        );
      }, 2000);
    }, 2500);
  };

  // If loading, show skeleton.
  if (isUserLoading || isChatLoading || isAppsLoading || (firestore && !chatRef)) {
    return (
      <div className="container mx-auto px-4 py-8 h-[calc(100vh-100px)] flex flex-col">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="flex-1 w-full rounded-xl" />
      </div>
    );
  }

  // Definitively check for non-existent chat AFTER loading is complete.
  if (!isChatLoading && chat === null) {
    notFound();
    return null;
  }

  if (!user || !chat) return null;

  const isLandlord = profile?.role === 'landlord' || chat.participants[0] !== user.uid && profile?.role === 'admin';
  const rentAmount = property?.price || 0;
  const cautionDeposit = rentAmount * 0.1;
  const platformFee = 5000;
  const totalEscrow = rentAmount + cautionDeposit + platformFee;

  return (
    <div className="container mx-auto px-4 py-8 h-[calc(100vh-100px)] flex flex-col max-w-3xl">
      <div className="mb-4 flex items-center gap-4">
        <Button onClick={() => router.back()} variant="ghost" size="icon">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold truncate">{chat.propertyTitle}</h1>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-accent" /> Secured Trust Conversation
          </p>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden relative">
        {/* ESCROW WORKFLOW STATUS WIDGET */}
        {activeApplication && (
          <div className={cn(
            "p-4 border-b flex flex-col gap-3 transition-all duration-300",
            activeApplication.status === 'PaidInEscrow' && "bg-emerald-500/10 border-emerald-500/20 text-emerald-950",
            activeApplication.status === 'Released' && "bg-blue-500/10 border-blue-500/20 text-blue-950",
            activeApplication.status === 'Disputed' && "bg-rose-500/10 border-rose-500/20 text-rose-950",
            activeApplication.status === 'Accepted' && "bg-amber-500/10 border-amber-500/20 text-amber-950",
            (activeApplication.status === 'Pending' || activeApplication.status === 'Reviewing' || activeApplication.status === 'Tour Scheduled') && "bg-muted/80 border-muted-foreground/10"
          )}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm",
                  activeApplication.status === 'PaidInEscrow' && "bg-emerald-600 text-white",
                  activeApplication.status === 'Released' && "bg-blue-600 text-white",
                  activeApplication.status === 'Disputed' && "bg-rose-600 text-white",
                  activeApplication.status === 'Accepted' && "bg-amber-600 text-white",
                  (activeApplication.status === 'Pending' || activeApplication.status === 'Reviewing' || activeApplication.status === 'Tour Scheduled') && "bg-slate-600 text-white"
                )}>
                  {activeApplication.status === 'PaidInEscrow' ? 'Secured in Escrow' : activeApplication.status}
                </span>
                <span className="text-xs font-semibold opacity-85">
                  Trust Escrow System
                </span>
              </div>
              <span className="text-xs font-bold">{formatPrice(totalEscrow)} Total Locked</span>
            </div>

            {/* View State Explanations */}
            <p className="text-xs leading-relaxed opacity-90">
              {activeApplication.status === 'Pending' && (
                isLandlord 
                  ? "Action Required: The tenant has requested to rent your property. Review and accept the application to request rent payment into Escrow."
                  : "Your application is pending landlord review. They will accept and request payment into secure platform Escrow once reviewed."
              )}
              {activeApplication.status === 'Accepted' && (
                isLandlord
                  ? "Awaiting tenant payment. They must pay the rent into secure platform Escrow before key exchange and physical inspection."
                  : "Congratulations! Landlord approved your application. You can now pay rent into secure Trust Escrow. Funds are safe and locked by the platform."
              )}
              {activeApplication.status === 'PaidInEscrow' && (
                isLandlord
                  ? "Rent secured in Escrow! You can now hand over keys and perform the walkthrough check-in. Funds will drop in your bank once tenant confirms inspection."
                  : "₦ Rent Secured! Funds are frozen safely. Perform a physical check-in, inspect power/water, and release funds only when satisfied."
              )}
              {activeApplication.status === 'Released' && (
                "🔓 Escrow Released: The rent has been successfully paid out to the landlord. Congratulations on a successful rental transaction!"
              )}
              {activeApplication.status === 'Disputed' && (
                "⚠️ Dispute Filed: Inspection issue reported. Platform administrators are reviewing. Funds remain completely frozen in Escrow."
              )}
            </p>

            {/* Actions for Landlord */}
            {isLandlord && activeApplication.status === 'Pending' && (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleUpdateStatus('Accepted', '🎉 Landlord approved application! Awaiting tenant secure Escrow payment.')} className="bg-primary text-white font-bold h-9">
                  Accept Application
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleUpdateStatus('Rejected', '❌ Application declined by Landlord.')} className="bg-white border-muted-foreground/20 text-foreground font-bold h-9">
                  Decline
                </Button>
              </div>
            )}

            {/* Actions for Tenant */}
            {!isLandlord && activeApplication.status === 'Accepted' && (
              <Button size="sm" onClick={() => setShowPaystack(true)} className="bg-primary text-white font-bold w-full h-10 shadow-lg">
                Secure in Escrow (Pay ₦{totalEscrow.toLocaleString()})
              </Button>
            )}

            {!isLandlord && activeApplication.status === 'PaidInEscrow' && (
              <div className="flex flex-col gap-2">
                {/* Collapsible Walkthrough Checklist */}
                <div className="border rounded-xl bg-background overflow-hidden">
                  <button 
                    onClick={() => setChecklistOpen(!checklistOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-foreground border-b bg-secondary/10"
                  >
                    <span>Inspection Walkthrough Checklist</span>
                    {checklistOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  {checklistOpen && (
                    <div className="p-3 flex flex-col gap-2 text-xs text-muted-foreground bg-background">
                      <label className="flex items-center gap-2 cursor-pointer font-medium hover:text-foreground">
                        <input type="checkbox" checked={checkedWater} onChange={(e) => setCheckedWater(e.target.checked)} className="rounded text-primary focus:ring-primary h-3.5 w-3.5" />
                        Verify clean water flow and plumbing checks
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-medium hover:text-foreground">
                        <input type="checkbox" checked={checkedPower} onChange={(e) => setCheckedPower(e.target.checked)} className="rounded text-primary focus:ring-primary h-3.5 w-3.5" />
                        Verify functional power outlets & fittings
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-medium hover:text-foreground">
                        <input type="checkbox" checked={checkedKeys} onChange={(e) => setCheckedKeys(e.target.checked)} className="rounded text-primary focus:ring-primary h-3.5 w-3.5" />
                        Verify keys, door locks, and structural security
                      </label>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleUpdateStatus('Released', `🔓 Escrow released by tenant! Inspection completed successfully. ₦${totalEscrow.toLocaleString()} disbursed to landlord.`)} 
                    disabled={!checkedWater || !checkedPower || !checkedKeys}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex-1 h-9 shadow-md disabled:opacity-50"
                  >
                    Confirm & Release Funds
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleUpdateStatus('Disputed', '⚠️ Tenant filed a formal escrow check-in dispute. Funds frozen instantly under platform arbitration.')} 
                    className="font-bold h-9 shadow-sm"
                  >
                    Report Issue
                  </Button>
                </div>
                {!checkedWater || !checkedPower || !checkedKeys ? (
                  <span className="text-[10px] text-muted-foreground text-center">Complete the checklist to unlock "Release Funds".</span>
                ) : null}
              </div>
            )}
          </div>
        )}

        {/* MESSAGES FEED */}
        <CardContent 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30"
        >
          {isMessagesLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-10 w-1/2 ml-auto" />
            </div>
          ) : messages && messages.length > 0 ? (
            messages.map((msg) => {
              if (msg.senderId === 'system') {
                return (
                  <div key={msg.id} className="mx-auto max-w-[90%] bg-accent/10 border border-accent/20 rounded-2xl p-4 text-center text-xs text-accent font-bold shadow-sm leading-relaxed my-2 flex flex-col items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-accent animate-pulse" />
                    <span>{msg.text}</span>
                  </div>
                );
              }
              
              return (
                <div 
                  key={msg.id} 
                  className={cn(
                    "max-w-[80%] p-3 rounded-2xl text-sm shadow-sm",
                    msg.senderId === user.uid 
                      ? "bg-primary text-primary-foreground ml-auto rounded-tr-none" 
                      : "bg-background text-foreground border rounded-tl-none"
                  )}
                >
                  {msg.text}
                </div>
              );
            })
          ) : (
            <div className="text-center text-muted-foreground py-12">
              No messages yet. Say hi!
            </div>
          )}
        </CardContent>
        <div className="p-4 border-t bg-background">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input 
              placeholder="Type your message..." 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="rounded-full"
            />
            <Button type="submit" size="icon" className="rounded-full shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>

        {/* HIGH FIDELITY PAYSTACK CHECKOUT SIMULATION MODAL */}
        {showPaystack && (
          <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-300">
            <Card className="w-full max-w-[400px] border shadow-2xl bg-white rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200">
              {/* Paystack Teal-Green Premium Header */}
              <div className="bg-[#011b33] p-5 text-white flex items-center justify-between border-b border-emerald-950">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-emerald-500 flex items-center justify-center font-black text-white text-xs">P</div>
                  <div className="flex flex-col">
                    <span className="text-xs text-emerald-400 font-extrabold uppercase tracking-wider">Secured by Paystack</span>
                    <span className="text-[10px] text-white/70 font-semibold truncate max-w-[180px]">{user.email}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm font-black text-emerald-400">₦{totalEscrow.toLocaleString()}</span>
                  <span className="text-[9px] text-white/50">Cross River Escrow</span>
                </div>
              </div>

              {/* Paystack Checkout Screen */}
              <div className="p-6 space-y-6">
                {paymentStep === 'options' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-700">Choose your payment method</h3>
                    <div className="grid grid-cols-1 gap-2.5">
                      <button 
                        onClick={() => setPaymentStep('card')}
                        className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/10 text-left transition-all"
                      >
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-3">
                          <CreditCard className="h-4 w-4 text-emerald-500" /> Pay with Card
                        </span>
                        <ChevronDown className="-rotate-90 h-4 w-4 text-slate-400" />
                      </button>
                      
                      <button 
                        onClick={() => setPaymentStep('transfer')}
                        className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/10 text-left transition-all"
                      >
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-3">
                          <RefreshCw className="h-4 w-4 text-emerald-500" /> Pay with Bank Transfer
                        </span>
                        <ChevronDown className="-rotate-90 h-4 w-4 text-slate-400" />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-center gap-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-widest pt-2">
                      <Lock className="h-3 w-3 text-emerald-500" /> 256-bit Encrypted Transaction
                    </div>
                  </div>
                )}

                {paymentStep === 'card' && (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Card Number</label>
                        <Input placeholder="5399 2384 1029 4821" className="h-10 text-sm tracking-widest bg-slate-50 border-slate-200" defaultValue="5399 4321 8890 1209" disabled={isPaying} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Expiry Date</label>
                          <Input placeholder="12/28" className="h-10 text-sm tracking-wide bg-slate-50 border-slate-200 text-center" defaultValue="09/29" disabled={isPaying} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">CVV</label>
                          <Input placeholder="123" className="h-10 text-sm tracking-widest bg-slate-50 border-slate-200 text-center" defaultValue="388" disabled={isPaying} />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button onClick={() => setPaymentStep('options')} variant="outline" className="flex-1 h-11 text-xs font-bold border-slate-200" disabled={isPaying}>
                        Back
                      </Button>
                      <Button onClick={handleSimulatePayment} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 text-xs shadow-md" disabled={isPaying}>
                        {isPaying ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : `Pay ₦${totalEscrow.toLocaleString()}`}
                      </Button>
                    </div>
                  </div>
                )}

                {paymentStep === 'transfer' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Transfer Rent & Fees to</span>
                      <div className="space-y-1">
                        <span className="text-lg font-black text-slate-800 tracking-wider">9923849102</span>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">WEMA BANK / PAYSTACK ESCROW</span>
                      </div>
                      <p className="text-[9px] text-slate-400 leading-normal">This unique bank account is created specifically for this rental transaction. Funds are safely locked under Trust Escrow.</p>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button onClick={() => setPaymentStep('options')} variant="outline" className="flex-1 h-11 text-xs font-bold border-slate-200" disabled={isPaying}>
                        Back
                      </Button>
                      <Button onClick={handleSimulatePayment} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 text-xs shadow-md" disabled={isPaying}>
                        {isPaying ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : "I've completed transfer"}
                      </Button>
                    </div>
                  </div>
                )}

                {paymentStep === 'success' && (
                  <div className="py-8 flex flex-col items-center justify-center gap-4 text-center animate-in zoom-in-95 duration-200">
                    <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <CheckCircle2 className="h-10 w-10 text-emerald-600 animate-bounce" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-800">Transaction Secured!</h4>
                      <p className="text-xs text-slate-500 mt-1">Funds successfully credited to Platform Escrow.</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </Card>
    </div>
  );
}

