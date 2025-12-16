'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirebase, useUser } from '@/firebase';
import { collection, serverTimestamp, addDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';

const listingSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  location: z.string().min(3, 'Location is required'),
  price: z.coerce.number().min(1, 'Price must be a positive number'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  type: z.enum(['Flat', 'Duplex', 'Short-let', 'Self-con', 'Penthouse']),
  beds: z.coerce.number().int().min(1, 'Must have at least one bed'),
  baths: z.coerce.number().int().min(1, 'Must have at least one bath'),
  images: z.instanceof(FileList).refine((files) => files.length > 0, 'At least one image is required.'),
});

type ListingFormValues = z.infer<typeof listingSchema>;

export default function NewListingPage() {
  const { user } = useUser();
  const { firestore, firebaseApp } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const form = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: '',
      location: '',
      price: 0,
      description: '',
      type: 'Flat',
      beds: 1,
      baths: 1,
    },
  });

  const onSubmit = async (values: ListingFormValues) => {
    if (!user || !firestore || !firebaseApp) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to create a listing.',
      });
      return;
    }

    setIsLoading(true); // START: Sets button to 'Creating...'

    try {
        // 1. Image Upload Logic
        const storage = getStorage(firebaseApp);
        // Map files to promises for upload and getting download URL
        const imagePromises = Array.from(values.images).map(file => {
            const imageRef = ref(storage, `properties/${user.uid}/${file.name}`);
            return uploadBytes(imageRef, file)
                .then(snapshot => getDownloadURL(snapshot.ref));
        });
        const imageUrls = await Promise.all(imagePromises);

        // 2. Firestore Write Logic
        const newListingData = {
            landlordId: user.uid,
            title: values.title,
            location: values.location,
            price: values.price,
            description: values.description,
            type: values.type,
            beds: values.beds,
            baths: values.baths,
            imageUrls,
            amenities: [], // Default amenities
            period: 'yr',
            createdAt: serverTimestamp(),
        };
        await addDoc(collection(firestore, "properties"), newListingData);

        // --- SUCCESS PATH ---
        
        // 3. Show Success Toast
        toast({
            title: 'Success!',
            description: 'Your property has been listed successfully.',
        });
        
        // 4. CLEANUP (Crucial change): Reset loading state before redirect
        setIsLoading(false); 

        // 5. Redirect
        router.push('/');
        
    } catch (error: any) {
        // --- FAILURE PATH ---
        
        // Log the full error for debugging
        console.error("Listing Submission Error:", error); 
        
        // Show user-friendly error toast
        toast({
            variant: 'destructive',
            title: 'Uh oh! Something went wrong.',
            description: error.message || 'Could not create listing. Please try again.',
        });
        
        // 6. CLEANUP (Crucial change): Reset loading state on failure
        setIsLoading(false); 
    }
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Create a New Listing</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Cozy 2 Bedroom Apartment" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="images"
                render={({ field: { onChange, value, ...rest } }) => (
                  <FormItem>
                    <FormLabel>Property Images</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        multiple
                        accept="image/*"
                        {...rest}
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files) {
                            onChange(files);
                            const newPreviews = Array.from(files).map(file => URL.createObjectURL(file));
                            setImagePreviews(newPreviews);
                          }
                        }}
                      />
                    </FormControl>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      {imagePreviews.map((src, index) => (
                        <div key={index} className="relative aspect-square">
                            <Image src={src} alt={`Preview ${index + 1}`} fill className="rounded-md object-cover" />
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />


              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Lekki, Lagos" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (per year)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 3500000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a property type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Flat">Flat</SelectItem>
                        <SelectItem value="Duplex">Duplex</SelectItem>
                        <SelectItem value="Short-let">Short-let</SelectItem>
                        <SelectItem value="Self-con">Self-con</SelectItem>
                        <SelectItem value="Penthouse">Penthouse</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                 <FormField
                  control={form.control}
                  name="beds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Beds</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 3" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="baths"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Baths</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 2" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe the property..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Creating...' : 'Create Listing'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
