
'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UtensilsCrossed, Leaf, Wheat, Nut } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

type MealItem = { name: string; type: 'Veg' | 'Non-Veg' | 'Vegan'; calories: number; };
type Meal = {
  breakfast: MealItem[];
  lunch: MealItem[];
  dinner: MealItem[];
};

const menuData: { today: Meal, tomorrow: Meal } = {
  today: {
    breakfast: [
      { name: 'Idli Sambar', type: 'Veg', calories: 250 },
      { name: 'Omelette', type: 'Non-Veg', calories: 180 },
      { name: 'Fruit Platter', type: 'Vegan', calories: 120 },
    ],
    lunch: [
      { name: 'Rajma Chawal', type: 'Veg', calories: 450 },
      { name: 'Chicken Curry', type: 'Non-Veg', calories: 550 },
      { name: 'Mixed Veggies', type: 'Vegan', calories: 300 },
      { name: 'Roti', type: 'Veg', calories: 80 },
    ],
    dinner: [
      { name: 'Paneer Butter Masala', type: 'Veg', calories: 500 },
      { name: 'Egg Bhurji', type: 'Non-Veg', calories: 350 },
      { name: 'Dal Tadka', type: 'Vegan', calories: 320 },
      { name: 'Jeera Rice', type: 'Veg', calories: 200 },
    ],
  },
  tomorrow: {
    breakfast: [
        { name: 'Aloo Paratha', type: 'Veg', calories: 300 },
        { name: 'Scrambled Eggs', type: 'Non-Veg', calories: 200 },
        { name: 'Oatmeal', type: 'Vegan', calories: 150 },
    ],
    lunch: [
        { name: 'Chole Bhature', type: 'Veg', calories: 600 },
        { name: 'Fish Fry', type: 'Non-Veg', calories: 450 },
        { name: 'Lentil Soup', type: 'Vegan', calories: 280 },
        { name: 'Brown Rice', type: 'Veg', calories: 180 },
    ],
    dinner: [
        { name: 'Veg Pulao', type: 'Veg', calories: 400 },
        { name: 'Mutton Rogan Josh', type: 'Non-Veg', calories: 650 },
        { name: 'Tofu Stir Fry', type: 'Vegan', calories: 380 },
        { name: 'Naan', type: 'Veg', calories: 150 },
    ],
  }
};

const MealCard = ({ title, items }: { title: string, items: MealItem[] }) => (
    <Card>
        <CardHeader>
            <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
            <ul className="space-y-4">
                {items.map((item, index) => (
                    <li key={index} className="flex justify-between items-center">
                        <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">{item.calories} kcal</p>
                        </div>
                        <Badge variant={item.type === 'Non-Veg' ? 'destructive' : item.type === 'Vegan' ? 'secondary' : 'default'}>
                            {item.type}
                        </Badge>
                    </li>
                ))}
            </ul>
        </CardContent>
    </Card>
);

export default function SmartMessPage() {
  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow'>('today');
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const getMealDate = (day: 'today' | 'tomorrow') => {
    const date = new Date();
    if (day === 'tomorrow') {
      date.setDate(date.getDate() + 1);
    }
    return date.toISOString().split('T')[0];
  };

  const selectionsQuery = useMemoFirebase(() => 
    (user && firestore) ? query(collection(firestore, 'bookings'), where('studentId', '==', user.uid)) : null,
    [user, firestore]
  );
  
  const { data: bookedSelections, isLoading: isLoadingSelections } = useCollection(selectionsQuery);

  const handleBookingToggle = (mealType: 'breakfast' | 'lunch' | 'dinner') => {
    if (!user || !firestore) return;

    const date = getMealDate(activeTab);
    const mealId = `${date}-${mealType}`;
    const existingBooking = bookedSelections?.find(selection => selection.mealId === mealId);

    if (existingBooking) {
      const docRef = doc(firestore, 'bookings', existingBooking.id);
      deleteDocumentNonBlocking(docRef);
    } else {
      addDocumentNonBlocking(collection(firestore, 'bookings'), {
        studentId: user.uid,
        mealId: mealId,
        date: date,
        mealType: mealType,
        status: 'booked',
        timestamp: new Date().toISOString(),
      });
    }
  };
  
  const isBooked = (mealType: 'breakfast' | 'lunch' | 'dinner') => {
    if (!bookedSelections) return false;
    const date = getMealDate(activeTab);
    const mealId = `${date}-${mealType}`;
    return bookedSelections.some(selection => selection.mealId === mealId);
  };

  const bookingSectionContent = () => {
    if (isUserLoading || isLoadingSelections) {
        return (
             <div className="space-y-4">
                <Skeleton className="h-5 w-48" />
                <div className="flex flex-wrap gap-4">
                    <Skeleton className="h-10 w-36" />
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-36" />
                </div>
            </div>
        )
    }
    if (!user) {
        return (
            <p className="text-muted-foreground">
                Please <Link href="/login" className="text-primary underline font-medium">log in</Link> to book your meals.
            </p>
        )
    }
    return (
        <div>
            <h3 className="font-medium mb-4">Book Your Meal for {activeTab === 'today' ? 'Today' : 'Tomorrow'}</h3>
            <div className="flex flex-wrap gap-4">
                {(['breakfast', 'lunch', 'dinner'] as const).map(mealType => {
                    const booked = isBooked(mealType);
                    return (
                        <Button
                            key={mealType}
                            variant={booked ? 'default' : 'outline'}
                            onClick={() => handleBookingToggle(mealType)}
                        >
                            {`${mealType.charAt(0).toUpperCase() + mealType.slice(1)} ${booked ? '(Booked)' : ''}`}
                        </Button>
                    )
                })}
            </div>
        </div>
    )
  }

  return (
    <div className="space-y-8">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Meal Booking</h1>
            <Button asChild variant="outline">
                <Link href={`/profile/${user?.uid}`}>
                    <Leaf className="mr-2 size-4 text-green-500" /> My Preferences
                </Link>
            </Button>
        </div>

        <Tabs defaultValue="today" onValueChange={(value) => setActiveTab(value as 'today' | 'tomorrow')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:w-96">
                <TabsTrigger value="today">Today's Menu</TabsTrigger>
                <TabsTrigger value="tomorrow">Tomorrow's Menu</TabsTrigger>
            </TabsList>
            <TabsContent value="today" className="pt-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <MealCard title="Breakfast" items={menuData.today.breakfast} />
                    <MealCard title="Lunch" items={menuData.today.lunch} />
                    <MealCard title="Dinner" items={menuData.today.dinner} />
                </div>
            </TabsContent>
            <TabsContent value="tomorrow" className="pt-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <MealCard title="Breakfast" items={menuData.tomorrow.breakfast} />
                    <MealCard title="Lunch" items={menuData.tomorrow.lunch} />
                    <MealCard title="Dinner" items={menuData.tomorrow.dinner} />
                </div>
            </TabsContent>
        </Tabs>
        
        <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
                <CardTitle>Reservation Desk</CardTitle>
                <CardDescription>Confirm your presence for upcoming meals to help us minimize waste.</CardDescription>
            </CardHeader>
            <CardContent>
                {bookingSectionContent()}
            </CardContent>
            <CardFooter className="border-t pt-4">
                 <p className="text-xs text-muted-foreground flex items-center">
                    <UtensilsCrossed className="mr-2 size-3" />
                    Bookings close 2 hours before the scheduled meal time.
                </p>
            </CardFooter>
        </Card>
    </div>
  );
}
