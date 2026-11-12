import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { cozyTheme } from '../styles/cozyTheme';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation, isGuest }) {
  const functions = [
    {
      id: 1,
      title: 'Nearby Sightings',
      icon: 'location-outline',
      image: require('../../assets/Nearby Sightings.png'),
      screen: 'NearbySightings',
      enabled: true
    },
    {
      id: 2,
      title: 'Report a Sighting',
      icon: 'add-circle-outline',
      image: require('../../assets/Report a Sighting.png'),
      screen: 'ReportSighting',
      enabled: true
    },
    {
      id: 3,
      title: 'Coyote Activity Map',
      icon: 'location-outline',
      image: require('../../assets/Activity Map.png'),
      screen: 'CoyoteMap',
      enabled: true
    },
    {
      id: 5,
      title: 'Analysis Reports',
      icon: 'analytics-outline',
      image: require('../../assets/Analysis Reports.png'),
      screen: 'AnalysisReports',
      enabled: true
    },
    {
      id: 6,
      title: 'Safety Tips\n',
      icon: 'shield-checkmark-outline',
      image: require('../../assets/Safety & Q&A.png'),
      screen: 'SafetyQA',
      enabled: true
    },
    {
      id: 7,
      title: 'Chat with Koko',
      icon: 'chatbox-ellipses-outline',
      image: require('../../assets/Chat with Koko Big.png'),
      screen: 'AIChat',
      enabled: true
    },
    {
      id: 8,
      title: 'Test Your Knowledge',
      icon: 'school-outline',
      image: require('../../assets/Test Your Knowledge.png'),
      screen: 'Quiz',
      enabled: true
    },
    {
      id: 9,
      title: 'Account Settings',
      icon: 'settings-outline',
      screen: 'Account',
      enabled: true
    }
  ];

  const handleFunctionPress = (func) => {
    if (!func.enabled || !func.screen) {
      return;
    }

    navigation.navigate(func.screen);
  };

  const renderFunctionItem = (func) => {
    const isDisabled = !func.enabled;
    
    return (
      <TouchableOpacity
        key={func.id}
        style={[
          styles.functionItem,
          isDisabled && styles.functionItemDisabled
        ]}
        onPress={() => handleFunctionPress(func)}
        activeOpacity={isDisabled ? 1 : 0.7}
      >
        <View style={[
          styles.iconContainer,
          isDisabled && styles.iconContainerDisabled
        ]}>
          {func.image ? (
            <Image
              source={func.image}
              style={styles.functionImage}
              resizeMode="contain"
            />
          ) : (
            <Ionicons
              name={func.icon}
              size={func.icon === 'settings-outline' ? 36 : 48}
              color={isDisabled ? '#FFFFFF' : '#FFFFFF'}
            />
          )}
        </View>
        <View style={styles.titleContainer}>
          <Text style={[
            styles.functionTitle,
            isDisabled && styles.functionTitleDisabled
          ]}>
            {func.title}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.accountButton}
        onPress={() => navigation.navigate('Account')}
      >
        <Ionicons
          name={isGuest ? 'person-outline' : 'person'}
          size={20}
          color={cozyTheme.colors.textSecondary}
        />
      </TouchableOpacity>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Image 
            source={require('../../coyotelogo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Coyote Alert</Text>
          <View style={styles.decorativeLine} />
        </View>

        <View style={styles.functionsGrid}>
          {functions.map(renderFunctionItem)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8', // Darker yellow/cream background
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 40, // Reduced top padding to shift content up
    paddingBottom: 40, // Extra padding at bottom to prevent cutoff
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 10,
  },
  logo: {
    width: 160,
    height: 100,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: cozyTheme.colors.textPrimary,
    fontFamily: 'Arial',
  },
  dateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  decorativeLine: {
    width: 300,
    height: 2,
    backgroundColor: '#000000',
    marginVertical: 8,
  },
  headerSubtitle: {
    fontSize: 18,
    color: cozyTheme.colors.textSecondary,
    fontFamily: 'Arial',
    textAlign: 'center',
    marginVertical: 8,
  },
  functionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  functionItem: {
    width: (width - 60) / 3, // 3 columns: (screen width - padding) / 3
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  functionItemDisabled: {
    opacity: 0.6,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2596be', // Blue background
    borderWidth: 1,
    borderColor: '#1fc5f5', // Blue border
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    ...cozyTheme.shadows.soft,
  },
  iconContainerDisabled: {
    backgroundColor: '#B0B0B0', // Gray for disabled
  },
  functionImage: {
    width: 44,
    height: 44,
  },
  titleContainer: {
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  functionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: cozyTheme.colors.textPrimary,
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: 'Arial',
  },
  functionTitleDisabled: {
    color: cozyTheme.colors.textLight,
  },
  accountButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 6,
    backgroundColor: '#e8e8e8',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d3d3d3',
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
});


