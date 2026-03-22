'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Edit, KeyRound, ShieldCheck, Salad, AlertCircle } from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking, useAuth } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface UserProfile {
  id: string;
  email: string;
  username?: string;
  displayName?: string;
  photoURL?: string;
  bio?: string;
  userType: 'student' | 'mess_staff' | 'admin';
  dietaryPreferences: string[];
  allergies: string[];
}

export default function ProfilePage() {
  const params = useParams();
  const userId = params.userId as string;

  const { user: currentUser, isUserLoading: isCurrentUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();

  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newBio, setNewBio] = useState('');
  const [newAllergies, setNewAllergies] = useState('');
  const [newPreferences, setNewPreferences] = useState('');

  const userProfileRef = useMemoFirebase(() => (firestore && userId) ? doc(firestore, 'users', userId) : null, [firestore, userId]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const handleProfileUpdate = async () => {
    if (!currentUser || !auth.currentUser || !userProfileRef) return;

    const trimmedDisplayName = newDisplayName.trim();
    if (!trimmedDisplayName) {
        toast({
            variant: 'destructive',
            title: 'Validation Error',
            description: 'Display Name cannot be empty.',
        });
        return;
    }

    const updateData: Partial<UserProfile> = {
      displayName: trimmedDisplayName,
      bio: newBio.trim(),
      allergies: newAllergies.split(',').map(s => s.trim()).filter(Boolean),
      dietaryPreferences: newPreferences.split(',').map(s => s.trim()).filter(Boolean),
    };

    try {
      await updateProfile(auth.currentUser, { displayName: trimmedDisplayName });
      updateDocumentNonBlocking(userProfileRef, updateData);
      toast({
        title: 'Profile Updated',
        description: 'Your mess preferences have been saved.',
      });
      setEditDialogOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Could not update your profile.',
      });
    }
  };
  
  const handlePasswordReset = () => {
    if (!auth || !currentUser?.email) return;
    sendPasswordResetEmail(auth, currentUser.email)
      .then(() => {
        toast({
          title: 'Reset Email Sent',
          description: `Instructions sent to ${currentUser.email}`,
        });
      });
  };

  const isLoading = isCurrentUserLoading || isProfileLoading;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!userProfile) {
    return <div className="p-8 text-center">User not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
                <Card>
                    <CardContent className="pt-6 flex flex-col items-center text-center">
                        <Avatar className="size-24 mb-4">
                            <AvatarImage src={userProfile.photoURL || `https://picsum.photos/seed/${userProfile.id}/96/96`} alt={userProfile.displayName || 'user'} />
                            <AvatarFallback>{userProfile.email?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <h2 className="text-2xl font-bold">{userProfile.displayName || 'Guest User'}</h2>
                        <Badge variant="secondary" className="mt-2 capitalize">
                            {userProfile.userType?.replace('_', ' ')}
                        </Badge>
                        
                        {userProfile.bio && <p className="mt-4 text-sm text-muted-foreground">{userProfile.bio}</p>}

                        <div className="mt-6 w-full text-left space-y-3">
                            <div className="flex items-center gap-3 text-sm">
                                <Mail className="size-4 text-muted-foreground" />
                                <span>{userProfile.email}</span>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        {currentUser?.uid === userId && (
                             <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
                                <DialogTrigger asChild>
                                  <Button variant="outline" className="w-full" onClick={() => {
                                      setNewDisplayName(userProfile.displayName || '');
                                      setNewBio(userProfile.bio || '');
                                      setNewAllergies(userProfile.allergies?.join(', ') || '');
                                      setNewPreferences(userProfile.dietaryPreferences?.join(', ') || '');
                                  }}>
                                    <Edit className="mr-2 h-4 w-4" /> Edit Profile
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Edit Profile & Preferences</DialogTitle>
                                        <DialogDescription>Update your dietary needs for better meal planning.</DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="displayName">Display Name</Label>
                                            <Input id="displayName" value={newDisplayName} onChange={(e) => setNewDisplayName(e.target.value)} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="bio">Short Bio</Label>
                                            <Textarea id="bio" value={newBio} onChange={(e) => setNewBio(e.target.value)} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="preferences">Dietary Preferences (comma separated)</Label>
                                            <Input id="preferences" placeholder="Veg, Vegan, Jain" value={newPreferences} onChange={(e) => setNewPreferences(e.target.value)} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="allergies">Allergies (comma separated)</Label>
                                            <Input id="allergies" placeholder="Peanuts, Dairy, Gluten" value={newAllergies} onChange={(e) => setNewAllergies(e.target.value)} />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit" onClick={handleProfileUpdate}>Save Changes</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                    </CardFooter>
                </Card>

                {currentUser?.uid === userId && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Security</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline" size="sm" className="w-full" onClick={handlePasswordReset}>
                                <KeyRound className="mr-2 h-4 w-4" /> Reset Password
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Salad className="size-5 text-primary" />
                            Mess Preferences
                        </CardTitle>
                        <CardDescription>Your registered dietary info used for meal preparation.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                <AlertCircle className="size-4 text-destructive" />
                                My Allergies
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {userProfile.allergies?.length ? userProfile.allergies.map(a => (
                                    <Badge key={a} variant="destructive">{a}</Badge>
                                )) : <span className="text-sm text-muted-foreground">No allergies listed.</span>}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                <Salad className="size-4 text-green-500" />
                                Dietary Choices
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {userProfile.dietaryPreferences?.length ? userProfile.dietaryPreferences.map(p => (
                                    <Badge key={p} variant="secondary">{p}</Badge>
                                )) : <span className="text-sm text-muted-foreground">No specific preferences listed.</span>}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
