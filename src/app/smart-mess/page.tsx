'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UtensilsCrossed, Leaf, Wheat, Nut } from 'lucide-react';

const menuData = {
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

const allergyInfo = [
    { icon: <Wheat className="size-4" />, label: 'Gluten' },
    { icon: <Nut className="size-4" />, label: 'Nuts' },
]

const MealCard = ({ title, items }: { title: string, items: typeof menuData.today.breakfast }) => (
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
)

export default function SmartMessPage() {
  const [bookedMeals, setBookedMeals] = useState<{ [key: string]: boolean }>({
    breakfast: false,
    lunch: false,
    dinner: true,
  });

  const toggleMealBooking = (meal: string) => {
    setBookedMeals((prev) => ({ ...prev, [meal]: !prev[meal] }));
  };

  return (
    <div className="space-y-8">
        <div className="flex items-center justify-between space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Smart Mess</h1>
            <Button>
                <Leaf className="mr-2 size-4" /> Manage Preferences
            </Button>
        </div>

        <Tabs defaultValue="today" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:w-96">
                <TabsTrigger value="today">Today's Menu</TabsTrigger>
                <TabsTrigger value="tomorrow">Tomorrow's Menu</TabsTrigger>
            </TabsList>
            <TabsContent value="today" className="pt-6">
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    <MealCard title="Breakfast" items={menuData.today.breakfast} />
                    <MealCard title="Lunch" items={menuData.today.lunch} />
                    <MealCard title="Dinner" items={menuData.today.dinner} />
                </div>
            </TabsContent>
            <TabsContent value="tomorrow" className="pt-6">
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    <MealCard title="Breakfast" items={menuData.tomorrow.breakfast} />
                    <MealCard title="Lunch" items={menuData.tomorrow.lunch} />
                    <MealCard title="Dinner" items={menuData.tomorrow.dinner} />
                </div>
            </TabsContent>
        </Tabs>
        
        <Card>
            <CardHeader>
                <CardTitle>Meal Booking & Preferences</CardTitle>
                <CardDescription>Book your meals in advance and set your dietary needs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="font-medium mb-2">Book Your Meal for Today</h3>
                    <div className="flex flex-wrap gap-4">
                        <Button
                            variant={bookedMeals.breakfast ? 'default' : 'outline'}
                            onClick={() => toggleMealBooking('breakfast')}
                        >
                            {bookedMeals.breakfast ? 'Breakfast (Booked)' : 'Breakfast'}
                        </Button>
                        <Button
                            variant={bookedMeals.lunch ? 'default' : 'outline'}
                            onClick={() => toggleMealBooking('lunch')}
                        >
                            {bookedMeals.lunch ? 'Lunch (Booked)' : 'Lunch'}
                        </Button>
                        <Button
                            variant={bookedMeals.dinner ? 'default' : 'outline'}
                            onClick={() => toggleMealBooking('dinner')}
                        >
                           {bookedMeals.dinner ? 'Dinner (Booked)' : 'Dinner'}
                        </Button>
                    </div>
                </div>
                <div>
                    <h3 className="font-medium mb-2">My Allergies</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {allergyInfo.map(info => (
                            <div key={info.label} className="flex items-center gap-2">
                                {info.icon}
                                <span>{info.label}</span>
                            </div>
                        ))}
                         <Button variant="link" size="sm" className="p-0 h-auto">Edit</Button>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                 <p className="text-xs text-muted-foreground">
                    <UtensilsCrossed className="inline-block mr-2 size-3" />
                    Bookings close 2 hours before meal time.
                </p>
            </CardFooter>
        </Card>
    </div>
  );
}
