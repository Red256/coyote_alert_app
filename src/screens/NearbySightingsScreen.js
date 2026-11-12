import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { collection, getDocs } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { db } from '../lib/firebase';
import { sharedStyles } from '../styles/sharedStyles';

import CozyCard from '../components/CozyCard';
import { cozyTheme } from '../styles/cozyTheme';
import { calculateDistance, formatDistance, formatTimeAgo } from '../utils/locationUtils';

export default function NearbySightingsScreen({ navigation }) {
  const [sightings, setSightings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [nearbySightings, setNearbySightings] = useState([]);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationFailed, setLocationFailed] = useState(false);
  const [maxDistance, setMaxDistance] = useState(1); // Default 1 mile
  const [showDistanceFilter, setShowDistanceFilter] = useState(false);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [selectedSighting, setSelectedSighting] = useState(null);

  useEffect(() => {
    // Get user's current location
    getUserCurrentLocation();
  }, []);

  useEffect(() => {
    // Fetch real sightings from Firebase
    const fetchRealSightings = async () => {
      try {
        // Wait for user's current location to be available
        if (!currentLocation) {
          console.log('Waiting for user location...');
          return;
        }
        
        // Fetch all sightings from Firebase
        const snapshot = await getDocs(collection(db, 'coyoteSightings'));
        const allSightings = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log('Total sightings fetched:', allSightings.length);
        
        const now = new Date();

        // Calculate distance from user's actual current location
        const sightingsWithDistance = allSightings
          .filter(sighting => {
            if (sighting.approved === false) return false; // pending admin approval
            if (!sighting.latitude || !sighting.longitude) return false;
            if (sighting.timestamp?.toDate && sighting.timestamp.toDate() > now) return false;
            const distance = calculateDistance(
              currentLocation.lat,
              currentLocation.lng,
              sighting.latitude,
              sighting.longitude
            );
            sighting.distance = distance;
            return true; // Return all sightings with distance calculated
          })
          .map(sighting => {
            // Use actual timestamp from the sighting
            const originalTime = sighting.timestamp?.toDate?.() || sighting.timestamp || new Date();
            sighting.timestamp = originalTime;
            return sighting;
          })
          .sort((a, b) => a.distance - b.distance); // Sort by distance
        
        console.log('Sightings with distance calculated:', sightingsWithDistance.length);
        
        // Sort by timestamp (newest first)
        sightingsWithDistance.sort((a, b) => {
          const timeA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
          const timeB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
          return timeB - timeA;
        });
        
        // Prefer address stored in Firestore (set at report submit); only reverse-geocode legacy rows without it
        const sightingsWithGeocodedLocation = [];
        for (const sighting of sightingsWithDistance) {
          const stored =
            (sighting.locationAddress && String(sighting.locationAddress).trim()) ||
            (sighting.location && String(sighting.location).trim());
          if (stored) {
            sighting.location = stored;
            sightingsWithGeocodedLocation.push(sighting);
            continue;
          }
          try {
            const geocodeResult = await Location.reverseGeocodeAsync({
              latitude: sighting.latitude,
              longitude: sighting.longitude,
            });

            if (geocodeResult && geocodeResult.length > 0) {
              const address = geocodeResult[0];
              const locationParts = [];
              if (address.streetNumber && address.street) {
                locationParts.push(`${address.streetNumber} ${address.street}`);
              } else if (address.street) {
                locationParts.push(address.street);
              } else if (address.streetNumber) {
                locationParts.push(address.streetNumber);
              }
              if (address.city) locationParts.push(address.city);
              if (address.region) locationParts.push(address.region);
              sighting.location =
                locationParts.join(', ') || sighting.location || 'Unknown Location';
            } else {
              sighting.location = sighting.location || 'Unknown Location';
            }
          } catch (error) {
            console.log('Geocoding error for sighting:', sighting.id, error.message);
            sighting.location = sighting.location || 'Unknown Location';
          }
          sightingsWithGeocodedLocation.push(sighting);
          await new Promise((r) => setTimeout(r, 150));
        }

        setSightings(sightingsWithGeocodedLocation);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching sightings:', error);
        setLoading(false);
      }
    };
    
    fetchRealSightings();
  }, [currentLocation]);

  useEffect(() => {
    // Filter nearby sightings when sightings, current location, or max distance changes
    if (sightings.length > 0) {
      // Filter by the selected maxDistance
      const nearby = sightings.filter(sighting => 
        sighting.distance <= maxDistance
      );
      setNearbySightings(nearby);
    } else {
      setNearbySightings([]);
    }
  }, [sightings, maxDistance]);

  const getUserCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      
      // Request permission to access location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        setLocationFailed(true);
        setLoading(false);
        Alert.alert(
          'Location Permission Required',
          'Please enable location services to see nearby coyote sightings.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const userLocation = {
        lat: location.coords.latitude,
        lng: location.coords.longitude
      };

      setCurrentLocation(userLocation);
      console.log('Current location obtained:', userLocation);
      
    } catch (error) {
      console.error('Error getting current location:', error);
      setLocationFailed(true);
      setLoading(false);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLocationLoading(false);
    }
  };

  const handleLearnMore = (sighting) => {
    setSelectedSighting(sighting);
    setShowDescriptionModal(true);
  };

  const isLongDescription = (text) => {
    return text && text.length > 120;
  };

  const getTruncatedDescription = (text, maxLength = 120) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const formatExactTime = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    const date = timestamp?.toDate?.() || new Date(timestamp);
    
    // Format date: Month Day, Year
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    // Format time: HH:MM AM/PM
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    
    return `${month} ${day}, ${year} at ${displayHours}:${displayMinutes} ${ampm}`;
  };

  const getRiskLevel = (sighting) => {
    const category = sighting.sightingCategory?.toLowerCase() || 'green';
    return category;
  };

  const getRiskColor = (riskLevel) => {
    switch(riskLevel) {
      case 'red': return '#e74c3c';
      case 'yellow': return '#f39c12';
      case 'green': 
      default: return '#27ae60';
    }
  };

  const getRiskLabel = (riskLevel) => {
    switch(riskLevel) {
      case 'red': return 'High Risk';
      case 'yellow': return 'Medium Risk';
      case 'green':
      default: return 'Low Risk';
    }
  };

  const getRiskEmoji = (riskLevel) => {
    switch(riskLevel) {
      case 'red': return '🔴';
      case 'yellow': return '🟡';
      case 'green':
      default: return '🟢';
    }
  };

  const renderSightingItem = ({ item }) => {
    const shouldShowLearnMore = isLongDescription(item.description);
    const displayDescription = shouldShowLearnMore 
      ? getTruncatedDescription(item.description) 
      : item.description;

    const riskLevel = getRiskLevel(item);
    const riskColor = getRiskColor(riskLevel);
    const riskLabel = getRiskLabel(riskLevel);
    const riskEmoji = getRiskEmoji(riskLevel);

    return (
      <View style={[styles.sightingCardWrapper, { borderColor: riskColor, borderWidth: 1, borderRadius: 24 }]}>
      <CozyCard variant="default" padding="medium" style={styles.sightingCard}>
        <View style={styles.sightingHeader}>
          <Text style={styles.timeDistanceText}>
            <Text style={styles.timeTextBold}>{formatTimeAgo(item.timestamp)}</Text>
            <Text style={styles.distanceTextNormal}> • {formatDistance(item.distance)}</Text>
          </Text>
          <View style={[styles.riskBadgeContainer, { backgroundColor: riskColor + '20' }]}>
            <Text style={[styles.riskBadgeText, { color: riskColor }]}>
              {riskEmoji} {riskLabel}
            </Text>
          </View>
        </View>
        
        <Text style={styles.locationText}>📍 {'Near ' + (item.location || 'Location not specified')}</Text>
        
        {item.description && (
          <View>
            <Text style={styles.descriptionText}>
              {displayDescription}
            </Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.cardButton}
                onPress={() => {
                  setSelectedSighting(item);
                  setShowDescriptionModal(true);
                }}
              >
                <Text style={styles.cardButtonText}>
                  Learn more <Text style={{ fontSize: 10 }}>▶︎</Text>
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.cardButton}
                onPress={() => {
                  navigation.navigate('CoyoteMap', {
                    initialLatitude: item.latitude,
                    initialLongitude: item.longitude,
                    focusSightingId: item.id
                  });
                }}
              >
                <Text style={styles.cardButtonText}>View on Map <Text style={{ fontSize: 10 }}>▶︎</Text></Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </CozyCard>
      </View>
    );
  };

  const renderDescriptionModal = () => {
    const hasMedia = selectedSighting?.mediaUrls && selectedSighting.mediaUrls.length > 0;
    
    return (
      <Modal
        visible={showDescriptionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDescriptionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <CozyCard variant="accent" padding="large" style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
              <Text style={styles.modalTitle}>📝 Full Details</Text>
              
              {selectedSighting && (
                <>
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>⏰ Time:</Text>
                    <Text style={styles.modalInfoValue}>{formatExactTime(selectedSighting.timestamp)}</Text>
                  </View>
                  
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>📍 Location:</Text>
                    <Text style={styles.modalInfoValue}>Near {selectedSighting.location}</Text>
                  </View>
                  
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>📏 Distance:</Text>
                    <Text style={styles.modalInfoValue}>{formatDistance(selectedSighting.distance)}</Text>
                  </View>
                  
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>⚠️ Risk Level:</Text>
                    <Text style={[styles.modalInfoValue, { color: getRiskColor(getRiskLevel(selectedSighting)), fontWeight: 'bold' }]}>
                      {getRiskLabel(getRiskLevel(selectedSighting))}
                    </Text>
                  </View>
                  
                  <View style={styles.modalDescriptionSection}>
                    <Text style={styles.modalDescriptionLabel}>📝 Description:</Text>
                    <Text style={styles.fullDescriptionText}>
                      {selectedSighting.description}
                    </Text>
                  </View>
                  
                  {/* Media Attachments Section */}
                  {hasMedia && (
                    <View style={styles.mediaSection}>
                      <Text style={styles.modalDescriptionLabel}>📷 Attachments:</Text>
                      <View style={styles.mediaGrid}>
                        {selectedSighting.mediaUrls.map((media, index) => (
                          <TouchableOpacity 
                            key={index} 
                            style={styles.mediaThumbnail}
                            onPress={() => {
                              Alert.alert('Media', 'Photo attachment');
                            }}
                          >
                            <Image 
                              source={{ uri: media.url }} 
                              style={styles.thumbnailImage}
                              resizeMode="cover"
                            />
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
            
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalMapButton]}
                onPress={() => {
                  setShowDescriptionModal(false);
                  navigation.navigate('CoyoteMap', {
                    initialLatitude: selectedSighting.latitude,
                    initialLongitude: selectedSighting.longitude,
                    focusSightingId: selectedSighting.id
                  });
                }}
              >
                <Text style={styles.modalCancelButtonText}>View on Map</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowDescriptionModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </CozyCard>
        </View>
      </Modal>
    );
  };

  const renderDistanceFilterModal = () => {
    const distanceOptions = [0.5, 1, 2];
    
    return (
      <Modal
        visible={showDistanceFilter}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDistanceFilter(false)}
      >
        <View style={styles.modalOverlay}>
          <CozyCard variant="primary" padding="large" style={styles.modalContent}>
            <Text style={styles.modalTitle}>📏 Filter by Distance</Text>
            <Text style={styles.modalSubtitle}>
              Show sightings within:
            </Text>
            
            <View style={styles.distanceOptions}>
              {distanceOptions.map((distance) => (
                <TouchableOpacity
                  key={distance}
                  style={[
                    styles.distanceOption,
                    maxDistance === distance && styles.distanceOptionSelected
                  ]}
                  onPress={() => {
                    setMaxDistance(distance);
                    setShowDistanceFilter(false);
                  }}
                >
                  <Text style={[
                    styles.distanceOptionText,
                    maxDistance === distance && styles.distanceOptionTextSelected
                  ]}>
                    {distance} mile{distance !== 1 ? 's' : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowDistanceFilter(false)}
            >
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </CozyCard>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={cozyTheme.colors.primary} />
        <Text style={styles.loadingText}>
          Loading coyote sightings...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={sharedStyles.header}>
        <TouchableOpacity
          style={sharedStyles.backButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Ionicons name="chevron-back" size={32} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={sharedStyles.headerTitle}>📍 Nearby Sightings</Text>
        <View style={sharedStyles.placeholder} />
      </View>
      
      <View style={styles.headerSubtitleContainer}>
        <Text style={styles.headerSubtitle}>within </Text>
        <TouchableOpacity 
          style={styles.inlineFilterButton}
          onPress={() => setShowDistanceFilter(true)}
        >
          <Text style={[styles.headerSubtitle, { fontStyle: 'italic' }]}>
            {maxDistance} mile{maxDistance !== 1 ? 's' : ''}
            <Text style={{ fontSize: 10, fontStyle: 'italic' }}>  ▶︎</Text>
          </Text>
        </TouchableOpacity>
        <Text style={styles.headerSubtitle}> of your location</Text>
      </View>

      <FlatList
        data={nearbySightings}
        renderItem={renderSightingItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View/>}
        ListEmptyComponent={
          <CozyCard variant="gentle" padding="large" style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              {locationFailed ? '📍 Location Unavailable' : '🔍 No Nearby Sightings'}
            </Text>
            <Text style={styles.emptyText}>
              {locationFailed
                ? 'We couldn\'t get your location. Turn on location for Coyote Alert in your phone settings, then reopen this screen. You can still browse all sightings on the Coyote Activity Map.'
                : `No coyote sightings found within ${maxDistance} mile${maxDistance !== 1 ? 's' : ''} of your current location.`}
            </Text>
          </CozyCard>
        }
      />

      {renderDistanceFilterModal()}
      {renderDescriptionModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: cozyTheme.colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: cozyTheme.colors.textSecondary,
    fontFamily: cozyTheme.typography.secondary,
  },
  headerSubtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  headerSubtitle: {
    fontSize: 16,
    color: cozyTheme.colors.textSecondary,
    fontFamily: cozyTheme.typography.secondary,
    fontWeight: 'bold',
  },
  inlineFilterButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 4,
    paddingVertical: 4,
    textDecorationLine: 'underline',
  },
  filterButton: {
    backgroundColor: cozyTheme.colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
  },
  filterButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: cozyTheme.typography.primary,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 16,
  },
  sightingCardWrapper: {
    marginBottom: 16,
    borderRadius: 12,
  },
  sightingCard: {
    borderWidth: 0,
  },
  sightingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeDistanceText: {
    fontSize: 14,
    fontFamily: cozyTheme.typography.secondary,
    flex: 1,
  },
  riskBadgeContainer: {
    marginLeft: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  riskBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: cozyTheme.typography.primary,
    textTransform: 'uppercase',
  },
  timeTextBold: {
    fontWeight: 'bold',
    color: cozyTheme.colors.textPrimary,
    fontFamily: cozyTheme.typography.primary,
  },
  distanceTextNormal: {
    fontWeight: 'normal',
    color: cozyTheme.colors.textSecondary,
    fontFamily: cozyTheme.typography.secondary,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    color: cozyTheme.colors.textPrimary,
    marginBottom: 8,
    fontFamily: cozyTheme.typography.primary,
  },
  descriptionText: {
    fontSize: 14,
    color: cozyTheme.colors.textSecondary,
    lineHeight: 20,
    fontFamily: cozyTheme.typography.secondary,
    marginBottom: 8,
  },
  learnMoreButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  learnMoreText: {
    fontSize: 14,
    color: cozyTheme.colors.textSecondary,
    textDecorationLine: 'underline',
    fontFamily: cozyTheme.typography.primary,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  cardButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    fontStyle: 'italic',
    fontFamily: cozyTheme.typography.primary,
    color: cozyTheme.colors.textSecondary,
  },
  fullDescriptionText: {
    fontSize: 16,
    color: cozyTheme.colors.textPrimary,
    lineHeight: 24,
    fontFamily: cozyTheme.typography.secondary,
    marginBottom: 20,
  },
  modalInfoRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  modalInfoLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: cozyTheme.colors.textPrimary,
    fontFamily: cozyTheme.typography.primary,
    marginRight: 8,
    minWidth: 80,
  },
  modalInfoValue: {
    fontSize: 16,
    color: cozyTheme.colors.textSecondary,
    fontFamily: cozyTheme.typography.secondary,
    flex: 1,
  },
  modalDescriptionSection: {
    marginTop: 16,
    marginBottom: 20,
  },
  modalDescriptionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: cozyTheme.colors.textPrimary,
    fontFamily: cozyTheme.typography.primary,
    marginBottom: 8,
  },
  emptyCard: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: cozyTheme.colors.textPrimary,
    marginBottom: 8,
    fontFamily: cozyTheme.typography.primary,
  },
  emptyText: {
    fontSize: 16,
    color: cozyTheme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: cozyTheme.typography.secondary,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: cozyTheme.colors.background,
    padding: 16,
    borderTopWidth: 3,
    borderTopColor: '#000',
    ...cozyTheme.shadows.soft,
  },
  mapButton: {
    marginBottom: 0,
    borderWidth: 0,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: "#F5F0E8",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: cozyTheme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: cozyTheme.typography.primary,
  },
  modalSubtitle: {
    fontSize: 16,
    color: cozyTheme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: cozyTheme.typography.secondary,
  },
  distanceOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  distanceOption: {
    backgroundColor: cozyTheme.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  distanceOptionSelected: {
    backgroundColor: cozyTheme.colors.primary,
  },
  distanceOptionText: {
    fontSize: 14,
    color: cozyTheme.colors.textSecondary,
    fontWeight: '500',
    fontFamily: cozyTheme.typography.secondary,
  },
  distanceOptionTextSelected: {
    color: cozyTheme.colors.textPrimary,
    fontWeight: 'bold',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 10,
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalMapButton: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderColor: '#888888',
    backgroundColor: cozyTheme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButton: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderColor: '#888888',
    backgroundColor: cozyTheme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButtonText: {
    fontSize: 14,
    color: cozyTheme.colors.textPrimary,
    fontFamily: cozyTheme.typography.primary,
    fontWeight: 'bold',
  },
  // Media styles
  mediaSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  mediaThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#e1e8ed',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2c3e50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoLabel: {
    color: '#fff',
    fontSize: 10,
    marginTop: 4,
  },
});


