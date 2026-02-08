'use client';

import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from '@/hooks/use-toast';

interface UserDoc {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  userType: 'student' | 'faculty' | 'alumni' | 'admin';
}

interface PostDoc {
  id: string;
  authorName: string;
  content: string;
}

export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userProfileRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserDoc>(userProfileRef);

  const usersCollectionRef = useMemoFirebase(() => (userProfile?.userType === 'admin' ? collection(firestore, 'users') : null), [userProfile, firestore]);
  const { data: users, isLoading: areUsersLoading } = useCollection<UserDoc>(usersCollectionRef);
  
  const postsCollectionRef = useMemoFirebase(() => (userProfile?.userType === 'admin' ? collection(firestore, 'posts') : null), [userProfile, firestore]);
  const { data: posts, isLoading: arePostsLoading } = useCollection<PostDoc>(postsCollectionRef);

  const handleRoleChange = (userId: string, newRole: string) => {
    const userDocRef = doc(firestore, 'users', userId);
    updateDocumentNonBlocking(userDocRef, { userType: newRole });
    toast({
      title: "User Role Updated",
      description: `The user's role has been changed to ${newRole}.`,
    })
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      // Deleting a user in Auth is a protected operation, this will likely fail
      // without a backend function. For now, we just delete the Firestore doc.
      updateDocumentNonBlocking(doc(firestore, 'users', userId), {});
    }
  };

  const handleDeletePost = (postId: string) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      updateDocumentNonBlocking(doc(firestore, 'posts', postId), {});
    }
  };

  const isLoading = isUserLoading || isProfileLoading;
  const isAdmin = userProfile?.userType === 'admin';

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-64" />
        <Card>
          <CardHeader><Skeleton className="h-8 w-48" /></CardHeader>
          <CardContent><Skeleton className="h-24 w-full" /></CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
       <Alert variant="destructive">
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>You must be logged in to view this page.</AlertDescription>
      </Alert>
    );
  }
  
  if (!isAdmin) {
    return (
       <Alert variant="destructive">
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>You do not have permission to access the admin panel.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>View and manage all users in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          {areUsersLoading ? <Skeleton className="h-32 w-full" /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>User Type</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.email}</TableCell>
                    <TableCell>
                      <Select 
                        value={u.userType} 
                        onValueChange={(newRole) => handleRoleChange(u.id, newRole)}
                        disabled={u.id === user.uid}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="faculty">Faculty</SelectItem>
                          <SelectItem value="alumni">Alumni</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.id}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(u.id)} disabled={u.id === user.uid}>
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
       <Card>
        <CardHeader>
          <CardTitle>Post Management</CardTitle>
          <CardDescription>View and delete any post from the CollabNest feed.</CardDescription>
        </CardHeader>
        <CardContent>
          {arePostsLoading ? <Skeleton className="h-32 w-full" /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Author</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts?.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.authorName}</TableCell>
                    <TableCell className="max-w-md truncate">{p.content}</TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="icon" onClick={() => handleDeletePost(p.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
