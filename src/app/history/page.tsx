'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { History, Utensils } from 'lucide-react';
import { format } from 'date-fns';
import { useMemo } from 'react';

interface MealBooking {
  id: string;
  date: string;
  mealType: string;
  status: 'booked' | 'consumed' | 'cancelled';
  timestamp: string;
}

export default function HistoryPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // Simple query without orderBy to avoid composite index requirement
  const historyQuery = useMemoFirebase(() => 
    (user && firestore) ? query(
      collection(firestore, 'bookings'), 
      where('studentId', '==', user.uid)
    ) : null,
    [user, firestore]
  );

  const { data: rawHistory, isLoading: isLoadingHistory } = useCollection<MealBooking>(historyQuery);

  // Sort history client-side by date and timestamp descending
  const history = useMemo(() => {
    if (!rawHistory) return null;
    return [...rawHistory].sort((a, b) => {
      // First sort by date
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      // Then sort by timestamp for the same day
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [rawHistory]);

  if (isUserLoading || isLoadingHistory) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-64" />
        <Card>
          <CardHeader><Skeleton className="h-8 w-48" /></CardHeader>
          <CardContent><Skeleton className="h-64 w-full" /></CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className="text-muted-foreground">Please log in to view your consumption history.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <History className="size-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Consumption History</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Past Meals</CardTitle>
          <CardDescription>A detailed record of your meal bookings and consumption status.</CardDescription>
        </CardHeader>
        <CardContent>
          {!history || history.length === 0 ? (
            <div className="text-center py-12">
              <Utensils className="size-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground">No meal history found yet. Try booking a meal in the Reservation Desk.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Meal</TableHead>
                  <TableHead>Booking Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {format(new Date(item.date), 'PPP')}
                    </TableCell>
                    <TableCell className="capitalize">{item.mealType}</TableCell>
                    <TableCell>
                      {item.timestamp ? format(new Date(item.timestamp), 'p') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        item.status === 'consumed' ? 'secondary' : 
                        item.status === 'booked' ? 'default' : 
                        'destructive'
                      }>
                        {item.status}
                      </Badge>
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
