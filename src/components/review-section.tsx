
'use client';

import { useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, doc, increment } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Star, MessageSquare, Loader2, User } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Review, UserProfile } from '@/lib/types';

interface ReviewSectionProps {
  propertyId: string;
}

export default function ReviewSection({ propertyId }: ReviewSectionProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  // Fetch reviews
  const reviewsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'properties', propertyId, 'reviews'), orderBy('createdAt', 'desc')) : null),
    [firestore, propertyId]
  );
  const { data: reviews, isLoading } = useCollection<Review>(reviewsQuery);

  // Get current user profile for their name
  const profileRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: profile } = useDoc<UserProfile>(profileRef);

  const handleSubmitReview = () => {
    if (!user || !firestore) return;

    if (!comment.trim()) {
      toast({
        title: "Comment required",
        description: "Please share a few words about your experience.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    const reviewData = {
      reviewerId: user.uid,
      reviewerName: profile?.displayName || user.email?.split('@')[0] || 'Anonymous',
      rating,
      comment: comment.trim(),
      createdAt: serverTimestamp(),
    };

    const reviewsRef = collection(firestore, 'properties', propertyId, 'reviews');
    const propertyRef = doc(firestore, 'properties', propertyId);

    // Add review
    addDocumentNonBlocking(reviewsRef, reviewData);

    // Increment review count and potentially update average (simple increment for now)
    updateDocumentNonBlocking(propertyRef, {
      reviewCount: increment(1),
    });

    toast({
      title: "Review Posted",
      description: "Thank you for sharing your feedback!",
    });

    setComment('');
    setRating(5);
    setOpen(false);
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-primary flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          Tenant Reviews
        </h3>
        {user && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-full border-primary text-primary hover:bg-primary/5">
                Write a Review
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share your experience</DialogTitle>
                <DialogDescription>
                  Your review helps other tenants make better decisions in Cross River.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Rating</Label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="focus:outline-none"
                      >
                        <Star 
                          className={cn(
                            "h-8 w-8 transition-colors",
                            star <= rating ? "fill-accent text-accent" : "text-muted-foreground"
                          )} 
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comment">Your Review</Label>
                  <Textarea
                    id="comment"
                    placeholder="What was the house like? How was the landlord?"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSubmitReview} disabled={isSubmitting} className="w-full">
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Post Review
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Card className="animate-pulse">
            <CardContent className="h-24 bg-muted/50 rounded-lg" />
          </Card>
        </div>
      ) : reviews && reviews.length > 0 ? (
        <div className="grid gap-4">
          {reviews.map((review) => (
            <Card key={review.id} className="border-none shadow-sm bg-background">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-primary/10">
                      <AvatarFallback className="bg-secondary text-primary">
                        {review.reviewerName[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-sm text-primary">{review.reviewerName}</p>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={cn(
                              "h-3 w-3",
                              i < review.rating ? "fill-accent text-accent" : "text-muted-foreground"
                            )} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                    {review.createdAt ? format(new Date((review.createdAt as any).seconds * 1000), 'MMM d, yyyy') : 'Recently'}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed italic">
                  "{review.comment}"
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-muted/20 rounded-2xl border-2 border-dashed">
          <User className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-20" />
          <p className="text-muted-foreground">No reviews yet. Be the first to share your thoughts!</p>
        </div>
      )}
    </div>
  );
}
