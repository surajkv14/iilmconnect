
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  UtensilsCrossed, 
  Leaf, 
  Ticket, 
  Vote, 
  CheckCircle2, 
  Clock, 
  Info, 
  Scan, 
  Camera,
  X
} from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { format, addDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface MealItem { name: string; category: 'Veg' | 'Non-Veg' | 'Vegan'; calories: number; }
interface MessMeal { id: string; date: string; type: string; items: MealItem[]; }
interface Poll { id: string; question: string; options: { text: string; votes: number }[]; isActive: boolean; voters?: string[]; }

const MealCard = ({ title, items }: { title: string, items: MealItem[] }) => (
  <Card className="h-full flex flex-col shadow-sm">
    <CardHeader className="pb-3">
      <CardTitle className="text-lg flex items-center gap-2">
        <UtensilsCrossed className="size-4 text-primary" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="flex-grow">
      <ul className="space-y-2">
        {items?.map((item, index) => (
          <li key={index} className="flex justify-between items-center p-2 rounded-md bg-muted/20 border border-transparent hover:border-border transition-colors">
            <div className="flex flex-col">
              <span className="text-sm font-medium leading-none">{item.name}</span>
              <span className="text-[10px] text-muted-foreground mt-1">{item.calories} calories</span>
            </div>
            <Badge variant={item.category === 'Non-Veg' ? 'destructive' : item.category === 'Vegan' ? 'secondary' : 'default'} className="text-[10px] h-5 px-1.5">
              {item.category}
            </Badge>
          </li>
        ))}
        {(!items || items.length === 0) && (
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground opacity-50">
            <Info className="size-8 mb-2" />
            <p className="text-xs italic">Not updated</p>
          </div>
        )}
      </ul>
    </CardContent>
  </Card>
);

export default function SmartMessPage() {
  const [activeTab, setActiveTab] = useState<'tomorrow' | 'dayAfter'>('tomorrow');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

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

  useEffect(() => {
    if (isScannerOpen) {
      // Small delay to ensure the container is rendered
      const timer = setTimeout(() => {
        const scanner = new Html5QrcodeScanner(
          "qr-reader",
          { fps: 10, qrbox: { width: 250, height: 250 } },
          /* verbose= */ false
        );
        
        scanner.render(onScanSuccess, onScanFailure);
        scannerRef.current = scanner;
      }, 100);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
          scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
        }
      };
    }
  }, [isScannerOpen]);

  function onScanSuccess(decodedText: string) {
    // If scanning from the app, it might be a relative or absolute URL
    if (decodedText.includes('/scan-meal')) {
      if (scannerRef.current) {
        scannerRef.current.clear().then(() => {
          setIsScannerOpen(false);
          // Extract path or just navigate to the known endpoint
          router.push('/scan-meal');
        });
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'Invalid QR Code',
        description: 'Please scan the official QR code at the mess counter.',
      });
    }
  }

  function onScanFailure(error: any) {
    // Failures are common while searching for a QR code, so we don't need to log them heavily
  }

  const handleBookingToggle = (mealType: 'breakfast' | 'lunch' | 'dinner') => {
    if (!user || !firestore) return;

    const date = dates[activeTab];
    const mealId = `${date}-${mealType}`;
    const existingBooking = bookedSelections?.find(selection => selection.mealId === mealId);

    if (existingBooking) {
      if (existingBooking.status !== 'booked') {
        toast({ variant: 'destructive', title: 'Action Denied', description: 'This meal is already being prepared or consumed.' });
        return;
      }
      deleteDocumentNonBlocking(doc(firestore, 'bookings', existingBooking.id));
      toast({ title: 'Booking Cancelled', description: 'Reservation removed.' });
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
      
      toast({ title: 'Meal Booked!', description: `Coupon: ${couponCode}. Safe dining!` });
    }
  };

  const handleVote = (pollId: string, optionIndex: number) => {
    if (!firestore || !user || !activePolls) return;
    const poll = activePolls.find(p => p.id === pollId);
    if (!poll) return;

    if (poll.voters?.includes(user.uid)) {
      toast({ variant: 'destructive', title: 'Already Voted', description: 'You have already participated in this poll.' });
      return;
    }

    const newOptions = [...poll.options];
    newOptions[optionIndex].votes += 1;
    
    const newVoters = [...(poll.voters || []), user.uid];

    updateDocumentNonBlocking(doc(firestore, 'polls', pollId), { 
      options: newOptions,
      voters: newVoters
    });
    toast({ title: 'Mess Pulse', description: 'Your vote has been recorded!' });
  };

  if (isUserLoading || isLoadingSelections) {
    return <div className="space-y-8 p-8"><Skeleton className="h-12 w-64" /><Skeleton className="h-96 w-full" /></div>;
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reservation Desk</h1>
          <p className="text-muted-foreground">Book ahead to reduce campus food waste.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
            <DialogTrigger asChild>
              <Button variant="default" className="gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
                <Scan className="size-4" /> Scan QR to Avail
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Verify Meal Collection</DialogTitle>
                <DialogDescription>
                  Scan the QR code displayed at the mess counter to confirm your pickup.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center justify-center p-4">
                <div id="qr-reader" className="w-full max-w-sm rounded-lg overflow-hidden border-2 border-primary/20 shadow-inner"></div>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground italic">
                  <Camera className="size-3" /> Align the QR code within the frame
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button asChild variant="outline" size="sm" className="h-9 px-4">
            <Link href="/history">
              <Ticket className="mr-2 size-4" /> My Coupons
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="h-9 px-4">
            <Link href={user ? `/profile/${user.uid}` : '/login'}>
              <Leaf className="mr-2 size-4 text-green-500" /> Preferences
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="tomorrow" onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md bg-muted/50">
          <TabsTrigger value="tomorrow" className="data-[state=active]:bg-background">Tomorrow ({format(addDays(new Date(), 1), 'MMM dd')})</TabsTrigger>
          <TabsTrigger value="dayAfter" className="data-[state=active]:bg-background">Day After ({format(addDays(new Date(), 2), 'MMM dd')})</TabsTrigger>
        </TabsList>

        <div className="grid gap-6 md:grid-cols-3 mt-6">
          <MealCard title="Breakfast" items={currentMenu.breakfast?.items || []} />
          <MealCard title="Lunch" items={currentMenu.lunch?.items || []} />
          <MealCard title="Dinner" items={currentMenu.dinner?.items || []} />
        </div>
      </Tabs>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-primary/20 bg-primary/5 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-primary" /> Booking Portal
            </CardTitle>
            <CardDescription>Confirm your presence for the selected date.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!user ? (
              <p className="text-sm text-muted-foreground italic">Sign in to reserve your meals.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {(['breakfast', 'lunch', 'dinner'] as const).map(type => {
                  const booking = bookedSelections?.find(b => b.mealId === `${dates[activeTab]}-${type}`);
                  return (
                    <div key={type} className="flex items-center justify-between p-3 rounded-lg bg-background border">
                      <span className="capitalize font-medium">{type}</span>
                      <Button
                        size="sm"
                        variant={booking ? 'default' : 'outline'}
                        className="w-32"
                        onClick={() => handleBookingToggle(type)}
                      >
                        {booking ? 'Booked' : 'Reserve'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-muted/30 py-3">
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Clock className="size-3" /> Note: Bookings close exactly 24 hours prior to the meal.
            </p>
          </CardFooter>
        </Card>

        {activePolls && activePolls.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Vote className="size-5 text-primary" /> Mess Pulse
              </CardTitle>
              <CardDescription>Shape next week's menu with your vote.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {activePolls.map(poll => {
                const hasVoted = poll.voters?.includes(user?.uid || '');
                const totalVotes = poll.options.reduce((acc, curr) => acc + curr.votes, 0);
                
                return (
                  <div key={poll.id} className="space-y-4">
                    <h4 className="text-sm font-semibold border-l-4 border-primary pl-3">{poll.question}</h4>
                    <div className="grid gap-3">
                      {poll.options.map((opt, idx) => {
                        const percentage = totalVotes > 0 ? (opt.votes / totalVotes) * 100 : 0;
                        return (
                          <div key={idx} className="space-y-1.5">
                            <Button 
                              variant={hasVoted ? 'ghost' : 'outline'}
                              disabled={hasVoted}
                              className={`w-full justify-between h-auto py-2.5 transition-all ${!hasVoted && 'hover:bg-primary/5 hover:border-primary/50'}`}
                              onClick={() => handleVote(poll.id, idx)}
                            >
                              <span className="text-sm">{opt.text}</span>
                              {hasVoted && <span className="text-xs font-bold">{Math.round(percentage)}%</span>}
                            </Button>
                            {hasVoted && (
                              <Progress value={percentage} className="h-1.5" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {hasVoted && (
                      <p className="text-[10px] text-center text-muted-foreground italic">
                        Thank you! Your feedback helps us serve you better.
                      </p>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
