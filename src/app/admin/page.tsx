
'use client';

import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  ShieldCheck, 
  Users, 
  History, 
  TrendingDown 
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface UserDoc {
  id: string;
  email: string;
  displayName?: string;
  userType: 'student' | 'faculty' | 'mess_staff' | 'admin';
}

interface MealBooking {
  id: string;
  studentId: string;
  date: string;
  mealType: string;
  status: 'booked' | 'consumed' | 'cancelled';
  timestamp: string;
}

interface WasteLog {
  id: string;
  date: string;
  mealType: string;
  wastedKgs: number;
  reason: string;
}

export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userProfileRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserDoc>(userProfileRef);

  // Queries for admin data
  const isAdmin = userProfile?.userType === 'admin';

  const usersQuery = useMemoFirebase(() => (isAdmin ? collection(firestore, 'users') : null), [isAdmin, firestore]);
  const { data: allUsers, isLoading: areUsersLoading } = useCollection<UserDoc>(usersQuery);

  const bookingsQuery = useMemoFirebase(() => (isAdmin ? collection(firestore, 'bookings') : null), [isAdmin, firestore]);
  const { data: allBookings, isLoading: areBookingsLoading } = useCollection<MealBooking>(bookingsQuery);

  const wasteQuery = useMemoFirebase(() => (isAdmin ? collection(firestore, 'waste_logs') : null), [isAdmin, firestore]);
  const { data: wasteLogs, isLoading: isWasteLoading } = useCollection<WasteLog>(wasteQuery);

  const handleRoleChange = (userId: string, newRole: string) => {
    const userDocRef = doc(firestore, 'users', userId);
    updateDocumentNonBlocking(userDocRef, { userType: newRole });
    toast({
      title: "Role Updated",
      description: `User role has been changed to ${newRole}.`,
    });
  };

  if (isUserLoading || isProfileLoading) {
    return <div className="p-8 space-y-4"><Skeleton className="h-12 w-1/4" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Alert variant="destructive" className="max-w-md">
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>You do not have administrative privileges to access this panel.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
        <p className="text-muted-foreground">Manage campus-wide mess operations and user permissions.</p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users" className="gap-2">
            <Users className="size-4" /> User Management
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="size-4" /> Global History
          </TabsTrigger>
          <TabsTrigger value="waste" className="gap-2">
            <TrendingDown className="size-4" /> Sustainability
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Campus Users</CardTitle>
              <CardDescription>Update user roles for students, faculty, and mess personnel.</CardDescription>
            </CardHeader>
            <CardContent>
              {areUsersLoading ? <Skeleton className="h-48 w-full" /> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Current Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUsers?.map(u => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.displayName || 'Unnamed User'}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          <Badge variant={u.userType === 'admin' ? 'default' : u.userType === 'student' ? 'outline' : 'secondary'}>
                            {u.userType.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Select 
                            defaultValue={u.userType} 
                            onValueChange={(val) => handleRoleChange(u.id, val)}
                            disabled={u.id === user.uid}
                          >
                            <SelectTrigger className="w-32 ml-auto">
                              <SelectValue placeholder="Change role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="student">Student</SelectItem>
                              <SelectItem value="faculty">Faculty</SelectItem>
                              <SelectItem value="mess_staff">Mess Staff</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Global Consumption Records</CardTitle>
              <CardDescription>Monitoring meal attendance across the entire campus.</CardDescription>
            </CardHeader>
            <CardContent>
              {areBookingsLoading ? <Skeleton className="h-48 w-full" /> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Student/User ID</TableHead>
                      <TableHead>Meal</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allBookings?.sort((a,b) => b.date.localeCompare(a.date)).map(b => (
                      <TableRow key={b.id}>
                        <TableCell>{format(new Date(b.date), 'PP')}</TableCell>
                        <TableCell className="font-mono text-xs">{b.studentId}</TableCell>
                        <TableCell className="capitalize">{b.mealType}</TableCell>
                        <TableCell>
                          <Badge variant={b.status === 'consumed' ? 'secondary' : 'default'}>
                            {b.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="waste">
          <Card>
            <CardHeader>
              <CardTitle>Waste Tracking</CardTitle>
              <CardDescription>Daily food waste reports submitted by mess staff.</CardDescription>
            </CardHeader>
            <CardContent>
              {isWasteLoading ? <Skeleton className="h-48 w-full" /> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Meal</TableHead>
                      <TableHead>Wasted (kg)</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {wasteLogs?.map(log => (
                      <TableRow key={log.id}>
                        <TableCell>{format(new Date(log.date), 'PP')}</TableCell>
                        <TableCell className="capitalize">{log.mealType}</TableCell>
                        <TableCell className="text-destructive font-bold">{log.wastedKgs} kg</TableCell>
                        <TableCell>{log.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
