
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc, limit } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, XCircle, Clock, Utensils, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

const MEAL_WINDOWS = {
  breakfast: { start: 7, end: 10 },
  lunch: { start: 12, end: 15 },
  dinner: { start: 19, end: 22 },
};

export default function ScanMealPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'invalid-time'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [mealInfo, setMealInfo] = useState<{ type: string; date: string } | null>(null);

  const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const currentHour = new Date().getHours();

  const currentMealType = useMemo(() => {
    if (currentHour >= MEAL_WINDOWS.breakfast.start && currentHour < MEAL_WINDOWS.breakfast.end) return 'breakfast';
    if (currentHour >= MEAL_WINDOWS.lunch.start && currentHour < MEAL_WINDOWS.lunch.end) return 'lunch';
    if (currentHour >= MEAL_WINDOWS.dinner.start && currentHour < MEAL_WINDOWS.dinner.end) return 'dinner';
    return null;
  }, [currentHour]);

  const bookingQuery = useMemoFirebase(() => 
    (user && firestore && currentMealType) ? query(
      collection(firestore, 'bookings'),
      where('studentId', '==', user.uid),
      where('date', '==', today),
      where('mealType', '==', currentMealType),
      limit(1)
    ) : null,
    [user, firestore, today, currentMealType]
  );

  const { data: bookings, isLoading: isQueryLoading } = useCollection(bookingQuery);

  useEffect(() => {
    if (isUserLoading || isQueryLoading) return;

    if (!user) {
      setStatus('error');
      setErrorMsg('You must be logged in to avail your meal.');
      return;
    }

    if (!currentMealType) {
      setStatus('invalid-time');
      return;
    }

    if (!bookings || bookings.length === 0) {
      setStatus('error');
      setErrorMsg(`No booking found for ${currentMealType} today (${format(new Date(), 'PPP')}).`);
      return;
    }

    const booking = bookings[0];

    if (booking.status === 'consumed') {
      setStatus('error');
      setErrorMsg('This meal has already been availed.');
      setMealInfo({ type: booking.mealType, date: booking.date });
      return;
    }

    // Process the meal
    const bookingRef = doc(firestore, 'bookings', booking.id);
    updateDocumentNonBlocking(bookingRef, {
      status: 'consumed',
      timestampAvailed: new Date().toISOString()
    });

    setMealInfo({ type: booking.mealType, date: booking.date });
    setStatus('success');
  }, [user, isUserLoading, bookings, isQueryLoading, currentMealType, firestore]);

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Skeleton className="size-20 rounded-full" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh] p-4">
      <Card className="w-full max-w-md shadow-lg border-2">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex justify-center">
            {status === 'success' && <CheckCircle2 className="size-16 text-green-500 animate-in zoom-in duration-300" />}
            {status === 'error' && <XCircle className="size-16 text-destructive animate-in shake-in duration-300" />}
            {status === 'invalid-time' && <Clock className="size-16 text-amber-500" />}
          </div>
          <CardTitle className="text-2xl font-bold">
            {status === 'success' && 'Meal Availed!'}
            {status === 'error' && 'Verification Failed'}
            {status === 'invalid-time' && 'Outside Serving Hours'}
          </CardTitle>
          <CardDescription>
            {status === 'success' && 'Your meal booking has been successfully verified.'}
            {status === 'error' && errorMsg}
            {status === 'invalid-time' && 'Please visit the mess during scheduled meal times.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {mealInfo && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Meal Type</span>
                <span className="font-bold capitalize">{mealInfo.type}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date</span>
                <span className="font-bold">{format(new Date(mealInfo.date), 'PPP')}</span>
              </div>
              {status === 'success' && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-bold">{format(new Date(), 'p')}</span>
                </div>
              )}
            </div>
          )}

          {status === 'invalid-time' && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Mess Schedule</div>
              <div className="grid gap-2">
                {Object.entries(MEAL_WINDOWS).map(([name, win]) => (
                  <div key={name} className="flex justify-between text-sm p-2 bg-muted/50 rounded">
                    <span className="capitalize">{name}</span>
                    <span>{win.start}:00 - {win.end}:00</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link href="/">Return to Dashboard</Link>
          </Button>
          {status === 'error' && (
            <Button variant="outline" asChild className="w-full">
              <Link href="/smart-mess">Check My Bookings</Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
