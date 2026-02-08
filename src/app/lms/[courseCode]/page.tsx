'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, ClipboardCheck, GraduationCap, Download } from 'lucide-react';

// Mock data - In a real app, this would be fetched from an API
const coursesData = [
  { title: 'Introduction to AI', code: 'CS-401', instructor: 'Dr. Alan Turing', progress: 75 },
  { title: 'Data Structures', code: 'CS-201', instructor: 'Dr. Ada Lovelace', progress: 50 },
  { title: 'Web Development', code: 'IT-305', instructor: 'Dr. Tim Berners-Lee', progress: 90 },
  { title: 'Database Management', code: 'CS-310', instructor: 'Dr. Edgar Codd', progress: 60 },
];

const courseDetails: Record<string, any> = {
    'CS-401': {
        lectures: [
            { title: 'Week 1: History of AI', content: 'From the Turing test to Deep Blue.' },
            { title: 'Week 2: Search Algorithms', content: 'Understanding BFS, DFS, and A*.' },
            { title: 'Week 3: Machine Learning Basics', content: 'Introduction to supervised and unsupervised learning.' },
        ],
        assignments: [
            { title: 'Assignment 1: Search Maze', due: 'Feb 20, 2026', status: 'Submitted' },
            { title: 'Assignment 2: ML Model', due: 'Mar 05, 2026', status: 'Pending' },
        ],
        grades: [
            { item: 'Quiz 1', score: '85/100', grade: 'A' },
            { item: 'Assignment 1', score: '92/100', grade: 'A+' },
        ]
    },
    'CS-201': {
        lectures: [
            { title: 'Week 1: Intro to Data Structures', content: 'Arrays, Linked Lists.' },
            { title: 'Week 2: Stacks & Queues', content: 'LIFO and FIFO structures.' },
        ],
        assignments: [
             { title: 'Assignment 1: Linked List', due: 'Feb 15, 2026', status: 'Submitted' },
        ],
        grades: [
             { item: 'Quiz 1', score: '90/100', grade: 'A+' },
        ]
    },
     'IT-305': {
        lectures: [
            { title: 'Week 1: HTML & CSS', content: 'Basics of web structure and styling.' },
            { title: 'Week 2: JavaScript', content: 'Making web pages interactive.' },
        ],
        assignments: [],
        grades: []
    },
     'CS-310': {
        lectures: [],
        assignments: [],
        grades: []
    }
};

export default function CourseDetailPage() {
    const params = useParams();
    const courseCode = params.courseCode as string;
    const course = coursesData.find(c => c.code === courseCode);
    const details = courseDetails[courseCode];

    if (!course) {
        return <div className="p-4">Course not found.</div>;
    }

    return (
        <div className="space-y-8">
            <div>
                <p className="text-muted-foreground">{course.code}</p>
                <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
                <p className="text-lg text-muted-foreground">Instructor: {course.instructor}</p>
            </div>

             <Card>
                <CardHeader>
                    <CardTitle>Your Progress</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <Progress value={course.progress} className="w-full" />
                        <span className="font-bold text-lg">{course.progress}%</span>
                    </div>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <Card>
                    <CardHeader className="flex flex-row items-center gap-4">
                        <FileText className="size-8 text-primary" />
                        <CardTitle>Syllabus & Lectures</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="single" collapsible className="w-full">
                            {details.lectures.length > 0 ? details.lectures.map((lecture: any, index: number) => (
                                <AccordionItem value={`item-${index}`} key={index}>
                                    <AccordionTrigger>{lecture.title}</AccordionTrigger>
                                    <AccordionContent>{lecture.content}</AccordionContent>
                                </AccordionItem>
                            )) : <p className="text-muted-foreground">No lectures available yet.</p>}
                        </Accordion>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center gap-4">
                        <ClipboardCheck className="size-8 text-primary" />
                        <CardTitle>Assignments</CardTitle>
                    </CardHeader>
                    <CardContent>
                         {details.assignments.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Due Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {details.assignments.map((assignment: any, index: number) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">{assignment.title}</TableCell>
                                            <TableCell>{assignment.due}</TableCell>
                                            <TableCell>
                                                <Badge variant={assignment.status === 'Submitted' ? 'secondary' : 'outline'}>
                                                    {assignment.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon">
                                                    <Download className="size-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                         ) : <p className="text-muted-foreground">No assignments posted yet.</p>}
                    </CardContent>
                </Card>
            </div>
             <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                    <GraduationCap className="size-8 text-primary" />
                    <CardTitle>My Grades</CardTitle>
                </CardHeader>
                <CardContent>
                     {details.grades.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Assessment</TableHead>
                                    <TableHead>Score</TableHead>
                                    <TableHead>Grade</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {details.grades.map((grade: any, index: number) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{grade.item}</TableCell>
                                        <TableCell>{grade.score}</TableCell>
                                        <TableCell>
                                            <Badge>{grade.grade}</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                     ) : <p className="text-muted-foreground">No grades posted yet.</p>}
                </CardContent>
            </Card>
        </div>
    );
}
