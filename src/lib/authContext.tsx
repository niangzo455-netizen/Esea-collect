import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, UserRole } from '../types';
import {
  CURRENT_SUPERVISOR,
  CURRENT_STUDENT,
  DEFAULT_CLEAN_SUPERVISOR,
  DEFAULT_CLEAN_STUDENT,
} from '../data/mockData';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isDemoMode: boolean;
  signUp: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    department: string;
    matricule?: string;
  }) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: (role?: UserRole, department?: string) => Promise<void>;
  signOut: () => Promise<void>;
  loginDemo: (role: UserRole) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER_STORAGE_KEY = 'esea_collect_demo_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  // Load user profile from Firestore or create initial
  const fetchOrCreateProfile = async (firebaseUser: User, fallbackRole: UserRole = 'student'): Promise<UserProfile> => {
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data() as UserProfile;
        const fullProfile: UserProfile = {
          ...data,
          id: firebaseUser.uid,
          uid: firebaseUser.uid,
          email: firebaseUser.email || data.email,
        };
        // Update last login
        await updateDoc(userDocRef, {
          lastLoginAt: new Date().toISOString(),
        }).catch((e) => console.warn('Could not update last login', e));

        return fullProfile;
      } else {
        // Create initial user profile
        const newProfile: UserProfile = {
          id: firebaseUser.uid,
          uid: firebaseUser.uid,
          email: firebaseUser.email || 'collecteur@esea.ucad.sn',
          name: firebaseUser.displayName || 'Enquêteur ESEA',
          role: fallbackRole,
          department: 'ATEGU',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };

        await setDoc(userDocRef, newProfile);
        return newProfile;
      }
    } catch (err) {
      console.warn('Firestore profile fetch error (fallback to local user)', err);
      return {
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || 'Utilisateur ESEA',
        role: fallbackRole,
        department: 'ATEGU',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
    }
  };

  useEffect(() => {
    // Listen to Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setIsDemoMode(false);
        setUser(currentUser);
        try {
          const userProf = await fetchOrCreateProfile(currentUser);
          setProfile(userProf);
        } catch (e) {
          console.error('Failed to load profile', e);
        }
        setLoading(false);
      } else {
        // Check for local demo session fallback
        const savedDemo = localStorage.getItem(DEMO_USER_STORAGE_KEY);
        if (savedDemo) {
          try {
            const parsed = JSON.parse(savedDemo) as UserProfile;
            setProfile(parsed);
            setIsDemoMode(true);
            setUser(null);
          } catch (e) {
            localStorage.removeItem(DEMO_USER_STORAGE_KEY);
            setProfile(null);
          }
        } else {
          // Default to clean supervisor profile in clean pilot environment
          setProfile(DEFAULT_CLEAN_SUPERVISOR);
          setIsDemoMode(false);
          setUser(null);
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Sign Up with Email & Password
  const signUp = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    department: string;
    matricule?: string;
  }) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`;
      
      await updateProfile(userCredential.user, {
        displayName: fullName,
      });

      const newProfile: UserProfile = {
        id: userCredential.user.uid,
        uid: userCredential.user.uid,
        name: fullName,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.toLowerCase(),
        role: data.role,
        department: data.department,
        matricule: data.matricule,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        isDemo: false,
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), newProfile);
      setProfile(newProfile);
      setIsDemoMode(false);
      localStorage.removeItem(DEMO_USER_STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  };

  // Sign In with Email & Password
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const prof = await fetchOrCreateProfile(userCredential.user);
      setProfile(prof);
      setIsDemoMode(false);
      localStorage.removeItem(DEMO_USER_STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  };

  // Sign In with Google
  const signInWithGoogle = async (role: UserRole = 'student', department: string = 'ATEGU') => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const userCredential = await signInWithPopup(auth, provider);
      const prof = await fetchOrCreateProfile(userCredential.user, role);
      if (department && prof.department !== department) {
        await updateUserProfile({ department });
      }
      setProfile(prof);
      setIsDemoMode(false);
      localStorage.removeItem(DEMO_USER_STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  };

  // Sign Out
  const signOut = async () => {
    setLoading(true);
    try {
      if (auth.currentUser) {
        await fbSignOut(auth);
      }
      localStorage.removeItem(DEMO_USER_STORAGE_KEY);
      setUser(null);
      setProfile(CURRENT_STUDENT);
      setIsDemoMode(true);
    } finally {
      setLoading(false);
    }
  };

  // Demo account instant login
  const loginDemo = async (role: UserRole) => {
    setLoading(true);
    try {
      if (auth.currentUser) {
        await fbSignOut(auth);
      }
      const demoProfile = role === 'supervisor' ? { ...CURRENT_SUPERVISOR, isDemo: true } : { ...CURRENT_STUDENT, isDemo: true };
      localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(demoProfile));
      setProfile(demoProfile);
      setIsDemoMode(true);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Update Profile
  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!profile) return;
    const updated = { ...profile, ...data };
    setProfile(updated);

    if (user && !isDemoMode) {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, data);
    } else {
      localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isDemoMode,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        loginDemo,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
