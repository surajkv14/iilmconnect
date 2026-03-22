
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc, orderBy, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Utensils, Bell, Vote, Plus, Trash2, ChefHat, ShieldAlert, Salad, X, QrCode, Scan, History, MessageSquare, ListTodo } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, addDays } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QRCodeSVG } from 'qrcode.react';

interface MealBooking { id: string; studentId: string; studentName: string; mealType: string; date: string; status: string; couponCode: string; }
interface MessMeal { id: string; date: string; type: string; items: any[]; }
interface Poll { id: string; question: string; options: { text: string; votes: number }[]; isActive: boolean; }
interface Feedback { id: string; userId: string; userName: string; message: string; category: string; timestamp: any; }

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

  // Poll Builder State
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);

  const canAccess = userProfile?.userType === 'mess_staff' || userProfile?.userType === 'admin';

  // Queries
  const today = format(new Date(), 'yyyy-MM-dd');
  const menuQuery = useMemoFirebase(() => canAccess ? query(collection(firestore, 'menu'), orderBy('date', 'desc')) : null, [firestore, canAccess]);
  const { data: menuList, isLoading: isMenuLoading } = useCollection<MessMeal>(menuQuery);

  const bookingsQuery = useMemoFirebase(() => canAccess ? query(collection(firestore, 'bookings'), orderBy('timestamp', 'desc')) : null, [firestore, canAccess]);
  const { data: allBookings, isLoading: isBookingsLoading } = useCollection<MealBooking>(bookingsQuery);

  const pollsQuery = useMemoFirebase(() => canAccess ? query(collection(firestore, 'polls'), orderBy('isActive', 'desc')) : null, [firestore, canAccess]);
  const { data: pollList, isLoading: isPollsLoading } = useCollection<Poll>(pollsQuery);

  const feedbackQuery = useMemoFirebase(() => canAccess ? query(collection(firestore, 'feedback'), orderBy('timestamp', 'desc')) : null, [firestore, canAccess]);
  const { data: feedbackList, isLoading: isFeedbackLoading } = useCollection<Feedback>(feedbackQuery);

  const todayBookings = useMemo(() => allBookings?.filter(b => b.date === today) || [], [allBookings, today]);
  const servedCount = todayBookings.filter(b => b.status === 'consumed').length;
  const totalBooked = todayBookings.length;

  const [scanUrl, setScanUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setScanUrl(`${window.location.origin}/scan-meal`);
    }
  }, []);

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
    if (!firestore || !pollQuestion || pollOptions.some(opt => !opt)) {
      toast({ variant: 'destructive', title: "Incomplete Poll", description: "Provide a question and all options." });
      return;
    }

    addDocumentNonBlocking(collection(firestore, 'polls'), {
      question: pollQuestion,
      options: pollOptions.map(opt => ({ text: opt, votes: 0 })),
      isActive: true,
      voters: [],
      createdAt: new Date().toISOString()
    });

    setPollQuestion("");
    setPollOptions(["", ""]);
    toast({ title: "Poll Created", description: "Students can now vote on this topic." });
  };

  const handleManualAvail = (bookingId: string) => {
    updateDocumentNonBlocking(doc(firestore, 'bookings', bookingId), { 
      status: 'consumed',
      timestampAvailed: new Date().toISOString()
    });
    toast({ title: "Updated", description: "Meal marked as consumed manually." });
  };

  const togglePollStatus = (pollId: string, currentStatus: boolean) => {
    updateDocumentNonBlocking(doc(firestore, 'polls', pollId), { isActive: !currentStatus });
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Staff Portal</h1>
            {userProfile?.userType === 'admin' && <Badge variant="secondary">Admin View</Badge>}
          </div>
          <p className="text-muted-foreground">Verification and dining management system.</p>
        </div>
        <div className="flex items-center gap-4 bg-primary/5 p-3 rounded-lg border border-primary/10">
          <div className="text-right">
            <div className="text-xs font-bold uppercase text-primary">Live Stats</div>
            <div className="text-sm font-medium">{servedCount} / {totalBooked} Served</div>
          </div>
          <Progress value={totalBooked > 0 ? (servedCount / totalBooked) * 100 : 0} className="w-24 h-2" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-primary/20 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <QrCode className="size-5 text-primary" /> Verification station
            </CardTitle>
            <CardDescription>Students scan this to avail booked meals.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6 space-y-6">
            <div className="p-4 bg-white rounded-xl shadow-inner border-4 border-primary/20">
              {scanUrl && (
                <QRCodeSVG 
                  value={scanUrl} 
                  size={200} 
                  level="H"
                  includeMargin={true}
                />
              )}
            </div>
            <div className="text-center space-y-2">
              <Badge variant="outline" className="animate-pulse">Active Verification Session</Badge>
              <p className="text-[10px] text-muted-foreground">Refreshing dynamic token every 5 minutes</p>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/30 flex flex-col items-start gap-1 p-3">
             <div className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                <Scan className="size-3" /> SCAN INSTRUCTIONS
             </div>
             <p className="text-[10px] text-muted-foreground">1. Student scans with phone. 2. Verification occurs automatically. 3. System marks meal as consumed.</p>
          </CardFooter>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="size-5 text-primary" /> Real-time Consumption
            </CardTitle>
            <CardDescription>Monitor live pickups and handle manual overrides.</CardDescription>
          </CardHeader>
          <CardContent>
            {isBookingsLoading ? <Skeleton className="h-64 w-full" /> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Meal</TableHead>
                    <TableHead>Coupon</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayBookings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground italic">
                        No bookings for today yet.
                      </TableCell>
                    </TableRow>
                  ) : todayBookings.map(b => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.studentName}</TableCell>
                      <TableCell className="capitalize">{b.mealType}</TableCell>
                      <TableCell><Badge variant="secondary" className="font-mono">{b.couponCode}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={b.status === 'consumed' ? 'secondary' : 'default'}>
                          {b.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {b.status !== 'consumed' && (
                          <Button size="sm" variant="ghost" onClick={() => handleManualAvail(b.id)}>
                            Verify Manually
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
      </div>

      <Tabs defaultValue="menu" className="space-y-6">
        <TabsList>
          <TabsTrigger value="menu"><Salad className="mr-2 size-4" /> Menu Builder</TabsTrigger>
          <TabsTrigger value="polls"><Vote className="mr-2 size-4" /> Poll Manager</TabsTrigger>
          <TabsTrigger value="feedback"><MessageSquare className="mr-2 size-4" /> Insights</TabsTrigger>
          <TabsTrigger value="all-orders"><ListTodo className="mr-2 size-4" /> Bookings</TabsTrigger>
        </TabsList>

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
           <div className="grid gap-6 md:grid-cols-3">
             <Card>
               <CardHeader>
                 <CardTitle>Create New Poll</CardTitle>
                 <CardDescription>Gather student opinions on dishes.</CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Question</label>
                    <Input placeholder="Should we add Pasta next Friday?" value={pollQuestion} onChange={e => setPollQuestion(e.target.value)} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Options</label>
                    {pollOptions.map((opt, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input placeholder={`Option ${idx + 1}`} value={opt} onChange={e => {
                          const newOpts = [...pollOptions];
                          newOpts[idx] = e.target.value;
                          setPollOptions(newOpts);
                        }} />
                        {pollOptions.length > 2 && (
                          <Button variant="ghost" size="icon" onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}>
                            <X className="size-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setPollOptions([...pollOptions, ""])}>
                      <Plus className="mr-2 size-3" /> Add Option
                    </Button>
                 </div>
                 <Button className="w-full" onClick={handleCreatePoll}>Launch Poll</Button>
               </CardContent>
             </Card>

             <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Poll Results & Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {pollList?.map(poll => (
                      <Card key={poll.id} className="bg-muted/30">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">{poll.question}</CardTitle>
                            <div className="flex gap-2">
                              <Badge variant={poll.isActive ? 'default' : 'secondary'}>{poll.isActive ? 'Active' : 'Closed'}</Badge>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteDocumentNonBlocking(doc(firestore, 'polls', poll.id))}>
                                <Trash2 className="size-3 text-destructive" />
                              </Button>
                            </div>
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
                                <Progress value={percentage} className="h-1.5" />
                              </div>
                            );
                          })}
                          <Button variant="outline" size="sm" className="w-full mt-2 text-xs" onClick={() => togglePollStatus(poll.id, poll.isActive)}>
                            {poll.isActive ? "Close Poll" : "Re-open Poll"}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
             </Card>
           </div>
        </TabsContent>

        <TabsContent value="feedback">
          <Card>
            <CardHeader>
              <CardTitle>Student Feedback Inbox</CardTitle>
              <CardDescription>Direct messages from campus diners.</CardDescription>
            </CardHeader>
            <CardContent>
              {isFeedbackLoading ? <Skeleton className="h-48 w-full" /> : (
                <div className="space-y-4">
                  {feedbackList?.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground italic">No feedback received yet.</div>
                  ) : feedbackList?.map(fb => (
                    <Card key={fb.id}>
                      <CardHeader className="py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{fb.category}</Badge>
                            <span className="text-sm font-bold">{fb.userName}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">{fb.timestamp?.toDate() ? format(fb.timestamp.toDate(), 'PPP p') : 'Just now'}</span>
                        </div>
                      </CardHeader>
                      <CardContent className="py-3 text-sm italic">
                        "{fb.message}"
                      </CardContent>
                      <CardFooter className="py-2 flex justify-end">
                        <Button variant="ghost" size="sm" className="text-destructive h-7" onClick={() => deleteDocumentNonBlocking(doc(firestore, 'feedback', fb.id))}>
                          <Trash2 className="mr-2 size-3" /> Dismiss
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all-orders">
          <Card>
            <CardHeader>
              <CardTitle>Historical Bookings</CardTitle>
              <CardDescription>View all bookings across time for operational audit.</CardDescription>
            </CardHeader>
            <CardContent>
              {isBookingsLoading ? <Skeleton className="h-48 w-full" /> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Meal</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allBookings?.map(b => (
                      <TableRow key={b.id}>
                        <TableCell>{format(new Date(b.date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="font-medium">{b.studentName}</TableCell>
                        <TableCell className="capitalize">{b.mealType}</TableCell>
                        <TableCell>
                           <Badge variant={b.status === 'consumed' ? 'secondary' : 'outline'}>
                            {b.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
