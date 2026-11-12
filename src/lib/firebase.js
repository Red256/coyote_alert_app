import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import 'react-native-get-random-values';
import { firebaseConfig } from '../../env';

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Storage
export const storage = getStorage(app);

// Initialize Auth with AsyncStorage persistence for React Native
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Helper function to get security rules for Firestore
export const getSecurityRules = () => `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Posts collection
    match /posts/{postId} {
      allow read: if true;
      allow write: if request.auth != null;
      
      // Comments subcollection
      match /comments/{commentId} {
        allow read: if true;
        allow write: if request.auth != null;
      }
    }
    
    // Coyote sightings collection
    match /coyoteSightings/{sightingId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
`;

// Helper function to get Storage security rules
export const getStorageRules = () => `
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /posts/{postId}/{imageId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
`;

// Admin permission functions using Firebase Auth custom claims
export const isAdmin = async () => {
  try {
    if (!auth.currentUser) {
      return false;
    }
    
    // Get the user's ID token to check custom claims
    const tokenResult = await auth.currentUser.getIdTokenResult();
    return tokenResult.claims.admin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

export const checkUserClaims = async () => {
  try {
    if (!auth.currentUser) {
      return {};
    }
    
    const tokenResult = await auth.currentUser.getIdTokenResult();
    return tokenResult.claims;
  } catch (error) {
    console.error('Error checking user claims:', error);
    return {};
  }
};