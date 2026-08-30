import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  setLogLevel,
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot 
} from 'firebase/firestore';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with Database ID from config
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
try {
  setLogLevel('silent');
} catch (_) {}

// Helper for Firestore error handling
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const msg = error instanceof Error ? error.message : String(error);
  const lowerMsg = msg.toLowerCase();

  // Ignore benign background/tab-hidden/database closing/unavailable network/quota errors
  if (
    lowerMsg.includes('closing') || 
    lowerMsg.includes('hidden') || 
    lowerMsg.includes('offline') || 
    lowerMsg.includes('unavailable') || 
    lowerMsg.includes('could not reach cloud firestore') ||
    lowerMsg.includes('canceled') ||
    lowerMsg.includes('cancelled') ||
    lowerMsg.includes('shutdown') ||
    lowerMsg.includes('database is closing') ||
    lowerMsg.includes('database is hidden') ||
    lowerMsg.includes('database is closing/hidden') ||
    lowerMsg.includes('failed-precondition') ||
    lowerMsg.includes('quota') ||
    lowerMsg.includes('resource_exhausted') ||
    lowerMsg.includes('resource exhausted') ||
    lowerMsg.includes('exceeded')
  ) {
    // Silently ignore benign background, quota, or network/offline events
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: msg,
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };

  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

// Initialize Firebase Auth
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export {
  app,
  db,
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
};
export type { User };
