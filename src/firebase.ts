import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs, onSnapshot, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firebase Cloud Messaging safely (non-blocking for unsupported browsers/iframes)
let messagingInstance: any = null;
isSupported().then((supported) => {
  if (supported) {
    messagingInstance = getMessaging(app);
    console.log("Firebase Cloud Messaging initialized successfully.");
  } else {
    console.warn("FCM is not supported in this browser environment. Direct push notifications are disabled.");
  }
}).catch((err) => {
  console.error("Error checking FCM support:", err);
});

export const getMessagingInstance = () => messagingInstance;

// Helper to request permission, register Service Worker explicitly, and obtain FCM Token
export async function getFCMToken(vapidKey?: string): Promise<string | null> {
  try {
    const supported = await isSupported();
    if (!supported || !messagingInstance) {
      console.warn("FCM is not supported, skipping token generation.");
      return null;
    }

    // Explicitly register our custom service worker file before getting token
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      });
      console.log("Firebase Messaging service worker registered with scope:", registration.scope);

      // Fetch FCM Token passing the registration and the VAPID public key
      const key = vapidKey || 'BOMz3_M8X9-4-g9zF2fJq6G_Gzsh7Z7p7t5K5G7H5R_G-M3G7c_r5B_C3_Y_h_K_f_X_W_q_w'; // Placeholder VAPID key config
      const token = await getToken(messagingInstance, {
        serviceWorkerRegistration: registration,
        vapidKey: key
      });

      return token;
    }
    return null;
  } catch (error) {
    console.error("Failed to generate FCM push token:", error);
    return null;
  }
}

// Error Handling helper
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
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Auth helpers
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const registerWithEmail = (email, password) => createUserWithEmailAndPassword(auth, email, password);
export const logInWithEmail = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const sendEmailVerificationLink = (user: User) => sendEmailVerification(user);
export const logout = () => auth.signOut();
