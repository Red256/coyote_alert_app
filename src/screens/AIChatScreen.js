import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { RecordingPresets, setAudioModeAsync, useAudioPlayer, useAudioRecorder } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { OPENAI_CONFIG } from '../config/aiConfig';
import { GOOGLE_MAPS_API_KEY } from '../config/googleMapsConfig';
import { auth, db } from '../lib/firebase';
import { sharedStyles } from '../styles/sharedStyles';
import { checkMicrophonePermission, requestMicrophonePermission } from '../utils/permissions';

export default function AIChatScreen() {
  const navigation = useNavigation();
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioPlayer = useAudioPlayer(null);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  
  // Overlay state for app interactions
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayTargetScreen, setOverlayTargetScreen] = useState(null);
  
  // Navigation offer state - tracks when AI has offered to navigate
  const [pendingNavigation, setPendingNavigation] = useState(null);
  
  // Report submission state
  const [isCollectingReport, setIsCollectingReport] = useState(false);
  const [reportData, setReportData] = useState({
    time: '',
    location: '',
    description: '',
    category: '',
    health: '',
    hazing: '',
    wildlifeFeeding: '',
    contactPreferences: ''
  });
  const [showReportConfirmation, setShowReportConfirmation] = useState(false);
  
  // Conversation history for AI memory
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  
  // Refs
  const scrollViewRef = useRef();
  const durationIntervalRef = useRef(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const saveTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);

  // Load chat history from Firestore
  const loadChatHistory = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        // User not logged in, show welcome message
        setIsLoadingHistory(false);
        const welcomeMessage = {
          id: Date.now(),
          type: 'ai',
          text: "Hi! I'm Koko, your AI assistant for coyote tracking. I can help you report sightings, navigate the app, answer questions, and more. How can I help you today?",
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
        return;
      }

      // User is logged in, try to load history
      const chatHistoryRef = doc(db, 'chatHistory', user.uid);
      const chatHistoryDoc = await getDoc(chatHistoryRef);

      if (chatHistoryDoc.exists()) {
        const data = chatHistoryDoc.data();
        if (data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
          // Restore messages with proper timestamp conversion
          const restoredMessages = data.messages.map(msg => ({
            ...msg,
            timestamp: msg.timestamp?.toDate ? msg.timestamp.toDate() : new Date(msg.timestamp),
          }));
          setMessages(restoredMessages);
          
          // Restore conversation history if available
          if (data.conversationHistory && Array.isArray(data.conversationHistory)) {
            setConversationHistory(data.conversationHistory);
          }
        } else {
          // No messages in history, show welcome message
          const welcomeMessage = {
            id: Date.now(),
            type: 'ai',
            text: "Hi! I'm Koko, your AI assistant for coyote tracking. I can help you report sightings, navigate the app, answer questions, and more. How can I help you today?",
            timestamp: new Date(),
          };
          setMessages([welcomeMessage]);
        }
      } else {
        // No history document, show welcome message
        const welcomeMessage = {
          id: Date.now(),
          type: 'ai',
          text: "Hi! I'm Koko, your AI assistant for coyote tracking. I can help you report sightings, navigate the app, answer questions, and more. How can I help you today?",
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      // On error, show welcome message
      const welcomeMessage = {
        id: Date.now(),
        type: 'ai',
        text: "Hi! I'm Koko, your AI assistant for coyote tracking. I can help you report sightings, navigate the app, answer questions, and more. How can I help you today?",
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // Save chat history to Firestore
  const saveChatHistory = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        // User not logged in, don't save
        return;
      }

      // Clear any pending save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Debounce saves to avoid too many writes
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const chatHistoryRef = doc(db, 'chatHistory', user.uid);
          
          // Convert Date objects to Timestamps for Firestore
          const messagesToSave = messages.map(msg => ({
            ...msg,
            timestamp: msg.timestamp instanceof Date 
              ? Timestamp.fromDate(msg.timestamp) 
              : msg.timestamp?.toDate 
                ? msg.timestamp 
                : Timestamp.now()
          }));
          
          await setDoc(chatHistoryRef, {
            messages: messagesToSave,
            conversationHistory: conversationHistory,
            lastUpdated: serverTimestamp(),
          }, { merge: true });
        } catch (error) {
          console.error('Error saving chat history:', error);
        }
      }, 1000); // Wait 1 second after last message change before saving
    } catch (error) {
      console.error('Error in saveChatHistory:', error);
    }
  }, [messages, conversationHistory]);

  // Load history when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadChatHistory();
    }, [loadChatHistory])
  );

  // Save history whenever messages or conversation history changes
  useEffect(() => {
    if (!isLoadingHistory && auth.currentUser) {
      saveChatHistory();
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [messages, conversationHistory, isLoadingHistory, saveChatHistory]);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  }, [messages]);

  useEffect(() => {
    // Setup audio mode for recording and playback at maximum volume
    const setupAudio = async () => {
      try {
        await setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: true,
          shouldPlayInBackground: false,
          interruptionMode: 'duckOthers', // ducks other audio for louder playback
        });
      } catch (error) {
        console.error('Error setting audio mode:', error);
      }
    };

    setupAudio();

    // Cleanup audio when component unmounts
    return () => {
      isMountedRef.current = false;
      // The recorder's native object may already be released by the time this runs
      // (expo-audio releases it on unmount too), so touching it here can throw
      // "Unable to find the native shared object" - guard defensively.
      try {
        if (audioRecorder.isRecording) {
          audioRecorder.stop();
        }
      } catch (error) {
        // Native recorder already released; nothing to stop.
      }
    };
  }, []);

  const addMessage = (type, text, isVoice = false) => {
    const newMessage = {
      id: Date.now() + Math.random(),
      type,
      text,
      timestamp: new Date(),
      isVoice,
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };


  const queryOpenAI = async (userMessage, history) => {
    try {
      // Import the API key from the config
      const { OPENAI_API_KEY } = require('../config/aiConfig');
      
      if (!OPENAI_CONFIG || !OPENAI_API_KEY) {
        return "I'm sorry, but I'm not properly configured right now. Please check the AI setup.";
      }

      const messages = [
        { role: 'system', content: OPENAI_CONFIG.systemPrompt },
        ...history,
        { role: 'user', content: userMessage }
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: OPENAI_CONFIG.model,
          messages: messages,
          max_tokens: OPENAI_CONFIG.maxTokens,
          temperature: OPENAI_CONFIG.temperature,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid API response structure');
      }

      return data.choices[0].message.content.trim();
    } catch (error) {
      return "I'm having trouble connecting to my AI service right now. Please try again in a moment.";
    }
  };

  const generateSpeech = async (text, isVoiceInput = false) => {
    // Only generate speech for voice input responses
    if (!isVoiceInput) return;
    
    try {
      const { OPENAI_API_KEY } = require('../config/aiConfig');
      
      if (!OPENAI_API_KEY) {
        return;
      }

      setIsSpeaking(true);

      // Clean text for TTS (remove navigation tokens and special formatting)
      const cleanText = text
        .replace(/\[NAVIGATE TO [^\]]+\]/g, '')
        .replace(/\[OFFER NAVIGATION TO [^\]]+\]/g, '')
        .replace(/\[START REPORT\]/g, '')
        .replace(/\[SUBMIT REPORT:[^\]]+\]/g, '')
        .trim();

      if (!cleanText) {
        setIsSpeaking(false);
        return;
      }

      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: OPENAI_CONFIG.tts.model,
          input: cleanText,
          voice: OPENAI_CONFIG.tts.voice,
          response_format: OPENAI_CONFIG.tts.format,
          speed: OPENAI_CONFIG.tts.speed,
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS API request failed with status ${response.status}`);
      }

      // Get the audio data as array buffer
      const audioBuffer = await response.arrayBuffer();
      
      // Create a temporary file to store the audio
      const audioUri = `${FileSystem.documentDirectory}temp_tts_${Date.now()}.mp3`;
      
      // Convert array buffer to base64
      const base64Audio = btoa(
        new Uint8Array(audioBuffer)
          .reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      
      // Write the audio file
      await FileSystem.writeAsStringAsync(audioUri, base64Audio, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Bail out if the screen was left while we were waiting on the network/file work above -
      // the audioPlayer's native object is released on unmount, and touching it afterward
      // crashes with "Unable to find the native shared object associated with given JavaScript object"
      if (!isMountedRef.current) {
        await FileSystem.deleteAsync(audioUri, { idempotent: true });
        return;
      }

      // Setup audio mode for maximum volume - duck other audio to be louder
      await setAudioModeAsync({
        allowsRecording: false,
        shouldPlayInBackground: false,
        playsInSilentMode: true,
        interruptionMode: 'duckOthers', // ducks other audio so Koko is louder
      });

      if (!isMountedRef.current) {
        await FileSystem.deleteAsync(audioUri, { idempotent: true });
        return;
      }

      // Play the sound at maximum volume
      audioPlayer.volume = 1.0;
      audioPlayer.muted = false;
      audioPlayer.replace({ uri: audioUri });

      const subscription = audioPlayer.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish) {
          setIsSpeaking(false);
          subscription.remove();
          // Clean up the temporary file
          FileSystem.deleteAsync(audioUri, { idempotent: true });
        }
      });

      audioPlayer.play();

    } catch (error) {
      setIsSpeaking(false);
    }
  };

  const stopSpeech = async () => {
    if (isSpeaking) {
      try {
        audioPlayer.pause();
        setIsSpeaking(false);
      } catch (error) {
        // Silently handle error
      }
    }
  };

  const handleNavigation = (response) => {
    // Check for navigation offers first
    const offerMatch = response.match(/\[OFFER NAVIGATION TO ([^\]]+)\]/);
    if (offerMatch) {
      const screenName = offerMatch[1].trim();
      setPendingNavigation(screenName);
      return false; // Don't navigate yet, just store the offer
    }

    // Handle direct navigation tokens
    const navigationTokens = {
      '[NAVIGATE TO MAP]': () => {
        setShowOverlay(true);
        setOverlayTargetScreen('Coyote Map');
        navigation.navigate('CoyoteMap');
      },
      '[NAVIGATE TO FAQ]': () => {
        setShowOverlay(true);
        setOverlayTargetScreen('FAQ');
        navigation.navigate('Main', { screen: 'FAQ' });
      },
      '[NAVIGATE TO ACCOUNT]': () => {
        setShowOverlay(true);
        setOverlayTargetScreen('Account');
        navigation.navigate('Main', { screen: 'Account' });
      },
      '[NAVIGATE TO REPORT]': () => {
        setShowOverlay(true);
        setOverlayTargetScreen('Report Sighting');
        navigation.navigate('ReportSighting', { userLocation: null });
      },
      '[NAVIGATE TO NEARBY SIGHTINGS]': () => {
        setShowOverlay(true);
        setOverlayTargetScreen('Nearby Sightings');
        navigation.navigate('NearbySightings');
      },
      '[NAVIGATE TO QUIZ]': () => {
        setShowOverlay(true);
        setOverlayTargetScreen('Quiz');
        navigation.navigate('Quiz');
      },
      '[NAVIGATE TO HOME]': () => {
        setShowOverlay(true);
        setOverlayTargetScreen('Home');
        navigation.navigate('Home');
      },
    };

    for (const [token, action] of Object.entries(navigationTokens)) {
      if (response.includes(token)) {
        setPendingNavigation(null); // Clear any pending navigation
        action();
        return true;
      }
    }
    return false;
  };

  const handleReportAction = async (response) => {
    if (response.includes('[START REPORT]')) {
      setIsCollectingReport(true);
      setReportData({ time: '', location: '', description: '', category: '', health: '', hazing: '', wildlifeFeeding: '', contactPreferences: '' });
      return true;
    } else if (response.includes('[SUBMIT REPORT:')) {
      const reportMatch = response.match(/\[SUBMIT REPORT:\s*([^\]]+)\]/);
      if (reportMatch) {
        const reportInfo = reportMatch[1];
        const [time, location, description, category, health, hazing, wildlifeFeeding, contactPreferences] = reportInfo.split('|');
        
        setReportData({ 
          time: time?.trim() || '', 
          location: location?.trim() || '', 
          description: description?.trim() || '',
          category: category?.trim() || '',
          health: health?.trim() || '',
          hazing: hazing?.trim() || '',
          wildlifeFeeding: wildlifeFeeding?.trim() || '',
          contactPreferences: contactPreferences?.trim() || ''
        });
        
        // Reset report collection state
        setIsCollectingReport(false);
        setShowReportConfirmation(false);
        
        // Add message saying it will open the form (but don't actually navigate)
        addMessage('ai', 'I\'ll open the report form with all your information. You can review everything, add any photos if you\'d like, and submit when you\'re ready.');
        
        return true;
      }
    }
    return false;
  };

  const parseNaturalTime = (timeString) => {
    const now = new Date();
    const lowerTime = timeString.toLowerCase();
    
    if (lowerTime.includes('yesterday')) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday;
    }
    
    if (lowerTime.includes('today') || lowerTime.includes('this morning') || lowerTime.includes('this afternoon')) {
      return now;
    }
    
    // Try to parse as regular date
    const parsedDate = new Date(timeString);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
    
    // Default to now
    return now;
  };





  const getCoordinatesForLocation = async (locationString) => {
    try {
      if (GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(locationString)}&key=${GOOGLE_MAPS_API_KEY}`
        );
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          const location = data.results[0].geometry.location;
          return { 
            latitude: location.lat, 
            longitude: location.lng,
            formatted_address: data.results[0].formatted_address 
          };
        }
      }
    } catch (error) {
      // Silently handle geocoding error
    }
    
    // Default to Los Angeles coordinates
    return { latitude: 34.0522, longitude: -118.2437 };
  };

  const determineSightingCategory = (category) => {
    // Handle empty/undefined category
    if (!category || typeof category !== 'string') {
      return { color: 'green', risk: 'Low Risk', description: 'Sighting only' };
    }
    
    const upperCategory = category.toUpperCase().trim();
    
    // Check most specific matches first to avoid substring conflicts
    // (YELLOW contains "LOW", so check YELLOW before LOW)
    if (upperCategory.includes('YELLOW') || upperCategory.includes('MEDIUM')) {
      return { color: 'yellow', risk: 'Medium Risk', description: 'Coyote interaction or off-leash pet encounter' };
    } else if (upperCategory.includes('RED') || upperCategory.includes('HIGH')) {
      return { color: 'red', risk: 'High Risk', description: 'On-leash pet encounter, attack, or human contact' };
    } else if (upperCategory.includes('GREEN') || upperCategory.includes('LOW')) {
      return { color: 'green', risk: 'Low Risk', description: 'Sighting only, no interaction' };
    }
    
    return { color: 'green', risk: 'Low Risk', description: 'Sighting only' };
  };

  const submitReport = async () => {
    try {
      setIsProcessing(true);
      
      const parsedTimestamp = parseNaturalTime(reportData.time);
      const coordinates = await getCoordinatesForLocation(reportData.location);
      
      const sightingCategory = determineSightingCategory(reportData.category);
      
      const sightingData = {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        description: reportData.description.trim(),
        timestamp: parsedTimestamp,
        reportedBy: auth.currentUser?.uid || 'anonymous',
        reporterEmail: auth.currentUser?.email || 'Anonymous',
        reportedAt: serverTimestamp(),
        locationDescription: reportData.location,
        sightingCategory: sightingCategory.color,
        riskLevel: sightingCategory.risk,
        categoryDescription: sightingCategory.description,
        healthConcerns: reportData.health.trim(),
        aiCategory: reportData.category.trim(),
        approved: false, // Requires admin approval before appearing on the map
      };

      await addDoc(collection(db, 'coyoteSightings'), sightingData);
      
      setIsCollectingReport(false);
      setReportData({ time: '', location: '', description: '', category: '', health: '' });
      setShowReportConfirmation(false);
      setConversationHistory([]);
      
      addMessage('ai', 'Report submitted successfully! Your coyote sighting has been sent for review and will appear on the map once it is approved. Thank you for helping keep the community safe.');
      
    } catch (error) {
      addMessage('ai', 'Sorry, there was an error submitting your report. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const processMessage = async (text, isVoice = false) => {
    if (!text.trim()) return;

    // Stop any current speech
    if (isSpeaking) {
      await stopSpeech();
    }

    // Check if user is confirming or declining a navigation offer
    const confirmationKeywords = ['yes', 'sure', 'okay', 'ok', 'yeah', 'yep', 'go ahead', 'take me there', 'let\'s go', 'open it', 'show me'];
    const declineKeywords = ['no', 'nope', 'not now', 'maybe later', 'later', 'cancel', 'never mind'];
    
    const isConfirmation = confirmationKeywords.some(keyword => 
      text.toLowerCase().trim().startsWith(keyword.toLowerCase())
    );
    const isDecline = declineKeywords.some(keyword => 
      text.toLowerCase().trim().startsWith(keyword.toLowerCase())
    );

    // If user declines, clear pending navigation
    if (pendingNavigation && isDecline) {
      addMessage('user', text, isVoice);
      addMessage('ai', 'No problem! Let me know if you need anything else.');
      setPendingNavigation(null);
      setInputText('');
      return;
    }

    if (pendingNavigation && isConfirmation) {
      // User confirmed navigation, navigate immediately
      const screenMap = {
        'MAP': () => {
          setShowOverlay(true);
          setOverlayTargetScreen('Coyote Map');
          navigation.navigate('CoyoteMap');
        },
        'COYOTE MAP': () => {
          setShowOverlay(true);
          setOverlayTargetScreen('Coyote Map');
          navigation.navigate('CoyoteMap');
        },
        'FAQ': () => {
          setShowOverlay(true);
          setOverlayTargetScreen('FAQ');
          navigation.navigate('Main', { screen: 'FAQ' });
        },
        'ACCOUNT': () => {
          setShowOverlay(true);
          setOverlayTargetScreen('Account');
          navigation.navigate('Main', { screen: 'Account' });
        },
        'PROFILE': () => {
          setShowOverlay(true);
          setOverlayTargetScreen('Account');
          navigation.navigate('Main', { screen: 'Account' });
        },
        'REPORT': () => {
          setShowOverlay(true);
          setOverlayTargetScreen('Report Sighting');
          navigation.navigate('ReportSighting', { userLocation: null });
        },
        'REPORT SIGHTING': () => {
          setShowOverlay(true);
          setOverlayTargetScreen('Report Sighting');
          navigation.navigate('ReportSighting', { userLocation: null });
        },
        'NEARBY SIGHTINGS': () => {
          setShowOverlay(true);
          setOverlayTargetScreen('Nearby Sightings');
          navigation.navigate('NearbySightings');
        },
        'QUIZ': () => {
          setShowOverlay(true);
          setOverlayTargetScreen('Quiz');
          navigation.navigate('Quiz');
        },
        'TEST YOUR KNOWLEDGE': () => {
          setShowOverlay(true);
          setOverlayTargetScreen('Quiz');
          navigation.navigate('Quiz');
        },
        'HOME': () => {
          setShowOverlay(true);
          setOverlayTargetScreen('Home');
          navigation.navigate('Home');
        },
      };

      const navigateAction = screenMap[pendingNavigation.toUpperCase()];
      if (navigateAction) {
        addMessage('user', text, isVoice);
        addMessage('ai', 'Taking you there now!');
        setPendingNavigation(null);
        navigateAction();
        setInputText('');
        return;
      }
    }

    // Add user message
    addMessage('user', text, isVoice);
    setInputText('');
    setIsProcessing(true);

    try {
      // Check if this is a specific report generation request (more specific keywords)
      const specificReportKeywords = [
        'generate a report', 'show me a report', 'create a chart', 'generate chart', 
        'show chart', 'display chart', 'monthly trends', 'time analysis', 
        'risk distribution', 'location analysis', 'statistics report',
        'show me statistics', 'generate statistics', 'data visualization',
        'show me monthly', 'show me weekly', 'show trends'
      ];
      
      const isSpecificReportRequest = specificReportKeywords.some(phrase => 
        text.toLowerCase().includes(phrase.toLowerCase())
      );

      if (isSpecificReportRequest) {
        // Add a message indicating report functionality is temporarily unavailable
        addMessage('ai', 'I understand you\'d like a data report! The visual reporting feature is currently being updated. In the meantime, I can help answer questions about coyote sightings, behavior, and safety. What specific information would you like to know?');
        setIsProcessing(false);
        return;
      }

      // Update conversation history
      const updatedHistory = [...conversationHistory, { role: 'user', content: text }];

      // Get AI response
      const aiResponse = await queryOpenAI(text, updatedHistory);
      
      // Clean the response for display (remove command tokens)
      const cleanResponse = aiResponse
        .replace(/\[START REPORT\]/g, '')
        .replace(/\[SUBMIT REPORT:[^\]]+\]/g, '')
        .replace(/\[NAVIGATE TO [^\]]+\]/g, '')
        .replace(/\[OFFER NAVIGATION TO [^\]]+\]/g, '')
        .trim();
      
      // Add AI message (cleaned version for display)
      addMessage('ai', cleanResponse);

      // Update conversation history with AI response
      const finalHistory = [...updatedHistory, { role: 'assistant', content: aiResponse }];
      setConversationHistory(finalHistory);

      // Generate speech for voice input responses
      if (isVoice) {
        generateSpeech(cleanResponse, true);
      }

      // Handle special actions
      const hasNavigation = handleNavigation(aiResponse);
      const hasReport = await handleReportAction(aiResponse);

      // If navigation happened, set a timer to hide overlay
      if (hasNavigation && !hasReport) {
        setTimeout(() => {
          setShowOverlay(false);
          setOverlayTargetScreen(null);
        }, 5000); // Hide overlay after 5 seconds
      }

    } catch (error) {
      addMessage('ai', "I'm sorry, I encountered an error. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const startVoiceRecognition = async () => {
    console.log('Starting audio recording for speech-to-text...');
    
    // Check microphone permission first
    try {
      const hasPermission = await checkMicrophonePermission();
      if (!hasPermission) {
        console.log('Requesting microphone permission...');
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
      } catch (error) {
      console.error('Permission check error:', error);
      Alert.alert('Permission Error', 'Unable to check microphone permissions. Please type your message instead.');
      return;
    }
    
    try {
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

      setIsListening(true);
      setRecordingDuration(0);

      // Update recording duration every second
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      console.log('Recording started successfully');

    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert(
        'Recording Error',
        'Unable to start audio recording. Please ensure your microphone is available and try again.',
        [{ text: 'OK' }]
      );
      setIsListening(false);
    }
  };

  const stopVoiceRecognition = async () => {
    if (!audioRecorder.isRecording) {
    setIsListening(false);
      return;
    }

    try {
      // Clear duration interval
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      console.log('Stopping recording...');
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      setIsListening(false);
      
      if (!uri) {
        Alert.alert('Recording Error', 'No audio was recorded. Please try again.');
        return;
      }
      
      console.log('Recording stopped, URI:', uri);
      
      // Show processing message
      addMessage('ai', '🎤 Processing your voice message...');
      setIsProcessing(true);
      
      // Transcribe the audio
      await transcribeAudio(uri);
      
      } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Recording Error', 'Failed to process recording. Please try again.');
      setIsListening(false);
      setIsProcessing(false);
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
        // Process the transcribed text as a voice message
        await processMessage(transcribedText, true);
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
      setIsProcessing(false);
      
      // Clean up the audio file
      try {
        await FileSystem.deleteAsync(audioUri, { idempotent: true });
      } catch (cleanupError) {
        console.log('Could not delete temp audio file:', cleanupError);
      }
    }
  };

  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      // Debug logging
      console.log('WebView message received:', data);
      
      if (data.type === 'debug') {
        return;
      }
      
      if (data.type === 'speechStart') {
        // Clear timeout when speech actually starts
        if (voiceTimeoutRef.current) {
          clearTimeout(voiceTimeoutRef.current);
          voiceTimeoutRef.current = null;
        }
        setIsListening(true);
      } else if (data.type === 'speechEnd') {
        setIsListening(false);
      } else if (data.type === 'speechResult') {
        setIsListening(false);
        if (data.text && data.text.trim()) {
          processMessage(data.text, true);
        } else {
          Alert.alert('Voice Recognition', 'No speech detected. Please try again.');
        }
      } else if (data.type === 'speechError') {
        // Clear timeout on any error
        if (voiceTimeoutRef.current) {
          clearTimeout(voiceTimeoutRef.current);
          voiceTimeoutRef.current = null;
        }
        setIsListening(false);
        
        console.log('Speech error received:', data);
        
        // Don't show alerts for "aborted" errors from dual communication
        if (data.error === 'aborted' && data.message === 'Recognition already running') {
          // This is expected from our dual communication approach, ignore it
          return;
        }
        
        let errorMessage = 'Could not recognize speech. Please try again or type your message.';
        let errorTitle = 'Voice Error';
        
        switch (data.error) {
          case 'not-allowed':
            errorTitle = 'Microphone Access Denied';
            errorMessage = 'Please enable microphone permissions in your device settings to use voice input.';
            break;
          case 'service-not-allowed':
            errorTitle = 'Speech Recognition Blocked';
            errorMessage = 'Speech recognition is blocked. This may be due to browser security settings or lack of HTTPS connection.';
            break;
          case 'network':
            errorTitle = 'Network Error';
            errorMessage = 'Unable to connect to speech recognition service. Please check your internet connection.';
            break;
          case 'no-speech':
            errorTitle = 'No Speech Detected';
            errorMessage = 'No speech was detected. Please speak clearly into your microphone and try again.';
            break;
          case 'audio-capture':
            errorTitle = 'Microphone Not Available';
            errorMessage = 'Cannot access your microphone. Please ensure your device microphone is enabled and not being used by another app.';
            break;
          case 'function-not-found':
            errorTitle = 'Voice Recognition Error';
            errorMessage = 'Voice recognition is not properly initialized. Please restart the app and try again.';
            break;
          default:
            // For other errors, provide more detail
            console.log('Unknown speech error:', data.error, data.message);
            if (data.message) {
              errorMessage = `${errorMessage}\n\nTechnical details: ${data.message}`;
            }
            break;
        }
        
        Alert.alert(errorTitle, errorMessage, [
          { text: 'OK', style: 'default' },
          { 
            text: 'Type Instead', 
            onPress: () => {
              // Focus on text input as alternative
              console.log('User chose to type instead');
            }
          }
        ]);
      } else if (data.type === 'notSupported') {
        setIsListening(false);
        Alert.alert(
          'Voice Input Not Available', 
          'Speech-to-text is not supported in this app environment. This feature requires native browser support.\n\nPlease type your message instead.',
          [{ text: 'OK' }]
        );
      } else if (data.type === 'webviewReady') {
        // WebView is ready
        console.log('WebView ready, speech supported:', data.speechSupported);
        setWebViewReady(true);
      }
    } catch (error) {
      setIsListening(false);
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Function to parse markdown-style bold text
  const parseBoldText = (text) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.slice(2, -2);
        return (
          <Text key={index} style={styles.boldText}>
            {boldText}
          </Text>
        );
      }
      return part;
    });
  };

  const renderMessage = (message) => {
    const isUser = message.type === 'user';
    return (
      <View key={message.id} style={[styles.messageContainer, isUser ? styles.userMessage : styles.aiMessage]}>
        {!isUser && (
          <View style={styles.aiIconCircle}>
            <Image 
              source={require('../../assets/Chat with Koko.png')}
              style={styles.aiMessageIcon}
              resizeMode="contain"
            />
          </View>
        )}
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>
            {parseBoldText(message.text)}
          </Text>
          <View style={styles.messageFooter}>
            {message.isVoice && (
              <Text style={[styles.voiceIndicator, isUser ? styles.userTime : styles.aiTime]}>
                🎤
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingContainer} 
        behavior="height"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Chat Header */}
        <View style={sharedStyles.header}>
          <View style={styles.headerTop}>
        <TouchableOpacity
          style={sharedStyles.backButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Ionicons name="chevron-back" size={32} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={sharedStyles.headerTitleContainer}>
              <Image 
                source={require('../../assets/Koko Colored.png')}
                style={sharedStyles.headerIcon}
                resizeMode="contain"
              />
              <Text style={sharedStyles.headerTitle}>Koko - AI Assistant</Text>
            </View>
            <View style={sharedStyles.placeholder} />
          </View>
          {overlayTargetScreen && (
            <TouchableOpacity 
              style={styles.closeOverlayButton}
              onPress={() => {
                setShowOverlay(false);
                setOverlayTargetScreen(null);
              }}
            >
              <Text style={styles.closeOverlayText}>✕ Close</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Messages */}
        <View style={styles.messagesWrapper}>
        <ScrollView 
          ref={scrollViewRef}
          style={[styles.messagesContainer, showOverlay && styles.overlayMode]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            if (scrollViewRef.current) {
              scrollViewRef.current.scrollToEnd({ animated: true });
            }
          }}
        >
          {messages.map(renderMessage)}
          
          {(isProcessing || isSpeaking) && (
            <View style={[styles.messageContainer, styles.aiMessage]}>
              <View style={[styles.messageBubble, styles.aiBubble]}>
                <Text style={styles.typingIndicator}>
                    {isProcessing ? 'Koko is typing...' : isSpeaking ? 'Koko is speaking... 🗣️' : ''}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
        </View>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask Koko anything..."
            multiline
            maxLength={500}
          />
          
          {isSpeaking && (
            <TouchableOpacity
              style={styles.stopSpeechButton}
              onPress={stopSpeech}
            >
              <Ionicons name="volume-mute-outline" size={28} color="#fff" />
            </TouchableOpacity>
          )}
          
          
          <TouchableOpacity
            style={[styles.voiceButton, isListening && styles.voiceButtonActive]}
            onPress={isListening ? stopVoiceRecognition : startVoiceRecognition}
            disabled={isProcessing || isSpeaking}
          >
            {isListening ? (
              <View style={styles.recordingIndicator}>
                <Ionicons name="stop-circle-outline" size={28} color="#fff" />
                <Text style={styles.recordingDuration}>{recordingDuration}s</Text>
              </View>
            ) : (
              <Ionicons name="mic-outline" size={28} color="#fff" />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || isProcessing || isSpeaking) && styles.sendButtonDisabled]}
            onPress={() => processMessage(inputText)}
            disabled={!inputText.trim() || isProcessing || isSpeaking}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>

        {/* Hidden WebView for Voice Recognition - DISABLED: Now using native audio recording + Whisper API */}
        {/* <View pointerEvents="box-none" style={isListening ? styles.webViewContainerActive : styles.webViewContainer}>
        <WebView
          ref={webViewRef}
            onLoad={() => console.log('WebView loaded')}
            onError={(error) => console.log('WebView error:', error)}
            pointerEvents={isListening ? "auto" : "none"}
          source={{
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:;">
              </head>
              <body>
                <script>
                  let recognition = null;
                  let isRecognizing = false;
                  
                  function initializeSpeechRecognition() {
                    console.log('Initializing speech recognition...');
                    console.log('webkitSpeechRecognition available:', 'webkitSpeechRecognition' in window);
                    console.log('SpeechRecognition available:', 'SpeechRecognition' in window);
                    
                    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                      console.log('Using SpeechRecognition constructor:', SpeechRecognition);
                      
                      try {
                        recognition = new SpeechRecognition();
                        console.log('SpeechRecognition object created successfully');
                        
                        recognition.continuous = false;
                        recognition.interimResults = false;
                        recognition.lang = 'en-US';
                        recognition.maxAlternatives = 1;
                        
                        recognition.onstart = function() {
                          isRecognizing = true;
                          try {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                              type: 'speechStart'
                            }));
                          } catch (e) {
                            // Silently handle error
                          }
                        };
                        
                        recognition.onend = function() {
                          isRecognizing = false;
                          try {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                              type: 'speechEnd'
                            }));
                          } catch (e) {
                            // Silently handle error
                          }
                        };
                        
                        recognition.onresult = function(event) {
                          if (event.results.length > 0) {
                            const text = event.results[0][0].transcript;
                            const confidence = event.results[0][0].confidence;
                            
                            try {
                              window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'speechResult',
                                text: text,
                                confidence: confidence
                              }));
                            } catch (e) {
                              // Silently handle error
                            }
                          }
                        };
                        
                        recognition.onerror = function(event) {
                          isRecognizing = false;
                          try {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                              type: 'speechError',
                              error: event.error,
                              message: event.message
                            }));
                          } catch (e) {
                            // Silently handle error
                          }
                        };
                        
                        recognition.onnomatch = function(event) {
                          try {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                              type: 'speechError',
                              error: 'no-speech'
                            }));
                          } catch (e) {
                            // Silently handle error
                          }
                        };
                        
                        console.log('Speech recognition initialized successfully');
                        return true;
                        
                      } catch (error) {
                        console.log('Error initializing speech recognition:', error);
                        return false;
                      }
                    } else {
                      console.log('Speech recognition not supported in this browser');
                      try {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                          type: 'notSupported'
                        }));
                      } catch (e) {
                        // Silently handle error
                      }
                      return false;
                    }
                  }
                  
                  // Initialize on load
                  const speechSupported = initializeSpeechRecognition();
                  console.log('Speech recognition supported:', speechSupported);
                  
                  // Send ready message
                  try {
                    console.log('Sending webviewReady message...');
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'webviewReady',
                      speechSupported: speechSupported
                    }));
                    console.log('webviewReady message sent successfully');
                  } catch (e) {
                    console.log('Error sending webviewReady message:', e);
                  }
                  
                  // Handle messages from React Native WebView
                  function handleReactNativeMessage(data) {
                    console.log('WebView received message:', data);
                    try {
                      if (data.action === 'startListening') {
                        console.log('Starting speech recognition...');
                        console.log('Recognition object exists:', !!recognition);
                        console.log('Currently recognizing:', isRecognizing);
                        
                        if (recognition && !isRecognizing) {
                          try {
                            console.log('Calling recognition.start()');
                            recognition.start();
                          } catch (error) {
                            console.log('Error starting recognition:', error);
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                              type: 'speechError',
                              error: 'audio-capture',
                              message: error.message
                            }));
                          }
                        } else if (!recognition) {
                          console.log('Recognition not initialized');
                          window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'notSupported',
                            message: 'Speech recognition not initialized'
                          }));
                        } else {
                          console.log('Recognition already running');
                          window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'speechError',
                            error: 'aborted',
                            message: 'Recognition already running'
                          }));
                        }
                      } else if (data.action === 'stopListening') {
                        console.log('Stopping speech recognition...');
                        if (recognition && isRecognizing) {
                          recognition.stop();
                        }
                      }
                    } catch (error) {
                      console.log('Error in handleReactNativeMessage:', error);
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'speechError',
                        error: 'unknown',
                        message: error.message
                      }));
                    }
                  }
                  
                  // Multiple ways to handle messages (for compatibility)
                  window.addEventListener('message', function(event) {
                    try {
                      const data = JSON.parse(event.data);
                      handleReactNativeMessage(data);
                    } catch (error) {
                      // Silently handle error
                    }
                  });
                  
                  // React Native WebView specific message handler
                  document.addEventListener('message', function(event) {
                    try {
                      const data = JSON.parse(event.data);
                      handleReactNativeMessage(data);
                    } catch (error) {
                      // Silently handle error
                    }
                  });
                  
                  // Global function for React Native to call directly
                  window.startVoiceRecognition = function() {
                    handleReactNativeMessage({ action: 'startListening' });
                  };
                  
                  window.stopVoiceRecognition = function() {
                    handleReactNativeMessage({ action: 'stopListening' });
                  };
                  
                  // Handle page visibility changes
                  document.addEventListener('visibilitychange', function() {
                    if (document.hidden && recognition && isRecognizing) {
                      recognition.stop();
                    }
                  });
                  
                </script>
              </body>
              </html>
            `
          }}
          style={styles.hiddenWebView}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          allowsFullscreenVideo={false}
          allowsBackForwardNavigationGestures={false}
          mixedContentMode="compatibility"
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
          originWhitelist={['*']}
          allowFileAccess={true}
          allowUniversalAccessFromFileURLs={true}
          cacheEnabled={false}
          incognito={false}
        />
        </View> */}

        {/* Report Confirmation Modal */}
        <Modal
          visible={showReportConfirmation}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowReportConfirmation(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.reportModal}>
              <Text style={styles.reportModalTitle}>📋 Confirm Report Details</Text>
              
              <ScrollView style={styles.reportDetails}>
                <View style={styles.reportField}>
                  <Text style={styles.reportFieldLabel}>⏰ Time:</Text>
                  <Text style={styles.reportFieldValue}>{reportData.time}</Text>
                </View>
                
                <View style={styles.reportField}>
                  <Text style={styles.reportFieldLabel}>📍 Location:</Text>
                  <Text style={styles.reportFieldValue}>{reportData.location}</Text>
                </View>
                
                <View style={styles.reportField}>
                  <Text style={styles.reportFieldLabel}>📝 Description:</Text>
                  <Text style={styles.reportFieldValue}>{reportData.description}</Text>
                </View>
                
                <View style={styles.reportField}>
                  <Text style={styles.reportFieldLabel}>⚠️ Risk Category:</Text>
                  <Text style={styles.reportFieldValue}>{reportData.category}</Text>
                </View>
                
                <View style={styles.reportField}>
                  <Text style={styles.reportFieldLabel}>🏥 Health Assessment:</Text>
                  <Text style={styles.reportFieldValue}>{reportData.health}</Text>
                </View>
              </ScrollView>
              
              <View style={styles.reportModalButtons}>
                <TouchableOpacity 
                  style={styles.reportCancelButton}
                  onPress={() => {
                    setShowReportConfirmation(false);
                    setIsCollectingReport(false);
                    setReportData({ time: '', location: '', description: '', category: '', health: '' });
                    setConversationHistory([]);
                  }}
                >
                  <Text style={styles.reportCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.reportSubmitButton}
                  onPress={submitReport}
                >
                  <Text style={styles.reportSubmitButtonText}>Submit Report</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8',
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  messagesWrapper: {
    flex: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  homeButtonText: {
    fontSize: 16,
  },
  closeOverlayButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  closeOverlayText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  scrollContent: {
    paddingBottom: 100, // Extra space for fixed input area at bottom
  },
  overlayMode: {
    maxHeight: '70%', // When in overlay mode, take up less space
  },
  messageContainer: {
    marginVertical: 4,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  aiIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1fc5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 4,
  },
  aiMessageIcon: {
    width: 25,
    height: 25,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#1fc5f5',
    borderBottomRightRadius: 5,
  },
  aiBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userText: {
    color: '#fff',
  },
  aiText: {
    color: '#2c3e50',
  },
  boldText: {
    fontWeight: 'bold',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  messageTime: {
    fontSize: 11,
  },
  userTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  aiTime: {
    color: '#7f8c8d',
  },
  voiceIndicator: {
    fontSize: 12,
    marginLeft: 5,
  },
  typingIndicator: {
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    marginRight: 10,
    fontSize: 16,
  },
  voiceButton: {
    backgroundColor: '#3498db',
    width: 40,
    height: 40,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  voiceButtonActive: {
    backgroundColor: '#e74c3c',
  },
  voiceButtonText: {
    fontSize: 18,
  },
  recordingIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingDuration: {
    fontSize: 10,
    color: '#fff',
    marginTop: 2,
    fontWeight: 'bold',
  },
  stopSpeechButton: {
    backgroundColor: '#e74c3c',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  stopSpeechButtonText: {
    fontSize: 18,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  webViewContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 1,
    width: 1,
    opacity: 0.1, // Slightly more visible to help with permissions
    zIndex: -1000,
  },
  webViewContainerActive: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 50,
    width: 50,
    opacity: 0.3, // More visible during speech recognition
    zIndex: -500,
  },
  hiddenWebView: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 1,
    width: 1,
    opacity: 0,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  reportModal: {
    flex: 1,
    padding: 20,
  },
  reportModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
  },
  reportDetails: {
    flex: 1,
  },
  reportField: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reportFieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 5,
  },
  reportFieldValue: {
    fontSize: 16,
    color: '#2c3e50',
  },
  reportModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  reportCancelButton: {
    backgroundColor: '#95a5a6',
    flex: 0.45,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  reportCancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  reportSubmitButton: {
    backgroundColor: '#e74c3c',
    flex: 0.45,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  reportSubmitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
