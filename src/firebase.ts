import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';
import { getFirestore, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDrQ7ooaylbfsNQAq_uL76md5WQW5qxhVE",
  authDomain: "language-flashcards-c0676.firebaseapp.com",
  projectId: "language-flashcards-c0676",
  storageBucket: "language-flashcards-c0676.firebasestorage.app",
  messagingSenderId: "391869561092",
  appId: "1:391869561092:web:b61e4817ce2a9735293851",
  measurementId: "G-PWNSN5N2N9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Auth functions
export const registerUser = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Initialize user data in Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email: userCredential.user.email,
      createdAt: new Date().toISOString(),
      settings: {
        selectedLevel: 'A1',
        progress: {
          Swedish: {
            phrasesStudied: 0,
            correctAnswers: 0,
            lastStudyDate: new Date().toISOString(),
            levelProgress: {
              'A1': { attempted: 0, correct: 0 },
              'A2': { attempted: 0, correct: 0 },
              'B1': { attempted: 0, correct: 0 },
              'B2': { attempted: 0, correct: 0 },
              'C1': { attempted: 0, correct: 0 },
              'C2': { attempted: 0, correct: 0 },
            },
            dailyStats: [],
            failedPhrases: [],
          },
          German: {
            phrasesStudied: 0,
            correctAnswers: 0,
            lastStudyDate: new Date().toISOString(),
            levelProgress: {
              'A1': { attempted: 0, correct: 0 },
              'A2': { attempted: 0, correct: 0 },
              'B1': { attempted: 0, correct: 0 },
              'B2': { attempted: 0, correct: 0 },
              'C1': { attempted: 0, correct: 0 },
              'C2': { attempted: 0, correct: 0 },
            },
            dailyStats: [],
            failedPhrases: [],
          },
        },
      },
    });
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error as Error };
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error as Error };
  }
};

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // Check if user data exists in Firestore
    const userDoc = await getDoc(doc(db, 'users', result.user.uid));
    if (!userDoc.exists()) {
      // Initialize user data if first time login
      await setDoc(doc(db, 'users', result.user.uid), {
        email: result.user.email,
        createdAt: new Date().toISOString(),
        settings: {
          selectedLevel: 'A1',
          progress: {
            Swedish: {
              phrasesStudied: 0,
              correctAnswers: 0,
              lastStudyDate: new Date().toISOString(),
              levelProgress: {
                'A1': { attempted: 0, correct: 0 },
                'A2': { attempted: 0, correct: 0 },
                'B1': { attempted: 0, correct: 0 },
                'B2': { attempted: 0, correct: 0 },
                'C1': { attempted: 0, correct: 0 },
                'C2': { attempted: 0, correct: 0 },
              },
              dailyStats: [],
              failedPhrases: [],
            },
            German: {
              phrasesStudied: 0,
              correctAnswers: 0,
              lastStudyDate: new Date().toISOString(),
              levelProgress: {
                'A1': { attempted: 0, correct: 0 },
                'A2': { attempted: 0, correct: 0 },
                'B1': { attempted: 0, correct: 0 },
                'B2': { attempted: 0, correct: 0 },
                'C1': { attempted: 0, correct: 0 },
                'C2': { attempted: 0, correct: 0 },
              },
              dailyStats: [],
              failedPhrases: [],
            },
          },
        },
      });
    }
    return { user: result.user, error: null };
  } catch (error) {
    return { user: null, error: error as Error };
  }
};

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
};

// Firestore functions for user data
export const getUserData = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { data: userDoc.data(), error: null };
    }
    return { data: null, error: new Error('User data not found') };
  } catch (error) {
    return { data: null, error: error as Error };
  }
};

export const updateUserProgress = async (userId: string, progress: any) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      'settings.progress': progress
    });
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
};

export const updateUserSettings = async (userId: string, settings: any) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      settings: settings
    });
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
};

// Custom hook for auth state
export const useFirebaseAuth = () => {
  return { 
    auth, 
    db,
    registerUser, 
    loginUser, 
    logoutUser, 
    signInWithGoogle, 
    resetPassword,
    getUserData,
    updateUserProgress,
    updateUserSettings
  };
}; 