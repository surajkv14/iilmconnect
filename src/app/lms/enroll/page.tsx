'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { getDoc, doc, collection, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertTriangle, PartyPopper } from 'lucide-react';
import Link from 'next/link';

interface Course {
  id: string;
  name: string;
  code: string;
  inviteCode?: string;
}

function EnrollmentHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const classId = searchParams.get('classId');
  const inviteCode = searchParams.get('code');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [courseName, setCourseName] = useState('');

  useEffect(() => {
    if (isUserLoading) return;

    if (!user) {
      // Redirect to login, but keep the invite link to return after login
      const currentPath = `/lms/enroll?classId=${classId}&code=${inviteCode}`;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    if (!classId || !inviteCode) {
      setErrorMessage('Invalid enrollment link. Missing class ID or invite code.');
      setStatus('error');
      return;
    }

    const enrollStudent = async () => {
      try {
        const courseRef = doc(firestore, 'classes', classId);
        const courseSnap = await getDoc(courseRef);

        if (!courseSnap.exists()) {
          setErrorMessage('This course does not exist.');
          setStatus('error');
          return;
        }

        const courseData = courseSnap.data() as Course;
        setCourseName(courseData.name);

        if (courseData.inviteCode !== inviteCode) {
          setErrorMessage('Invalid or expired invite code.');
          setStatus('error');
          return;
        }

        const enrollmentRef = collection(firestore, 'classes', classId, 'students');
        // Use setDoc with user UID as doc ID to prevent duplicates
        const studentEnrollmentRef = doc(enrollmentRef, user.uid);
        const studentEnrollmentSnap = await getDoc(studentEnrollmentRef);

        if (studentEnrollmentSnap.exists()) {
          // Already enrolled, just redirect
           setStatus('success');
           setTimeout(() => router.push(`/lms/${classId}`), 2000);
           return;
        }

        await addDocumentNonBlocking(enrollmentRef, {
            studentId: user.uid,
            studentName: user.displayName || user.email,
            studentEmail: user.email,
            enrollmentDate: serverTimestamp(),
        });
        
        setStatus('success');
        setTimeout(() => router.push(`/lms/${classId}`), 2000);

      } catch (e) {
        console.error(e);
        setErrorMessage('An unexpected error occurred. Please try again.');
        setStatus('error');
      }
    };

    enrollStudent();

  }, [classId, inviteCode, user, isUserLoading, firestore, router]);

  if (status === 'loading') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Enrolling You...</CardTitle>
          <CardDescription>Please wait while we add you to the course.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center p-10">
          <Loader2 className="size-12 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (status === 'error') {
    return (
      <Alert variant="destructive" className="max-w-md">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Enrollment Failed</AlertTitle>
        <AlertDescription>
            {errorMessage} Please check the link or contact the instructor.
            <br />
            <Link href="/lms" className="underline mt-2 inline-block">Go to LMS Dashboard</Link>
        </AlertDescription>
      </Alert>
    );
  }

  return (
     <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-green-600">Success!</CardTitle>
          <CardDescription>You have been successfully enrolled in <strong>{courseName}</strong>.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center p-10">
          <PartyPopper className="size-12 text-green-600" />
          <p className="ml-4">Redirecting you to the course...</p>
        </CardContent>
      </Card>
  );
}


export default function EnrollPage() {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <Suspense fallback={<div>Loading Enrollment...</div>}>
                <EnrollmentHandler />
            </Suspense>
        </div>
    );
}
