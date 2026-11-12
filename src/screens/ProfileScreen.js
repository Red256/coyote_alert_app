import { Ionicons } from '@expo/vector-icons';
import { deleteUser, signOut, updatePassword } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db, isAdmin } from '../lib/firebase';
import { cozyTheme } from '../styles/cozyTheme';
import { sharedStyles } from '../styles/sharedStyles';
import { sendContactAdminEmail } from '../utils/emailService';

export default function ProfileScreen({ navigation, isGuest, onGuestToAuth }) {
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [adminCheckLoading, setAdminCheckLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [showPhoneEdit, setShowPhoneEdit] = useState(false);
  const [editingPhone, setEditingPhone] = useState('');
  const [showContactAdmin, setShowContactAdmin] = useState(false);
  const [contactMessage, setContactMessage] = useState('');

  const user = auth.currentUser;

  useEffect(() => {
    checkAdminStatus();
    fetchUserProfile();
  }, []);

  const checkAdminStatus = async () => {
    if (user) {
      try {
        const adminStatus = await isAdmin();
        setUserIsAdmin(adminStatus);
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    }
    setAdminCheckLoading(false);
  };

  const fetchUserProfile = async () => {
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const profileData = userDoc.data();
          setUserProfile(profileData);
          setEditingPhone(profileData.phoneNumber || '');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    }
  };

  const handlePhoneUpdate = async () => {
    setBusy(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        phoneNumber: editingPhone.trim() || null,
        updatedAt: new Date(),
      });
      setUserProfile(prev => ({ ...prev, phoneNumber: editingPhone.trim() || null }));
      setShowPhoneEdit(false);
      Alert.alert('Success', 'Phone number updated successfully!');
    } catch (error) {
      console.error('Error updating phone number:', error);
      Alert.alert('Error', 'Failed to update phone number. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword.trim()) {
      Alert.alert('Error', 'Please enter a new password.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      await updatePassword(user, newPassword);
      Alert.alert('Success', 'Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordChange(false);
    } catch (error) {
      let message = 'Unable to update password. Please try again.';
      if (error.code === 'auth/requires-recent-login') {
        message = 'For security reasons, please sign out and sign in again before changing your password.';
      }
      Alert.alert('Error', message);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your posts and data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: confirmDeleteAccount }
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    Alert.alert(
      'Final Confirmation',
      'Are you absolutely sure? This will permanently delete your account.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes, Delete My Account', style: 'destructive', onPress: performDeleteAccount }
      ]
    );
  };

  const performDeleteAccount = async () => {
    setBusy(true);
    try {
      await deleteUser(user);
      // User will be automatically signed out
    } catch (error) {
      Alert.alert('Error', 'Unable to delete account. Please try again.');
      setBusy(false);
    }
  };

  const doSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: async () => {
          try {
            await signOut(auth);
          } catch (e) {
            Alert.alert('Sign Out Error', 'Unable to sign out. Please try again.');
          }
        }}
      ]
    );
  };

  const handleContactAdmin = async () => {
    if (!contactMessage.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    setBusy(true);
    try {
      const userName = userProfile?.name || user?.email || 'Unknown User';
      const userEmail = user?.email || 'No email';
      
      const result = await sendContactAdminEmail(userEmail, userName, contactMessage.trim());
      
      if (result.success) {
        Alert.alert(
          'Message Sent',
          'Your message has been sent to the admin. You will receive a copy via email.',
          [{ text: 'OK', onPress: () => {
            setShowContactAdmin(false);
            setContactMessage('');
          }}]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending contact message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setBusy(false);
    }
  };

  if (isGuest) {
  return (
      <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: 50 }}>
      <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Ionicons name="chevron-back" size={24} color="#000000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>👤 Guest Mode</Text>
            <View style={styles.placeholder} />
          </View>
        <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>G</Text>
          </View>
          <Text style={styles.userEmail}>Browsing as Guest</Text>
          <Text style={styles.userStatus}>Limited access - Sign in for full features</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Guest Limitations</Text>
          <View style={styles.limitationItem}>
            <Text style={styles.limitationText}>✅ Can view coyote map and sightings</Text>
          </View>
          <View style={styles.limitationItem}>
            <Text style={styles.limitationText}>✅ Can report coyote sightings (email required)</Text>
          </View>
          <View style={styles.limitationItem}>
            <Text style={styles.limitationText}>✅ Can use AI chat and image analysis</Text>
          </View>
          <View style={styles.limitationItem}>
            <Text style={styles.limitationText}>✅ Can access FAQ and educational content</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Create Account</Text>
          <Text style={styles.sectionDescription}>
            Sign up for a free account to save your account details and personalize your settings.
          </Text>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => {
              Alert.alert(
                'Create Account / Sign In',
                'You will be taken to the sign-in screen. Your current guest session will end.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Continue', 
                    onPress: () => {
                      console.log('Guest to auth button pressed, calling onGuestToAuth...');
                      if (onGuestToAuth) {
                        onGuestToAuth();
                      } else {
                        console.log('onGuestToAuth function not available!');
                      }
                    }
                  }
                ]
              );
            }}
          >
            <Text style={styles.signInButtonText}>Create Account / Sign In</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Coyote Tracking App - Guest Mode</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: 0 }}>
      <View style={sharedStyles.header}>
        <TouchableOpacity
          style={sharedStyles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={32} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={sharedStyles.headerTitle}>Account Settings</Text>
        <View style={sharedStyles.placeholder} />
      </View>
      
      <View style={styles.userInfoContainer}>
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.userEmail}>{user?.email || 'User'}</Text>
        <Text style={styles.userStatus}>Member since {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'Unknown'}</Text>
        {userProfile?.phoneNumber && (
          <Text style={styles.userPhone}>📞 {userProfile.phoneNumber}</Text>
        )}
        {!adminCheckLoading && userIsAdmin && (
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>👑 Administrator</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        
        <TouchableOpacity
          style={styles.option}
          onPress={() => setShowPasswordChange(!showPasswordChange)}
        >
          <Text style={styles.optionText}>Change Password</Text>
          <Text style={styles.optionArrow}>{showPasswordChange ? '▼' : '▶'}</Text>
        </TouchableOpacity>

        {showPasswordChange && (
          <View style={styles.passwordForm}>
            <TextInput
              style={styles.input}
              placeholder="New Password"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              editable={!busy}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm New Password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              editable={!busy}
            />
            <View style={styles.passwordActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowPasswordChange(false);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                disabled={busy}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, (!newPassword || !confirmPassword || busy) && styles.saveButtonDisabled]}
                onPress={handlePasswordChange}
                disabled={!newPassword || !confirmPassword || busy}
              >
                {busy ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        <TouchableOpacity
          style={[styles.option, { borderBottomWidth: 0, paddingBottom: 8 }]}
          onPress={() => setShowPhoneEdit(!showPhoneEdit)}
        >
          <Text style={styles.optionText}>Add Phone Number</Text>
          <Text style={styles.optionArrow}>{showPhoneEdit ? '▼' : '▶'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>

        {showPhoneEdit && (
          <View style={styles.editForm}>
            <TextInput
              style={styles.input}
              placeholder="Phone Number (optional)"
              value={editingPhone}
              onChangeText={setEditingPhone}
              editable={!busy}
              inputMode="tel"
            />
            <View style={styles.editActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowPhoneEdit(false);
                  setEditingPhone(userProfile?.phoneNumber || '');
                }}
                disabled={busy}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, busy && styles.saveButtonDisabled]}
                onPress={handlePhoneUpdate}
                disabled={busy}
              >
                {busy ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.option} onPress={() => setShowContactAdmin(true)}>
          <Text style={styles.optionText}>Contact Admin</Text>
          <Text style={styles.optionArrow}>▶</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.option} onPress={doSignOut}>
          <Text style={styles.optionText}>Sign Out</Text>
          <Text style={styles.optionArrow}>▶</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.option, { borderBottomWidth: 0, paddingBottom: 8 }]} onPress={handleDeleteAccount}>
          <Text style={[styles.optionText, styles.dangerText]}>Delete Account</Text>
          <Text style={[styles.optionArrow, styles.dangerText]}>▶</Text>
        </TouchableOpacity>
      </View>

      {/* Contact Admin Modal */}
      {showContactAdmin && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Contact Admin</Text>
            <Text style={styles.modalDescription}>
              Send a message to the admin team. 
            </Text>
            
            <TextInput
              style={styles.modalTextInput}
              placeholder="Enter your message here..."
              value={contactMessage}
              onChangeText={setContactMessage}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              placeholderTextColor="#999"
            />
            
            <View style={styles.modalButtons}>
            <TouchableOpacity
                style={[styles.modalButton, styles.modalSendButton]}
                onPress={handleContactAdmin}
                disabled={busy}
              >
                {busy ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalSendButtonText}>Send Message</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSendButton]}
                onPress={() => {
                  setShowContactAdmin(false);
                  setContactMessage('');
                }}
                disabled={busy}
              >
                <Text style={styles.modalSendButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
      </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8',
  },
  header: {
    backgroundColor: '#2596be',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginTop: 60,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...cozyTheme.shadows.soft,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  placeholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userInfoContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
    textAlign: 'center',
  },
  userEmailAddress: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 8,
  },
  userStatus: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  userPhone: {
    fontSize: 14,
    color: '#27ae60',
    textAlign: 'center',
    marginBottom: 8,
  },
  adminBadge: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  adminBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    padding: 16,
    paddingBottom: 8,
    paddingTop: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  optionText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  optionArrow: {
    fontSize: 16,
    color: '#95a5a6',
  },
  dangerText: {
    color: '#888888',
  },
  passwordForm: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e1e8ed',
  },
  editForm: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e1e8ed',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  passwordActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#95a5a6',
  },
  cancelButtonText: {
    color: '#7f8c8d',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#3498db',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 14,
    color: '#95a5a6',
    marginBottom: 4,
  },
  limitationItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  limitationText: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 20,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  signInButton: {
    backgroundColor: '#3498db',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Contact Admin Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    maxWidth: '90%',
    width: '100%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalTextInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    marginBottom: 20,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalSendButton: {
    backgroundColor: '#1fc5f5',
  },
  modalSendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

