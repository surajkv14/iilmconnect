
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { TrendingDown, Users, ArrowRight, Salad, Zap } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [today, setToday] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Determine today's date only on the client to avoid hydration errors
    setToday(new Date().toISOString().split('T')[0]);
  }, []);

  // Fetch bookings for today
  const bookingsQuery = useMemoFirebase(() => 
    (firestore && today) ? query(collection(firestore, 'bookings'), where('date', '==', today)) : null,
    [firestore, today]
  );
  const { data: bookings, isLoading: isLoadingBookings } = useCollection(bookingsQuery);

  const mockConsumptionData = [
    { name: 'Mon', count: 420 },
    { name: 'Tue', count: 380 },
    { name: 'Wed', count: 510 },
    { name: 'Thu', count: 440 },
    { name: 'Fri', count: 390 },
    { name: 'Sat', count: 210 },
    { name: 'Sun', count: 180 },
  ];

  if (!mounted) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-12 w-1/4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Mess Dashboard</h1>
        <p className="text-muted-foreground">Smart monitoring for campus dining and sustainability.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's Bookings</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings?.length || 482}</div>
            <p className="text-xs text-muted-foreground">+12% from last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Waste Saved (MTD)</CardTitle>
            <TrendingDown className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">124 kg</div>
            <p className="text-xs text-muted-foreground">8% reduction in food waste</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Veg vs Non-Veg</CardTitle>
            <Salad className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">65% / 35%</div>
            <p className="text-xs text-muted-foreground">Preference trend: High Veg</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Meal</CardTitle>
            <Zap className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Dinner</div>
            <p className="text-xs text-muted-foreground">Paneer Butter Masala & Roti</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Weekly Consumption Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockConsumptionData}>
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/smart-mess">
              <Button className="w-full justify-between" variant="outline">
                Book Next Meal <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link href={user ? `/profile/${user.uid}` : '/login'}>
              <Button className="w-full justify-between" variant="outline">
                Update Allergies <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Card className="bg-primary/5 border-primary/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Sustainability Tip</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Book your meals at least 24 hours in advance to help the mess team reduce preparation waste and optimize inventory.
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
