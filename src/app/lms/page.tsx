'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CourseCard } from '@/components/lms/course-card';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase, updateDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc, serverTimestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { BookCopy, Users, ClipboardCheck, PlusCircle, Check, XIcon, UserCheck } from 'lucide-react';
import { useState, useMemo } from 'react';
import { CreateClassDialog } from '@/components/lms/CreateClassDialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface Course {
  id: string;
  name: string;
  semester: string;
  instructor: string;
  teacherId: string;
}

interface UserProfile {
    userType: 'student' | 'faculty' | 'admin' | 'alumni';
}

interface Notification {
    id: string;
    message: string;
    type: 'message' | 'join_request';
    status: 'pending' | 'approved' | 'rejected';
    requesterId: string;
    requesterName: string;
    requesterEmail: string;
    classId: string;
    className: string;
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

const StudentDashboard = () => {
    const firestore = useFirestore();

    // For students, we show all courses as "My Courses". A real app would use an enrollment subcollection.
    const coursesQuery = useMemoFirebase(() =>
        (firestore) ? collection(firestore, 'classes') : null,
        [firestore]
    );
    const { data: courses, isLoading: isLoadingCourses } = useCollection<Course>(coursesQuery);

    const renderCourseCards = () => {
        if (isLoadingCourses) {
            return (
                <div className="grid gap-6 md:grid-cols-2">
                    <Skeleton className="h-48" />
                    <Skeleton className="h-48" />
                </div>
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
                                    cursor={{ fill: 'hsl(var(--muted))' }}
                                    content={<CustomTooltip />}
                                />
                                <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-xl">Upcoming Deadlines</CardTitle></CardHeader>
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
            </div>
        </div>
    );
};

const FacultyDashboard = () => {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isCreateClassOpen, setCreateClassOpen] = useState(false);

    const coursesQuery = useMemoFirebase(() =>
        (firestore && user) ? query(collection(firestore, 'classes'), where('teacherId', '==', user.uid)) : null,
        [firestore, user]
    );
    const { data: courses, isLoading: isLoadingCourses } = useCollection<Course>(coursesQuery);
    
    const notificationsQuery = useMemoFirebase(() => 
        (user && firestore) ? collection(firestore, 'users', user.uid, 'notifications') : null, 
        [user, firestore]
    );
    const { data: notifications, isLoading: isLoadingNotifications } = useCollection<Notification>(notificationsQuery);
    
    const joinRequests = useMemo(() => {
        return notifications?.filter(n => n.type === 'join_request' && n.status === 'pending');
    }, [notifications]);

    const handleApprove = (notification: Notification) => {
        if (!firestore || !user) return;

        // 1. Add student to the class's `students` subcollection
        const studentDocRef = doc(firestore, 'classes', notification.classId, 'students', notification.requesterId);
        const studentData = {
            studentId: notification.requesterId,
            studentName: notification.requesterName,
            studentEmail: notification.requesterEmail,
            enrollmentDate: serverTimestamp()
        };
        setDocumentNonBlocking(studentDocRef, studentData, {});

        // 2. Update the notification status to 'approved'
        const notifRef = doc(firestore, 'users', user.uid, 'notifications', notification.id);
        updateDocumentNonBlocking(notifRef, { status: 'approved', isRead: true });

        toast({
            title: "Student Approved",
            description: `${notification.requesterName} has been enrolled in ${notification.className}.`,
        });
    };

    const handleReject = (notification: Notification) => {
        if (!firestore || !user) return;
        
        // Update the notification status to 'rejected'
        const notifRef = doc(firestore, 'users', user.uid, 'notifications', notification.id);
        updateDocumentNonBlocking(notifRef, { status: 'rejected', isRead: true });
        
        toast({
            title: "Request Rejected",
            description: `The request from ${notification.requesterName} has been rejected.`,
            variant: "destructive"
        });
    };

    const totalStudents = 125; 
    const totalAssignments = courses?.length ? courses.length * 3 : 0; 

    return (
        <div className="space-y-8">
            <CreateClassDialog isOpen={isCreateClassOpen} setIsOpen={setCreateClassOpen} />
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Courses Teaching</CardTitle>
                        <BookCopy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{isLoadingCourses ? <Skeleton className="h-8 w-10"/> : courses?.length}</div>
                        <p className="text-xs text-muted-foreground">You are the instructor for these courses.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalStudents}</div>
                        <p className="text-xs text-muted-foreground">Across all your classes.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Enrollment Requests</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{isLoadingNotifications ? <Skeleton className="h-8 w-10"/> : joinRequests?.length || 0}</div>
                        <p className="text-xs text-muted-foreground">Pending requests to join your classes.</p>
                    </CardContent>
                </Card>
            </div>
            
            {joinRequests && joinRequests.length > 0 && (
                 <Card>
                    <CardHeader>
                        <CardTitle>Enrollment Requests</CardTitle>
                        <CardDescription>Review and respond to student requests to join your classes.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {joinRequests.map(req => (
                            <div key={req.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <div>
                                    <p><span className="font-semibold">{req.requesterName}</span> wants to join <span className="font-semibold">{req.className}</span>.</p>
                                    <p className="text-sm text-muted-foreground">{req.requesterEmail}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="icon" variant="outline" className="text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => handleReject(req)}>
                                        <XIcon className="size-4" />
                                        <span className="sr-only">Reject</span>
                                    </Button>
                                    <Button size="icon" variant="outline" className="text-green-600 hover:bg-green-600 hover:text-white" onClick={() => handleApprove(req)}>
                                        <Check className="size-4" />
                                        <span className="sr-only">Approve</span>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            <div>
                 <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold tracking-tight">Courses You Teach</h2>
                    <Button onClick={() => setCreateClassOpen(true)}>
                        <PlusCircle className="mr-2" />
                        Create Class
                    </Button>
                </div>
                {isLoadingCourses ? (
                     <div className="grid gap-6 md:grid-cols-2">
                        <Skeleton className="h-48" />
                        <Skeleton className="h-48" />
                    </div>
                ) : courses && courses.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {courses.map(course => (
                            <CourseCard key={course.id} course={course} />
                        ))}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            <p>You are not assigned as an instructor to any courses. Click "Create Class" to get started.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default function LmsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const userProfileRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

    const isLoading = isUserLoading || isProfileLoading;
    const userRole = userProfile?.userType;

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="space-y-8">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
                    <div className="grid gap-6 md:grid-cols-2"><Skeleton className="h-48" /><Skeleton className="h-48" /></div>
                </div>
            );
        }

        if (!user) {
            return (
                <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                        <p>Please <Link href="/login" className="text-primary underline">log in</Link> to access the LMS Portal.</p>
                    </CardContent>
                </Card>
            );
        }
        
        if (userRole === 'faculty' || userRole === 'admin') {
            return <FacultyDashboard />;
        }
        
        return <StudentDashboard />;
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">LMS Portal</h1>
            </div>
            {renderContent()}
        </div>
    );
}
