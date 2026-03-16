
'use client';

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Send, ArrowLeft } from 'lucide-react';
import { useUser, useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy, serverTimestamp, addDoc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Chat, Message } from '@/lib/types';

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;
  
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const chatRef = useMemoFirebase(
    () => (firestore && id ? doc(firestore, 'chats', id) : null),
    [firestore, id]
  );
  const { data: chat, isLoading: isChatLoading } = useDoc<Chat>(chatRef);

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !firestore || !chat || !id) return;

    const messageData = {
      senderId: user.uid,
      text: newMessage.trim(),
      createdAt: serverTimestamp(),
    };

    setNewMessage('');

    // Add message to sub-collection
    addDoc(collection(firestore, 'chats', id, 'messages'), messageData);

    // Update chat metadata
    updateDoc(doc(firestore, 'chats', id), {
      lastMessage: newMessage.trim(),
      updatedAt: serverTimestamp(),
    });
  };

  if (isUserLoading || isChatLoading || (firestore && !chatRef)) {
    return (
      <div className="container mx-auto px-4 py-8 h-[calc(100vh-100px)] flex flex-col">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="flex-1 w-full rounded-xl" />
      </div>
    );
  }

  if (!user || !chat) return null;

  return (
    <div className="container mx-auto px-4 py-8 h-[calc(100vh-100px)] flex flex-col max-w-3xl">
      <div className="mb-4 flex items-center gap-4">
        <Button onClick={() => router.back()} variant="ghost" size="icon">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold truncate">{chat.propertyTitle}</h1>
          <p className="text-xs text-muted-foreground">Direct Conversation</p>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
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
            messages.map((msg) => (
              <div 
                key={msg.id} 
                className={cn(
                  "max-w-[80%] p-3 rounded-2xl text-sm",
                  msg.senderId === user.uid 
                    ? "bg-primary text-primary-foreground ml-auto rounded-tr-none" 
                    : "bg-background text-foreground border rounded-tl-none"
                )}
              >
                {msg.text}
              </div>
            ))
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
      </Card>
    </div>
  );
}
