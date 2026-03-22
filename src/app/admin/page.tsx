'use client';

import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2, ShieldCheck, UserCog } from 'lucide-react';
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
  displayName?: string;
  userType: 'student' | 'mess_staff' | 'admin';
}

export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userProfileRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserDoc>(userProfileRef);

  const usersCollectionRef = useMemoFirebase(() => (userProfile?.userType === 'admin' ? collection(firestore, 'users') : null), [userProfile, firestore]);
  const { data: users, isLoading: areUsersLoading } = useCollection<UserDoc>(usersCollectionRef);

  const handleRoleChange = (userId: string, newRole: string) => {
    const userDocRef = doc(firestore, 'users', userId);
    updateDocumentNonBlocking(userDocRef, { userType: newRole });
    toast({
      title: "User Role Updated",
      description: `User role has been updated to ${newRole.replace('_', ' ')}.`,
    })
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

  if (!user || !isAdmin) {
    return (
       <Alert variant="destructive">
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>You do not have administrative privileges to view this page.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <UserCog className="size-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Mess Administration</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Manage roles for students and mess staff.</CardDescription>
        </CardHeader>
        <CardContent>
          {areUsersLoading ? <Skeleton className="h-32 w-full" /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.displayName || 'Unnamed User'}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Select 
                        value={u.userType} 
                        onValueChange={(newRole) => handleRoleChange(u.id, newRole)}
                        disabled={u.id === user.uid}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="mess_staff">Mess Staff</SelectItem>
                          <SelectItem value="admin">Administrator</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" disabled={u.id === user.uid}>
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
