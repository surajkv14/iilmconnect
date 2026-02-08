'use client';

import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

function EnrollmentHandler() {
    return (
      <Alert variant="destructive" className="max-w-md">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Invalid Enrollment Method</AlertTitle>
        <AlertDescription>
            Enrollment via invite link is no longer supported. Please ask your course instructor to add you to the class or send a request to join from the course page.
            <br />
            <Link href="/lms" className="underline mt-2 inline-block">Go to LMS Dashboard</Link>
        </AlertDescription>
      </Alert>
    );
}


export default function EnrollPage() {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <Suspense fallback={<div>Loading...</div>}>
                <EnrollmentHandler />
            </Suspense>
        </div>
    );
}

    