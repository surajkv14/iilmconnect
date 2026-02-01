import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const heroImage = PlaceHolderImages.find((img) => img.id === 'hero');

export function HeroSection() {
  return (
    <section className="relative h-[60vh] min-h-[500px] w-full">
      {heroImage && (
        <Image
          src={heroImage.imageUrl}
          alt={heroImage.description}
          fill
          className="object-cover"
          priority
          data-ai-hint={heroImage.imageHint}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      <div className="relative z-10 flex h-full flex-col items-center justify-center text-center">
        <div className="container max-w-3xl">
          <h1 className="font-headline text-4xl font-bold md:text-6xl">
            Welcome to <span className="text-primary">IILM Connect</span>
          </h1>
          <p className="mt-4 text-lg text-foreground/80 md:text-xl">
            Your all-in-one portal for campus life. Seamlessly manage academics,
            network with peers, and streamline your daily routines.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
