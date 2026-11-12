import { getRecordingPermissionsAsync, requestRecordingPermissionsAsync } from 'expo-audio';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

/**
 * Request microphone permission for speech recognition
 * @returns {Promise<boolean>} - true if permission granted, false otherwise
 */
export const requestMicrophonePermission = async () => {
  try {
    if (Platform.OS === 'web') {
      // For web, we need to request permission through the browser
      console.log('Web platform - checking microphone permission...');
      return true; // Let the WebView handle browser permissions
    }

    // For iOS and Android, use Expo Audio
    const { status } = await requestRecordingPermissionsAsync();
    console.log('Microphone permission status:', status);
    
    if (status === 'granted') {
      console.log('Microphone permission granted');
      return true;
    } else {
      console.log('Microphone permission denied');
      return false;
    }
  } catch (error) {
    console.error('Error requesting microphone permission:', error);
    return false;
  }
};

/**
 * Check if microphone permission is already granted
 * @returns {Promise<boolean>} - true if permission granted, false otherwise
 */
export const checkMicrophonePermission = async () => {
  try {
    if (Platform.OS === 'web') {
      // For web, we can't check permissions directly
      return true;
    }

    const { status } = await getRecordingPermissionsAsync();
    console.log('Current microphone permission status:', status);
    return status === 'granted';
  } catch (error) {
    console.error('Error checking microphone permission:', error);
    return false;
  }
};

/**
 * Check if camera permission is already granted
 * @returns {Promise<boolean>} - true if permission granted, false otherwise
 */
export const checkCameraPermission = async () => {
  try {
    if (Platform.OS === 'web') {
      return true;
    }

    const { status } = await ImagePicker.getCameraPermissionsAsync();
    console.log('Current camera permission status:', status);
    return status === 'granted';
  } catch (error) {
    console.error('Error checking camera permission:', error);
    return false;
  }
};

/**
 * Check if location permission is already granted
 * @returns {Promise<boolean>} - true if permission granted, false otherwise
 */
export const checkLocationPermission = async () => {
  try {
    if (Platform.OS === 'web') {
      return true;
    }

    const { status } = await Location.getForegroundPermissionsAsync();
    console.log('Current location permission status:', status);
    return status === 'granted';
  } catch (error) {
    console.error('Error checking location permission:', error);
    return false;
  }
};

/**
 * Request all necessary permissions for the app
 * @returns {Promise<Object>} - Object with permission statuses
 */
export const requestAllPermissions = async () => {
  try {
    const permissions = {
      microphone: false,
      camera: false,
      location: false
    };

    // Request microphone permission
    permissions.microphone = await requestMicrophonePermission();

    // Request camera permission (if needed)
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      permissions.camera = status === 'granted';
    } catch (error) {
      console.log('Camera permission not available or already granted');
      permissions.camera = true; // Assume granted if not needed
    }

    // Request location permission (if needed)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      permissions.location = status === 'granted';
    } catch (error) {
      console.log('Location permission not available or already granted');
      permissions.location = true; // Assume granted if not needed
    }

    console.log('All permissions status:', permissions);
    return permissions;
  } catch (error) {
    console.error('Error requesting permissions:', error);
    return {
      microphone: false,
      camera: false,
      location: false
    };
  }
};
