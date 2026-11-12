import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { RecordingPresets, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import * as Location from 'expo-location';
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapLocationPicker from '../components/MapLocationPicker';
import { auth, db, storage } from '../lib/firebase';
import { sharedStyles } from '../styles/sharedStyles';
import { launchCamera, showImagePicker, showMediaPicker } from '../utils/imageAnalysis';
import { checkMicrophonePermission, requestMicrophonePermission } from '../utils/permissions';

// Maximum file size: 1GB in bytes
const MAX_FILE_SIZE = 1 * 1024 * 1024 * 1024;

export default function ReportSightingScreen({ route, navigation, isGuest }) {
  const { userLocation, prefilledData } = route?.params || {};
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState(null);
  const [description, setDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [autoFilling, setAutoFilling] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');
  
  // User info fields
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  
  // New fields for expanded reporting
  const [encounterType, setEncounterType] = useState('');
  const [hazingAttempted, setHazingAttempted] = useState('');
  const [coyoteSickInjured, setCoyoteSickInjured] = useState('');
  const [wildlifeFeeding, setWildlifeFeeding] = useState('');
  const [contactPreferences, setContactPreferences] = useState('');
  const [alertLevel, setAlertLevel] = useState('');
  
  // Media fields
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Voice input fields
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recordingIntervalRef = useRef(null);
  
  // Success modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Fetch user profile data on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!isGuest && auth.currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.name) setUserName(userData.name);
            if (userData.phoneNumber) setUserPhone(userData.phoneNumber);
          }
          // Always set email from auth
          if (auth.currentUser.email) {
            setUserEmail(auth.currentUser.email);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Still set email from auth even if profile fetch fails
          if (auth.currentUser?.email) {
            setUserEmail(auth.currentUser.email);
          }
        }
      }
    };
    
    fetchUserProfile();
  }, [isGuest]);

  useEffect(() => {
    // Pre-fill with pre-filled data from Koko if available
    if (prefilledData) {
      if (prefilledData.location) {
        setLocation(prefilledData.location);
      }
      if (prefilledData.description) {
        setDescription(prefilledData.description);
      }
      if (prefilledData.timestamp) {
        setSelectedDate(prefilledData.timestamp instanceof Date ? prefilledData.timestamp : new Date(prefilledData.timestamp));
      }
      if (prefilledData.hazingAttempted) {
        const hazingLower = prefilledData.hazingAttempted.toLowerCase().trim();
        setHazingAttempted(hazingLower === 'yes' || hazingLower.startsWith('y') ? 'yes' : 'no');
      }
      if (prefilledData.wildlifeFeeding) {
        const feedingLower = prefilledData.wildlifeFeeding.toLowerCase().trim();
        setWildlifeFeeding(feedingLower === 'yes' || feedingLower.startsWith('y') ? 'yes' : 'no');
      }
      if (prefilledData.contactPreferences) {
        const contactLower = prefilledData.contactPreferences.toLowerCase().trim();
        setContactPreferences(contactLower === 'yes' || contactLower.startsWith('y') ? 'yes' : 'no');
      }
      // Map category to alert level
      if (prefilledData.category) {
        const category = prefilledData.category.toUpperCase();
        if (category.includes('RED') || category.includes('HIGH')) {
          setAlertLevel('danger');
        } else if (category.includes('YELLOW') || category.includes('MEDIUM')) {
          setAlertLevel('warning');
        } else {
          setAlertLevel('sighting');
        }
      }
      // Set coyote health status
      if (prefilledData.health) {
        const healthLower = prefilledData.health.toLowerCase();
        setCoyoteSickInjured(healthLower.includes('sick') || healthLower.includes('injured') || healthLower.includes('unusual') ? 'yes' : 'no');
      }
      // Infer encounter type from description
      if (prefilledData.description) {
        const descLower = prefilledData.description.toLowerCase();
        if (descLower.includes('road kill') || descLower.includes('roadkill') || descLower.includes('dead on road')) {
          setEncounterType('road kill');
        } else if (descLower.includes('bit me') || descLower.includes('attacked me') || descLower.includes('chased me') || descLower.includes('approached me')) {
          setEncounterType('human interaction');
        } else if (descLower.includes('dog') || descLower.includes('cat') || descLower.includes('pet') || descLower.includes('attacked') || descLower.includes('chased')) {
          setEncounterType('pet interaction');
        } else {
          // Default to pet interaction if unclear (most common)
          setEncounterType('pet interaction');
        }
      }
    }
    
    // Pre-fill with user's current location if available (and no pre-filled location)
    if (userLocation && !prefilledData?.location) {
      setCoordinates(userLocation);
      setLocation(`${userLocation.latitude.toFixed(6)}, ${userLocation.longitude.toFixed(6)}`);
    } else if (userLocation && prefilledData?.location) {
      // If we have pre-filled location text, still set coordinates from userLocation
      setCoordinates(userLocation);
    }
  }, [userLocation, prefilledData]);

  const autoFillLocation = async () => {
    setAutoFilling(true);
    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to auto-fill your current location.');
        return;
      }

      // Get current position
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
      setCoordinates(coords);

      // Reverse geocode to get address
      try {
        const reverseGeocodeResults = await Location.reverseGeocodeAsync({
          latitude: coords.latitude,
          longitude: coords.longitude
        });

        if (reverseGeocodeResults.length > 0) {
          const address = reverseGeocodeResults[0];
          const addressParts = [];
          
          if (address.streetNumber && address.street) {
            addressParts.push(`${address.streetNumber} ${address.street}`);
          } else if (address.street) {
            addressParts.push(address.street);
          }
          
          if (address.city) {
            addressParts.push(address.city);
          }
          
          if (address.region) {
            addressParts.push(address.region);
          }
          
          if (address.postalCode) {
            addressParts.push(address.postalCode);
          }
          
          const addressString = addressParts.join(', ');
          setLocation(addressString || `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
        } else {
          setLocation(`${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
        }
      } catch (geocodeError) {
        console.error('Reverse geocoding error:', geocodeError);
        setLocation(`${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
      }

      Alert.alert('Success', 'Location auto-filled successfully!');
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Unable to get your current location. Please try again or enter manually.');
    } finally {
      setAutoFilling(false);
    }
  };

  const handleDateChange = (event, date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date) {
      // Keep the existing time but update the date
      const newDate = new Date(selectedDate);
      newDate.setFullYear(date.getFullYear());
      newDate.setMonth(date.getMonth());
      newDate.setDate(date.getDate());
      setSelectedDate(newDate);
    }
  };

  const handleTimeChange = (event, time) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (time) {
      // Keep the existing date but update the time
      const newDate = new Date(selectedDate);
      newDate.setHours(time.getHours());
      newDate.setMinutes(time.getMinutes());
      setSelectedDate(newDate);
    }
  };

  const setCurrentTime = () => {
    setSelectedDate(new Date());
    Alert.alert('Success', 'Time set to current date and time!');
  };

  const handleLocationFromMap = async (location) => {
    setCoordinates(location);
    setShowMapPicker(false);
    
    // Reverse geocode the coordinates to get a human-readable address
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // If permission denied, fall back to coordinates
        setLocation(`${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`);
        Alert.alert('Success', 'Location selected on map!');
        return;
      }

      const reverseGeocodeResults = await Location.reverseGeocodeAsync({
        latitude: location.latitude,
        longitude: location.longitude
      });
      
      if (reverseGeocodeResults.length > 0) {
        const address = reverseGeocodeResults[0];
        console.log('Reverse geocoding result:', address); // Debug log
        
        // Try to build a more complete address
        const addressParts = [];
        
        // Add street number and name
        if (address.streetNumber && address.street) {
          addressParts.push(`${address.streetNumber} ${address.street}`);
        } else if (address.street) {
          addressParts.push(address.street);
        }
        
        // Add city
        if (address.city) {
          addressParts.push(address.city);
        }
        
        // Add region (state)
        if (address.region) {
          addressParts.push(address.region);
        }
        
        // Add postal code
        if (address.postalCode) {
          addressParts.push(address.postalCode);
        }
        
        const addressString = addressParts.join(', ');
        console.log('Formatted address:', addressString); // Debug log
        
        setLocation(addressString || `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`);
      } else {
        setLocation(`${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`);
      }
      
      Alert.alert('Success', 'Location selected on map!');
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      // Fall back to coordinates if geocoding fails
      setLocation(`${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`);
      Alert.alert('Success', 'Location selected on map!');
    }
  };

  const openMapPicker = () => {
    const currentLocation = coordinates || userLocation;
    setShowMapPicker(true);
  };

  const handleMediaSelection = () => {
    Alert.alert(
      'Add Photo',
      'Choose how you want to add media',
      [
        { text: 'Take Photo', onPress: handleCamera },
        { text: 'Select from Library', onPress: handleMediaLibrary },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleCamera = async () => {
    try {
      const result = await launchCamera();
      if (result && result.uri) {
        setSelectedMedia(prev => [...prev, { uri: result.uri, type: 'image' }]);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera. Please try again.');
    }
  };

  const handlePhotoLibrary = async () => {
    try {
      const result = await showImagePicker();
      if (result && result.uri) {
        setSelectedMedia(prev => [...prev, { uri: result.uri, type: 'image' }]);
      }
    } catch (error) {
      console.error('Photo library error:', error);
      Alert.alert('Error', 'Failed to open photo library. Please try again.');
    }
  };

  const handleMediaLibrary = async () => {
    try {
      const result = await showMediaPicker();
      if (result && result.uri) {
        setSelectedMedia(prev => [...prev, { uri: result.uri, type: 'image' }]);
      }
    } catch (error) {
      console.error('Media library error:', error);
      Alert.alert('Error', 'Failed to open media library. Please try again.');
    }
  };

  const removeMedia = (index) => {
    setSelectedMedia(prev => prev.filter((_, i) => i !== index));
  };

  /** Build a single human-readable address to store in Firestore (avoids repeat geocoding on map / nearby list). */
  const buildLocationAddressForSubmit = async () => {
    const trimmed = (location || '').trim();
    const coordOnly =
      trimmed &&
      /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/.test(trimmed.replace(/\s/g, ''));
    if (trimmed && !coordOnly) {
      return trimmed;
    }
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return trimmed || `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`;
      }
      const rev = await Location.reverseGeocodeAsync({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      });
      if (rev?.length) {
        const address = rev[0];
        const parts = [];
        if (address.streetNumber && address.street) {
          parts.push(`${address.streetNumber} ${address.street}`);
        } else if (address.street) {
          parts.push(address.street);
        }
        if (address.city) parts.push(address.city);
        if (address.region) parts.push(address.region);
        if (address.postalCode) parts.push(address.postalCode);
        const built = parts.join(', ');
        if (built) return built;
      }
    } catch (e) {
      console.warn('buildLocationAddressForSubmit:', e);
    }
    return trimmed || `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`;
  };

  const geocodeLocation = async (address) => {
    try {
      // If it looks like coordinates (contains comma and numbers), parse them
      if (address.includes(',') && /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/.test(address.trim())) {
        const [latStr, lngStr] = address.split(',').map(s => s.trim());
        const lat = parseFloat(latStr);
        const lng = parseFloat(lngStr);
        
        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          const coords = { latitude: lat, longitude: lng };
          setCoordinates(coords);
          return;
        }
      }
      
      // Otherwise, try to geocode the address
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required for geocoding.');
        return;
      }

      const results = await Location.geocodeAsync(address);
      if (results.length > 0) {
        const coords = {
          latitude: results[0].latitude,
          longitude: results[0].longitude
        };
        setCoordinates(coords);
      } else {
        Alert.alert('Error', 'Address not found. Please try a different address or use coordinates.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      Alert.alert('Error', 'Failed to find location. Please try a different address or use coordinates.');
    }
  };

  const validateInputs = () => {
    if (!coordinates) {
      Alert.alert('Error', 'Please enter a location.');
      return false;
    }
    
    const lat = coordinates.latitude;
    const lng = coordinates.longitude;
    
    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert('Error', 'Please enter valid coordinates.');
      return false;
    }
    
    if (lat < -90 || lat > 90) {
      Alert.alert('Error', 'Latitude must be between -90 and 90.');
      return false;
    }
    
    if (lng < -180 || lng > 180) {
      Alert.alert('Error', 'Longitude must be between -180 and 180.');
      return false;
    }
    
    if (!description.trim()) {
      Alert.alert('Error', 'Please provide a description of the sighting.');
      return false;
    }
    
    if (!selectedDate) {
      Alert.alert('Error', 'Please select a date and time for the sighting.');
      return false;
    }
    
    if (!encounterType) {
      Alert.alert('Error', 'Please select the type of encounter.');
      return false;
    }
    
    if (!hazingAttempted) {
      Alert.alert('Error', 'Please indicate if you attempted to haze the coyote.');
      return false;
    }
    
    if (!coyoteSickInjured) {
      Alert.alert('Error', 'Please indicate if the coyote appeared sick or injured.');
      return false;
    }
    
    if (!wildlifeFeeding) {
      Alert.alert('Error', 'Please indicate if you know of anyone feeding wildlife in your area.');
      return false;
    }
    
    // Validate email for guest users
    if (isGuest) {
      if (!guestEmail.trim()) {
        Alert.alert('Error', 'Please provide your email address.');
        return false;
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(guestEmail.trim())) {
        Alert.alert('Error', 'Please enter a valid email address.');
        return false;
      }
    }
    
    return true;
  };

  // Upload media to Firebase Storage using React Native compatible method
  const uploadMediaToStorage = async (mediaItem, sightingId, index) => {
    try {
      // Get file info to check size
      const fileInfo = await FileSystem.getInfoAsync(mediaItem.uri);
      
      if (fileInfo.size && fileInfo.size > MAX_FILE_SIZE) {
        throw new Error(`File exceeds 1GB limit: ${(fileInfo.size / (1024 * 1024 * 1024)).toFixed(2)}GB`);
      }
      
      // Create storage reference
      const fileExtension = 'jpg'; // Only images allowed
      const storagePath = `sightings/${sightingId}/media_${index}.${fileExtension}`;
      const storageRef = ref(storage, storagePath);
      
      // For React Native, we need to use XMLHttpRequest to create a proper blob
      // that Firebase Storage can accept
      const response = await fetch(mediaItem.uri);
      const blob = await response.blob();
      
      // Upload with progress tracking
      return new Promise((resolve, reject) => {
        const uploadTask = uploadBytesResumable(storageRef, blob);
        
        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            console.error('Upload error:', error);
            reject(error);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({
              url: downloadURL,
              type: mediaItem.type,
              storagePath: storagePath
            });
          }
        );
      });
    } catch (error) {
      console.error('Error uploading media:', error);
      throw error;
    }
  };

  const submitSighting = async () => {
    if (!validateInputs()) return;
    
    setSubmitting(true);
    setUploadProgress(0);
    
    try {
      const locationAddress = await buildLocationAddressForSubmit();

      // Map alertLevel to sightingCategory for map display
      let sightingCategory = 'green'; // Default to low risk
      if (alertLevel === 'danger') {
        sightingCategory = 'red';
      } else if (alertLevel === 'warning') {
        sightingCategory = 'yellow';
      }
      
      // First create the sighting document to get an ID
      const sightingData = {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        description: description.trim(),
        timestamp: selectedDate,
        reportedBy: isGuest ? 'guest' : auth.currentUser?.uid || 'guest',
        reporterEmail: isGuest ? guestEmail.trim() : userEmail || auth.currentUser?.email || '',
        reporterName: userName || '',
        reporterPhone: userPhone || '',
        reportedAt: serverTimestamp(),
        isGuestReport: !!isGuest,
        encounterType: encounterType || '',
        hazingAttempted: hazingAttempted || '',
        coyoteSickInjured: coyoteSickInjured || '',
        wildlifeFeeding: wildlifeFeeding || '',
        contactPreferences: contactPreferences || '',
        alertLevel: alertLevel || '',
        sightingCategory: sightingCategory, // For map display
        mediaUrls: [], // Will be updated after upload
        approved: false, // Requires admin approval before appearing on the map
        locationAddress, // Stored once at submit; map/nearby use this instead of geocoding again
      };

      const docRef = await addDoc(collection(db, 'coyoteSightings'), sightingData);
      
      // Upload media files if any
      if (selectedMedia.length > 0) {
        const uploadedMedia = [];
        
        for (let i = 0; i < selectedMedia.length; i++) {
          try {
            const uploadedItem = await uploadMediaToStorage(selectedMedia[i], docRef.id, i);
            uploadedMedia.push(uploadedItem);
          } catch (uploadError) {
            console.error(`Failed to upload media ${i}:`, uploadError);
            Alert.alert('Upload Warning', `Some media files could not be uploaded: ${uploadError.message}`);
          }
        }
        
        // Update the document with media URLs if any were uploaded
        if (uploadedMedia.length > 0) {
          const { updateDoc } = await import('firebase/firestore');
          await updateDoc(docRef, { mediaUrls: uploadedMedia });
        }
      }
      
      // Show success modal
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error reporting sighting:', error);
      Alert.alert('Error', 'Failed to report sighting. Please try again.');
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  // Voice recording functions
  const startVoiceRecording = async () => {
    try {
      // Check microphone permission first
      const hasPermission = await checkMicrophonePermission();
      if (!hasPermission) {
        const permissionGranted = await requestMicrophonePermission();
        if (!permissionGranted) {
          Alert.alert(
            'Microphone Permission Required',
            'This app needs microphone access for voice input. Please enable microphone permissions in your device settings.',
            [{ text: 'OK' }]
          );
          return;
        }
      }

      // Stop any existing recording
      if (audioRecorder.isRecording) {
        await audioRecorder.stop();
      }

      // Configure recording options
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: 'duckOthers',
      });

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();

      setIsRecording(true);
      setRecordingDuration(0);

      // Update recording duration every second
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert(
        'Recording Error',
        'Unable to start audio recording. Please ensure your microphone is available and try again.',
        [{ text: 'OK' }]
      );
      setIsRecording(false);
    }
  };

  const stopVoiceRecording = async () => {
    if (!audioRecorder.isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      // Clear duration interval
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }

      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      setIsRecording(false);
      setRecordingDuration(0);
      
      if (!uri) {
        Alert.alert('Recording Error', 'No audio was recorded. Please try again.');
        return;
      }
      
      // Transcribe the audio
      await transcribeAudio(uri);

    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Recording Error', 'Could not stop voice recording.');
      setIsRecording(false);
      setRecordingDuration(0);
    }
  };

  const transcribeAudio = async (audioUri) => {
    try {
      const { OPENAI_API_KEY } = require('../config/aiConfig');
      
      if (!OPENAI_API_KEY || OPENAI_API_KEY === 'YOUR_OPENAI_API_KEY_HERE') {
        throw new Error('OpenAI API key not configured');
      }
      
      // Read the audio file
      const audioInfo = await FileSystem.getInfoAsync(audioUri);
      if (!audioInfo.exists) {
        throw new Error('Audio file not found');
      }
      
      // Create form data for Whisper API
      const formData = new FormData();
      formData.append('file', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'audio.m4a',
      });
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');
      
      console.log('Sending audio to Whisper API...');
      
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Whisper API error:', errorText);
        throw new Error(`Transcription failed: ${response.status}`);
      }
      
      const data = await response.json();
      const transcribedText = data.text?.trim();
      
      console.log('Transcription result:', transcribedText);
      
      if (transcribedText) {
        // Set the transcribed text to the description field
        setDescription(transcribedText);
        Alert.alert('Success', 'Voice recording transcribed successfully!');
      } else {
        Alert.alert('No Speech Detected', 'Could not detect any speech in the recording. Please try again and speak clearly.');
      }
      
    } catch (error) {
      console.error('Transcription error:', error);
      Alert.alert(
        'Transcription Failed',
        'Unable to convert speech to text. Please check your internet connection and try again, or type your message instead.'
      );
    } finally {
      // Clean up the audio file
      try {
        await FileSystem.deleteAsync(audioUri, { idempotent: true });
      } catch (cleanupError) {
        console.log('Could not delete temp audio file:', cleanupError);
      }
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <View style={sharedStyles.header}>
        <TouchableOpacity
          style={sharedStyles.backButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Ionicons name="chevron-back" size={32} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={sharedStyles.headerTitleContainer}>
          <Image 
            source={require('../../assets/report sighting banner.png')} 
            style={sharedStyles.headerIcon}
            resizeMode="contain"
          />
          <Text style={sharedStyles.headerTitle}>Report Sighting</Text>
        </View>
        <View style={sharedStyles.placeholder} />
      </View>

      <View style={styles.form}>
      <Text style={styles.sectionTitle}>📧 Contact Information</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={[styles.input, !isGuest && userName && styles.inputPrefilled]}
            value={isGuest ? '' : userName}
            onChangeText={isGuest ? null : setUserName}
            placeholder="Enter your name"
            autoCapitalize="words"
            autoCorrect={false}
            editable={true}
          />
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, !isGuest && userEmail && styles.inputPrefilled]}
            value={isGuest ? guestEmail : userEmail}
            onChangeText={isGuest ? setGuestEmail : setUserEmail}
            placeholder="your.email@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={true}
          />
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={[styles.input, !isGuest && userPhone && styles.inputPrefilled]}
            value={isGuest ? '' : userPhone}
            onChangeText={isGuest ? null : setUserPhone}
            placeholder="(555) 123-4567"
            keyboardType="phone-pad"
            autoCorrect={false}
            editable={true}
          />
          {isGuest && (
            <Text style={styles.helperText}>
              We'll use this to contact you if we need more information about your sighting.
            </Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>🕐 Date & Time</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>When did you see the coyote?</Text>
          
          <View style={styles.dateTimeContainer}>
            <TouchableOpacity 
              style={styles.dateTimeButton} 
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateTimeButtonText}>
                📅 {selectedDate.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.dateTimeButton} 
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.dateTimeButtonText}>
                🕐 {selectedDate.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.locationButtonsContainer}>
          <TouchableOpacity style={styles.autoFillButton} onPress={setCurrentTime}>
            <Text style={styles.autoFillButtonText}>🕐 Use current time</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>📍 Location</Text>
        <Text style={styles.label}>Where did you see the coyote?</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="Enter address or nearest intersection"
            keyboardType="default"
            multiline={false}
            onBlur={() => geocodeLocation(location)}
          />
        </View>
        
        <View style={styles.locationButtonsContainer}>
          <TouchableOpacity 
            style={[styles.autoFillButton, autoFilling && styles.autoFillButtonDisabled]} 
            onPress={autoFillLocation}
            disabled={autoFilling}
          >
            {autoFilling ? (
              <Text style={styles.autoFillButtonText}>Getting Location...</Text>
            ) : (
              <Text style={styles.autoFillButtonText}>📍 Use my current location</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.autoFillButton} onPress={openMapPicker}>
            <Text style={styles.mapPickerButtonText}>🗺️ Manually select on map</Text>
          </TouchableOpacity>
          

        </View>
        
        <Text style={styles.sectionTitle}>🐺 Encounter Details</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Type of Encounter</Text>
          <View style={styles.radioGroup}>
            {['human interaction', 'pet interaction', 'road kill'].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.radioOption,
                  encounterType === option && styles.radioOptionSelected
                ]}
                onPress={() => setEncounterType(option)}
              >
                <Text style={[
                  styles.radioText,
                  encounterType === option && styles.radioTextSelected
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Did you attempt to haze the coyote?</Text>
          <View style={styles.radioGroup}>
            {['yes', 'no'].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.radioOption,
                  hazingAttempted === option && styles.radioOptionSelected
                ]}
                onPress={() => setHazingAttempted(option)}
              >
                <Text style={[
                  styles.radioText,
                  hazingAttempted === option && styles.radioTextSelected
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Did the coyote appear sick or injured?</Text>
          <View style={styles.radioGroup}>
            {['yes', 'no'].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.radioOption,
                  coyoteSickInjured === option && styles.radioOptionSelected
                ]}
                onPress={() => setCoyoteSickInjured(option)}
              >
                <Text style={[
                  styles.radioText,
                  coyoteSickInjured === option && styles.radioTextSelected
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Do you know of anyone feeding wildlife, including feral cats, in your area?</Text>
          <View style={styles.radioGroup}>
            {['yes', 'no'].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.radioOption,
                  wildlifeFeeding === option && styles.radioOptionSelected
                ]}
                onPress={() => setWildlifeFeeding(option)}
              >
                <Text style={[
                  styles.radioText,
                  wildlifeFeeding === option && styles.radioTextSelected
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>📝 Description</Text>
        <View style={styles.labelWithVoiceButton}>
          <Text style={styles.label}>Please tell us more about your encounter</Text>
          <TouchableOpacity
            style={[styles.voiceButtonInline, isRecording && styles.voiceButtonActive]}
            onPress={isRecording ? stopVoiceRecording : startVoiceRecording}
          >
            {isRecording ? (
              <View style={styles.recordingIndicator}>
                <Ionicons name="stop-circle-outline" size={20} color="#fff" />
                <Text style={styles.recordingDurationText}>{recordingDuration}s</Text>
              </View>
            ) : (
              <Ionicons name="mic-outline" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the coyote sighting, behavior, location details, etc."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Please choose one of the alert levels:</Text>
          <View style={styles.radioGroupVertical}>
            <TouchableOpacity
              style={[
                styles.radioOption,
                styles.radioOptionWithEmoji,
                alertLevel === 'sighting' && styles.radioOptionSelected
              ]}
              onPress={() => setAlertLevel('sighting')}
            >
              <Text style={styles.radioEmoji}>🟢</Text>
              <Text style={[
                styles.radioText,
                alertLevel === 'sighting' && styles.radioTextSelected
              ]}>
                Sighting only
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.radioOption,
                styles.radioOptionWithEmoji,
                alertLevel === 'medium' && styles.radioOptionSelected
              ]}
              onPress={() => setAlertLevel('medium')}
            >
              <Text style={styles.radioEmoji}>🟡</Text>
              <Text style={[
                styles.radioText,
                alertLevel === 'medium' && styles.radioTextSelected
              ]}>
                Coyote approached or followed reporter, chased or attacked pet off-leash
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.radioOption,
                styles.radioOptionWithEmoji,
                alertLevel === 'high' && styles.radioOptionSelected
              ]}
              onPress={() => setAlertLevel('high')}
            >
              <Text style={styles.radioEmoji}>🔴</Text>
              <Text style={[
                styles.radioText,
                alertLevel === 'high' && styles.radioTextSelected
              ]}>
                Chased or attacked pet on-leash, killed pet or bit reporter
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>If possible, would you like to be contacted by your local animal services agency about this report?</Text>
          <View style={styles.radioGroup}>
            {['yes', 'no'].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.radioOption,
                  contactPreferences === option && styles.radioOptionSelected
                ]}
                onPress={() => setContactPreferences(option)}
              >
                <Text style={[
                  styles.radioText,
                  contactPreferences === option && styles.radioTextSelected
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <TouchableOpacity onPress={handleMediaSelection}>
          <Text style={styles.sectionTitle}>📷 Photo</Text>
        </TouchableOpacity>
        <View style={styles.inputContainer}>
          <TouchableOpacity onPress={handleMediaSelection}>
            <Text style={styles.label}>Tap to add photos (optional)</Text>
          </TouchableOpacity>
          
          {selectedMedia.length > 0 && (
            <View style={styles.mediaPreviewContainer}>
              {selectedMedia.map((media, index) => (
                <View key={index} style={styles.mediaPreviewItem}>
                  <Image source={{ uri: media.uri }} style={styles.mediaPreview} />
                  <TouchableOpacity 
                    style={styles.removeMediaButton} 
                    onPress={() => removeMedia(index)}
                  >
                    <Text style={styles.removeMediaButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, (!description.trim() || submitting || (isGuest && !guestEmail.trim()) || !encounterType || !hazingAttempted || !coyoteSickInjured || !wildlifeFeeding) && styles.submitButtonDisabled]} 
          onPress={submitSighting}
          disabled={!description.trim() || submitting || (isGuest && !guestEmail.trim()) || !encounterType || !hazingAttempted || !coyoteSickInjured || !wildlifeFeeding}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Report</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Date Picker */}
      {showDatePicker && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={showDatePicker}
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.pickerHeaderText}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date()} // Can't select future dates
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={showTimePicker}
          onRequestClose={() => setShowTimePicker(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Text style={styles.pickerHeaderText}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={selectedDate}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Map Location Picker Modal */}
      <Modal
        visible={showMapPicker}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowMapPicker(false)}
      >
        <MapLocationPicker
          initialLocation={coordinates || userLocation}
          onLocationSelect={handleLocationFromMap}
          onClose={() => setShowMapPicker(false)}
        />
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowSuccessModal(false);
          navigation.goBack();
        }}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalContent}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={48} color="#27ae60" />
            </View>
            <Text style={styles.successTitle}>Your report has been submitted and will be added to the map soon. Thank you!</Text>
            <TouchableOpacity
              style={styles.successCloseButton}
              onPress={() => {
                setShowSuccessModal(false);
                navigation.goBack();
              }}
            >
              <Text style={styles.successCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 0,
  },
  form: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    backgroundColor: '#1fc5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    minWidth: 220,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputContainer: {
    flex: 1,
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#34495e',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  inputPrefilled: {
    backgroundColor: '#e8f4e8',
    borderColor: '#27ae60',
  },
  textArea: {
    height: 160,
    textAlignVertical: 'top',
    marginBottom: -8
  },
  locationButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPickerButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPickerButtonText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  autoFillButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 32,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoFillButtonDisabled: {
    borderColor: '#E8F2E0',
    opacity: 0.6,
  },
  autoFillButtonText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  dateTimeButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateTimeButtonText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  pickerHeaderText: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  submitButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
    lineHeight: 16,
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  radioGroupVertical: {
    flexDirection: 'column',
    gap: 10,
  },
  radioOption: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  radioOptionSelected: {
    backgroundColor: '#FBF0D1',
  },
  radioOptionWithEmoji: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  radioEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  radioText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
    flex: 1,
  },
  mediaPreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  mediaPreviewItem: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  mediaPreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  videoPreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPreviewText: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
  removeMediaButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#e74c3c',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeMediaButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  labelWithVoiceButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  voiceButtonInline: {
    backgroundColor: '#3498db',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  voiceButtonActive: {
    backgroundColor: '#e74c3c',
  },
  recordingIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingDurationText: {
    fontSize: 10,
    color: '#fff',
    marginTop: 2,
    fontWeight: 'bold',
  },
  // Success Modal Styles
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModalContent: {
    backgroundColor: '#F5F0E8',
    borderRadius: 20,
    padding: 16,
    width: '75%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  successIconContainer: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Arial',
    lineHeight: 32,
  },
  successCloseButton: {
    backgroundColor: '#27ae60',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 32,
    minWidth: 120,
  },
  successCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'Arial',
  },
});

