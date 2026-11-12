import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import CozyCard from '../components/CozyCard';
import { auth, db } from '../lib/firebase';
import { cozyTheme } from '../styles/cozyTheme';

const AUTH_ERROR_MESSAGES = {
  'auth/invalid-email': 'That email address doesn\'t look right. Please check it and try again (for example, name@example.com).',
  'auth/email-already-in-use': 'An account with this email already exists. Try signing in instead.',
  'auth/weak-password': 'Your password is too short. Please use at least 6 characters.',
  'auth/missing-password': 'Please enter a password.',
  'auth/user-not-found': 'No account was found with that email. Check the address or create an account.',
  'auth/wrong-password': 'Incorrect email or password. Please try again.',
  'auth/invalid-credential': 'Incorrect email or password. Please try again.',
  'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
  'auth/network-request-failed': 'Couldn\'t connect. Please check your internet connection and try again.',
};

const friendlyAuthMessage = (e) =>
  AUTH_ERROR_MESSAGES[e?.code] || 'Something went wrong. Please try again.';

export default function AuthScreen({ onGuestLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState('signIn'); // 'signIn' | 'signUp'
  const [busy, setBusy] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) return Alert.alert('Missing info', 'Email and password required.');
    if (mode === 'signUp' && !name.trim()) return Alert.alert('Missing info', 'Name is required.');
    
    setBusy(true);
    try {
      if (mode === 'signUp') {
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const user = userCredential.user;
        
        // Save user profile data
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          name: name.trim(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        Alert.alert('Account created', 'Welcome to Coyote Alert!');
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (e) {
      Alert.alert('Auth error', friendlyAuthMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../coyotelogo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>Coyote Alert</Text>
        
        <CozyCard variant="primary" padding="large" style={styles.form}>
          {mode === 'signUp' && (
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={name}
              onChangeText={setName}
              placeholderTextColor={cozyTheme.colors.textLight}
            />
          )}
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            inputMode="email"
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            placeholderTextColor={cozyTheme.colors.textLight}
          />
          <TextInput
            style={styles.input}
            secureTextEntry
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            placeholderTextColor={cozyTheme.colors.textLight}
          />

          <TouchableOpacity 
            style={styles.firstAuthButton} 
            onPress={handleAuth}
            disabled={busy}
          >
            <Text style={[styles.authButtonText, { fontWeight: 'bold' }]}>
              {mode === 'signUp' ? 'Create account' : 'Sign in'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.authButton}
            onPress={() => setMode(mode === 'signUp' ? 'signIn' : 'signUp')}
          >
            <Text style={styles.authButtonText}>
              {mode === 'signUp' ? 'Have an account? Sign in' : 'Create an account'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.guestButton} onPress={onGuestLogin}>
            <Text style={styles.guestButtonText}>Continue as guest</Text>
          </TouchableOpacity>
        </CozyCard>
      </View>
    </View>
  );
}
 
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F5F0E8',
    padding: 24, 
    justifyContent: 'center' 
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: 50,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    marginBottom: 12, 
    textAlign: 'center',
    color: cozyTheme.colors.textPrimary,
    fontFamily: cozyTheme.typography.primary,
  },
  subtitle: {
    fontSize: 18,
    color: cozyTheme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    fontFamily: cozyTheme.typography.secondary,
  },
  form: {
    marginHorizontal: 8,
    borderWidth: 0,
    shadowColor: 'transparent',
    backgroundColor: 'transparent',
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#888', 
    borderRadius: 10, 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: cozyTheme.colors.surface,
    color: cozyTheme.colors.textPrimary,
    fontFamily: cozyTheme.typography.primary,
    height: 50,
    ...cozyTheme.shadows.soft,
  },
  authButton: {
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: cozyTheme.colors.surface,
    borderWidth: 1,
    borderColor: '#888',
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    ...cozyTheme.shadows.soft,
  },
  firstAuthButton: {
    marginBottom: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#888',
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    backgroundColor: cozyTheme.colors.background,
    ...cozyTheme.shadows.soft,
  },
  authButtonText: {
    fontSize: 18,
    color: cozyTheme.colors.textPrimary,
    fontFamily: cozyTheme.typography.primary,
  },
  switchButton: {
    marginBottom: 24,
  },
  guestButton: {
    backgroundColor: cozyTheme.colors.surface,
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 8,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    ...cozyTheme.shadows.soft,
  },
  guestButtonText: {
    fontSize: 18,
    color: cozyTheme.colors.textPrimary,
    fontFamily: cozyTheme.typography.primary,
  },
  guestSubtext: {
    fontSize: 14,
    color: cozyTheme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: cozyTheme.typography.secondary,
  },
});