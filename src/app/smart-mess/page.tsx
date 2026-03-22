
'use client';

import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UtensilsCrossed, Leaf, Ticket, Vote, CheckCircle2, Clock } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { format, addDays, isAfter, startOfDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface MealItem { name: string; category: 'Veg' | 'Non-Veg' | 'Vegan'; calories: number; }
interface MessMeal { id: string; date: string; type: string; items: MealItem[]; }
interface Poll { id: string; question: string; options: { text: string; votes: number }[]; isActive: boolean; }

const MealCard = ({ title, items }: { title: string, items: MealItem[] }) => (
  <Card className="h-full flex flex-col">
    <CardHeader>
      <CardTitle className="text-lg">{title}</CardTitle>
    </CardHeader>
    <CardContent className="flex-grow">
      <ul className="space-y-3">
        {items?.map((item, index) => (
          <li key={index} className="flex justify-between items-center text-sm">
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-xs text-muted-foreground">{item.calories} kcal</p>
            </div>
            <Badge variant={item.category === 'Non-Veg' ? 'destructive' : item.category === 'Vegan' ? 'secondary' : 'default'} className="text-[10px]">
              {item.category}
            </Badge>
          </li>
        ))}
        {(!items || items.length === 0) && <p className="text-xs text-muted-foreground italic">Menu not yet updated by staff.</p>}
      </ul>
    </CardContent>
  </Card>
);

export default function SmartMessPage() {
  const [activeTab, setActiveTab] = useState<'tomorrow' | 'dayAfter'>('tomorrow');
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const dates = useMemo(() => ({
    tomorrow: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    dayAfter: format(addDays(new Date(), 2), 'yyyy-MM-dd')
  }), []);

  // Fetch Menu
  const menuQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'menu'), where('date', 'in', [dates.tomorrow, dates.dayAfter])) : null,
    [firestore, dates]
  );
  const { data: menuItems } = useCollection<MessMeal>(menuQuery);

  // Fetch My Bookings
  const selectionsQuery = useMemoFirebase(() => 
    (user && firestore) ? query(collection(firestore, 'bookings'), where('studentId', '==', user.uid)) : null,
    [user, firestore]
  );
  const { data: bookedSelections, isLoading: isLoadingSelections } = useCollection(selectionsQuery);

  // Fetch Active Polls
  const pollsQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'polls'), where('isActive', '==', true)) : null,
    [firestore]
  );
  const { data: activePolls } = useCollection<Poll>(pollsQuery);

  const currentMenu = useMemo(() => {
    const targetDate = dates[activeTab];
    return {
      breakfast: menuItems?.find(m => m.date === targetDate && m.type === 'breakfast'),
      lunch: menuItems?.find(m => m.date === targetDate && m.type === 'lunch'),
      dinner: menuItems?.find(m => m.date === targetDate && m.type === 'dinner'),
    };
  }, [menuItems, activeTab, dates]);

  const handleBookingToggle = (mealType: 'breakfast' | 'lunch' | 'dinner') => {
    if (!user || !firestore) return;

    const date = dates[activeTab];
    const mealId = `${date}-${mealType}`;
    const existingBooking = bookedSelections?.find(selection => selection.mealId === mealId);

    if (existingBooking) {
      if (existingBooking.status !== 'booked') {
        toast({ variant: 'destructive', title: 'Action Denied', description: 'Cannot cancel a meal that is ready or consumed.' });
        return;
      }
      deleteDocumentNonBlocking(doc(firestore, 'bookings', existingBooking.id));
      toast({ title: 'Booking Cancelled', description: 'Your meal reservation has been removed.' });
    } else {
      const couponCode = `SM-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      addDocumentNonBlocking(collection(firestore, 'bookings'), {
        studentId: user.uid,
        studentName: user.displayName || user.email,
        mealId: mealId,
        date: date,
        mealType: mealType,
        status: 'booked',
        couponCode: couponCode,
        timestamp: new Date().toISOString(),
      });
      
      // Notify staff
      addDocumentNonBlocking(collection(firestore, 'notifications'), {
        userId: 'staff', // Generic tag for staff portal
        message: `New booking for ${mealType} on ${date} by ${user.displayName || user.email}`,
        type: 'booking_received',
        timestamp: new Date().toISOString(),
        isRead: false
      });

      toast({ title: 'Meal Booked!', description: `Coupon: ${couponCode}. Show this at the counter.` });
    }
  };

  const handleVote = (pollId: string, optionIndex: number) => {
    if (!firestore || !activePolls) return;
    const poll = activePolls.find(p => p.id === pollId);
    if (!poll) return;

    const newOptions = [...poll.options];
    newOptions[optionIndex].votes += 1;

    updateDocumentNonBlocking(doc(firestore, 'polls', pollId), { options: newOptions });
    toast({ title: 'Vote Counted', description: 'Thank you for your feedback!' });
  };

  if (isUserLoading || isLoadingSelections) {
    return <div className="space-y-8 p-8"><Skeleton className="h-12 w-64" /><Skeleton className="h-96 w-full" /></div>;
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Smart Reservation</h1>
          <p className="text-muted-foreground">Book your meals at least 24 hours in advance.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/history">
              <Ticket className="mr-2 size-4" /> My Coupons
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/profile/${user?.uid}`}>
              <Leaf className="mr-2 size-4 text-green-500" /> Preferences
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="tomorrow" onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="tomorrow">Tomorrow ({format(addDays(new Date(), 1), 'MMM dd')})</TabsTrigger>
          <TabsTrigger value="dayAfter">Day After ({format(addDays(new Date(), 2), 'MMM dd')})</TabsTrigger>
        </TabsList>

        <div className="grid gap-6 md:grid-cols-3 mt-6">
          <MealCard title="Breakfast" items={currentMenu.breakfast?.items || []} />
          <MealCard title="Lunch" items={currentMenu.lunch?.items || []} />
          <MealCard title="Dinner" items={currentMenu.dinner?.items || []} />
        </div>
      </Tabs>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="size-5 text-primary" /> Reservation Desk
            </CardTitle>
            <CardDescription>Confirm your attendance. Bookings close 24h prior.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!user ? (
              <p className="text-sm text-muted-foreground italic">Log in to book meals.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {(['breakfast', 'lunch', 'dinner'] as const).map(type => {
                  const booking = bookedSelections?.find(b => b.mealId === `${dates[activeTab]}-${type}`);
                  return (
                    <Button
                      key={type}
                      variant={booking ? 'default' : 'outline'}
                      className="capitalize"
                      onClick={() => handleBookingToggle(type)}
                    >
                      {booking ? <CheckCircle2 className="mr-2 size-4" /> : null}
                      {type} {booking ? `(${booking.couponCode})` : ''}
                    </Button>
                  );
                })}
              </div>
            )}
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground italic">
            <Clock className="mr-2 size-3" /> Booking advanced notice required for waste reduction.
          </CardFooter>
        </Card>

        {activePolls && activePolls.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Vote className="size-5 text-primary" /> Mess Pulse
              </CardTitle>
              <CardDescription>Vote for next week's special menu items!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {activePolls.map(poll => (
                <div key={poll.id} className="space-y-3">
                  <h4 className="text-sm font-semibold">{poll.question}</h4>
                  <div className="grid gap-2">
                    {poll.options.map((opt, idx) => (
                      <Button 
                        key={idx} 
                        variant="ghost" 
                        className="justify-between border hover:bg-accent"
                        onClick={() => handleVote(poll.id, idx)}
                      >
                        <span>{opt.text}</span>
                        <Badge variant="secondary">{opt.votes} votes</Badge>
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
