'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Sparkles, Loader2, ArrowLeft, Check } from 'lucide-react';
import { useFirebase, useUser } from '@/firebase';
import { collection, serverTimestamp, addDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { generateListingDescription } from '@/ai/flows/generate-listing-description';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { LocationAutocomplete } from '@/components/location-autocomplete';
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
  amenities: z.array(z.string()).default([]),
  images: z.any().refine((files) => files instanceof FileList && files.length > 0, 'At least one image is required.'),
});

type ListingFormValues = z.infer<typeof listingSchema>;

const AMENITY_OPTIONS = [
  { id: 'wifi', label: 'High-Speed WiFi' },
  { id: 'power', label: '24/7 Power Supply' },
  { id: 'security', label: 'Round-the-clock Security' },
];

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
      amenities: [],
    },
  });

  const handleAiGenerate = async () => {
    const values = form.getValues();
    
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
        keyFeatures: values.description,
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
        amenities: values.amenities,
        period: 'yr',
        createdAt: serverTimestamp(),
      };
      
      await addDoc(collection(firestore, "properties"), newListingData);

      toast({
        title: 'Success!',
        description: 'Your property has been listed successfully.',
      });
      
      router.push('/my-listings');
    } catch (error: any) {
      console.error("Listing Submission Error:", error); 
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: error.message || 'Could not create listing.',
      });
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
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <Button asChild variant="ghost" className="-ml-2">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>

      <Card className="border-t-4 border-t-accent shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl text-primary font-extrabold">List Your Property</CardTitle>
          <CardDescription className="text-base">Fill in the details below to showcase your property to thousands of tenants.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-bold">Property Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Luxury 3 Bedroom Apartment" className="h-12" {...field} />
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
                      <FormLabel className="text-lg font-bold">Property Images</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          multiple
                          accept="image/*"
                          className="h-12 py-2"
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
                          <div key={index} className="relative aspect-video rounded-lg overflow-hidden border shadow-sm group">
                              <Image src={src} alt={`Preview ${index + 1}`} fill className="object-cover transition-transform group-hover:scale-110" />
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-bold">Location</FormLabel>
                        <FormControl>
                          <LocationAutocomplete 
                            value={field.value} 
                            onChange={field.onChange} 
                            placeholder="Select neighborhood..." 
                          />
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
                        <FormLabel className="text-lg font-bold">Price (per year)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 3500000" className="h-12" {...field} />
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
                      <FormLabel className="text-lg font-bold">Property Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12">
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

                <div className="grid grid-cols-2 gap-6">
                   <FormField
                    control={form.control}
                    name="beds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-bold">Bedrooms</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 3" className="h-12" {...field} />
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
                        <FormLabel className="text-lg font-bold">Bathrooms</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 2" className="h-12" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="amenities"
                  render={() => (
                    <FormItem className="space-y-4">
                      <div className="mb-2">
                        <FormLabel className="text-lg font-bold">Amenities</FormLabel>
                        <FormDescription>Select the features your property offers.</FormDescription>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {AMENITY_OPTIONS.map((item) => (
                          <FormField
                            key={item.id}
                            control={form.control}
                            name="amenities"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={item.id}
                                  className="flex flex-row items-center space-x-3 space-y-0 p-3 rounded-lg border bg-secondary/20"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(item.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, item.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== item.id
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-medium cursor-pointer">
                                    {item.label}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between mb-1">
                        <FormLabel className="text-lg font-bold">Description</FormLabel>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          className="text-accent border-accent hover:bg-accent hover:text-white flex items-center gap-2"
                          onClick={handleAiGenerate}
                          disabled={isAiLoading}
                        >
                          {isAiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                          {isAiLoading ? 'Writing...' : 'Magic Write'}
                        </Button>
                      </div>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the property or click 'Magic Write' to generate one..." 
                          className="min-h-[150px] text-base"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full h-14 text-xl font-bold rounded-xl shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.99]">
                {isLoading ? <Loader2 className="mr-3 h-6 w-6 animate-spin" /> : null}
                {isLoading ? 'Creating Listing...' : 'Publish Listing'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
