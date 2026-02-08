'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, MessageSquare, MoreHorizontal, Repeat2, UserCheck, Mail, Briefcase, Edit, KeyRound } from 'lucide-react';
import Image from 'next/image';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase, updateDocumentNonBlocking, useAuth } from '@/firebase';
import { collection, query, where, doc, Timestamp, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNowStrict } from 'date-fns';
import Link from 'next/link';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { Textarea } from '@/components/ui/textarea';

interface UserProfile {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  photoURL?: string;
  bio?: string;
  userType: 'student' | 'faculty' | 'alumni' | 'admin';
}

interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timestamp: Timestamp | null;
  likedBy: string[];
  image?: string;
  imageHint?: string;
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
  const [newUsername, setNewUsername] = useState('');
  const [newBio, setNewBio] = useState('');

  const userProfileRef = useMemoFirebase(() => (firestore && userId) ? doc(firestore, 'users', userId) : null, [firestore, userId]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const userPostsQuery = useMemoFirebase(() => 
    (firestore && userId) ? query(collection(firestore, 'posts'), where('authorId', '==', userId), orderBy('timestamp', 'desc')) : null,
  [firestore, userId]);
  const { data: posts, isLoading: isLoadingPosts } = useCollection<Post>(userPostsQuery);

  const handleLike = (post: Post) => {
    if (!currentUser || !firestore) return;

    const postRef = doc(firestore, 'posts', post.id);
    const currentLikedBy = post.likedBy || [];
    let newLikedBy;

    if (currentLikedBy.includes(currentUser.uid)) {
      newLikedBy = currentLikedBy.filter(uid => uid !== currentUser.uid);
    } else {
      newLikedBy = [...currentLikedBy, currentUser.uid];
    }
    
    updateDocumentNonBlocking(postRef, { likedBy: newLikedBy });
  };
  
  const handleProfileUpdate = async () => {
    if (!currentUser || !auth.currentUser) return;

    const trimmedDisplayName = newDisplayName.trim();
    const trimmedUsername = newUsername.trim();

    if (!trimmedDisplayName || !trimmedUsername) {
        toast({
            variant: 'destructive',
            title: 'Validation Error',
            description: 'Display Name and Username cannot be empty.',
        });
        return;
    }

    try {
      const updateData: Partial<UserProfile> = {
        displayName: trimmedDisplayName,
        username: trimmedUsername,
        bio: newBio.trim(),
      };

      // 1. Update Firebase Auth profile (only displayName and photoURL are supported)
      await updateProfile(auth.currentUser, { displayName: trimmedDisplayName });
      
      // 2. Update Firestore document
      if (userProfileRef) {
        updateDocumentNonBlocking(userProfileRef, updateData);
      }

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
      setEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating profile: ", error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Could not update your profile. Please try again.',
      });
    }
  };
  
  const handlePasswordReset = () => {
    if (!auth || !currentUser?.email) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not send password reset email. User not found.',
      });
      return;
    }

    sendPasswordResetEmail(auth, currentUser.email)
      .then(() => {
        toast({
          title: 'Password Reset Email Sent',
          description: `An email has been sent to ${currentUser.email} with instructions to reset your password.`,
        });
      })
      .catch((error) => {
        console.error("Error sending password reset email: ", error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to send password reset email. Please try again later.',
        });
      });
  };

  const isLoading = isCurrentUserLoading || isProfileLoading;

  if (isLoading) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1 space-y-8">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
            <div className="lg:col-span-2 space-y-6"><Skeleton className="h-48 w-full" /></div>
        </div>
    );
  }

  if (!userProfile) {
    return <div>User not found.</div>;
  }

  const PostCard = ({ post }: { post: Post }) => {
    const isLiked = currentUser ? post.likedBy?.includes(currentUser.uid) : false;
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={post.authorAvatar} alt={post.authorName} />
                            <AvatarFallback>{post.authorName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">{post.authorName}</p>
                            <p className="text-xs text-muted-foreground">
                            {post.timestamp ? formatDistanceToNowStrict(post.timestamp.toDate(), { addSuffix: true }) : 'Just now'}
                            </p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm mb-4 whitespace-pre-wrap">{post.content}</p>
                {post.image && (
                    <div className="rounded-lg overflow-hidden border">
                        <Image 
                            src={post.image}
                            alt="Post image"
                            width={600}
                            height={400}
                            className="w-full object-cover"
                            data-ai-hint={post.imageHint}
                        />
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-between items-center border-t pt-4">
                <Button variant="ghost" size="sm" className={`flex items-center gap-2 ${isLiked ? 'text-destructive' : 'text-muted-foreground'} hover:text-destructive`} onClick={() => handleLike(post)} disabled={!currentUser}>
                    <Heart className="size-5" fill={isLiked ? 'hsl(var(--destructive))' : 'none'} /> <span>{post.likedBy?.length || 0}</span>
                </Button>
                <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground">
                    <MessageSquare className="size-5" />
                </Button>
                <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground">
                    <Repeat2 className="size-5" /> <span>0</span>
                </Button>
            </CardFooter>
        </Card>
    );
  };


  return (
    <div className="space-y-8">
       <div className="flex items-center justify-between space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">User Profile</h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1 space-y-8">
                <Card>
                    <CardContent className="pt-6 flex flex-col items-center text-center">
                        <Avatar className="size-24 mb-4">
                            <AvatarImage src={userProfile.photoURL || `https://picsum.photos/seed/${userProfile.id}/96/96`} alt={userProfile.displayName || 'user'} />
                            <AvatarFallback>{userProfile.email?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <h2 className="text-2xl font-bold">{userProfile.displayName || `${userProfile.firstName} ${userProfile.lastName}`}</h2>
                        {userProfile.username && <p className="text-muted-foreground">@{userProfile.username}</p>}
                        <p className="text-muted-foreground capitalize">{userProfile.userType} Profile</p>
                        
                        {userProfile.bio && <p className="mt-4 text-sm text-center max-w-xs">{userProfile.bio}</p>}

                        <div className="mt-6 w-full text-left space-y-3">
                            <div className="flex items-center gap-3 text-sm">
                                <Mail className="size-4 text-muted-foreground" />
                                <span>{userProfile.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Briefcase className="size-4 text-muted-foreground" />
                                <span className="capitalize">{userProfile.userType}</span>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        {currentUser?.uid === userId ? (
                             <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
                                <DialogTrigger asChild>
                                  <Button variant="outline" className="w-full" onClick={() => {
                                      setNewDisplayName(userProfile.displayName || '');
                                      setNewUsername(userProfile.username || '');
                                      setNewBio(userProfile.bio || '');
                                      setEditDialogOpen(true);
                                  }}>
                                    <Edit className="mr-2" /> Edit Profile
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Edit Profile</DialogTitle>
                                        <DialogDescription>
                                            Update your profile information. Click save when you're done.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="displayName" className="text-right">Display Name</Label>
                                            <Input id="displayName" value={newDisplayName} onChange={(e) => setNewDisplayName(e.target.value)} className="col-span-3" />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="username" className="text-right">Username</Label>
                                            <Input id="username" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="col-span-3" />
                                        </div>
                                        <div className="grid grid-cols-4 items-start gap-4">
                                            <Label htmlFor="bio" className="text-right pt-2">Bio</Label>
                                            <Textarea id="bio" value={newBio} onChange={(e) => setNewBio(e.target.value)} className="col-span-3" />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit" onClick={handleProfileUpdate}>Save changes</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        ) : (
                             <Button className="w-full"><UserCheck className="mr-2"/> Follow</Button>
                        )}
                       
                    </CardFooter>
                </Card>

                {currentUser?.uid === userId && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Security</CardTitle>
                            <CardDescription>Manage your account security settings.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline" className="w-full" onClick={handlePasswordReset}>
                                <KeyRound className="mr-2" /> Send Password Reset Email
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Posts Feed */}
            <div className="lg:col-span-2 space-y-6">
                <h3 className="text-2xl font-bold tracking-tight">Posts</h3>
                {isLoadingPosts ? (
                    <div className="space-y-6">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-48 w-full" />
                    </div>
                ) : posts && posts.length > 0 ? (
                    posts.map(post => <PostCard key={post.id} post={post} />)
                ) : (
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            <p>{userProfile.displayName || userProfile.firstName} hasn't posted anything yet.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    </div>
  );
}
