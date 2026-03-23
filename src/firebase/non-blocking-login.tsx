
'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { errorEmitter } from './error-emitter';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { setDocumentNonBlocking } from './non-blocking-updates';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance).catch((error: FirebaseError) => {
    errorEmitter.emit('auth-error', error);
  });
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): void {
  // Sign-up restriction to internal university domains
  if (!email.endsWith('.edu')) {
    const error = new FirebaseError('auth/invalid-email', 'Sign-up is restricted to university (.edu) email addresses.');
    errorEmitter.emit('auth-error', error);
    return;
  }
  
  createUserWithEmailAndPassword(authInstance, email, password)
  .then(async (userCredential) => {
      const user = userCredential.user;
      const firestore = getFirestore(authInstance.app);
      const userDocRef = doc(firestore, 'users', user.uid);

      let userType: 'admin' | 'student' = 'student';
      // Basic admin check for the initial setup
      if (email.startsWith('admin@')) {
        userType = 'admin';
      }
      
      const username = email.split('@')[0];
      const displayName = email.split('@')[0];
      const photoURL = `https://picsum.photos/seed/${user.uid}/96/96`;

      await updateProfile(user, { 
        displayName: displayName,
        photoURL: photoURL,
      });
      
      setDocumentNonBlocking(userDocRef, {
        id: user.uid,
        email: user.email,
        userType: userType,
        username: username,
        displayName: displayName,
        bio: '',
        photoURL: photoURL,
        dietaryPreferences: [],
        allergies: []
      }, {});
    })
    .catch((error: FirebaseError) => {
    errorEmitter.emit('auth-error', error);
  });
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  signInWithEmailAndPassword(authInstance, email, password)
  .then(async (userCredential) => {
      const user = userCredential.user;
      const firestore = getFirestore(authInstance.app);
      const userDocRef = doc(firestore, 'users', user.uid);
      
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) {
        let userType: 'admin' | 'student' = 'student';
        if (email.startsWith('admin@')) {
            userType = 'admin';
        }

        const username = user.displayName || email.split('@')[0];
        const displayName = user.displayName || email.split('@')[0];
        const photoURL = user.photoURL || `https://picsum.photos/seed/${user.uid}/96/96`;
        
        if (!user.displayName || !user.photoURL) {
            await updateProfile(user, { displayName, photoURL });
        }

        setDocumentNonBlocking(userDocRef, {
            id: user.uid,
            email: user.email,
            userType: userType,
            username: username,
            displayName: displayName,
            bio: '',
            photoURL: photoURL,
            dietaryPreferences: [],
            allergies: []
        }, {});
      }
    })
  .catch((error: FirebaseError) => {
    errorEmitter.emit('auth-error', error);
  });
}
