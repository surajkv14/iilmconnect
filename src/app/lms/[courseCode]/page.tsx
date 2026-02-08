'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, ClipboardCheck, GraduationCap, AlertTriangle, PlusCircle } from 'lucide-react';
import { useFirestore, useDoc, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format } from 'date-fns';
import { CreateAssignmentDialog } from '@/components/lms/CreateAssignmentDialog';
import Link from 'next/link';

interface Course {
  id: string;
  name: string;
  code: string;
  instructor: string;
  teacherId: string;
}

interface Assignment {
  id: string;
  title: string;
  dueDate: string;
  details: string;
}

interface UserGrade {
  id: string;
  assignmentId: string;
  score: number;
  grade: string;
}

export default function CourseDetailPage() {
    const params = useParams();
    // The parameter is the Firestore document ID, even though the filename is [courseCode]
    const classId = params.courseCode as string; 
    
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const [isCreateAssignmentOpen, setCreateAssignmentOpen] = useState(false);

    const courseRef = useMemoFirebase(() => (firestore && classId) ? doc(firestore, 'classes', classId) : null, [firestore, classId]);
    const { data: course, isLoading: isLoadingCourse, error: courseError } = useDoc<Course>(courseRef);

    const assignmentsQuery = useMemoFirebase(() => (firestore && classId) ? collection(firestore, 'classes', classId, 'assignments') : null, [firestore, classId]);
    const { data: assignments, isLoading: isLoadingAssignments } = useCollection<Assignment>(assignmentsQuery);

    const gradesQuery = useMemoFirebase(() => (user && firestore && classId) ? query(collection(firestore, 'users', user.uid, 'grades'), where('classId', '==', classId)) : null, [user, firestore, classId]);
    const { data: grades, isLoading: isLoadingGrades } = useCollection<UserGrade>(gradesQuery);
    
    const isTeacher = !isLoadingCourse && !isUserLoading && user?.uid === course?.teacherId;

    const getGradeForAssignment = (assignmentId: string) => {
        return grades?.find(g => g.assignmentId === assignmentId);
    };

    if (isLoadingCourse || isUserLoading) {
        return (
            <div className="space-y-8">
                <Skeleton className="h-12 w-3/4" />
                <Skeleton className="h-8 w-1/2" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Not Logged In</AlertTitle>
                <AlertDescription>
                    Please log in to view course details.
                </AlertDescription>
            </Alert>
        );
    }
    
    if (!course) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                    {courseError ? "You don't have permission to view this course." : "Course not found."}
                </AlertDescription>
            </Alert>
        );
    }
    
    const StudentView = () => (
      <>
        <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                    <FileText className="size-8 text-primary" />
                    <CardTitle>Syllabus & Lectures</CardTitle>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>Week 1: Introduction</AccordionTrigger>
                            <AccordionContent>Overview of the course, learning objectives, and introduction to key concepts.</AccordionContent>
                        </AccordionItem>
                          <AccordionItem value="item-2">
                            <AccordionTrigger>Week 2: Core Concepts</AccordionTrigger>
                            <AccordionContent>Deep dive into the fundamental principles and theories.</AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                    <ClipboardCheck className="size-8 text-primary" />
                    <CardTitle>Assignments</CardTitle>
                </CardHeader>
                <CardContent>
                      {isLoadingAssignments ? <Skeleton className="h-48" /> : assignments && assignments.length > 0 ? (
                        <div className="space-y-4">
                            {assignments.map((assignment) => {
                              const grade = getGradeForAssignment(assignment.id);
                              return (
                                <Card key={assignment.id} className="bg-muted/50">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="text-lg">{assignment.title}</CardTitle>
                                        <CardDescription>Due: {format(new Date(assignment.dueDate), 'PPP')}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Accordion type="single" collapsible>
                                            <AccordionItem value="details" className="border-b-0">
                                                <AccordionTrigger>View Details</AccordionTrigger>
                                                <AccordionContent className="whitespace-pre-wrap text-muted-foreground">
                                                    {assignment.details}
                                                </AccordionContent>
                                            </AccordionItem>
                                        </Accordion>
                                    </CardContent>
                                    <CardFooter className="flex justify-between">
                                         <Badge variant={grade ? 'secondary' : 'outline'}>
                                            {grade ? 'Graded' : 'Pending Submission'}
                                        </Badge>
                                        <Button variant="secondary" size="sm">Submit</Button>
                                    </CardFooter>
                                </Card>
                              )
                            })}
                        </div>
                      ) : <p className="text-muted-foreground text-center py-4">No assignments posted yet.</p>}
                </CardContent>
            </Card>
        </div>
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
                <GraduationCap className="size-8 text-primary" />
                <CardTitle>My Grades</CardTitle>
            </CardHeader>
            <CardContent>
                  {isLoadingGrades ? <Skeleton className="h-24" /> : grades && grades.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Assessment</TableHead>
                                <TableHead>Score</TableHead>
                                <TableHead>Grade</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {grades.map((grade) => {
                              const assignment = assignments?.find(a => a.id === grade.assignmentId);
                              return (
                                <TableRow key={grade.id}>
                                    <TableCell className="font-medium">{assignment?.title || 'Assessment'}</TableCell>
                                    <TableCell>{grade.score}/100</TableCell>
                                    <TableCell>
                                        <Badge>{grade.grade}</Badge>
                                    </TableCell>
                                </TableRow>
                              )
                            })}
                        </TableBody>
                    </Table>
                  ) : <p className="text-muted-foreground">No grades posted yet.</p>}
            </CardContent>
        </Card>
      </>
    );
    
    const FacultyView = () => (
      <>
        <CreateAssignmentDialog
          classId={classId}
          isOpen={isCreateAssignmentOpen}
          setIsOpen={setCreateAssignmentOpen}
        />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-4">
                <ClipboardCheck className="size-8 text-primary" />
                <CardTitle>Assignment Management</CardTitle>
              </div>
              <Button onClick={() => setCreateAssignmentOpen(true)}>
                <PlusCircle className="mr-2" />
                Create Assignment
              </Button>
          </CardHeader>
          <CardContent>
              {isLoadingAssignments ? <Skeleton className="h-24" /> : assignments && assignments.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {assignments.map((assignment) => (
                            <TableRow key={assignment.id}>
                                <TableCell className="font-medium">{assignment.title}</TableCell>
                                <TableCell>{format(new Date(assignment.dueDate), 'MMM dd, yyyy')}</TableCell>
                                <TableCell className="text-right">
                                    <Button asChild variant="outline" size="sm">
                                      <Link href={`/lms/${classId}/assignments/${assignment.id}/grades`}>
                                        Manage Grades
                                      </Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
              ) : <p className="text-muted-foreground text-center py-8">No assignments created yet.</p>}
          </CardContent>
        </Card>
      </>
    );

    return (
        <div className="space-y-8">
            <div>
                <p className="text-muted-foreground">{course.code}</p>
                <h1 className="text-3xl font-bold tracking-tight">{course.name}</h1>
                <p className="text-lg text-muted-foreground">Instructor: {course.instructor}</p>
                 {isTeacher && <Badge className="mt-2">Faculty View</Badge>}
            </div>
            {isTeacher ? <FacultyView /> : <StudentView />}
        </div>
    );
}

    