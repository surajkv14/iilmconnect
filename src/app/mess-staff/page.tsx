
'use client';

import { useState } from 'react';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Utensils, Bell, Vote, Plus, Trash2, CheckCircle, ChefHat, ShieldAlert, Salad, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, addDays } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MealBooking { id: string; studentId: string; studentName: string; mealType: string; date: string; status: string; couponCode: string; }
interface MessMeal { id: string; date: string; type: string; items: any[]; }
interface Poll { id: string; question: string; options: { text: string; votes: number }[]; isActive: boolean; }

export default function MessStaffPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userProfileRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<any>(userProfileRef);

  // Menu Builder State
  const [newMealDate, setNewMealDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [newMealType, setNewMealType] = useState<'breakfast' | 'lunch' | 'dinner'>('lunch');
  const [pendingItems, setPendingItems] = useState<{ name: string; category: string; calories: number }[]>([]);
  const [itemName, setItemName] = useState("");
  const [itemCategory, setItemCategory] = useState("Veg");

  // Poll State
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState("");

  const canAccess = userProfile?.userType === 'mess_staff' || userProfile?.userType === 'admin';

  // Queries
  const menuQuery = useMemoFirebase(() => canAccess ? query(collection(firestore, 'menu'), orderBy('date', 'desc')) : null, [firestore, canAccess]);
  const { data: menuList, isLoading: isMenuLoading } = useCollection<MessMeal>(menuQuery);

  const bookingsQuery = useMemoFirebase(() => canAccess ? query(collection(firestore, 'bookings'), orderBy('timestamp', 'desc')) : null, [firestore, canAccess]);
  const { data: allBookings, isLoading: isBookingsLoading } = useCollection<MealBooking>(bookingsQuery);

  const pollsQuery = useMemoFirebase(() => canAccess ? query(collection(firestore, 'polls'), orderBy('isActive', 'desc')) : null, [firestore, canAccess]);
  const { data: pollList, isLoading: isPollsLoading } = useCollection<Poll>(pollsQuery);

  const addPendingItem = () => {
    if (!itemName) return;
    setPendingItems([...pendingItems, { name: itemName, category: itemCategory, calories: 300 }]);
    setItemName("");
  };

  const removePendingItem = (index: number) => {
    setPendingItems(pendingItems.filter((_, i) => i !== index));
  };

  const handlePublishMenu = () => {
    if (!firestore || pendingItems.length === 0) {
      toast({ variant: 'destructive', title: "Empty Menu", description: "Please add at least one item." });
      return;
    }

    addDocumentNonBlocking(collection(firestore, 'menu'), {
      date: newMealDate,
      type: newMealType,
      items: pendingItems
    });
    
    setPendingItems([]);
    toast({ title: "Menu Published", description: `${newMealType} for ${newMealDate} is live.` });
  };

  const handleCreatePoll = () => {
    if (!firestore || !pollQuestion) return;
    const options = pollOptions.split(',').map(o => ({ text: o.trim(), votes: 0 }));

    addDocumentNonBlocking(collection(firestore, 'polls'), {
      question: pollQuestion,
      options: options,
      voters: [],
      isActive: true,
      createdAt: new Date().toISOString()
    });
    setPollQuestion("");
    setPollOptions("");
    toast({ title: "Poll Created", description: "Students can now vote." });
  };

  const handleNotifyReady = (booking: MealBooking) => {
    if (!firestore) return;
    updateDocumentNonBlocking(doc(firestore, 'bookings', booking.id), { status: 'ready' });
    
    addDocumentNonBlocking(collection(firestore, 'notifications'), {
      userId: booking.studentId,
      message: `Your ${booking.mealType} is ready! Coupon: ${booking.couponCode}.`,
      type: 'meal_ready',
      timestamp: new Date().toISOString(),
      isRead: false
    });
    toast({ title: "Notification Sent", description: `Alert sent to ${booking.studentName}.` });
  };

  if (isUserLoading || isProfileLoading) {
    return <div className="p-8 space-y-4"><Skeleton className="h-12 w-1/4" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!canAccess) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Alert variant="destructive" className="max-w-md">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>Operational Portal access is restricted to Mess Staff.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Staff Portal</h1>
            {userProfile?.userType === 'admin' && <Badge variant="secondary">Admin View</Badge>}
          </div>
          <p className="text-muted-foreground">Operational dashboard for campus dining.</p>
        </div>
        <ChefHat className="size-10 text-primary opacity-20" />
      </div>

      <Tabs defaultValue="orders" className="space-y-6">
        <TabsList>
          <TabsTrigger value="orders"><Utensils className="mr-2 size-4" /> Live Orders</TabsTrigger>
          <TabsTrigger value="menu"><Salad className="mr-2 size-4" /> Menu Builder</TabsTrigger>
          <TabsTrigger value="polls"><Vote className="mr-2 size-4" /> Polls</TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Today's Bookings</CardTitle>
              <CardDescription>Track incoming requests and alert students on completion.</CardDescription>
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
                        <TableCell className="font-medium truncate max-w-[150px]">{b.studentName}</TableCell>
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
                              <Bell className="mr-1 size-3" /> Ready
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
                <CardTitle>Create Menu Entry</CardTitle>
                <CardDescription>Build a meal with multiple items.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Date</label>
                    <Input type="date" value={newMealDate} onChange={e => setNewMealDate(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Type</label>
                    <Select value={newMealType} onValueChange={(v: any) => setNewMealType(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="breakfast">Breakfast</SelectItem>
                        <SelectItem value="lunch">Lunch</SelectItem>
                        <SelectItem value="dinner">Dinner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-3 border rounded-lg bg-muted/30 space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Add Dish</label>
                    <div className="flex gap-2">
                      <Input placeholder="Dish name..." value={itemName} onChange={e => setItemName(e.target.value)} />
                      <Button size="icon" onClick={addPendingItem}><Plus className="size-4" /></Button>
                    </div>
                  </div>
                  <Select value={itemCategory} onValueChange={setItemCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Veg">Vegetarian</SelectItem>
                      <SelectItem value="Non-Veg">Non-Vegetarian</SelectItem>
                      <SelectItem value="Vegan">Vegan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold">Planned Items ({pendingItems.length})</label>
                  <div className="space-y-2">
                    {pendingItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-background border rounded text-sm">
                        <div className="flex flex-col">
                          <span className="font-medium">{item.name}</span>
                          <span className="text-[10px] text-muted-foreground">{item.category}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removePendingItem(idx)}>
                          <X className="size-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <Button className="w-full" onClick={handlePublishMenu} disabled={pendingItems.length === 0}>
                  Publish Daily Menu
                </Button>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Active Menu Records</CardTitle>
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
                          <TableCell className="font-medium">{format(new Date(m.date), 'MMM dd')}</TableCell>
                          <TableCell className="capitalize">{m.type}</TableCell>
                          <TableCell className="max-w-xs">
                            <div className="flex flex-wrap gap-1">
                              {m.items?.map((i, idx) => (
                                <Badge key={idx} variant="outline" className="text-[10px]">
                                  {i.name}
                                </Badge>
                              ))}
                            </div>
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
                <CardTitle>Launch Feedback Poll</CardTitle>
                <CardDescription>Survey students for menu improvements.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="Question (e.g., Which dessert for Sunday?)" value={pollQuestion} onChange={e => setPollQuestion(e.target.value)} />
                <Input placeholder="Options (comma separated: Cake, Pudding...)" value={pollOptions} onChange={e => setPollOptions(e.target.value)} />
                <Button className="w-full" onClick={handleCreatePoll}>Launch Mess Pulse</Button>
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
                    {poll.options.map((opt, idx) => {
                      const totalVotes = poll.options.reduce((acc, curr) => acc + curr.votes, 0);
                      const percentage = totalVotes > 0 ? (opt.votes / totalVotes) * 100 : 0;
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span>{opt.text}</span>
                            <span className="font-bold">{opt.votes} votes ({Math.round(percentage)}%)</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                  <CardFooter className="pt-0">
                    {poll.isActive && (
                      <Button variant="outline" size="sm" className="w-full" onClick={() => updateDocumentNonBlocking(doc(firestore, 'polls', poll.id), { isActive: false })}>
                        End Voting
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
