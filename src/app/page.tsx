import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, BookCopy, Users, Utensils, CalendarCheck } from 'lucide-react';

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center space-x-2">
          <Button>Download Report</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">+5.2% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
             <BookCopy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">56</div>
            <p className="text-xs text-muted-foreground">+2 since last semester</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faculty Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">128</div>
            <p className="text-xs text-muted-foreground">+10 since last year</p>
          </CardContent>
        </Card>
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
