// Script to update all existing user accounts with zip code 92782
import { collection, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Update all existing user accounts to have zip code 92782
 * This function handles cases where users collection might not exist or have permission issues
 */
export const updateAllUserZipCodes = async () => {
  try {
    console.log('Starting to update user zip codes...');
    
    // Get all users from the users collection
    const usersCollection = collection(db, 'users');
    let usersSnapshot;
    
    try {
      usersSnapshot = await getDocs(usersCollection);
    } catch (permissionError) {
      console.log('Permission error accessing users collection:', permissionError.message);
      return { 
        success: false, 
        message: 'Permission denied. Please check Firestore security rules for the users collection.', 
        count: 0 
      };
    }
    
    if (usersSnapshot.empty) {
      console.log('No users found in the database.');
      return { 
        success: true, 
        message: 'No users found in Firestore. Users will get zip code 92782 when they next sign up.', 
        count: 0 
      };
    }
    
    let updateCount = 0;
    let errorCount = 0;
    const updatePromises = [];
    
    // Update each user document
    usersSnapshot.forEach((userDoc) => {
      const userData = userDoc.data();
      const userId = userDoc.id;
      
      console.log(`Updating user ${userId} (${userData.email || 'No email'}) with zip code 92782`);
      
      // Update the user document with zip code 92782
      const updatePromise = updateDoc(doc(db, 'users', userId), {
        zipCode: '92782',
        updatedAt: new Date(),
      }).then(() => {
        updateCount++;
      }).catch((error) => {
        console.error(`Failed to update user ${userId}:`, error.message);
        errorCount++;
      });
      
      updatePromises.push(updatePromise);
    });
    
    // Wait for all updates to complete
    await Promise.all(updatePromises);
    
    console.log(`Successfully updated ${updateCount} user accounts with zip code 92782`);
    if (errorCount > 0) {
      console.log(`Failed to update ${errorCount} user accounts`);
    }
    
    return {
      success: updateCount > 0 || errorCount === 0,
      message: errorCount > 0 
        ? `Updated ${updateCount} users, failed to update ${errorCount} users`
        : `Successfully updated ${updateCount} user accounts`,
      count: updateCount
    };
    
  } catch (error) {
    console.error('Error updating user zip codes:', error);
    return {
      success: false,
      message: `Error updating zip codes: ${error.message}. Note: User profiles are stored in Firestore 'users' collection.`,
      count: 0
    };
  }
};

/**
 * Check current zip codes of all users (for verification)
 */
export const checkUserZipCodes = async () => {
  try {
    console.log('Checking current user zip codes...');
    
    const usersCollection = collection(db, 'users');
    let usersSnapshot;
    
    try {
      usersSnapshot = await getDocs(usersCollection);
    } catch (permissionError) {
      console.log('Permission error accessing users collection:', permissionError.message);
      return { 
        success: false, 
        message: 'Permission denied. Please check Firestore security rules for the users collection.', 
        users: [] 
      };
    }
    
    if (usersSnapshot.empty) {
      console.log('No users found in the database.');
      return { 
        success: true, 
        message: 'No users found in Firestore users collection. This is normal if no one has signed up yet.', 
        users: [] 
      };
    }
    
    const users = [];
    
    usersSnapshot.forEach((userDoc) => {
      const userData = userDoc.data();
      const userId = userDoc.id;
      
      users.push({
        userId,
        email: userData.email || 'No email',
        zipCode: userData.zipCode || 'No zip code',
        createdAt: userData.createdAt?.toDate?.() || 'Unknown',
        updatedAt: userData.updatedAt?.toDate?.() || 'Unknown',
      });
    });
    
    console.log('Current user zip codes:', users);
    return {
      success: true,
      message: `Found ${users.length} users in Firestore`,
      users: users
    };
    
  } catch (error) {
    console.error('Error checking user zip codes:', error);
    return {
      success: false,
      message: `Error checking zip codes: ${error.message}. Note: User profiles should be in Firestore 'users' collection.`,
      users: []
    };
  }
};

/**
 * Alternative approach: Create a default settings document
 * This sets a default zip code that can be used for new users
 */
export const setDefaultZipCode = async (zipCode = '92782') => {
  try {
    console.log(`Setting default zip code to ${zipCode}...`);
    
    // Create or update a settings document
    await setDoc(doc(db, 'settings', 'defaults'), {
      defaultZipCode: zipCode,
      updatedAt: new Date(),
      description: 'Default zip code for new users'
    });
    
    console.log(`Successfully set default zip code to ${zipCode}`);
    
    return {
      success: true,
      message: `Default zip code set to ${zipCode}. New users will use this zip code.`,
      zipCode: zipCode
    };
    
  } catch (error) {
    console.error('Error setting default zip code:', error);
    return {
      success: false,
      message: `Error setting default zip code: ${error.message}`,
      zipCode: null
    };
  }
};
