'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase, setDocumentNonBlocking, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, where, collectionGroup } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Student {
  id: string;
  email: string;
  displayName?: string;
}

interface UserGrade {
  id: string;
  userId: string;
  classId: string;
  assignmentId: string;
  score: number;
  grade: string;
}

interface Assignment {
  id: string;
  title: string;
}

export default function GradeManagementPage() {
  const params = useParams();
  const classId = params.courseCode as string;
  const assignmentId = params.assignmentId as string;

  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [grades, setGrades] = useState<Record<string, { score: string; grade: string }>>({});
  const [isSaving, setIsSaving] = useState(false);

  const studentsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'users'), where('userType', '==', 'student')) : null),
    [firestore]
  );
  const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsQuery);

  const assignmentRef = useMemoFirebase(
    () => (firestore && classId && assignmentId ? doc(firestore, 'classes', classId, 'assignments', assignmentId) : null),
    [firestore, classId, assignmentId]
  );
  const { data: assignment, isLoading: isLoadingAssignment } = useDoc<Assignment>(assignmentRef);

  // Use a collectionGroup query to get all grades for this assignment.
  // NOTE: This requires a composite index in Firestore. The console will provide a link to create it.
  const gradesQuery = useMemoFirebase(
    () => (firestore && assignmentId ? query(collectionGroup(firestore, 'grades'), where('assignmentId', '==', assignmentId)) : null),
    [firestore, assignmentId]
  );
  const { data: existingGrades, isLoading: isLoadingGrades } = useCollection<UserGrade>(gradesQuery);
  
  // Pre-fill the grades state with existing grades from the database
  useEffect(() => {
    if (existingGrades) {
      const initialGrades = existingGrades.reduce((acc, grade) => {
        acc[grade.userId] = { score: String(grade.score), grade: grade.grade };
        return acc;
      }, {} as Record<string, { score: string; grade: string }>);
      setGrades(initialGrades);
    }
  }, [existingGrades]);


  const handleGradeChange = (studentId: string, field: 'score' | 'grade', value: string) => {
    setGrades(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { score: '', grade: '' }),
        [field]: value,
      },
    }));
  };
  
  const handleSaveGrades = async () => {
    if (!firestore || !students) return;
    setIsSaving(true);
  
    const promises = students.map(student => {
      const studentGrade = grades[student.id];
      if (studentGrade && (studentGrade.score || studentGrade.grade)) {
        const existingGrade = existingGrades?.find(g => g.userId === student.id);
        const gradeData = {
          userId: student.id,
          classId: classId,
          assignmentId: assignmentId,
          score: Number(studentGrade.score) || 0,
          grade: studentGrade.grade || '',
        };
  
        if (existingGrade) {
          // Update existing grade
          const gradeRef = doc(firestore, 'users', student.id, 'grades', existingGrade.id);
          return updateDocumentNonBlocking(gradeRef, gradeData);
        } else {
          // Add new grade
          const gradesCollectionRef = collection(firestore, 'users', student.id, 'grades');
          return addDocumentNonBlocking(gradesCollectionRef, gradeData);
        }
      }
      return Promise.resolve();
    });
  
    await Promise.all(promises);
  
    setIsSaving(false);
    toast({
      title: 'Grades Saved!',
      description: 'All student grades have been successfully updated.',
    });
  };

  const isLoading = isLoadingStudents || isLoadingAssignment || isUserLoading || isLoadingGrades;

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }
  
  if (!user) {
    return (
       <Alert variant="destructive">
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>You must be logged in to view this page.</AlertDescription>
      </Alert>
    );
  }

  // A proper check for faculty role would be better here
  if (!assignment) {
      return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                    Assignment not found or you do not have permission to manage it.
                </AlertDescription>
            </Alert>
        );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-muted-foreground">Grade Management</p>
        <h1 className="text-3xl font-bold tracking-tight">{assignment.title}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enter Student Grades</CardTitle>
          <CardDescription>
            Enter the score and grade for each student. Click "Save All Grades" when you're done.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-32">Score (/100)</TableHead>
                <TableHead className="w-32">Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students?.map(student => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.displayName || 'N/A'}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      placeholder="e.g., 85"
                      value={grades[student.id]?.score || ''}
                      onChange={e => handleGradeChange(student.id, 'score', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      placeholder="e.g., A-"
                      value={grades[student.id]?.grade || ''}
                      onChange={e => handleGradeChange(student.id, 'grade', e.target.value)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button onClick={handleSaveGrades} disabled={isSaving}>
          <Save className="mr-2" />
          {isSaving ? 'Saving...' : 'Save All Grades'}
        </Button>
      </div>
    </div>
  );
}
