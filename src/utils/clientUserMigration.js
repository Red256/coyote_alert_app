// Client-side user migration utility
// This creates Firestore user documents when users sign in (if they don't exist)

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Ensure user document exists in Firestore
 * Call this after successful authentication
 */
export const ensureUserDocument = async (user, additionalData = {}) => {
  try {
    if (!user || !user.uid) {
      console.log('No user provided to ensureUserDocument');
      return false;
    }

    console.log(`Checking if user document exists for: ${user.email || user.uid}`);
    
    // Check if user document already exists
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      console.log(`✅ User document already exists for: ${user.email || user.uid}`);
      return true;
    }
    
    console.log(`📝 Creating user document for: ${user.email || user.uid}`);
    
    // Create user document with default data
    const userData = {
      email: user.email || null,
      zipCode: '92782', // Default zip code for migrated users
      createdAt: new Date(),
      updatedAt: new Date(),
      displayName: user.displayName || null,
      emailVerified: user.emailVerified || false,
      // Migration metadata
      migratedFromAuth: true,
      migrationDate: new Date(),
      // Merge any additional data provided
      ...additionalData
    };
    
    await setDoc(userDocRef, userData);
    console.log(`✅ Successfully created user document for: ${user.email || user.uid}`);
    
    return true;
    
  } catch (error) {
    console.error('Error ensuring user document:', error);
    return false;
  }
};

/**
 * Get user profile data from Firestore
 * Creates the document if it doesn't exist
 */
export const getUserProfile = async (user) => {
  try {
    if (!user || !user.uid) {
      return null;
    }
    
    // Ensure document exists first
    await ensureUserDocument(user);
    
    // Get the document
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      return {
        uid: user.uid,
        ...userDoc.data()
      };
    }
    
    return null;
    
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

/**
 * Update user profile data in Firestore
 */
export const updateUserProfile = async (user, updates) => {
  try {
    if (!user || !user.uid) {
      return false;
    }
    
    // Ensure document exists first
    await ensureUserDocument(user);
    
    // Update the document
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
      ...updates,
      updatedAt: new Date()
    }, { merge: true });
    
    console.log(`✅ Updated profile for: ${user.email || user.uid}`);
    return true;
    
  } catch (error) {
    console.error('Error updating user profile:', error);
    return false;
  }
};



