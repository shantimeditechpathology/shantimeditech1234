import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string, role?: UserRole, phone?: string) => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  sendOtp: (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => Promise<ConfirmationResult>;
  verifyOtp: (confirmationResult: ConfirmationResult, otp: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isDelivery: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const createProfile = async (firebaseUser: User, displayName?: string, role?: UserRole, phone?: string): Promise<UserProfile> => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data() as UserProfile;
      let updatedData = { ...data };
      let needsUpdate = false;

      if ((firebaseUser.email === 'vipinks2000@gmail.com' || firebaseUser.email === 'shantimeditechpathology12@gmail.com') && data.role !== 'admin') {
        updatedData.role = 'admin' as const;
        needsUpdate = true;
      }

      if (role && data.role !== role) {
        updatedData.role = role;
        needsUpdate = true;
      }

      if (phone && data.phoneNumber !== phone) {
        updatedData.phoneNumber = phone;
        needsUpdate = true;
      }

      if (!data.referralCode) {
        updatedData.referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        needsUpdate = true;
      }

      if (needsUpdate) {
        await updateDoc(userDocRef, updatedData);
      }
      
      return updatedData;
    } else {
      const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      let finalRole: UserRole = 'user';
      
      if (firebaseUser.email === 'vipinks2000@gmail.com' || firebaseUser.email === 'shantimeditechpathology12@gmail.com') {
        finalRole = 'admin';
      } else if (role) {
        finalRole = role;
      }

      const newProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: displayName || firebaseUser.displayName || '',
        phoneNumber: phone || firebaseUser.phoneNumber || '',
        role: finalRole,
        referralCode,
        referralEarnings: 0,
        withdrawableBalance: 0,
        createdAt: new Date().toISOString(),
      };
      await setDoc(userDocRef, newProfile);
      return newProfile;
    }
  };

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      try {
        if (firebaseUser) {
          const profileData = await createProfile(firebaseUser);
          setProfile(profileData);

          const userDocRef = doc(db, 'users', firebaseUser.uid);
          unsubProfile = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
              setProfile(doc.data() as UserProfile);
            }
          }, (error) => {
            console.error('Profile snapshot error:', error);
          });
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error('Error in AuthProvider:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const registerWithEmail = async (email: string, pass: string, name: string, role?: UserRole, phone?: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(userCredential.user, { displayName: name });
    await createProfile(userCredential.user, name, role, phone);
  };

  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const sendOtp = async (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => {
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    return confirmationResult;
  };

  const verifyOtp = async (confirmationResult: ConfirmationResult, otp: string) => {
    const result = await confirmationResult.confirm(otp);
    if (result.user) {
      await createProfile(result.user);
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const isAdmin = profile?.role === 'admin' || user?.email === 'vipinks2000@gmail.com' || user?.email === 'shantimeditechpathology12@gmail.com';
  const isDelivery = profile?.role === 'delivery';

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      loginWithGoogle, 
      registerWithEmail,
      loginWithEmail,
      sendOtp,
      verifyOtp,
      resetPassword,
      logout, 
      isAdmin, 
      isDelivery 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
