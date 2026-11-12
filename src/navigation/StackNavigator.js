import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

// Import all screens
import AdminScreen from '../screens/AdminScreen';
import AIChatScreen from '../screens/AIChatScreen';
import AnalysisReportsScreen from '../screens/AnalysisReportsScreen';
import AuthScreen from '../screens/AuthScreen';
import CoyoteMapScreen from '../screens/CoyoteMapScreen';
import FAQScreen from '../screens/FAQScreen';
import HomeScreen from '../screens/HomeScreen';
import NearbySightingsScreen from '../screens/NearbySightingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import QuizScreen from '../screens/QuizScreen';
import ReportSightingScreen from '../screens/ReportSightingScreen';
import SafetyQAScreen from '../screens/SafetyQAScreen';

const Stack = createNativeStackNavigator();

export default function StackNavigator({ isGuest, onGuestToAuth }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // We'll use custom headers in each screen
      }}
    >
      <Stack.Screen name="Home" options={{ title: 'Home' }}>
        {(props) => <HomeScreen {...props} isGuest={isGuest} />}
      </Stack.Screen>
      
      <Stack.Screen name="NearbySightings" component={NearbySightingsScreen} />
      <Stack.Screen name="ReportSighting" component={ReportSightingScreen} />
      <Stack.Screen name="CoyoteMap" component={CoyoteMapScreen} />
      
      <Stack.Screen name="SafetyQA" component={SafetyQAScreen} />
      <Stack.Screen name="FAQ" component={FAQScreen} />
      <Stack.Screen name="AIChat" component={AIChatScreen} />
      <Stack.Screen name="Quiz" component={QuizScreen} />
      <Stack.Screen name="AnalysisReports" component={AnalysisReportsScreen} />
      <Stack.Screen name="Admin" component={AdminScreen} />
      
      <Stack.Screen name="Account" options={{ title: isGuest ? 'Guest' : 'Account' }}>
        {(props) => <ProfileScreen {...props} isGuest={isGuest} onGuestToAuth={onGuestToAuth} />}
      </Stack.Screen>
      
      <Stack.Screen name="Auth" component={AuthScreen} />
    </Stack.Navigator>
  );
}


