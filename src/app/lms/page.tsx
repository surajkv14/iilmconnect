import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Book, Calendar, Megaphone, Target } from 'lucide-react';
import { CourseCard, type Course } from '@/components/lms/course-card';

const courses: Course[] = [
  { title: 'Introduction to AI', code: 'CS-401', instructor: 'Dr. Alan Turing', progress: 75 },
  { title: 'Data Structures', code: 'CS-201', instructor: 'Dr. Ada Lovelace', progress: 50 },
  { title: 'Web Development', code: 'IT-305', instructor: 'Dr. Tim Berners-Lee', progress: 90 },
  { title: 'Database Management', code: 'CS-310', instructor: 'Dr. Edgar Codd', progress: 60 },
];

export default function LmsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">LMS Portal</h1>
      </div>

      <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:bg-accent cursor-pointer transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Assignments</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      View upcoming assignments and grades.
                    </p>
                  </CardContent>
                </Card>
                <Card className="hover:bg-accent cursor-pointer transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Announcements</CardTitle>
                    <Megaphone className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      Latest news from faculty.
                    </p>
                  </CardContent>
                </Card>
                <Card className="hover:bg-accent cursor-pointer transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Exam Calendar</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      Upcoming exam schedules.
                    </p>
                  </CardContent>
                </Card>
                 <Card className="hover:bg-accent cursor-pointer transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">My Grades</CardTitle>
                    <Book className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      Check your academic performance.
                    </p>
                  </CardContent>
                </Card>
            </CardContent>
        </Card>

        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">My Courses</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courses.map(course => (
              <CourseCard key={course.code} course={course} />
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              <p>No upcoming deadlines. You're all caught up!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
