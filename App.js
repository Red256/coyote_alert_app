import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Font from 'expo-font';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from './src/lib/firebase';
import StackNavigator from './src/navigation/StackNavigator';
import AdminZipCodeScreen from './src/screens/AdminZipCodeScreen';
import AuthScreen from './src/screens/AuthScreen';
import ReportSightingScreen from './src/screens/ReportSightingScreen';
import { cozyTheme } from './src/styles/cozyTheme';
import { ensureUserDocument } from './src/utils/clientUserMigration';

const Stack = createNativeStackNavigator();

// Edge-to-edge is on, so content draws under the system navigation bar.
// Pad the bottom once at the root so every screen sits above it.
function InsetRoot({ children }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: cozyTheme.colors.background, paddingBottom: insets.bottom }}>
      {children}
    </View>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [forceAuthScreen, setForceAuthScreen] = useState(false);

  useEffect(() => {
    const loadFonts = async () => {
      try {
        await Font.loadAsync({
          'Quicksand-Bold': require('./assets/fonts/Quicksand-Bold.otf'),
          'Arial': require('./assets/fonts/SpaceMono-Regular.ttf'), // Using Arial as system font
        });
        setFontsLoaded(true);
      } catch (error) {
        console.error('Error loading fonts:', error);
        setFontsLoaded(true); // Continue even if font loading fails
      }
    };

    loadFonts();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        setIsGuest(false); // Clear guest mode if user signs in
        // Ensure user document exists in Firestore (for migration)
        await ensureUserDocument(user);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleGuestLogin = () => {
    setIsGuest(true);
    setLoading(false);
  };

  const handleGuestToAuth = () => {
    console.log('Transitioning from guest to auth...');
    setIsGuest(false);
    setForceAuthScreen(true);
    // Reset force flag after a brief moment to allow re-render
    setTimeout(() => setForceAuthScreen(false), 100);
  };

  if (loading || !fontsLoaded) {
    return null; // Or a loading screen
  }

  console.log('App render - user:', !!user, 'isGuest:', isGuest, 'loading:', loading);

  return (
    <SafeAreaProvider>
    <NavigationContainer>
      <InsetRoot>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {(user || isGuest) && !forceAuthScreen ? (
            // User is signed in or using guest mode
            <>
              <Stack.Screen name="Main">
                {(props) => <StackNavigator {...props} isGuest={isGuest} onGuestToAuth={handleGuestToAuth} />}
              </Stack.Screen>
              <Stack.Screen name="ReportSighting">
                {(props) => <ReportSightingScreen {...props} isGuest={isGuest} />}
              </Stack.Screen>
              <Stack.Screen name="AdminZipCode" component={AdminZipCodeScreen} />
            </>
          ) : (
            // User is not signed in
            <Stack.Screen name="Auth">
              {(props) => <AuthScreen {...props} onGuestLogin={handleGuestLogin} />}
            </Stack.Screen>
          )}
        </Stack.Navigator>
      </InsetRoot>
    </NavigationContainer>
    </SafeAreaProvider>
  );
}