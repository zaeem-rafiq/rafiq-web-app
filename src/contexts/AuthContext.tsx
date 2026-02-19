import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  deleteUser,
  updateProfile as firebaseUpdateProfile,
  type User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

// Matches iOS Madhab enum raw values exactly (lowercase, no punctuation)
export type Madhab = "hanafi" | "shafii" | "maliki" | "hanbali" | "jafari" | "";

// Display labels for UI rendering (human-readable)
export const MADHAB_LABELS: Record<Madhab, string> = {
  hanafi: "Hanafi",
  shafii: "Shafi'i",
  maliki: "Maliki",
  hanbali: "Hanbali",
  jafari: "Ja'fari",
  "": "",
};

export type Marja = "sistani" | "khamenei" | "other" | "";

export interface UserProfile {
  displayName: string;
  firstName: string;
  lastName: string;
  email: string;
  madhab: Madhab;
  marja: Marja;
  nisabStandard: "gold" | "silver";
  zakatAnniversaryDate: string | null;
  khumsAnniversaryDate: string | null;  // iOS field name (was khumsYearStartDate)
  householdSize: number;
  homeMosqueId: string | null;
  homeMosqueName: string | null;
  createdAt: any;
  onboardingComplete: boolean;          // web-only field
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_PROFILE: Omit<UserProfile, "displayName" | "firstName" | "lastName" | "email" | "createdAt"> = {
  madhab: "",
  marja: "",
  nisabStandard: "gold",
  zakatAnniversaryDate: null,
  khumsAnniversaryDate: null,
  householdSize: 1,
  homeMosqueId: null,
  homeMosqueName: null,
  onboardingComplete: false,
};

async function fetchProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

async function createProfileDoc(uid: string, displayName: string, email: string) {
  const nameParts = displayName.trim().split(/\s+/);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";
  const profile: UserProfile = {
    displayName,
    firstName,
    lastName,
    email,
    ...DEFAULT_PROFILE,
    createdAt: serverTimestamp(),
  };
  await setDoc(doc(db, "users", uid), profile, { merge: true });
  return profile;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const profile = await fetchProfile(firebaseUser.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const profile = await fetchProfile(cred.user.uid);
    setUserProfile(profile);
  };

  const signup = async (email: string, password: string, displayName: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await firebaseUpdateProfile(cred.user, { displayName });
    const profile = await createProfileDoc(cred.user.uid, displayName, email);
    setUserProfile(profile);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    let profile = await fetchProfile(cred.user.uid);
    if (!profile) {
      profile = await createProfileDoc(
        cred.user.uid,
        cred.user.displayName || "User",
        cred.user.email || "",
      );
    }
    setUserProfile(profile);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid), data);
    setUserProfile((prev) => (prev ? { ...prev, ...data } : null));
  };

  const refreshProfile = async () => {
    if (!user) return;
    const profile = await fetchProfile(user.uid);
    setUserProfile(profile);
  };

  const deleteAccount = async () => {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid));
    await deleteUser(user);
    setUser(null);
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        login,
        signup,
        loginWithGoogle,
        logout,
        updateUserProfile,
        refreshProfile,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
