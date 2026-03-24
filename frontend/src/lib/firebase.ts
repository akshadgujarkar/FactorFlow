// ============================================================
// Firebase Configuration & Firestore Service
// ============================================================
// Replace with your Firebase project config to connect to a real backend.
// Until configured, the app falls back to mock data seamlessly.

import { initializeApp, FirebaseApp } from "firebase/app";
import {
  getFirestore,
  Firestore,
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
  onSnapshot,
  Unsubscribe,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import type {
  FirebaseUser,
  FirebaseProposalMetadata,
  FirebaseActivityLog,
  FirebaseAnalyticsCache,
  FirebaseNotification,
  FirebaseVendor,
} from "./types";

// ----- Firebase Config (replace with real values) -----
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

const isFirebaseConfigured = () =>
  !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

if (isFirebaseConfigured()) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
}

// ============================================================
// Firestore CRUD helpers — graceful no-ops when Firebase is not configured
// ============================================================

// ----- Users -----
export const getUsers = async (): Promise<FirebaseUser[]> => {
  if (!db) return [];
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => d.data() as FirebaseUser);
};

export const getUserByWallet = async (
  wallet: string
): Promise<FirebaseUser | null> => {
  if (!db) return null;
  const q = query(collection(db, "users"), where("walletAddress", "==", wallet));
  const snap = await getDocs(q);
  return snap.empty ? null : (snap.docs[0].data() as FirebaseUser);
};

export const upsertUser = async (user: FirebaseUser) => {
  if (!db) return;
  await setDoc(doc(db, "users", user.walletAddress), user, { merge: true });
};

// ----- Proposal Metadata -----
export const getProposalMetadata = async (): Promise<
  FirebaseProposalMetadata[]
> => {
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, "proposals_metadata"), orderBy("createdAt", "desc"))
  );
  return snap.docs.map((d) => d.data() as FirebaseProposalMetadata);
};

export const getProposalMetadataById = async (
  proposalId: number
): Promise<FirebaseProposalMetadata | null> => {
  if (!db) return null;
  const ref = doc(db, "proposals_metadata", String(proposalId));
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as FirebaseProposalMetadata) : null;
};

export const saveProposalMetadata = async (
  data: FirebaseProposalMetadata
) => {
  if (!db) return;
  await setDoc(doc(db, "proposals_metadata", String(data.proposalId)), data);
};

// ----- Activity Logs -----
export const getActivityLogs = async (): Promise<FirebaseActivityLog[]> => {
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, "activity_logs"), orderBy("timestamp", "desc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FirebaseActivityLog);
};

export const addActivityLog = async (
  log: Omit<FirebaseActivityLog, "id">
) => {
  if (!db) return;
  await addDoc(collection(db, "activity_logs"), log);
};

// ----- Analytics Cache -----
export const getAnalyticsCache =
  async (): Promise<FirebaseAnalyticsCache | null> => {
    if (!db) return null;
    const ref = doc(db, "analytics_cache", "global");
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as FirebaseAnalyticsCache) : null;
  };

export const updateAnalyticsCache = async (
  data: Partial<FirebaseAnalyticsCache>
) => {
  if (!db) return;
  await setDoc(doc(db, "analytics_cache", "global"), {
    ...data,
    lastUpdated: new Date().toISOString(),
  }, { merge: true });
};

// ----- Notifications -----
export const getNotifications = async (
  wallet?: string
): Promise<FirebaseNotification[]> => {
  if (!db) return [];
  const baseQuery = wallet
    ? query(
        collection(db, "notifications"),
        where("walletAddress", "==", wallet),
        orderBy("timestamp", "desc")
      )
    : query(collection(db, "notifications"), orderBy("timestamp", "desc"));
  const snap = await getDocs(baseQuery);
  return snap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as FirebaseNotification
  );
};

export const addNotification = async (
  notif: Omit<FirebaseNotification, "id">
) => {
  if (!db) return;
  await addDoc(collection(db, "notifications"), notif);
};

export const markNotificationRead = async (id: string) => {
  if (!db) return;
  await updateDoc(doc(db, "notifications", id), { read: true });
};

// ----- Vendors -----
export const getVendors = async (): Promise<FirebaseVendor[]> => {
  if (!db) return [];
  const snap = await getDocs(collection(db, "vendors"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FirebaseVendor);
};

export const addVendor = async (vendor: Omit<FirebaseVendor, "id">) => {
  if (!db) return;
  await addDoc(collection(db, "vendors"), vendor);
};

export const updateVendor = async (id: string, data: Partial<FirebaseVendor>) => {
  if (!db) return;
  await updateDoc(doc(db, "vendors", id), data);
};

export const deleteVendor = async (id: string) => {
  if (!db) return;
  await deleteDoc(doc(db, "vendors", id));
};

// ----- Real-time Listeners -----
export const onNotificationsSnapshot = (
  wallet: string,
  callback: (notifications: FirebaseNotification[]) => void
): Unsubscribe => {
  if (!db) return () => {};
  const q = query(
    collection(db, "notifications"),
    where("walletAddress", "==", wallet),
    orderBy("timestamp", "desc")
  );
  return onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
    callback(
      snap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as FirebaseNotification
      )
    );
  });
};

export const onActivityLogsSnapshot = (
  callback: (logs: FirebaseActivityLog[]) => void
): Unsubscribe => {
  if (!db) return () => {};
  const q = query(
    collection(db, "activity_logs"),
    orderBy("timestamp", "desc")
  );
  return onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
    callback(
      snap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as FirebaseActivityLog
      )
    );
  });
};

export { isFirebaseConfigured };
