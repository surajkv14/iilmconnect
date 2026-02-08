'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, ClipboardCheck, GraduationCap, AlertTriangle, PlusCircle, UserPlus, Trash2, Upload } from 'lucide-react';
import { useFirestore, useDoc, useCollection, useMemoFirebase, useUser, deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, where, serverTimestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format } from 'date-fns';
import { CreateAssignmentDialog } from '@/components/lms/CreateAssignmentDialog';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


interface Course {
  id: string;
  name: string;
  semester: string;
  instructor: string;
  teacherId: string;
}

interface Assignment {
  id: string;
  title: string;
  dueDate: string;
  details: string;
  submissionType: 'text-entry' | 'file-upload';
}

interface UserGrade {
  id: string;
  assignmentId: string;
  score: number;
  grade: string;
}

interface EnrolledStudent {
    id: string; // student's UID
    studentName: string;
    studentEmail: string;
    enrollmentDate: any;
}


export default function CourseDetailPage() {
    const params = useParams();
    const classId = params.courseCode as string; 
    
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [isCreateAssignmentOpen, setCreateAssignmentOpen] = useState(false);
    const [studentToRemove, setStudentToRemove] = useState<EnrolledStudent | null>(null);

    const courseRef = useMemoFirebase(() => (firestore && classId) ? doc(firestore, 'classes', classId) : null, [firestore, classId]);
    const { data: course, isLoading: isLoadingCourse, error: courseError } = useDoc<Course>(courseRef);

    const assignmentsQuery = useMemoFirebase(() => (firestore && classId) ? collection(firestore, 'classes', classId, 'assignments') : null, [firestore, classId]);
    const { data: assignments, isLoading: isLoadingAssignments } = useCollection<Assignment>(assignmentsQuery);

    const gradesQuery = useMemoFirebase(() => (user && firestore && classId) ? query(collection(firestore, 'users', user.uid, 'grades'), where('classId', '==', classId)) : null, [user, firestore, classId]);
    const { data: grades, isLoading: isLoadingGrades } = useCollection<UserGrade>(gradesQuery);

    const enrolledStudentsQuery = useMemoFirebase(() => (firestore && classId) ? collection(firestore, 'classes', classId, 'students') : null, [firestore, classId]);
    const { data: enrolledStudents, isLoading: isLoadingEnrolledStudents } = useCollection<EnrolledStudent>(enrolledStudentsQuery);
    
    const isTeacher = !isLoadingCourse && !isUserLoading && user?.uid === course?.teacherId;

    const isEnrolled = useMemo(() => {
        if (!user || !enrolledStudents) return false;
        return enrolledStudents.some(student => student.id === user.uid);
    }, [user, enrolledStudents]);
    
    const getGradeForAssignment = (assignmentId: string) => {
        return grades?.find(g => g.assignmentId === assignmentId);
    };
    
    const handleRemoveStudent = () => {
        if (!firestore || !classId || !studentToRemove) return;
        
        const studentDocRef = doc(firestore, 'classes', classId, 'students', studentToRemove.id);
        deleteDocumentNonBlocking(studentDocRef);
        
        toast({
          title: 'Student Removed',
          description: `${studentToRemove.studentName} has been removed from the class.`,
        });
        setStudentToRemove(null); // Close the dialog
    }

    const handleRequestToJoin = () => {
        if (!firestore || !user || !course) {
            toast({
                variant: 'destructive',
                title: "Error",
                description: "You must be logged in to send a request.",
            });
            return;
        }

        const notificationsCollection = collection(firestore, 'users', course.teacherId, 'notifications');
        addDocumentNonBlocking(notificationsCollection, {
            userId: course.teacherId,
            message: `${user.displayName || user.email} has requested to join your class: ${course.name}`,
            timestamp: serverTimestamp(),
            isRead: false,
        });

        toast({
            title: "Request Sent",
            description: "Your request to join has been sent to the instructor.",
        });
    };

    const isLoading = isLoadingCourse || isUserLoading || isLoadingEnrolledStudents;

    if (isLoading) {
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
                    {courseError ? "You may not have permission to view this course." : "Course not found."}
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
                                        {assignment.submissionType === 'file-upload' ? (
                                            <Button variant="secondary" size="sm"><Upload className="mr-2" /> Upload File</Button>
                                        ) : (
                                            <Button variant="secondary" size="sm">Submit Online</Button>
                                        )}
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
    
    const FacultyView = () => {
      
      return (
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
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
          </div>
          <div className="space-y-8">
            <Card>
              <CardHeader>
                  <CardTitle>Student Management</CardTitle>
                  <CardDescription>Manage your class roster.</CardDescription>
              </CardHeader>
              <CardContent>
                  <AlertDialog open={!!studentToRemove} onOpenChange={(isOpen) => !isOpen && setStudentToRemove(null)}>
                    <div className="mt-6">
                      <h4 className="font-medium mb-2">Enrolled Students</h4>
                      {isLoadingEnrolledStudents ? <Skeleton className="h-24" /> : enrolledStudents && enrolledStudents.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {enrolledStudents.map(student => (
                                <TableRow key={student.id}>
                                  <TableCell>{student.studentName}</TableCell>
                                  <TableCell>{student.studentEmail}</TableCell>
                                  <TableCell className="text-right">
                                      <Button variant="ghost" size="icon" onClick={() => setStudentToRemove(student)}>
                                          <Trash2 className="size-4 text-destructive" />
                                      </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No students enrolled yet.</p>
                      )}
                    </div>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently remove {studentToRemove?.studentName} from this class. They will lose access to all class materials and assignments. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleRemoveStudent}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                Confirm Removal
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }
    
    if (isTeacher) {
        return (
            <div className="space-y-8">
                <div>
                    <p className="text-muted-foreground">{course.semester}</p>
                    <h1 className="text-3xl font-bold tracking-tight">{course.name}</h1>
                    <p className="text-lg text-muted-foreground">Instructor: {course.instructor}</p>
                    <Badge className="mt-2">Faculty View</Badge>
                </div>
                <FacultyView />
            </div>
        );
    }

    if (isEnrolled) {
        return (
            <div className="space-y-8">
                <div>
                    <p className="text-muted-foreground">{course.semester}</p>
                    <h1 className="text-3xl font-bold tracking-tight">{course.name}</h1>
                    <p className="text-lg text-muted-foreground">Instructor: {course.instructor}</p>
                </div>
                <StudentView />
            </div>
        );
    }

    return (
        <Card className="max-w-2xl mx-auto mt-10">
            <CardHeader>
                <p className="text-sm text-muted-foreground">{course.semester}</p>
                <CardTitle className="text-3xl">{course.name}</CardTitle>
                <CardDescription className="text-lg">Instructor: {course.instructor}</CardDescription>
            </CardHeader>
            <CardContent>
                <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>You are not enrolled in this course.</AlertTitle>
                    <AlertDescription>
                        You can send a request to the instructor to join this class.
                    </AlertDescription>
                </Alert>
            </CardContent>
            <CardFooter>
                <Button onClick={handleRequestToJoin}>
                    <UserPlus className="mr-2" />
                    Send Request to Join
                </Button>
            </CardFooter>
        </Card>
    );
}

    