// Location and distance utility functions
import * as Location from 'expo-location';

// Simple zip code to approximate coordinates mapping (US)
// In a real app, you'd use a proper geocoding service
const zipCodeCoordinates = {
  // California zip codes (examples)
  '90210': { lat: 34.0901, lng: -118.4065 }, // Beverly Hills
  '90211': { lat: 34.0836, lng: -118.4006 },
  '92602': { lat: 33.6603, lng: -117.7615 }, // Irvine
  '92603': { lat: 33.6845, lng: -117.8265 },
  '92604': { lat: 33.6694, lng: -117.8226 },
  '92612': { lat: 33.6581, lng: -117.8442 },
  '92614': { lat: 33.6866, lng: -117.7908 },
  '92617': { lat: 33.7175, lng: -117.7794 },
  '92618': { lat: 33.6866, lng: -117.8226 },
  '92620': { lat: 33.7175, lng: -117.8442 },
  '92697': { lat: 33.6405, lng: -117.8443 },
  '92782': { lat: 33.8886, lng: -117.8131 }, // Yorba Linda, CA
  // Add more zip codes as needed
};

/**
 * Get approximate coordinates for a zip code
 * @param {string} zipCode - 5-digit zip code
 * @returns {Object|null} - {lat, lng} or null if not found
 */
export const getZipCodeCoordinates = (zipCode) => {
  if (!zipCode || zipCode.length !== 5) return null;
  return zipCodeCoordinates[zipCode] || null;
};

/**
 * Get user's current location
 * @returns {Promise<Object|null>} - {lat, lng} or null if permission denied/error
 */
export const getCurrentLocation = async () => {
  try {
    // Request permission to access location
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('Location permission denied');
      return null;
    }

    // Get current position
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      lat: location.coords.latitude,
      lng: location.coords.longitude
    };
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
};

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} - Distance in miles
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Convert degrees to radians
 * @param {number} degrees
 * @returns {number}
 */
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Filter sightings by distance from user's current location
 * @param {Array} sightings - Array of sighting objects
 * @param {Object} userLocation - User's current location {lat, lng}
 * @param {number} maxDistance - Maximum distance in miles (default: 25)
 * @returns {Array} - Filtered and sorted sightings with distance
 */
export const filterSightingsByLocation = (sightings, userLocation, maxDistance = 25) => {
  if (!userLocation || !userLocation.lat || !userLocation.lng) return [];

  return sightings
    .map(sighting => {
      if (!sighting.latitude || !sighting.longitude) return null;
      
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        sighting.latitude,
        sighting.longitude
      );
      
      return {
        ...sighting,
        distance: Math.round(distance * 10) / 10 // Round to 1 decimal place
      };
    })
    .filter(sighting => sighting && sighting.distance <= maxDistance)
    .sort((a, b) => {
      // Sort by recency first (newest first), then by distance
      const dateA = new Date(a.timestamp?.toDate?.() || a.timestamp);
      const dateB = new Date(b.timestamp?.toDate?.() || b.timestamp);
      
      if (dateB - dateA !== 0) {
        return dateB - dateA; // Newest first
      }
      
      return a.distance - b.distance; // Closest first if same date
    });
};

/**
 * Legacy function for backward compatibility - now uses zip code coordinates as location
 * @deprecated Use filterSightingsByLocation instead
 */
export const filterSightingsByZipCode = (sightings, zipCode, maxDistance = 25) => {
  const zipCoords = getZipCodeCoordinates(zipCode);
  return filterSightingsByLocation(sightings, zipCoords, maxDistance);
};

/**
 * Format distance for display
 * @param {number} distance - Distance in miles
 * @returns {string} - Formatted distance string
 */
export const formatDistance = (distance) => {
  if (distance < 0.1) return 'Less than 0.1 mi';
  if (distance < 1) return `${distance.toFixed(1)} mi`;
  return `${Math.round(distance)} mi`;
};

/**
 * Format time ago for display
 * @param {Date|Object} timestamp - Date object or Firestore timestamp
 * @returns {string} - Formatted time ago string
 */
export const formatTimeAgo = (timestamp) => {
  const date = timestamp?.toDate?.() || new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
};
