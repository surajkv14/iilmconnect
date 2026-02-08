'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CourseCard } from '@/components/lms/course-card';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

// Updated Course type to match Firestore data model
interface Course {
  id: string;
  name: string;
  code: string;
  instructor: string;
}

const performanceData = [
    { name: 'Quiz 1', score: 85, max: 100 },
    { name: 'Quiz 2', score: 92, max: 100 },
    { name: 'Midterm', score: 78, max: 100 },
    { name: 'Quiz 3', score: 88, max: 100 },
    { name: 'Final', score: 95, max: 100 },
];

const deadlines = [
    { course: 'Data Structures', task: 'Assignment 3', due: 'Feb 15, 2026' },
    { course: 'Web Development', task: 'Project Milestone 2', due: 'Feb 20, 2026' },
    { course: 'Introduction to AI', task: 'Research Paper', due: 'Feb 28, 2026' },
]

const announcements = [
    { course: 'University', title: 'Mid-term break announced', date: 'Feb 10, 2026' },
    { course: 'Web Development', title: 'Guest lecture on React Hooks', date: 'Feb 09, 2026' },
]

const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <p className="font-bold">{label}</p>
          <p className="text-sm text-muted-foreground">
            Score: {payload[0].value} / {payload[0].payload.max}
          </p>
        </div>
      );
    }
  
    return null;
};

export default function LmsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  
  const coursesQuery = useMemoFirebase(() => 
    (firestore && user) ? collection(firestore, 'classes') : null,
    [firestore, user]
  );
  
  const { data: courses, isLoading: isLoadingCourses } = useCollection<Course>(coursesQuery);

  const renderCourseCards = () => {
    if (isLoadingCourses || isUserLoading) {
      return (
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      );
    }

    if (!user) {
      return (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p>Please <Link href="/login" className="text-primary underline">log in</Link> to see your courses.</p>
          </CardContent>
        </Card>
      );
    }
    
    if (!courses || courses.length === 0) {
       return (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p>No courses are available at this time.</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid gap-6 md:grid-cols-2">
        {courses.map(course => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">LMS Portal</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-4">My Courses</h2>
            {renderCourseCards()}
          </div>
        </div>

        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Performance Overview</CardTitle>
                    <CardDescription>Your scores in recent assessments.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={performanceData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                cursor={{fill: 'hsl(var(--muted))'}}
                                content={<CustomTooltip />}
                            />
                            <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Upcoming Deadlines</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-4">
                        {deadlines.map((item, index) => (
                            <li key={index} className="flex items-start justify-between">
                                <div>
                                    <p className="font-medium">{item.task}</p>
                                    <p className="text-sm text-muted-foreground">{item.course}</p>
                                </div>
                                <Badge variant="secondary" className="whitespace-nowrap">{item.due}</Badge>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Announcements</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                    {announcements.map((item, index) => (
                        <li key={index} className="pb-4 border-b last:border-b-0 last:pb-0">
                           <div>
                                <p className="font-medium">{item.title}</p>
                                <p className="text-sm text-muted-foreground">{item.course} - <span className="text-xs">{item.date}</span></p>
                            </div>
                        </li>
                    ))}
                </ul>
              </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
    