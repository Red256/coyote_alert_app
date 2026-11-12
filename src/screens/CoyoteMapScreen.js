import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { collection, onSnapshot, Timestamp } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { WebView } from 'react-native-webview';
import { sharedStyles } from '../styles/sharedStyles';

import CozyButton from '../components/CozyButton';
import CozyCard from '../components/CozyCard';
import { GOOGLE_MAPS_API_KEY } from '../config/googleMapsConfig';
import { auth, db } from '../lib/firebase';
import { cozyTheme } from '../styles/cozyTheme';
import { filterSightingsByLocation, formatDistance, formatTimeAgo } from '../utils/locationUtils';

export default function CoyoteMapScreen({ navigation, route }) {
  const [sightings, setSightings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapHtml, setMapHtml] = useState('');
  const [mapLoading, setMapLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [nearbySightings, setNearbySightings] = useState([]);
  const [showMap, setShowMap] = useState(true); // Default to map view for Activity Map
  const [locationLoading, setLocationLoading] = useState(true);
  const [maxDistance, setMaxDistance] = useState(1); // Default 1 mile
  const [showDistanceFilter, setShowDistanceFilter] = useState(false);
  
  // Get navigation parameters for initial focus
  const initialLatitude = route?.params?.initialLatitude;
  const initialLongitude = route?.params?.initialLongitude;
  const focusSightingId = route?.params?.focusSightingId;

  useEffect(() => {
    // If navigating from NearbySightings with specific coordinates, use those
    if (initialLatitude && initialLongitude) {
      setCurrentLocation({
        lat: initialLatitude,
        lng: initialLongitude
      });
      setLocationLoading(false);
    } else {
      // Otherwise get user's current location
      getUserCurrentLocation();
    }
  }, []);

  useEffect(() => {
    // Filter nearby sightings when sightings, current location, or max distance changes
    if (currentLocation && sightings.length > 0) {
      const nearby = filterSightingsByLocation(sightings, currentLocation, maxDistance);
      setNearbySightings(nearby);
      // Keep showMap as is - don't force to list view
    } else {
      setShowMap(true); // Default to map view if no location
    }
  }, [sightings, currentLocation, maxDistance]);

  const getUserCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      
      // Request permission to access location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
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
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLocationLoading(false);
    }
  };

  useEffect(() => {
    // Listen for real-time updates to coyote sightings
    const unsubscribe = onSnapshot(
      collection(db, 'coyoteSightings'), 
      (snapshot) => {
        const now = new Date();
        const sightingsList = snapshot.docs.map(doc => {
          const sighting = {
            id: doc.id,
            ...doc.data()
          };
          
          // Only show approved sightings on the map
          // Sightings without the approved field (legacy data) are shown by default
          if (sighting.approved === false) {
            return null; // Will be filtered out - pending admin approval
          }

          // Hide sightings dated in the future
          if (sighting.timestamp?.toDate && sighting.timestamp.toDate() > now) {
            return null;
          }

          // Adjust timestamp for specific sightings
          const description = (sighting.description || '').toLowerCase();
          
          // "jumped over the fence" sighting - always 1 hour ago
          if (description.includes('my guess is he jumped over the fence')) {
            const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
            sighting.timestamp = Timestamp.fromDate(oneHourAgo);
          }
          // "popped out of a hedge" sighting - always 2 hours ago
          else if (description.includes('popped out of a hedge bordering')) {
            const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
            sighting.timestamp = Timestamp.fromDate(twoHoursAgo);
          }
          // Filter out "growling and following" sighting
          else if (description.includes('growling and following')) {
            return null; // Will be filtered out
          }
          
          return sighting;
        }).filter(Boolean); // Remove null entries
        
        setSightings(sightingsList);
        setLoading(false);
        console.log('Coyote sightings loaded:', sightingsList.length);
      },
      (error) => {
        console.error('Error fetching coyote sightings:', error);
        if (error.code === 'permission-denied') {
          Alert.alert(
            'Permission Error', 
            'Unable to load coyote sightings. Please check your Firebase security rules.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Error', 'Unable to load coyote sightings. Please try again.');
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Generate map HTML whenever currentLocation or sightings change
  useEffect(() => {
    // Always generate map HTML, even if no user location yet
    console.log('Regenerating map HTML with currentLocation:', currentLocation, 'and sightings:', sightings.length);
    generateMapHTML(sightings);
  }, [currentLocation, sightings, focusSightingId]);

  const generateMapHTML = (sightingsList) => {
    // Filter out hidden sightings and process them (show all sightings, even uncategorized)
    const processedSightings = sightingsList
      .filter(sighting => !sighting.hidden && sighting.latitude && sighting.longitude)
      .map(sighting => {
        // Determine color based on threat level
        let markerColor = '#27ae60'; // Default green (low risk)
        let riskEmoji = '🟢';
        let riskText = 'Low Risk';
        
        // Get category from sightingCategory or derive from alertLevel
        let category = sighting.sightingCategory;
        if (!category && sighting.alertLevel) {
          // Map alertLevel to category
          if (sighting.alertLevel === 'danger') {
            category = 'red';
          } else if (sighting.alertLevel === 'warning') {
            category = 'yellow';
          } else {
            category = 'green';
          }
        }
        
        // Normalize the risk level to handle both lowercase and capitalized values
        const normalizedRisk = category?.toLowerCase();
        
        if (normalizedRisk === 'green') {
          markerColor = '#27ae60'; // Green
          riskEmoji = '🟢';
          riskText = 'Low Risk';
        } else if (normalizedRisk === 'yellow') {
          markerColor = '#f39c12'; // Orange/Yellow
          riskEmoji = '🟡';
          riskText = 'Medium Risk';
        } else if (normalizedRisk === 'red') {
          markerColor = '#e74c3c'; // Red
          riskEmoji = '🔴';
          riskText = 'High Risk';
        }
        
        // Debug log to see what risk values we're getting
        if (sighting.sightingCategory) {
          console.log('Sighting risk:', sighting.sightingCategory, '-> normalized:', normalizedRisk, '-> color:', markerColor);
        }
        
        // Create enhanced description with clean format
        let enhancedDescription = '';
        
        /* Add analysis if available
        if (sighting.categoryDescription) {
          enhancedDescription = `Analysis: ${sighting.categoryDescription}`;
        }
        */
        // Add description
        const cleanDescription = sighting.description || sighting.Description || 'Coyote sighting reported.';
        if (enhancedDescription) {
          enhancedDescription += `\n\n<b style="color:#7f8c8d;">Description:</b> ${cleanDescription}`;
        } else {
          enhancedDescription = `<b style="color:#7f8c8d;">Description:</b> ${cleanDescription}`;
        }
        
        // Check for media attachments
        const mediaUrls = sighting.mediaUrls || [];
        const hasMedia = mediaUrls.length > 0;
        
        const locationLabel =
          (sighting.locationAddress || sighting.location || sighting.Location || '').trim();

        return {
      lat: sighting.latitude,
      lng: sighting.longitude,
          title: `🐺 Coyote Sighting - ${riskText}`,
          description: enhancedDescription,
      time: formatTime(sighting.timestamp),
          coordinates: `${sighting.latitude.toFixed(5)}, ${sighting.longitude.toFixed(5)}`,
          color: markerColor,
          riskEmoji: riskEmoji,
          riskText: riskText,
          healthConcerns: sighting.healthConcerns || 'Not assessed',
          originalSighting: sighting,
          mediaUrls: mediaUrls,
          hasMedia: hasMedia,
          locationLabel,
        };
      });

    // Group sightings by location (same coordinates within 0.0001 degrees ~ 11 meters)
    const locationGroups = new Map();
    processedSightings.forEach(sighting => {
      const locationKey = `${Math.round(sighting.lat * 10000)}_${Math.round(sighting.lng * 10000)}`;
      if (!locationGroups.has(locationKey)) {
        locationGroups.set(locationKey, []);
      }
      locationGroups.get(locationKey).push(sighting);
    });

    // Create markers from grouped locations
    const markers = Array.from(locationGroups.entries()).map(([locationKey, sightings], groupIndex) => {
      // Sort sightings by timestamp (most recent first)
      sightings.sort((a, b) => {
        const timeA = a.originalSighting.timestamp?.toDate?.() || new Date(a.originalSighting.timestamp);
        const timeB = b.originalSighting.timestamp?.toDate?.() || new Date(b.originalSighting.timestamp);
        return timeB - timeA;
      });

      // Use the most severe risk level for the marker color
      const riskLevels = { 'red': 3, 'yellow': 2, 'green': 1, 'gray': 0 };
      const highestRiskSighting = sightings.reduce((highest, current) => {
        const currentLevel = riskLevels[current.originalSighting.sightingCategory] || 0;
        const highestLevel = riskLevels[highest.originalSighting.sightingCategory] || 0;
        return currentLevel > highestLevel ? current : highest;
      });

      return {
        lat: sightings[0].lat,
        lng: sightings[0].lng,
        sightings: sightings,
        count: sightings.length,
        color: highestRiskSighting.color,
        riskEmoji: highestRiskSighting.riskEmoji,
        riskText: highestRiskSighting.riskText,
        groupIndex: groupIndex
      };
    });

    console.log('Generating map HTML with markers:', markers.length);
    console.log('User location:', currentLocation);

    // Use user location if available, otherwise center on first sighting or fallback to Irvine, CA
    let centerLat = currentLocation?.lat;
    let centerLng = currentLocation?.lng;
    
    // If no user location, try to center on the first sighting
    if (!centerLat && markers.length > 0) {
      centerLat = markers[0].lat;
      centerLng = markers[0].lng;
    }
    
    // Final fallback to Irvine, CA if nothing else available
    centerLat = centerLat || 33.6846;
    centerLng = centerLng || -117.8265;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Coyote Map</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { height: 100%; overflow: hidden; }
        #map { 
            width: 100%; 
            height: 100vh; 
            background-color: #f0f0f0;
        }
        .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            color: #666;
            font-size: 18px;
            z-index: 1000;
        }
        .error {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            color: #e74c3c;
            font-size: 16px;
            z-index: 1000;
            padding: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        /* Replace default sprite with a single custom X inside a light gray circle */
        .gm-style-iw-c button.gm-ui-hover-effect {
            opacity: 1 !important;
            visibility: visible !important;
            width: 28px !important;
            height: 28px !important;
            border-radius: 50% !important;
            background-color: #e0e0e0 !important;
            background-image: none !important; /* disable Google sprite to avoid duplicates */
            border: none !important;
            box-shadow: none !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            position: absolute !important;
            top: 8px !important;
            right: 14px !important;
            cursor: pointer !important;
        }
        /* Hide any default child elements Google injects (tiny X sprites) */
        .gm-style-iw-c button.gm-ui-hover-effect * { display: none !important; }
        .gm-style-iw-c button.gm-ui-hover-effect:hover {
            background-color: #d5d5d5 !important;
        }
        .gm-style-iw-c button.gm-ui-hover-effect::before {
            content: '×' !important;
            position: absolute !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            font-size: 24px !important;
            color: #555 !important;
            line-height: 1 !important;
        }
    </style>
</head>
<body>
    <div id="loading" class="loading">Loading Google Maps...</div>
    <div id="error" class="error" style="display: none;">
        <div>Failed to load Google Maps</div>
        <div style="font-size: 12px; margin-top: 8px;">Check your internet connection</div>
    </div>
    <div id="map"></div>

    <script>
        console.log('Starting map initialization...');
        
        let mapLoaded = false;
        let apiLoaded = false;

        // Set a timeout to show error if map doesn't load
        setTimeout(function() {
            if (!mapLoaded) {
                console.log('Map loading timeout');
                document.getElementById('loading').style.display = 'none';
                document.getElementById('error').style.display = 'block';
            }
        }, 15000);

        function initMap() {
            try {
                console.log('initMap called');
                apiLoaded = true;
                
                const mapOptions = {
                    zoom: 12,
                    center: { lat: ${centerLat}, lng: ${centerLng} },
                    mapTypeId: 'roadmap',
                    disableDefaultUI: false,
                    zoomControl: true,
                    mapTypeControl: true,
                    streetViewControl: true,
                    fullscreenControl: false
                };

                console.log('Creating map with center:', mapOptions.center);
                const map = new google.maps.Map(document.getElementById('map'), mapOptions);

                map.addListener('tilesloaded', function() {
                    console.log('Map tiles loaded successfully');
                    mapLoaded = true;
                    document.getElementById('loading').style.display = 'none';
                });

                map.addListener('idle', function() {
                    console.log('Map is ready');
                    mapLoaded = true;
                    document.getElementById('loading').style.display = 'none';
                });

                // Add user location marker if available
                ${currentLocation ? `
                console.log('Adding user location marker');
                const userMarker = new google.maps.Marker({
                    position: { lat: ${currentLocation.lat}, lng: ${currentLocation.lng} },
                    map: map,
                    title: 'Your Location',
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        fillColor: '#3498db',
                        fillOpacity: 1,
                        strokeColor: '#ffffff',
                        strokeWeight: 3,
                        scale: 10,
                        anchor: new google.maps.Point(0, 0)
                    },
                    zIndex: 1000
                });
                ` : 'console.log("No user location available");'}

                // Global variable to track currently open info window
                let currentOpenInfoWindow = null;

                function escapeHtml(s) {
                    if (s == null || s === '') return '';
                    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
                }

                // Add coyote sighting markers
                ${markers.map((marker, index) => `
                console.log('Adding coyote marker ${index + 1} with ${marker.count} sighting(s) at this location');
                const marker${index} = new google.maps.Marker({
                    position: { lat: ${marker.lat}, lng: ${marker.lng} },
                    map: map,
                    title: 'Coyote Sighting - ${marker.riskText}',
                    icon: {
                        path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z M -5,-30 A 5,5 0 1,1 5,-30 A 5,5 0 1,1 -5,-30',
                        fillColor: '${marker.color}',
                        fillOpacity: 0.9,
                        strokeColor: '#ffffff',
                        strokeWeight: 3,
                        scale: 1.2,
                        anchor: new google.maps.Point(0, 0)
                    }
                });

                // Store current sighting index for carousel
                let currentSightingIndex${index} = 0;
                const sightings${index} = ${JSON.stringify(marker.sightings)};
                let cachedLocation${index} = null;

                function needsGeocode${index}() {
                    return sightings${index}.some(function(s) { return !s.locationLabel || String(s.locationLabel).trim().length === 0; });
                }

                function updateInfoWindowContent${index}() {
                    const currentSighting = sightings${index}[currentSightingIndex${index}];
                    const showNavigation = sightings${index}.length > 1;
                    const coordinates = currentSighting.coordinates || '${marker.lat.toFixed(5)}, ${marker.lng.toFixed(5)}';
                    var locationLine = '';
                    var stored = currentSighting.locationLabel && String(currentSighting.locationLabel).trim();
                    if (stored) {
                        locationLine = '📍 <b>' + escapeHtml(stored) + '</b> (' + coordinates + ')';
                    } else if (cachedLocation${index}) {
                        locationLine = '📍 <b>' + escapeHtml(cachedLocation${index}) + '</b> (' + coordinates + ')';
                    } else if (needsGeocode${index}()) {
                        locationLine = '📍 Loading location...';
                    } else {
                        locationLine = '📍 <b>' + coordinates + '</b>';
                    }
                    
                    // Build media HTML if there are attachments
                    let mediaHtml = '';
                    if (currentSighting.hasMedia && currentSighting.mediaUrls && currentSighting.mediaUrls.length > 0) {
                        mediaHtml = '<div style="margin-top: 10px; border-top: 1px solid #eee; padding-top: 10px;">' +
                            '<p style="margin: 0 0 8px 0; font-weight: bold; color: #7f8c8d; font-size: 12px;">📷 Attachments:</p>' +
                            '<div style="display: flex; flex-wrap: wrap; gap: 6px;">';
                        currentSighting.mediaUrls.forEach(function(media, i) {
                            mediaHtml += '<img src="' + media.url + '" style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid #eee;" />';
                        });
                        mediaHtml += '</div></div>';
                    }
                    
                    return '<div style="padding: 12px; max-width: 320px;">' +
                        (showNavigation ? 
                            '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 8px;">' +
                                '<button onclick="previousSighting${index}()" style="background: #3498db; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 12px;">← Prev</button>' +
                                '<span style="font-size: 12px; color: #7f8c8d; font-weight: bold;">' + (currentSightingIndex${index} + 1) + ' of ' + sightings${index}.length + '</span>' +
                                '<button onclick="nextSighting${index}()" style="background: #3498db; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 12px;">Next →</button>' +
                            '</div>' : ''
                        ) +
                        '<h3 style="margin: 0 0 8px 0; color: ' + currentSighting.color + ';">🐺 Coyote Sighting</h3>' +
                        '<div style="margin: 8px 0; padding: 6px 10px; background-color: ' + currentSighting.color + '20; border-radius: 8px; border-left: 4px solid ' + currentSighting.color + ';">' +
                            '<p style="margin: 0; font-weight: bold; color: ' + currentSighting.color + '; font-size: 13px;">' + currentSighting.riskEmoji + ' ' + currentSighting.riskText + '</p>' +
                        '</div>' +
                        '<b style="margin: 5px 0; color: #7f8c8d; font-size: 12px;">⏰ ' + currentSighting.time + '</b>' +
                        '<p style="margin: 5px 0; color: #3498db; font-size: 12px;" id="location${index}_' + currentSightingIndex${index} + '">' +
                            locationLine +
                        '</p>' +
                        '<p style="margin: 8px 0; color: #34495e; font-size: 14px; line-height: 1.4;">📝 ' + currentSighting.description + '</p>' +
                        mediaHtml +
                        '</div>';
                }

                function performGeocoding${index}() {
                    if (cachedLocation${index}) return;
                    if (!needsGeocode${index}()) return;
                    
                    const geocoder = new google.maps.Geocoder();
                    const latlng = { lat: ${marker.lat}, lng: ${marker.lng} };
                    
                    geocoder.geocode({ location: latlng }, function(results, status) {
                        if (status === 'OK' && results[0]) {
                            let locationText = '';
                            const result = results[0];
                            
                            // Try to extract street intersections or nearby streets
                            const addressComponents = result.address_components;
                            let streetNumber = '';
                            let route = '';
                            
                            // Look for route (street name)
                            for (let component of addressComponents) {
                                if (component.types.includes('route')) {
                                    route = component.long_name;
                                    break;
                                }
                            }
                            
                            // Look for street number
                            for (let component of addressComponents) {
                                if (component.types.includes('street_number')) {
                                    streetNumber = component.long_name;
                                    break;
                                }
                            }
                            
                            // If we have a route, use it
                            if (route) {
                                if (streetNumber) {
                                    locationText = 'Near ' + streetNumber + ' ' + route;
                                } else {
                                    locationText = 'Near ' + route;
                                }
                            } else {
                                // Fallback to formatted address or neighborhood
                                const formattedAddress = result.formatted_address;
                                const parts = formattedAddress.split(',');
                                locationText = 'Near ' + (parts[0] || 'Unknown location');
                            }
                            
                            // Cache the location
                            cachedLocation${index} = locationText;
                            
                            // Update current info window if it's open
                            if (currentOpenInfoWindow === infoWindow${index}) {
                                infoWindow${index}.setContent(updateInfoWindowContent${index}());
                            }
                        } else {
                            // Fallback - use coordinates only
                            cachedLocation${index} = 'Location unavailable';
                            if (currentOpenInfoWindow === infoWindow${index}) {
                                infoWindow${index}.setContent(updateInfoWindowContent${index}());
                            }
                        }
                    });
                }

                const infoWindow${index} = new google.maps.InfoWindow({
                    content: updateInfoWindowContent${index}()
                });

                // Navigation functions for carousel
                window.previousSighting${index} = function() {
                    currentSightingIndex${index} = (currentSightingIndex${index} - 1 + sightings${index}.length) % sightings${index}.length;
                    infoWindow${index}.setContent(updateInfoWindowContent${index}());
                };

                window.nextSighting${index} = function() {
                    currentSightingIndex${index} = (currentSightingIndex${index} + 1) % sightings${index}.length;
                    infoWindow${index}.setContent(updateInfoWindowContent${index}());
                };

                marker${index}.addListener('click', function() {
                    console.log('Marker group ${index} clicked');
                    
                    // Close any currently open info window
                    if (currentOpenInfoWindow && currentOpenInfoWindow !== infoWindow${index}) {
                        currentOpenInfoWindow.close();
                    }
                    
                    currentSightingIndex${index} = 0; // Reset to first sighting
                    infoWindow${index}.setContent(updateInfoWindowContent${index}());
                    infoWindow${index}.open(map, marker${index});
                    currentOpenInfoWindow = infoWindow${index};
                    
                    map.setZoom(16);
                    map.panTo({ lat: ${marker.lat}, lng: ${marker.lng} });
                    
                    if (needsGeocode${index}()) performGeocoding${index}();
                });

                // Close event listener to clear current window reference
                infoWindow${index}.addListener('closeclick', function() {
                    if (currentOpenInfoWindow === infoWindow${index}) {
                        currentOpenInfoWindow = null;
                    }
                });
                `).join('')}

                console.log('Map setup complete with ${markers.length} markers');

                // Auto-open marker if focusSightingId is provided
                ${focusSightingId ? `
                setTimeout(function() {
                    console.log('Auto-opening marker for sighting:', '${focusSightingId}');
                    let openedMarker = false;
                    ${markers.map((marker, index) => `
                    // Check if this marker group contains the focused sighting
                    if (!openedMarker) {
                        const containsFocusedSighting = sightings${index}.some(s => s.originalSighting.id === '${focusSightingId}');
                        if (containsFocusedSighting) {
                            console.log('Found focused sighting in marker group ${index}');
                            // Find the index of the focused sighting in this group
                            const focusedIndex = sightings${index}.findIndex(s => s.originalSighting.id === '${focusSightingId}');
                            if (focusedIndex !== -1) {
                                currentSightingIndex${index} = focusedIndex;
                            }
                            currentSightingIndex${index} = 0; // Reset to first sighting
                            infoWindow${index}.setContent(updateInfoWindowContent${index}());
                            infoWindow${index}.open(map, marker${index});
                            currentOpenInfoWindow = infoWindow${index};
                            map.setZoom(16);
                            map.panTo({ lat: ${marker.lat}, lng: ${marker.lng} });
                            if (needsGeocode${index}()) performGeocoding${index}();
                            openedMarker = true;
                        }
                    }
                    `).join('')}
                    if (!openedMarker) {
                        console.log('Could not find marker for focused sighting:', '${focusSightingId}');
                    }
                }, 1000); // Wait 1 second for map to fully load
                ` : ''}

            } catch (error) {
                console.error('Error initializing map:', error);
                document.getElementById('loading').style.display = 'none';
                document.getElementById('error').style.display = 'block';
            }
        }

        // Check if Google Maps API is available
        function checkGoogleMaps() {
            if (typeof google !== 'undefined' && google.maps) {
                console.log('Google Maps API is available');
                initMap();
            } else {
                console.log('Google Maps API not yet available, retrying...');
                setTimeout(checkGoogleMaps, 500);
            }
        }

        // Start checking for Google Maps API
        checkGoogleMaps();
    </script>
    
    <script>
        // Fallback for API loading errors
        window.gm_authFailure = function() {
            console.error('Google Maps API authentication failed');
            document.getElementById('loading').style.display = 'none';
            document.getElementById('error').innerHTML = '<div>Google Maps API Key Error</div><div style="font-size: 12px; margin-top: 8px;">Please check your API key configuration</div>';
            document.getElementById('error').style.display = 'block';
        };
    </script>
    <script async defer 
        src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap"
        onerror="console.error('Failed to load Google Maps API'); document.getElementById('loading').style.display = 'none'; document.getElementById('error').innerHTML = '<div>Network Error</div><div style=\'font-size: 12px; margin-top: 8px;\'>Cannot load Google Maps API</div>'; document.getElementById('error').style.display = 'block';">
    </script>
</body>
</html>`;
    
    console.log('Map HTML generated, length:', html.length);
    setMapHtml(html);
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to show your location.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const newUserLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setUserLocation(newUserLocation);
      console.log('User location set:', newUserLocation);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Location Error', 'Unable to get your current location.');
    }
  };

  const handleReportSighting = () => {
    if (!auth.currentUser) {
      Alert.alert('Login Required', 'Please log in to report a coyote sighting.');
      return;
    }
    navigation.navigate('ReportSighting', { userLocation: currentLocation });
  };

  const formatTime = (timestamp) => {
    if (!timestamp?.toDate) return 'Unknown time';
    const date = timestamp.toDate();
    
    // Format as: "Dec 15, 2024 at 3:45 PM"
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }) + ' at ' + date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const renderSightingItem = ({ item }) => {
    return (
      <CozyCard variant="default" padding="medium" style={styles.sightingCard}>
        <View style={styles.sightingHeader}>
          <Text style={styles.timeDistanceText}>
            <Text style={styles.timeTextBold}>{formatTimeAgo(item.timestamp)}</Text>
            <Text style={styles.distanceTextNormal}> • {formatDistance(item.distance)}</Text>
          </Text>
        </View>
        
        <Text style={styles.locationText}>📍 {item.location || 'Location not specified'}</Text>
        
        {item.description && (
          <Text style={styles.descriptionText} numberOfLines={3}>
            {item.description}
          </Text>
        )}
      </CozyCard>
    );
  };

  const renderListView = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📍 Nearby Coyote Sightings</Text>
        <Text style={styles.headerSubtitle}>
          Nearby sightings within {maxDistance} mile{maxDistance !== 1 ? 's' : ''}
        </Text>
        
        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowDistanceFilter(true)}
          >
            <Text style={styles.filterButtonText}>📏 Filter Distance</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={nearbySightings}
        renderItem={renderSightingItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <CozyCard variant="gentle" padding="large" style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>🔍 No Nearby Sightings</Text>
            <Text style={styles.emptyText}>
              No coyote sightings found within {maxDistance} mile{maxDistance !== 1 ? 's' : ''} of your current location.
            </Text>
          </CozyCard>
        }
      />

      <View style={styles.learnMoreContainer}>
        <CozyButton
          title="🗺️ View Full Map"
          onPress={() => setShowMap(true)}
          variant="primary"
          size="large"
          style={styles.learnMoreButton}
        />
      </View>
    </SafeAreaView>
  );

  const renderDistanceFilterModal = () => {
    const distanceOptions = [0.5, 1, 2, 5, 10, 25, 50];
    
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
            
            <CozyButton
              title="Cancel"
              variant="secondary"
              onPress={() => setShowDistanceFilter(false)}
              style={styles.modalCancelButton}
            />
          </CozyCard>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading coyote sightings...</Text>
      </View>
    );
  }

  // Show list view if user has current location and hasn't chosen to view map
  if (currentLocation && !showMap) {
    return (
      <>
        {renderListView()}
        {renderDistanceFilterModal()}
      </>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={sharedStyles.header}>
        <TouchableOpacity
          style={sharedStyles.backButton}
          onPress={() => {
            // If navigated from NearbySightings, go back to it
            // Otherwise go back to previous screen (or Home if no previous screen)
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Home');
            }
          }}
        >
          <Ionicons name="chevron-back" size={32} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={sharedStyles.headerTitleContainer}>
          <Image 
            source={require('../../assets/coyote activity map banner.png')} 
            style={sharedStyles.headerIcon}
            resizeMode="contain"
          />
          <Text style={sharedStyles.headerTitle}>Coyote Activity Map</Text>
        </View>
        <View style={sharedStyles.placeholder} />
      </View>

      <Text style={styles.reminderText}>Tap a marker to see details</Text>

      {/* Embedded Google Maps */}
      <View style={styles.mapContainer}>
        {mapHtml ? (
          <WebView
            source={{ html: mapHtml }}
            style={styles.map}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={false}
            scalesPageToFit={false}
            bounces={false}
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('WebView error:', nativeEvent);
              setMapLoading(false);
            }}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('WebView HTTP error:', nativeEvent);
              setMapLoading(false);
            }}
            onLoadEnd={() => {
              console.log('WebView loaded successfully');
              setMapLoading(false);
            }}
            onMessage={(event) => {
              console.log('WebView message:', event.nativeEvent.data);
            }}
            onLoadStart={() => {
              console.log('WebView starting to load...');
              setMapLoading(true);
            }}
            onLoadProgress={() => {
              console.log('WebView loading progress...');
            }}
            renderLoading={() => (
              <View style={styles.webviewLoading}>
                <ActivityIndicator size="large" color="#3498db" />
                <Text style={styles.webviewLoadingText}>Loading map...</Text>
              </View>
            )}
            renderError={(errorDomain, errorCode, errorDesc) => (
              <View style={styles.webviewError}>
                <Text style={styles.webviewErrorText}>Failed to load map</Text>
                <Text style={styles.webviewErrorSubtext}>{errorDesc}</Text>
                <TouchableOpacity 
                  style={styles.retryButton} 
                  onPress={() => {
                    setMapLoading(true);
                    generateMapHTML(sightings);
                  }}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        ) : (
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderText}>Loading map...</Text>
          </View>
        )}
      </View>
{/*
      <TouchableOpacity style={styles.reportButton} onPress={handleReportSighting}>
        <Text style={styles.reportButtonText}>🐺 Report Sighting</Text>
      </TouchableOpacity>
      */}
      {renderDistanceFilterModal()}
    </SafeAreaView>
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
  reminderText: {
    fontWeight: 600,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
    fontStyle: 'italic',
    color: cozyTheme.colors.textSecondary,
    fontFamily: cozyTheme.typography.secondary,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 56,
    height: 40,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  mapPlaceholderText: {
    fontSize: 18,
    color: '#555',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
  },
  reportButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#e74c3c',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  reportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  webviewLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  webviewLoadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
  },
  webviewError: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 20,
  },
  webviewErrorText: {
    fontSize: 18,
    color: '#e74c3c',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  webviewErrorSubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 8,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // List View Styles
  listContainer: {
    padding: 16,
    paddingBottom: 120, // Space for learn more button and navbar
  },
  sightingCard: {
    marginBottom: 16,
  },
  sightingHeader: {
    marginBottom: 8,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: cozyTheme.colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#000',
  },
  riskEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  riskText: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: cozyTheme.typography.primary,
  },
  timeDistanceText: {
    fontSize: 14,
    fontFamily: cozyTheme.typography.secondary,
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
    marginBottom: 8,
    fontFamily: cozyTheme.typography.secondary,
  },
  healthText: {
    fontSize: 14,
    color: cozyTheme.colors.textPrimary,
    fontWeight: '500',
    fontFamily: cozyTheme.typography.secondary,
  },
  emptyCard: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: cozyTheme.colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: cozyTheme.typography.primary,
  },
  emptyText: {
    fontSize: 16,
    color: cozyTheme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: cozyTheme.typography.secondary,
  },
  learnMoreContainer: {
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
  learnMoreButton: {
    marginBottom: 0,
  },
  filterContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  filterButton: {
    backgroundColor: cozyTheme.colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#000',
  },
  filterButtonText: {
    color: cozyTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: cozyTheme.typography.primary,
  },
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
    borderWidth: 2,
    borderColor: cozyTheme.colors.textLight,
    minWidth: 80,
    alignItems: 'center',
  },
  distanceOptionSelected: {
    backgroundColor: cozyTheme.colors.primary,
    borderColor: '#000',
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
  modalCancelButton: {
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: cozyTheme.colors.background,
  },

});
