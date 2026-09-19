// FSL TRADER PRO — Firebase & Firestore Persistence Layer
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  collection,
  query,
  getDocs,
  orderBy,
  limit,
  onSnapshot,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { User, License, SignalResult, AuditLog } from '../types';

// Initialize Firebase App instance
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with the provisioned database ID
export const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Error Handling Specification
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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('[Firestore Error]:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connectivity Validation on Startup
export async function testFirestoreConnection(): Promise<{ success: boolean; message: string }> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return { success: true, message: 'Connected to Firestore Enterprise Database.' };
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firestore] Client is offline or database initializing.');
      return { success: false, message: 'Firestore client offline.' };
    }
    // Permission denied on test/connection is expected if restricted, but proves network connectivity
    return { success: true, message: 'Firestore instance reachable.' };
  }
}

// Initial boot check
if (typeof window !== 'undefined') {
  testFirestoreConnection();
}

// Database helper functions with robust error interception
export const firestoreService = {
  // Sync / Save User Profile
  async saveUser(user: Partial<User> & { id: string; email: string }): Promise<void> {
    const path = `users/${user.id}`;
    try {
      await setDoc(doc(db, 'users', user.id), {
        id: user.id,
        email: user.email,
        name: user.name || user.email.split('@')[0],
        role: user.role || 'USER',
        status: user.status || 'ACTIVE',
        plan: user.plan || 'FREE',
        activeLicenseKey: user.activeLicenseKey || '',
        createdAt: user.createdAt || new Date().toISOString(),
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // Get User Profile
  async getUser(userId: string): Promise<User | null> {
    const path = `users/${userId}`;
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      if (!snap.exists()) return null;
      return snap.data() as User;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  },

  // Save / Sync Generated Signal
  async saveSignal(signal: SignalResult): Promise<void> {
    const path = `signals/${signal.id}`;
    try {
      await setDoc(doc(db, 'signals', signal.id), {
        id: signal.id,
        symbol: signal.symbol,
        market: signal.market,
        timeframe: signal.timeframe,
        direction: signal.direction,
        confluenceScore: signal.confluenceScore,
        setupQuality: signal.setupQuality,
        setupTitle: signal.setupTitle,
        currentPrice: signal.currentPrice,
        explanation: signal.explanation,
        timestamp: signal.timestamp,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // Save Immutable Audit Log
  async saveAuditLog(log: AuditLog): Promise<void> {
    const path = `audit_logs/${log.id}`;
    try {
      await setDoc(doc(db, 'audit_logs', log.id), {
        id: log.id,
        userId: log.userId || 'anonymous',
        userEmail: log.userEmail || 'unknown',
        action: log.action,
        resource: log.resource,
        timestamp: log.timestamp,
        details: log.details || {},
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // Save License
  async saveLicense(license: License): Promise<void> {
    const path = `licenses/${license.key}`;
    try {
      await setDoc(doc(db, 'licenses', license.key), {
        id: license.id,
        key: license.key,
        plan: license.plan,
        status: license.status,
        maxDevices: license.maxDevices,
        scanLimit: license.scanLimit,
        activationsCount: license.activationsCount,
        expiresAt: license.expiresAt || '',
        createdAt: license.createdAt,
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // Real-time signals listener
  subscribeRecentSignals(callback: (signals: SignalResult[]) => void): () => void {
    const path = 'signals';
    const q = query(collection(db, path), limit(25));
    return onSnapshot(
      q,
      (snapshot) => {
        const signals = snapshot.docs.map((doc) => doc.data() as SignalResult);
        callback(signals);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  },

  // Google Sign-in popup helper
  async signInWithGoogle(): Promise<FirebaseUser | null> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (err) {
      console.error('[Firebase Auth] Google popup sign in error:', err);
      throw err;
    }
  },

  async signOut(): Promise<void> {
    await signOut(auth);
  },
};
