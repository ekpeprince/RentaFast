'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Sparkles, Loader2, ArrowLeft } from 'lucide-react';
import { useFirebase, useUser } from '@/firebase';
import { collection, serverTimestamp, addDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { generateListingDescription } from '@/ai/flows/generate-listing-description';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import Link from 'next/link';

const listingSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  location: z.string().min(3, 'Location is required'),
  price: z.preprocess((val) => Number(val), z.number().min(1, 'Price must be a positive number')),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  type: z.enum(['Flat', 'Duplex', 'Short-let', 'Self-con', 'Penthouse']),
  beds: z.preprocess((val) => Number(val), z.number().int().min(1)),
  baths: z.preprocess((val) => Number(val), z.number().int().min(1)),
  images: z.any().refine((files) => files instanceof FileList && files.length > 0, 'At least one image is required.'),
});

type ListingFormValues = z.infer<typeof listingSchema>;

export default function NewListingPage() {
  const { user, isUserLoading } = useUser();
  const { firestore, firebaseApp } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

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

  const handleAiGenerate = async () => {
    const values = form.getValues();
    
    // Basic validation check before calling AI
    if (!values.title || !values.location || !values.type) {
      toast({
        title: "Missing info",
        description: "Please fill in the title, location, and property type first.",
        variant: "destructive"
      });
      return;
    }

    setIsAiLoading(true);
    try {
      const result = await generateListingDescription({
        title: values.title,
        type: values.type,
        beds: Number(values.beds),
        baths: Number(values.baths),
        location: values.location,
        keyFeatures: values.description, // Use existing text as context
      });
      
      form.setValue('description', result.description, { shouldValidate: true });
      toast({
        title: "AI Description Generated",
        description: "We've crafted a professional description for you.",
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'AI Generation Failed',
        description: error.message || 'Could not generate description.',
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const onSubmit = async (values: ListingFormValues) => {
    if (!user || !firestore || !firebaseApp) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to create a listing.',
      });
      return;
    }

    setIsLoading(true);

    try {
      const storage = getStorage(firebaseApp);
      const imageFiles = Array.from(values.images as FileList);
      
      const imagePromises = imageFiles.map(file => {
        // Sanitize filename to avoid path errors
        const fileExtension = file.name.split('.').pop();
        const cleanName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExtension}`;
        const imageRef = ref(storage, `properties/${user.uid}/${cleanName}`);
        
        return uploadBytes(imageRef, file)
          .then(snapshot => getDownloadURL(snapshot.ref));
      });
      
      const imageUrls = await Promise.all(imagePromises);

      const newListingData = {
        landlordId: user.uid,
        title: values.title,
        location: values.location,
        price: Number(values.price),
        description: values.description,
        type: values.type,
        beds: Number(values.beds),
        baths: Number(values.baths),
        imageUrls,
        amenities: [],
        period: 'yr',
        createdAt: serverTimestamp(),
      };
      
      await addDoc(collection(firestore, "properties"), newListingData);

      toast({
        title: 'Success!',
        description: 'Your property has been listed successfully.',
      });
      
      router.push('/');
    } catch (error: any) {
      console.error("Listing Submission Error:", error); 
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: error.message || 'Could not create listing.',
      });
    } finally {
      setIsLoading(false); 
    }
  };

  if (isUserLoading || !user) {
    return <div className="p-8 text-center flex flex-col items-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p>Verifying credentials...</p>
    </div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto mb-6">
        <Button asChild variant="ghost" className="-ml-2">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>

      <Card className="max-w-2xl mx-auto border-t-4 border-t-accent">
        <CardHeader>
          <CardTitle className="text-2xl text-primary">List Your Property</CardTitle>
          <CardDescription>Fill in the details below to showcase your property to thousands of tenants.</CardDescription>
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
                      <Input placeholder="e.g., Luxury 3 Bedroom Apartment" {...field} />
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
                          if (files && files.length > 0) {
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
                            <Image src={src} alt={`Preview ${index + 1}`} fill className="rounded-md object-cover shadow-sm" />
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Lekki Phase 1, Lagos" {...field} />
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
              </div>

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
                    <div className="flex items-center justify-between">
                      <FormLabel>Description</FormLabel>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="text-accent hover:text-accent/80 flex items-center gap-1"
                        onClick={handleAiGenerate}
                        disabled={isAiLoading}
                      >
                        {isAiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                        {isAiLoading ? 'Writing...' : 'Magic Write'}
                      </Button>
                    </div>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the property or click 'Magic Write' to generate one..." 
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading} className="w-full h-12 text-lg">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isLoading ? 'Processing...' : 'Create Listing'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
