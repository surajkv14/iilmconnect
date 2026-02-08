'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addDocumentNonBlocking, useFirestore, useUser } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const classSchema = z.object({
  name: z.string().min(3, 'Class name must be at least 3 characters long'),
  code: z.string().min(3, 'Class code must be at least 3 characters long (e.g., CS-101)'),
});

type ClassFormValues = z.infer<typeof classSchema>;

interface CreateClassDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function CreateClassDialog({ isOpen, setIsOpen }: CreateClassDialogProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      name: '',
      code: '',
    },
  });

  const onSubmit = (data: ClassFormValues) => {
    if (!firestore || !user) return;
    setIsSubmitting(true);

    const classesCollection = collection(firestore, 'classes');
    addDocumentNonBlocking(classesCollection, {
      ...data,
      teacherId: user.uid,
      instructor: user.displayName || user.email,
    }).then(() => {
        toast({
            title: 'Class Created',
            description: `${data.name} has been successfully created.`,
        });
        form.reset();
        setIsSubmitting(false);
        setIsOpen(false);
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Create New Class</DialogTitle>
              <DialogDescription>
                Fill out the details below to create a new class. You will be assigned as the instructor.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Introduction to Computer Science" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., CS-101" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Class'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
