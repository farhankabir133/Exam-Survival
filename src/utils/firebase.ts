import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore,
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  getDocFromServer 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json' with { type: 'json' };
import { DbUser, DbMatch, DbAnalytics } from '../types.js';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore (using custom databaseId if configured)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Standard Auth State Listener Export
export { onAuthStateChanged };
export type { FirebaseUser };

/**
 * FIRESTORE SAFETY EXCEPTION LOGGER BOUNDARY
 * Required by Firebase Integration Skill guidelines
 */
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
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
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error Payload: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validate Connection to Firestore (Skill Mandate check)
 */
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firebase client reports as offline. Verify configurations.");
    }
  }
}
testConnection();

/**
 * AUTHENTICATION WORKFLOW METHODS
 */

// Email Login
export async function loginWithEmail(email: string, password: string): Promise<FirebaseUser> {
  const credentials = await signInWithEmailAndPassword(auth, email, password);
  return credentials.user;
}

// Email Signup & Profile Name Init
export async function signupWithEmail(email: string, password: string, displayName: string): Promise<FirebaseUser> {
  const credentials = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credentials.user, { displayName });
  return credentials.user;
}

// Google Pop-up Authenticative Login
export async function loginWithGoogle(): Promise<FirebaseUser> {
  const credentials = await signInWithPopup(auth, googleProvider);
  return credentials.user;
}

// Sign Out Routine
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// Password Reset Instruction Delivery
export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

// Updation for demographic display name profile
export async function updateUserProfile(displayName: string): Promise<void> {
  if (auth.currentUser) {
    await updateProfile(auth.currentUser, { displayName });
  } else {
    throw new Error("No active user authenticated to perform profile changes");
  }
}

/**
 * FIRESTORE WORKSPACE PERSISTENCE LAYERS
 */

// Save (or register a newly registered) user blueprint profile record
export async function saveUserProfile(userId: string, data: Partial<DbUser>): Promise<void> {
  const profilePath = `users/${userId}`;
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, {
      id: userId,
      name: data.name || 'Anonymous Candidate',
      email: data.email || '',
      examTarget: data.examTarget || ['BCS'],
      currentRank: data.currentRank ?? 99,
      totalGames: data.totalGames ?? 0,
      bestStreak: data.bestStreak ?? 0,
      totalScore: data.totalScore ?? 0,
      fastestResponse: data.fastestResponse ?? 99.99,
      friends: data.friends || [],
      lastActiveAt: data.lastActiveAt || new Date().toISOString(),
      createdAt: data.createdAt ? data.createdAt.toISOString() : new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, profilePath);
  }
}

// Query current lifetime metrics from DB
export async function getUserProfile(userId: string): Promise<DbUser | null> {
  const profilePath = `users/${userId}`;
  try {
    const docSnap = await getDoc(doc(db, 'users', userId));
    if (docSnap.exists()) {
      const raw = docSnap.data();
      return {
        id: raw.id,
        name: raw.name,
        email: raw.email,
        examTarget: raw.examTarget || [],
        currentRank: raw.currentRank || 99,
        totalGames: raw.totalGames || 0,
        bestStreak: raw.bestStreak || 0,
        totalScore: raw.totalScore || 0,
        fastestResponse: raw.fastestResponse ?? 99.99,
        friends: raw.friends || [],
        lastActiveAt: raw.lastActiveAt || new Date().toISOString(),
        createdAt: new Date(raw.createdAt)
      };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, profilePath);
    return null;
  }
}

// Query all leaderboards candidates from cloud db
import { collection, query, getDocs, limit } from 'firebase/firestore';
export async function fetchLeaderboardUsers(): Promise<DbUser[]> {
  const usersPath = 'users';
  try {
    const qSnap = await getDocs(query(collection(db, 'users'), limit(150)));
    const usersList: DbUser[] = [];
    qSnap.forEach(docSnap => {
      if (docSnap.exists()) {
        const raw = docSnap.data();
        usersList.push({
          id: raw.id || docSnap.id,
          name: raw.name || 'Anonymous Candidate',
          email: raw.email || '',
          examTarget: raw.examTarget || [],
          currentRank: raw.currentRank || 99,
          totalGames: raw.totalGames || 0,
          bestStreak: raw.bestStreak || 0,
          totalScore: raw.totalScore || 0,
          fastestResponse: raw.fastestResponse ?? 99.99,
          friends: raw.friends || [],
          lastActiveAt: raw.lastActiveAt || new Date().toISOString(),
          createdAt: new Date(raw.createdAt || Date.now())
        });
      }
    });
    return usersList;
  } catch (error) {
    console.warn("Could not retrieve cloud leaderboards. Using local fallback.", error);
    return [];
  }
}

// Log game matches (for leaderboard analytics aggregation)
export async function saveMatchRecord(matchData: DbMatch): Promise<void> {
  const matchPath = `matches/${matchData.id}`;
  try {
    await setDoc(doc(db, 'matches', matchData.id), {
      ...matchData
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, matchPath);
  }
}

// Log cognitive analyzer metrics
export async function saveAnalyticsRecord(analyticsData: DbAnalytics): Promise<void> {
  const analyticsPath = `analytics/${analyticsData.userId}`;
  try {
    await setDoc(doc(db, 'analytics', analyticsData.userId), {
      ...analyticsData
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, analyticsPath);
  }
}
