import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

export type Course = {
  title: string;
  code: string;
  instructor: string;
  progress: number;
};

export function CourseCard({ course }: { course: Course }) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">{course.title}</CardTitle>
        <p className="text-sm text-muted-foreground">{course.code}</p>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm font-medium">Instructor: {course.instructor}</p>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-2">
        <div className="w-full">
          <div className="flex justify-between items-center mb-1">
            <p className="text-xs text-muted-foreground">Progress</p>
            <p className="text-xs font-semibold">{course.progress}%</p>
          </div>
          <Progress value={course.progress} aria-label={`${course.progress}% course progress`} />
        </div>
        <Button variant="outline" size="sm" className="mt-2 w-full">View Course</Button>
      </CardFooter>
    </Card>
  );
}
