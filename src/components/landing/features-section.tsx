import Image from 'next/image';
import Link from 'next/link';
import { BookOpenCheck, Users, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const features = [
  {
    icon: <BookOpenCheck className="h-8 w-8 text-primary" />,
    title: 'LMS Portal',
    description:
      'Track attendance, access course materials, and receive important notifications, all in one place.',
    link: '/lms',
    image: PlaceHolderImages.find((img) => img.id === 'lms'),
  },
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: 'CollabNest',
    description:
      'Connect with students, faculty, and alumni. Share your achievements and build your professional network.',
    link: '/collabnest',
    image: PlaceHolderImages.find((img) => img.id === 'collabnest'),
  },
  {
    icon: <UtensilsCrossed className="h-8 w-8 text-primary" />,
    title: 'Mess Portal',
    description:
      'Pre-select your meals to help reduce food waste and allow the mess staff to prepare accordingly.',
    link: '/mess',
    image: PlaceHolderImages.find((img) => img.id === 'mess'),
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="w-full bg-background py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm text-secondary-foreground">
              Core Features
            </div>
            <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl">
              A Unified University Experience
            </h2>
            <p className="max-w-[900px] text-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              From the classroom to the dining hall, IILM Connect brings all
              aspects of campus life together in one intuitive platform.
            </p>
          </div>
        </div>
        <div className="mx-auto mt-12 grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group h-full transform-gpu overflow-hidden rounded-lg shadow-md transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
            >
              {feature.image && (
                <div className="aspect-video overflow-hidden">
                  <Image
                    src={feature.image.imageUrl}
                    alt={feature.image.description}
                    width={600}
                    height={400}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    data-ai-hint={feature.image.imageHint}
                  />
                </div>
              )}
              <CardHeader className="flex flex-row items-center gap-4 pb-2 pt-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/80">
                  {feature.icon}
                </div>
                <CardTitle className="font-headline text-xl">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
                <Button variant="link" className="p-0 mt-4 font-semibold" asChild>
                  <Link href={feature.link}>
                    Explore {feature.title} &rarr;
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
