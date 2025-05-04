import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
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
    alert('Getting user data for: ' + userId);
    const userDoc = await getDoc(doc(db, 'users', userId));
    alert('User document exists: ' + userDoc.exists());
    if (userDoc.exists()) {
      const data = userDoc.data();
      alert('User data retrieved: ' + JSON.stringify(data));
      return { data, error: null };
    }
    alert('User data not found');
    return { data: null, error: new Error('User data not found') };
  } catch (error) {
    alert('Error getting user data: ' + error);
    return { data: null, error: error as Error };
  }
};

export const updateUserProgress = async (userId: string, progress: any) => {
  try {
    alert('Updating user progress for user: ' + userId);
    await updateDoc(doc(db, 'users', userId), {
      'settings.progress': progress
    });
    alert('Progress updated successfully');
    return { error: null };
  } catch (error) {
    alert('Error updating progress: ' + error);
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

// New functions for tracking individual question progress
export const saveQuestionProgress = async (userId: string, language: string, questionId: string, result: 'success' | 'failed') => {
  try {
    alert('Saving question progress: ' + JSON.stringify({ userId, language, questionId, result }));
    const timestamp = new Date().toISOString();
    const progressRef = doc(db, 'users', userId, 'questionProgress', `${language}_${questionId}`);
    
    await setDoc(progressRef, {
      questionId,
      language,
      result,
      timestamp,
    }, { merge: true });
    
    alert('Question progress saved successfully');
    return { error: null };
  } catch (error) {
    alert('Error saving question progress: ' + error);
    return { error: error as Error };
  }
};

export const getQuestionProgress = async (userId: string, language: string, questionId: string) => {
  try {
    const progressRef = doc(db, 'users', userId, 'questionProgress', `${language}_${questionId}`);
    const progressDoc = await getDoc(progressRef);
    
    if (progressDoc.exists()) {
      return { data: progressDoc.data(), error: null };
    }
    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
};

export const getUserQuestionProgress = async (userId: string, language: string) => {
  try {
    const progressRef = collection(db, 'users', userId, 'questionProgress');
    const q = query(progressRef, where('language', '==', language));
    const querySnapshot = await getDocs(q);
    
    const progress = querySnapshot.docs.map(doc => doc.data());
    return { data: progress, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
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
    updateUserSettings,
    saveQuestionProgress,
    getQuestionProgress,
    getUserQuestionProgress
  };
}; 