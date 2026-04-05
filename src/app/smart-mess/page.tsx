
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  UtensilsCrossed, 
  Ticket, 
  Vote, 
  CheckCircle2, 
  Clock, 
  Info, 
  MessageCircle,
  Send,
  History,
  AlertCircle
} from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc, serverTimestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { format, addDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  // Feedback State
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [feedbackCategory, setFeedbackCategory] = useState("General");
  const [feedbackURN, setFeedbackURN] = useState("");
  const [feedbackPhone, setFeedbackPhone] = useState("");
  const [feedbackMealType, setFeedbackMealType] = useState("lunch");
  const [feedbackMealDate, setFeedbackMealDate] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Booking Confirmation State
  const [pendingBooking, setPendingBooking] = useState<{ type: 'breakfast' | 'lunch' | 'dinner', date: string } | null>(null);

  // Hydration safety
  const [mounted, setMounted] = useState(false);
  const [dates, setDates] = useState<{ tomorrow: string; dayAfter: string } | null>(null);

  useEffect(() => {
    setMounted(true);
    const tom = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    const daf = format(addDays(new Date(), 2), 'yyyy-MM-dd');
    setDates({ tomorrow: tom, dayAfter: daf });
    setFeedbackMealDate(tom);
  }, []);

  // Fetch Menu
  const menuQuery = useMemoFirebase(() => 
    (firestore && dates) ? query(collection(firestore, 'menu'), where('date', 'in', [dates.tomorrow, dates.dayAfter])) : null,
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
    if (!dates) return { breakfast: undefined, lunch: undefined, dinner: undefined };
    const targetDate = dates[activeTab];
    return {
      breakfast: menuItems?.find(m => m.date === targetDate && m.type === 'breakfast'),
      lunch: menuItems?.find(m => m.date === targetDate && m.type === 'lunch'),
      dinner: menuItems?.find(m => m.date === targetDate && m.type === 'dinner'),
    };
  }, [menuItems, activeTab, dates]);

  const initiateBooking = (mealType: 'breakfast' | 'lunch' | 'dinner') => {
    if (!user || !dates) return;
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
      setPendingBooking({ type: mealType, date });
    }
  };

  const confirmBooking = () => {
    if (!user || !firestore || !pendingBooking) return;

    const { type, date } = pendingBooking;
    const mealId = `${date}-${type}`;
    const couponCode = `SM-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    addDocumentNonBlocking(collection(firestore, 'bookings'), {
      studentId: user.uid,
      studentName: user.displayName || user.email,
      mealId: mealId,
      date: date,
      mealType: type,
      status: 'booked',
      couponCode: couponCode,
      timestamp: new Date().toISOString(),
    });
    
    toast({ title: 'Meal Booked!', description: `Coupon: ${couponCode}. Show this at the counter!` });
    setPendingBooking(null);
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

  const handleSubmitFeedback = async () => {
    if (!user || !feedbackMsg || !feedbackURN || !feedbackPhone) {
      toast({ variant: 'destructive', title: "Incomplete Form", description: "Please fill all required fields." });
      return;
    }

    // Basic 10-digit phone validation
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(feedbackPhone)) {
      toast({ variant: 'destructive', title: "Invalid Phone", description: "Please enter a valid 10-digit phone number." });
      return;
    }

    setIsSubmittingFeedback(true);

    addDocumentNonBlocking(collection(firestore, 'feedback'), {
      userId: user.uid,
      userName: user.displayName || user.email,
      urn: feedbackURN,
      phoneNumber: feedbackPhone,
      message: feedbackMsg,
      category: feedbackCategory,
      mealType: feedbackMealType,
      mealDate: feedbackMealDate,
      timestamp: serverTimestamp(),
    });

    setFeedbackMsg("");
    setFeedbackURN("");
    setFeedbackPhone("");
    setIsSubmittingFeedback(false);
    toast({ title: "Feedback Sent", description: "The mess team has received your message." });
  };

  if (!mounted || isUserLoading || isLoadingSelections || !dates) {
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
          <Button asChild variant="outline" size="sm" className="h-9 px-4">
            <Link href="/history">
              <History className="mr-2 size-4" /> View My Coupons
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

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 border-primary/20 bg-primary/5 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-primary" /> Booking Portal
            </CardTitle>
            <CardDescription>Confirm presence for {dates[activeTab]}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!user ? (
              <p className="text-sm text-muted-foreground italic">Sign in to reserve meals.</p>
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
                        onClick={() => initiateBooking(type)}
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
              <Clock className="size-3" /> Note: Bookings close 24h prior.
            </p>
          </CardFooter>
        </Card>

        <Card className="lg:col-span-1 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Vote className="size-5 text-primary" /> Mess Pulse
              </CardTitle>
              <CardDescription>Shape next week's menu.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {(!activePolls || activePolls.length === 0) ? (
                 <div className="flex flex-col items-center justify-center py-12 text-muted-foreground opacity-50">
                    <Vote className="size-12 mb-2" />
                    <p className="text-xs italic">No active polls</p>
                 </div>
              ) : activePolls.map(poll => {
                const hasVoted = poll.voters?.includes(user?.uid || '');
                const totalVotes = poll.options.reduce((acc, curr) => acc + curr.votes, 0);
                
                return (
                  <div key={poll.id} className="space-y-4 border-b pb-4 last:border-b-0">
                    <h4 className="text-sm font-semibold border-l-4 border-primary pl-3">{poll.question}</h4>
                    <div className="grid gap-2">
                      {poll.options.map((opt, idx) => {
                        const percentage = totalVotes > 0 ? (opt.votes / totalVotes) * 100 : 0;
                        return (
                          <div key={idx} className="space-y-1">
                            <Button 
                              variant={hasVoted ? 'ghost' : 'outline'}
                              disabled={hasVoted}
                              className={`w-full justify-between h-auto py-2 transition-all ${!hasVoted && 'hover:bg-primary/5 hover:border-primary/50'}`}
                              onClick={() => handleVote(poll.id, idx)}
                            >
                              <span className="text-xs">{opt.text}</span>
                              {hasVoted && <span className="text-[10px] font-bold">{Math.round(percentage)}%</span>}
                            </Button>
                            {hasVoted && <Progress value={percentage} className="h-1" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </CardContent>
        </Card>

        <Card className="lg:col-span-1 shadow-sm border-accent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="size-5 text-primary" /> Voice of Campus
            </CardTitle>
            <CardDescription>Direct feedback to the mess staff.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Category</label>
                <Select value={feedbackCategory} onValueChange={setFeedbackCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Food Quality">Food Quality</SelectItem>
                    <SelectItem value="Service">Service</SelectItem>
                    <SelectItem value="Hygiene">Hygiene</SelectItem>
                    <SelectItem value="Suggestions">Suggestions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Meal Type</label>
                <Select value={feedbackMealType} onValueChange={setFeedbackMealType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakfast">Breakfast</SelectItem>
                    <SelectItem value="lunch">Lunch</SelectItem>
                    <SelectItem value="dinner">Dinner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">URN</label>
                <Input placeholder="Roll Number" value={feedbackURN} onChange={e => setFeedbackURN(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Phone</label>
                <Input placeholder="10 Digits" value={feedbackPhone} onChange={e => setFeedbackPhone(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Meal Date</label>
              <Input type="date" value={feedbackMealDate} onChange={e => setFeedbackMealDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Message</label>
              <Textarea 
                placeholder="Share your thoughts..." 
                className="min-h-[80px] text-sm"
                value={feedbackMsg}
                onChange={e => setFeedbackMsg(e.target.value)}
              />
            </div>
            <Button 
              className="w-full" 
              onClick={handleSubmitFeedback} 
              disabled={isSubmittingFeedback || !feedbackMsg}
            >
              <Send className="mr-2 size-4" /> 
              {isSubmittingFeedback ? "Sending..." : "Submit Feedback"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!pendingBooking} onOpenChange={() => setPendingBooking(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Meal Reservation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to book <strong>{pendingBooking?.type}</strong> for <strong>{pendingBooking ? format(new Date(pendingBooking.date), 'PPP') : ''}</strong>? 
              <br /><br />
              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted p-2 rounded">
                <AlertCircle className="size-4 shrink-0" />
                <span>Reservations help us minimize food waste. Please ensure you attend the meal once booked. Bookings are final.</span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBooking}>Confirm Booking</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
