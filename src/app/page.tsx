'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, BookCopy, Users, Utensils, CalendarCheck } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface UserDoc {
  id: string;
  userType: 'student' | 'faculty' | 'alumni' | 'admin';
}

interface ClassDoc {
  id: string;
}

export default function Home() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserDoc>(userProfileRef);

  const isAdmin = userProfile?.userType === 'admin';

  const usersCollectionRef = useMemoFirebase(() => (isAdmin ? collection(firestore, 'users') : null), [isAdmin, firestore]);
  const { data: users, isLoading: areUsersLoading } = useCollection<UserDoc>(usersCollectionRef);

  const classesCollectionRef = useMemoFirebase(() => (isAdmin ? collection(firestore, 'classes') : null), [isAdmin, firestore]);
  const { data: classes, isLoading: areClassesLoading } = useCollection<ClassDoc>(classesCollectionRef);
  
  const [studentCount, setStudentCount] = useState<number | null>(null);
  const [facultyCount, setFacultyCount] = useState<number | null>(null);
  const [courseCount, setCourseCount] = useState<number | null>(null);
  
  useEffect(() => {
    if (users) {
      setStudentCount(users.filter(u => u.userType === 'student').length);
      setFacultyCount(users.filter(u => u.userType === 'faculty').length);
    }
  }, [users]);

  useEffect(() => {
    if (classes) {
      setCourseCount(classes.length);
    }
  }, [classes]);
  
  const isLoading = isUserLoading || isProfileLoading || (isAdmin && (areUsersLoading || areClassesLoading));

  const renderStatCard = (title: string, value: number | null, staticValue: string, changeText: string, icon: React.ReactNode) => {
    const displayValue = isAdmin ? (value !== null ? value.toString() : <Skeleton className="h-8 w-20" />) : staticValue;
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{isLoading && isAdmin ? <Skeleton className="h-8 w-20" /> : displayValue}</div>
          <p className="text-xs text-muted-foreground">{changeText}</p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center space-x-2">
          <Button>Download Report</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {renderStatCard("Total Students", studentCount, "1,234", "+5.2% from last month", <Users className="h-4 w-4 text-muted-foreground" />)}
        {renderStatCard("Active Courses", courseCount, "56", "+2 since last semester", <BookCopy className="h-4 w-4 text-muted-foreground" />)}
        {renderStatCard("Faculty Members", facultyCount, "128", "+10 since last year", <Users className="h-4 w-4 text-muted-foreground" />)}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92.8%</div>
            <p className="text-xs text-muted-foreground">-1.2% from yesterday</p>
          </CardContent>
        </Card>
      </div>
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Your Campus Hub</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/lms" className="block hover:no-underline">
            <Card className="flex flex-col h-full hover:border-primary transition-colors">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <BookCopy className="size-8 text-primary" />
                  <CardTitle className="text-xl">LMS Portal</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-muted-foreground">
                  Access courses, grades, and assignments. Your central place for all academic activities.
                </p>
              </CardContent>
              <CardFooter className="bg-muted/50 p-4">
                 <div className="flex items-center text-sm font-medium text-primary">
                    Go to LMS <ArrowRight className="ml-2 size-4" />
                 </div>
              </CardFooter>
            </Card>
          </Link>
          <Link href="/collabnest" className="block hover:no-underline">
            <Card className="flex flex-col h-full hover:border-primary transition-colors">
              <CardHeader>
                 <div className="flex items-center gap-4">
                  <Users className="size-8 text-primary" />
                  <CardTitle className="text-xl">CollabNest</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-muted-foreground">
                  Connect with peers, faculty, and alumni. Build your professional network.
                </p>
              </CardContent>
              <CardFooter className="bg-muted/50 p-4">
                 <div className="flex items-center text-sm font-medium text-primary">
                    Go to CollabNest <ArrowRight className="ml-2 size-4" />
                 </div>
              </CardFooter>
            </Card>
          </Link>
          <Link href="/smart-mess" className="block hover:no-underline">
            <Card className="flex flex-col h-full hover:border-primary transition-colors">
              <CardHeader>
                 <div className="flex items-center gap-4">
                  <Utensils className="size-8 text-primary" />
                  <CardTitle className="text-xl">Smart Mess</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-muted-foreground">
                  View menus, manage meal preferences, and track your diet.
                </p>
              </CardContent>
              <CardFooter className="bg-muted/50 p-4">
                 <div className="flex items-center text-sm font-medium text-primary">
                    Go to Smart Mess <ArrowRight className="ml-2 size-4" />
                 </div>
              </CardFooter>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
