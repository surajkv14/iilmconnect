
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { History, Utensils } from 'lucide-react';
import { format } from 'date-fns';

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

  const historyQuery = useMemoFirebase(() => 
    (user && firestore) ? query(
      collection(firestore, 'bookings'), 
      where('studentId', '==', user.uid),
      orderBy('date', 'desc')
    ) : null,
    [user, firestore]
  );

  const { data: history, isLoading: isLoadingHistory } = useCollection<MealBooking>(historyQuery);

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
              <p className="text-muted-foreground">No meal history found yet.</p>
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
