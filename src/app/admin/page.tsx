import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { Shield } from 'lucide-react';

export default function AdminPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="container py-12 md:py-24 text-center">
          <div className="inline-block rounded-full bg-secondary p-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <h1 className="font-headline text-4xl font-bold mt-6">Admin Portal</h1>
          <p className="text-muted-foreground mt-2 text-xl">
            This feature is coming soon.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
