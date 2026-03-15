
'use client';

import { useState, useEffect } from 'react';
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase, useFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { doc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, LogOut, Loader2, Save, FileUp, ExternalLink, Clock, XCircle } from 'lucide-react';
import type { UserProfile } from '@/lib/types';

export default function AccountPage() {
  const { user, isUserLoading } = useUser();
  const { auth, firestore, firebaseApp } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Sync with Firestore data
  const userRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: profile, isLoading: isProfileLoading } = useDoc<UserProfile>(userRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setPhoneNumber(profile.phoneNumber || '');
    }
  }, [profile]);

  const handleSignOut = async () => {
    if (auth) {
      await auth.signOut();
      router.push('/');
    }
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore) return;

    setIsSaving(true);
    const userDocRef = doc(firestore, 'users', user.uid);
    
    updateDocumentNonBlocking(userDocRef, {
      displayName,
      phoneNumber,
    });

    toast({
      title: 'Profile Updated',
      description: 'Your changes have been saved successfully.',
    });
    setIsSaving(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !firebaseApp || !firestore) return;

    setIsUploading(true);
    try {
      const storage = getStorage(firebaseApp);
      const storageRef = ref(storage, `verification-docs/${user.uid}/${file.name}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);

      const userDocRef = doc(firestore, 'users', user.uid);
      updateDocumentNonBlocking(userDocRef, {
        verificationDocUrl: downloadUrl,
        verificationStatus: 'pending'
      });

      toast({
        title: 'Document Uploaded',
        description: 'Your verification document is now under review.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message || 'Could not upload document.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (isUserLoading || isProfileLoading) {
    return <div className="p-8 text-center flex flex-col items-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p>Loading your profile...</p>
    </div>;
  }

  if (!user || !profile) {
    return null;
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return names[0][0] + names[names.length - 1][0];
    }
    return name[0];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-none flex items-center gap-1"><Clock className="h-3 w-3" /> Pending Review</Badge>;
      case 'verified':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 border-none flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Verified Agent</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">Unverified</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <Avatar className="h-20 w-20 border-4 border-primary/10">
          <AvatarImage src={user.photoURL ?? ''} alt={displayName || 'User'} />
          <AvatarFallback className="text-xl font-bold">{getInitials(displayName || user.email)}</AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-primary">
              {displayName || 'User'}
            </h1>
            {profile.isVerified && <ShieldCheck className="h-6 w-6 text-accent" />}
          </div>
          <p className="text-muted-foreground">{user.email}</p>
          <div className="flex items-center gap-2 mt-1">
             <Badge variant="secondary" className="capitalize">{profile.role}</Badge>
             {profile.role === 'landlord' && getStatusBadge(profile.verificationStatus || 'unverified')}
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Public Profile</CardTitle>
            <CardDescription>This information will be visible to other users when you interact on the platform.</CardDescription>
          </CardHeader>
          <form onSubmit={handleUpdateProfile}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input 
                  id="displayName" 
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)} 
                  placeholder="e.g., John Property Manager" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  value={phoneNumber} 
                  onChange={(e) => setPhoneNumber(e.target.value)} 
                  placeholder="e.g., +234 800 000 0000" 
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t p-6">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </CardFooter>
          </form>
        </Card>

        {profile.role === 'landlord' && (
          <Card className={profile.isVerified ? "border-accent/20 bg-accent/5" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Verification Documents
                {profile.isVerified && <ShieldCheck className="h-5 w-5 text-accent" />}
              </CardTitle>
              <CardDescription>
                Upload a government ID or proof of ownership to earn the "Verified Agent" badge.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.verificationDocUrl ? (
                <div className="p-4 border rounded-lg bg-background flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary rounded-md">
                      <FileUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Document Uploaded</p>
                      <p className="text-xs text-muted-foreground">Status: <span className="capitalize">{profile.verificationStatus}</span></p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <a href={profile.verificationDocUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View
                    </a>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Label htmlFor="doc-upload" className="cursor-pointer">
                    <div className="border-2 border-dashed rounded-xl py-8 flex flex-col items-center justify-center gap-2 hover:bg-secondary/20 transition-colors">
                      <FileUp className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm font-medium">Click to upload verification document</p>
                      <p className="text-xs text-muted-foreground">PDF, JPG, or PNG</p>
                    </div>
                  </Label>
                  <Input 
                    id="doc-upload" 
                    type="file" 
                    className="hidden" 
                    accept="image/*,.pdf" 
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                  {isUploading && (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading document...
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive">Account Actions</CardTitle>
            <CardDescription>Sign out of your account on this device.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSignOut} variant="destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
