'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, useUser, errorEmitter } from '@/firebase';
import { initiateEmailSignIn, initiateEmailSignUp } from '@/firebase/non-blocking-login';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { FirebaseError } from 'firebase/app';
import { Skeleton } from '@/components/ui/skeleton';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    // If the user is already logged in, redirect them to the dashboard.
    if (user) {
      router.push('/');
    }
  }, [user, router]);
  
  useEffect(() => {
    // Listen for authentication errors and display them as toasts.
    const handleAuthError = (error: FirebaseError) => {
      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description: error.message.replace('Firebase: ', ''),
      });
    };
    
    errorEmitter.on('auth-error', handleAuthError);

    return () => {
      errorEmitter.off('auth-error', handleAuthError);
    };
  }, [toast]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSigningUp) {
      initiateEmailSignUp(auth, email, password);
    } else {
      initiateEmailSignIn(auth, email, password);
    }
  };

  // While checking auth state, show a loading skeleton.
  if (isUserLoading || user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="grid gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">{isSigningUp ? 'Create an account' : 'Log In'}</CardTitle>
          <CardDescription>
            {isSigningUp ? 'Enter your details below to create your account.' : 'Enter your email below to login to your account.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@iilm.edu"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">
              {isSigningUp ? 'Sign Up' : 'Sign In'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            {isSigningUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button onClick={() => setIsSigningUp(!isSigningUp)} className="underline">
              {isSigningUp ? 'Sign in' : 'Sign up'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
