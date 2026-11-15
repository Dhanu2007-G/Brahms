/**
 * AstraPulse — Firebase SDK Initialization, Connection Verification & Error Handling
 * Team Zenitsu — NASA Space Apps Challenge 2026
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDocFromServer,
  getFirestore,
  setDoc,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

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
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

/**
 * Validate connection to Firestore at boot per firebase-integration-rpc skill.
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'system', 'connection_check'));
    return true;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error(
        'Please check your Firebase configuration. The client is offline.'
      );
    }
    return false;
  }
}

export async function signInWithGooglePopup(): Promise<User | null> {
  const provider = new GoogleAuthProvider();
  const res = await signInWithPopup(auth, provider);
  if (res.user) {
    const userPath = `users/${res.user.uid}`;
    try {
      await setDoc(
        doc(db, 'users', res.user.uid),
        {
          uid: res.user.uid,
          email: res.user.email || '',
          displayName: res.user.displayName || 'Crew Member',
          role: 'astronaut',
          assignedCrewId: 'ASTRA-002',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, userPath);
    }
  }
  return res.user;
}

export async function signOutFirebase(): Promise<void> {
  await signOut(auth);
}

export async function mirrorObservationToFirestore(
  obsId: string,
  payload: Record<string, unknown>
): Promise<void> {
  if (!auth.currentUser) return;
  const path = `observations/${obsId}`;
  try {
    await setDoc(doc(collection(db, 'observations'), obsId), {
      ...payload,
      ownerUid: auth.currentUser.uid,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export { onAuthStateChanged };
export type { User };
