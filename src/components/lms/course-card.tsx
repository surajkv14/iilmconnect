import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export type Course = {
  id: string;
  name: string;
  code: string;
  instructor: string;
};

export function CourseCard({ course }: { course: Course }) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">{course.name}</CardTitle>
        <p className="text-sm text-muted-foreground">{course.code}</p>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm font-medium">Instructor: {course.instructor}</p>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-2">
        <Button asChild variant="outline" size="sm" className="mt-2 w-full">
          {/* The URL now uses the Firestore document ID for direct lookup */}
          <Link href={`/lms/${course.id}`}>View Course</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

    