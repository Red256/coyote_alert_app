import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { WebView } from 'react-native-webview';
import { GOOGLE_MAPS_API_KEY } from '../config/googleMapsConfig';

const MapLocationPicker = ({ initialLocation, onLocationSelect, onClose }) => {
  const [selectedLocation, setSelectedLocation] = useState(initialLocation || null);
  const [userLocation, setUserLocation] = useState(null);
  const [mapHtml, setMapHtml] = useState(null);
  const [address, setAddress] = useState('');
  const webViewRef = useRef(null);

  useEffect(() => {
    getUserLocation();
  }, []);

  useEffect(() => {
    if (userLocation || initialLocation) {
      generateMapHTML();
    }
  }, [userLocation, initialLocation]);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to show your current location on the map.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.log('Error getting location:', error);
    }
  };

  const generateMapHTML = () => {
    const centerLat = selectedLocation?.latitude || userLocation?.latitude || 40.7128;
    const centerLng = selectedLocation?.longitude || userLocation?.longitude || -74.0060;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
        #map { height: 100vh; width: 100%; }
        .info-window { padding: 10px; }
        #loading { 
            position: absolute; 
            top: 50%; 
            left: 50%; 
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 1000;
        }
    </style>
</head>
<body>
    <div id="loading">Loading map...</div>
    <div id="map"></div>
    
    <script>
        let map;
        let selectedMarker = null;
        
        function initMap() {
            try {
                map = new google.maps.Map(document.getElementById('map'), {
                    center: { lat: ${centerLat}, lng: ${centerLng} },
                    zoom: 15,
                    mapTypeControl: true,
                    streetViewControl: false,
                    fullscreenControl: false,
                });

                // Add user location marker if available
                ${userLocation ? `
                new google.maps.Marker({
                    position: { lat: ${userLocation.latitude}, lng: ${userLocation.longitude} },
                    map: map,
                    title: 'Your Location',
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 8,
                        fillColor: '#4285F4',
                        fillOpacity: 1,
                        strokeColor: '#ffffff',
                        strokeWeight: 2
                    }
                });
                ` : ''}


                // Don't add a marker in Google Maps - we'll use an overlay instead
                selectedMarker = null;
                
                // Add throttled center change listener to avoid too frequent updates
                let updateTimeout;
                let geocoder = new google.maps.Geocoder();
                
                // Function to search for address and center map
                function searchAddress(address) {
                    geocoder.geocode({ address: address }, function(results, status) {
                        if (status === 'OK' && results[0]) {
                            const location = results[0].geometry.location;
                            map.setCenter(location);
                            map.setZoom(15);
                            updateLocationAndGeocode(location.lat(), location.lng());
                        } else {
                            window.ReactNativeWebView?.postMessage(JSON.stringify({
                                type: 'searchError',
                                message: 'Address not found'
                            }));
                        }
                    });
                }
                
                // Listen for search requests from React Native
                window.searchAddress = searchAddress;
                
                function updateLocationAndGeocode(lat, lng) {
                    // Send location to React Native
                    window.ReactNativeWebView?.postMessage(JSON.stringify({
                        type: 'locationSelected',
                        latitude: lat,
                        longitude: lng
                    }));
                    
                    // Get human-readable address
                    geocoder.geocode({ location: { lat: lat, lng: lng } }, function(results, status) {
                        if (status === 'OK' && results[0]) {
                            const address = results[0].formatted_address;
                            window.ReactNativeWebView?.postMessage(JSON.stringify({
                                type: 'addressFound',
                                address: address,
                                latitude: lat,
                                longitude: lng
                            }));
                        } else {
                            window.ReactNativeWebView?.postMessage(JSON.stringify({
                                type: 'addressFound',
                                address: 'Address not found',
                                latitude: lat,
                                longitude: lng
                            }));
                        }
                    });
                }
                
                map.addListener('center_changed', function() {
                    clearTimeout(updateTimeout);
                    updateTimeout = setTimeout(function() {
                        const center = map.getCenter();
                        const lat = center.lat();
                        const lng = center.lng();
                        
                        updateLocationAndGeocode(lat, lng);
                    }, 300); // Throttle updates to every 300ms
                });

                // Initial geocoding for center location
                updateLocationAndGeocode(${centerLat}, ${centerLng});
                
                // Hide loading indicator
                document.getElementById('loading').style.display = 'none';
                
                console.log('Map initialized successfully');
            } catch (error) {
                console.error('Error initializing map:', error);
                document.getElementById('loading').innerHTML = 'Error loading map: ' + error.message;
            }
        }

        // Global error handler for Maps API
        window.gm_authFailure = function() {
            console.error('Google Maps API authentication failed');
            document.getElementById('loading').innerHTML = 'Maps API authentication failed. Please check your API key.';
        };

        // Check if Google Maps loaded
        function checkGoogleMaps() {
            if (typeof google !== 'undefined' && google.maps) {
                initMap();
            } else {
                setTimeout(checkGoogleMaps, 100);
            }
        }
        
        checkGoogleMaps();
    </script>
    <script src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap" async defer></script>
</body>
</html>`;

    setMapHtml(html);
  };

  const handleWebViewMessage = (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type === 'locationSelected') {
        setSelectedLocation({
          latitude: message.latitude,
          longitude: message.longitude
        });
      } else if (message.type === 'addressFound') {
        setAddress(message.address);
      }
    } catch (error) {
      console.log('Error parsing WebView message:', error);
    }
  };

  // Initialize with a default location if none provided
  useEffect(() => {
    if (!selectedLocation && (userLocation || initialLocation)) {
      setSelectedLocation(userLocation || initialLocation);
    }
  }, [userLocation, initialLocation]);

  const handleConfirmLocation = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
    } else {
      Alert.alert('No Location Selected', 'Please drag the map to position the marker.');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📍 Select Location</Text>
        <Text style={styles.headerSubtitle}>
          Drag the map to position the red marker at your sighting location
        </Text>
      </View>

      <View style={styles.mapContainer}>
        {mapHtml && (
          <WebView
            ref={webViewRef}
            source={{ html: mapHtml }}
            style={styles.webview}
            onMessage={handleWebViewMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={false}
            scalesPageToFit={false}
            onError={(error) => console.log('WebView error:', error)}
            onHttpError={(error) => console.log('WebView HTTP error:', error)}
          />
        )}
        {/* SVG Droplet Marker Overlay */}
        <View style={styles.markerOverlay} pointerEvents="none">
          <Svg width="40" height="50" viewBox="-8 -48 20 48" style={styles.markerSvg}>
            <Path
              d="M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z"
              fill="#FF0000"
              fillOpacity="0.9"
              stroke="#ffffff"
              strokeWidth="3"
            />
            <Circle cx="0" cy="-30" r="5" fill="#ffffff" />
          </Svg>
        </View>
      </View>

      <View style={styles.footer}>
        {selectedLocation && (
          <View style={styles.coordinatesContainer}>
            <TextInput
              style={styles.addressInput}
              value={address || 'Loading address...'}
              placeholder="Search for an address or location..."
              onChangeText={setAddress}
              onSubmitEditing={() => {
                if (address.trim()) {
                  const searchScript = `window.searchAddress("${address.trim()}");`;
                  webViewRef.current?.injectJavaScript(searchScript);
                }
              }}
            />
          </View>
        )}
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.confirmButton} 
            onPress={handleConfirmLocation}
          >
            <Text style={styles.confirmButtonText}>
              Use This Location
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 50,
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  addressInput: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#e0e0e0',
  },
  webview: {
    flex: 1,
  },
  markerOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -55,
    width: 40,
    height: 50,
    zIndex: 1000,
  },
  markerSvg: {
    width: 40,
    height: 50,
  },
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  coordinatesContainer: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  addressText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  coordinatesText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 2,
    backgroundColor: '#28a745',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MapLocationPicker;





















































