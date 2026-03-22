
'use client';

import { useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Utensils, Bell, Vote, Plus, Trash2, CheckCircle, ChefHat } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, addDays } from 'date-fns';

interface MealBooking { id: string; studentId: string; studentName: string; mealType: string; date: string; status: string; couponCode: string; }
interface MessMeal { id: string; date: string; type: string; items: any[]; }
interface Poll { id: string; question: string; options: { text: string; votes: number }[]; isActive: boolean; }

export default function MessStaffPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  // Menu State
  const [newMealDate, setNewMealDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [newMealType, setNewMealType] = useState<'breakfast' | 'lunch' | 'dinner'>('lunch');
  const [newMealItems, setNewMealItems] = useState("");

  // Poll State
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState("");

  const isStaff = user?.email?.includes('staff') || user?.uid === 'staff-uid'; // Logic placeholder

  // Queries
  const menuQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'menu'), orderBy('date', 'desc')) : null, [firestore]);
  const { data: menuList, isLoading: isMenuLoading } = useCollection<MessMeal>(menuQuery);

  const bookingsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'bookings'), orderBy('timestamp', 'desc')) : null, [firestore]);
  const { data: allBookings, isLoading: isBookingsLoading } = useCollection<MealBooking>(bookingsQuery);

  const pollsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'polls'), orderBy('isActive', 'desc')) : null, [firestore]);
  const { data: pollList, isLoading: isPollsLoading } = useCollection<Poll>(pollsQuery);

  const handleAddMenu = () => {
    if (!firestore || !newMealItems) return;
    const items = newMealItems.split(',').map(s => ({
      name: s.trim(),
      category: 'Veg',
      calories: 300
    }));

    addDocumentNonBlocking(collection(firestore, 'menu'), {
      date: newMealDate,
      type: newMealType,
      items: items
    });
    setNewMealItems("");
    toast({ title: "Menu Updated", description: `${newMealType} for ${newMealDate} added.` });
  };

  const handleCreatePoll = () => {
    if (!firestore || !pollQuestion) return;
    const options = pollOptions.split(',').map(o => ({ text: o.trim(), votes: 0 }));

    addDocumentNonBlocking(collection(firestore, 'polls'), {
      question: pollQuestion,
      options: options,
      isActive: true,
      createdAt: new Date().toISOString()
    });
    setPollQuestion("");
    setPollOptions("");
    toast({ title: "Poll Created", description: "Students can now vote on this topic." });
  };

  const handleNotifyReady = (booking: MealBooking) => {
    if (!firestore) return;
    updateDocumentNonBlocking(doc(firestore, 'bookings', booking.id), { status: 'ready' });
    
    addDocumentNonBlocking(collection(firestore, 'notifications'), {
      userId: booking.studentId,
      message: `Your ${booking.mealType} is ready! Please collect it using coupon ${booking.couponCode}.`,
      type: 'meal_ready',
      timestamp: new Date().toISOString(),
      isRead: false
    });
    toast({ title: "Notification Sent", description: `Student ${booking.studentName} has been alerted.` });
  };

  if (isUserLoading) return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Portal</h1>
          <p className="text-muted-foreground">Manage operations, live orders, and student engagement.</p>
        </div>
        <ChefHat className="size-10 text-primary opacity-20" />
      </div>

      <Tabs defaultValue="orders" className="space-y-6">
        <TabsList>
          <TabsTrigger value="orders"><Utensils className="mr-2 size-4" /> Live Orders</TabsTrigger>
          <TabsTrigger value="menu"><Plus className="mr-2 size-4" /> Menu Builder</TabsTrigger>
          <TabsTrigger value="polls"><Vote className="mr-2 size-4" /> Polls & Voting</TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Student Bookings</CardTitle>
              <CardDescription>Monitor daily presence and alert students when food is ready.</CardDescription>
            </CardHeader>
            <CardContent>
              {isBookingsLoading ? <Skeleton className="h-48 w-full" /> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Meal</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Coupon</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allBookings?.map(b => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">{b.studentName}</TableCell>
                        <TableCell className="capitalize">{b.mealType}</TableCell>
                        <TableCell>{format(new Date(b.date), 'MMM dd')}</TableCell>
                        <TableCell><Badge variant="outline" className="font-mono">{b.couponCode}</Badge></TableCell>
                        <TableCell>
                          <Badge variant={b.status === 'ready' ? 'secondary' : b.status === 'consumed' ? 'outline' : 'default'}>
                            {b.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {b.status === 'booked' && (
                            <Button size="sm" onClick={() => handleNotifyReady(b)}>
                              <Bell className="mr-2 size-3" /> Mark Ready
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="menu">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Add Daily Menu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium">Date</label>
                  <Input type="date" value={newMealDate} onChange={e => setNewMealDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium">Meal Type</label>
                  <select 
                    className="w-full rounded-md border p-2 text-sm"
                    value={newMealType}
                    onChange={e => setNewMealType(e.target.value as any)}
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium">Items (comma separated)</label>
                  <Input 
                    placeholder="Paneer, Dal, Rice..." 
                    value={newMealItems} 
                    onChange={e => setNewMealItems(e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={handleAddMenu}>Publish Menu</Button>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Existing Menus</CardTitle>
              </CardHeader>
              <CardContent>
                {isMenuLoading ? <Skeleton className="h-48 w-full" /> : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {menuList?.map(m => (
                        <TableRow key={m.id}>
                          <TableCell>{m.date}</TableCell>
                          <TableCell className="capitalize">{m.type}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {m.items?.map(i => i.name).join(', ')}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => deleteDocumentNonBlocking(doc(firestore, 'menu', m.id))}>
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="polls">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Create Food Poll</CardTitle>
                <CardDescription>Ask students what they want to see on the menu.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input 
                  placeholder="Question (e.g., Which snack for Friday?)" 
                  value={pollQuestion}
                  onChange={e => setPollQuestion(e.target.value)}
                />
                <Input 
                  placeholder="Options (e.g., Samosa, Pasta, Burger)" 
                  value={pollOptions}
                  onChange={e => setPollOptions(e.target.value)}
                />
                <Button className="w-full" onClick={handleCreatePoll}>Launch Poll</Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {pollList?.map(poll => (
                <Card key={poll.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{poll.question}</CardTitle>
                      <Badge variant={poll.isActive ? 'default' : 'secondary'}>{poll.isActive ? 'Active' : 'Closed'}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {poll.options.map((opt, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span>{opt.text}</span>
                        <span className="font-bold">{opt.votes} votes</span>
                      </div>
                    ))}
                  </CardContent>
                  <CardFooter className="pt-0">
                    {poll.isActive && (
                      <Button variant="outline" size="sm" className="w-full" onClick={() => updateDocumentNonBlocking(doc(firestore, 'polls', poll.id), { isActive: false })}>
                        Close Poll
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
