
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LmsPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <p className="text-muted-foreground italic">Redirecting to Mess Dashboard...</p>
    </div>
  );
}
