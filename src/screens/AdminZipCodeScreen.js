import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import CozyButton from '../components/CozyButton';
import CozyCard from '../components/CozyCard';
import { auth } from '../lib/firebase';
import { cozyTheme } from '../styles/cozyTheme';
import { ensureUserDocument } from '../utils/clientUserMigration';
import { checkUserZipCodes, setDefaultZipCode, updateAllUserZipCodes } from '../utils/updateUserZipCodes';

export default function AdminZipCodeScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [userList, setUserList] = useState([]);

  const handleUpdateZipCodes = async () => {
    Alert.alert(
      'Update Zip Codes',
      'This will set all existing user accounts to zip code 92782. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            setResult(null);
            
            try {
              const updateResult = await updateAllUserZipCodes();
              setResult(updateResult);
              
              if (updateResult.success) {
                Alert.alert('Success', updateResult.message);
              } else {
                Alert.alert('Error', updateResult.message);
              }
            } catch (error) {
              Alert.alert('Error', `Failed to update zip codes: ${error.message}`);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleCheckZipCodes = async () => {
    setLoading(true);
    
    try {
      const result = await checkUserZipCodes();
      if (result.success) {
        setUserList(result.users);
        if (result.users.length === 0) {
          Alert.alert('Info', result.message);
        }
      } else {
        Alert.alert('Error', result.message);
        setUserList([]);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to check zip codes: ${error.message}`);
      setUserList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefaultZipCode = async () => {
    Alert.alert(
      'Set Default Zip Code',
      'This will set the default zip code to 92782 for new users. This is an alternative to updating existing users.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Set Default',
          onPress: async () => {
            setLoading(true);
            try {
              const defaultResult = await setDefaultZipCode('92782');
              setResult(defaultResult);
              if (defaultResult.success) {
                Alert.alert('Success', defaultResult.message);
              } else {
                Alert.alert('Error', defaultResult.message);
              }
            } catch (error) {
              Alert.alert('Error', `Failed to set default zip code: ${error.message}`);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleMigrateCurrentUser = async () => {
    Alert.alert(
      'Migrate Current User',
      'This will create a Firestore document for the currently signed-in user if it doesn\'t exist.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Migrate',
          onPress: async () => {
            setLoading(true);
            try {
              const currentUser = auth.currentUser;
              if (!currentUser) {
                Alert.alert('Error', 'No user is currently signed in.');
                return;
              }

              const success = await ensureUserDocument(currentUser, { zipCode: '92782' });
              
              if (success) {
                setResult({
                  success: true,
                  message: `Successfully migrated user: ${currentUser.email || currentUser.uid}`,
                  count: 1
                });
                Alert.alert('Success', 'Current user migrated to Firestore successfully!');
              } else {
                Alert.alert('Error', 'Failed to migrate current user.');
              }
            } catch (error) {
              Alert.alert('Error', `Failed to migrate user: ${error.message}`);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };


  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <CozyCard variant="primary" padding="large" style={styles.headerCard}>
          <Text style={styles.title}>🔧 Admin: Zip Code Management</Text>
          <Text style={styles.subtitle}>
            Manage user zip codes for personalized coyote sightings
          </Text>
        </CozyCard>

        <CozyCard variant="default" padding="large" style={styles.actionCard}>
          <Text style={styles.sectionTitle}>Update All Users</Text>
          <Text style={styles.description}>
            Set all existing user accounts to zip code 92782 (Yorba Linda, CA area)
          </Text>
          
          <CozyButton
            title="🏠 Update All Zip Codes to 92782"
            onPress={handleUpdateZipCodes}
            variant="primary"
            size="large"
            disabled={loading}
            style={styles.button}
          />
        </CozyCard>

        <CozyCard variant="secondary" padding="large" style={styles.actionCard}>
          <Text style={styles.sectionTitle}>Check Current Zip Codes</Text>
          <Text style={styles.description}>
            View all user accounts and their current zip codes
          </Text>
          
          <CozyButton
            title="🔍 Check User Zip Codes"
            onPress={handleCheckZipCodes}
            variant="secondary"
            size="large"
            disabled={loading}
            style={styles.button}
          />
        </CozyCard>

        <CozyCard variant="cozy" padding="large" style={styles.actionCard}>
          <Text style={styles.sectionTitle}>Set Default Zip Code</Text>
          <Text style={styles.description}>
            Alternative approach: Set a default zip code for new users (recommended if permissions are limited)
          </Text>
          
          <CozyButton
            title="⚙️ Set Default Zip Code to 92782"
            onPress={handleSetDefaultZipCode}
            variant="cozy"
            size="large"
            disabled={loading}
            style={styles.button}
          />
        </CozyCard>

        <CozyCard variant="warm" padding="large" style={styles.actionCard}>
          <Text style={styles.sectionTitle}>Migrate Current User</Text>
          <Text style={styles.description}>
            Create a Firestore document for the currently signed-in user (useful for existing Auth users)
          </Text>
          
          <CozyButton
            title="👤 Migrate Current User to Firestore"
            onPress={handleMigrateCurrentUser}
            variant="warm"
            size="large"
            disabled={loading}
            style={styles.button}
          />
        </CozyCard>


        {result && (
          <CozyCard 
            variant={result.success ? "accent" : "warm"} 
            padding="large" 
            style={styles.resultCard}
          >
            <Text style={styles.resultTitle}>
              {result.success ? '✅ Success' : '❌ Error'}
            </Text>
            <Text style={styles.resultText}>{result.message}</Text>
            {result.count > 0 && (
              <Text style={styles.resultCount}>
                Updated {result.count} user account{result.count !== 1 ? 's' : ''}
              </Text>
            )}
          </CozyCard>
        )}

        {userList.length > 0 && (
          <CozyCard variant="gentle" padding="large" style={styles.userListCard}>
            <Text style={styles.sectionTitle}>Current User Zip Codes</Text>
            {userList.map((user, index) => (
              <View key={user.userId} style={styles.userItem}>
                <Text style={styles.userEmail}>{user.email}</Text>
                <Text style={styles.userZipCode}>
                  Zip: {user.zipCode}
                </Text>
              </View>
            ))}
          </CozyCard>
        )}

        <CozyButton
          title="← Back"
          onPress={() => navigation.goBack()}
          variant="outline"
          size="medium"
          style={[styles.backButton, { color: 'black' }]}
          textStyle={{ color: 'black' }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cozyTheme.colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  headerCard: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: cozyTheme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: cozyTheme.typography.primary,
  },
  subtitle: {
    fontSize: 16,
    color: cozyTheme.colors.textSecondary,
    textAlign: 'center',
    fontFamily: cozyTheme.typography.secondary,
  },
  actionCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: cozyTheme.colors.textPrimary,
    marginBottom: 8,
    fontFamily: cozyTheme.typography.primary,
  },
  description: {
    fontSize: 14,
    color: cozyTheme.colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
    fontFamily: cozyTheme.typography.secondary,
  },
  button: {
    marginTop: 8,
  },
  resultCard: {
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: cozyTheme.colors.textPrimary,
    marginBottom: 8,
    fontFamily: cozyTheme.typography.primary,
  },
  resultText: {
    fontSize: 16,
    color: cozyTheme.colors.textSecondary,
    marginBottom: 8,
    fontFamily: cozyTheme.typography.secondary,
  },
  resultCount: {
    fontSize: 14,
    color: cozyTheme.colors.textPrimary,
    fontWeight: '600',
    fontFamily: cozyTheme.typography.primary,
  },
  userListCard: {
    marginBottom: 16,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: cozyTheme.colors.primaryLight,
  },
  userEmail: {
    fontSize: 14,
    color: cozyTheme.colors.textPrimary,
    flex: 1,
    fontFamily: cozyTheme.typography.primary,
  },
  userZipCode: {
    fontSize: 14,
    color: cozyTheme.colors.textSecondary,
    fontWeight: '600',
    fontFamily: cozyTheme.typography.secondary,
  },
  backButton: {
    marginTop: 16,
  },
});
