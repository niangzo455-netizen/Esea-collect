import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfigData from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId,
  measurementId: firebaseConfigData.measurementId,
};

// Initialize Firebase App singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore (with databaseId if defined)
export const db =
  firebaseConfigData.firestoreDatabaseId &&
  firebaseConfigData.firestoreDatabaseId !== '(default)' &&
  firebaseConfigData.firestoreDatabaseId !== ''
    ? getFirestore(app, firebaseConfigData.firestoreDatabaseId)
    : getFirestore(app);

// Initialize Firebase Storage
export const storage = getStorage(app);

export default app;
