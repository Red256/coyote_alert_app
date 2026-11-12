const { GOOGLE_MAPS_API_KEY } = require('./env');

module.exports = {
  expo: {
    name: "Coyote Alert",
    slug: "coyote",
    version: "1.0.2",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "coyote",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.coyotealert.app",
      config: {
        googleMapsApiKey: GOOGLE_MAPS_API_KEY
      },
      infoPlist: {
        NSMicrophoneUsageDescription: "This app uses the microphone for voice assistant feature to help you interact with the coyote tracking system.",
        NSSpeechRecognitionUsageDescription: "This app uses speech recognition for the voice assistant feature.",
        NSCameraUsageDescription: "This app uses the camera to capture photos for animal identification.",
        NSLocationWhenInUseUsageDescription: "This app uses location services to show nearby coyote sightings and report your location."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      package: "com.coyotealert.app",
      googleServicesFile: "./google-services.json",
      config: {
        googleMaps: {
          apiKey: GOOGLE_MAPS_API_KEY
        }
      },
      permissions: [
        "RECORD_AUDIO",
        "INTERNET",
        "ACCESS_NETWORK_STATE",
        "CAMERA",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ]
    },
    web: {
      bundler: "metro",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      [
                "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff"
        }
      ],
      "expo-asset",
      "expo-font",
      [
                "expo-image-picker",
        {
          photosPermission: "Allow Coyote Alert to access your photos for animal identification.",
          cameraPermission: "Allow Coyote Alert to access your camera for animal identification."
        }
      ],
      [
                "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Allow Coyote Alert to access your location to show nearby coyote sightings."
        }
      ],
      "expo-mail-composer",
      "@react-native-community/datetimepicker",
      [
        "expo-audio",
        {
          microphonePermission: "Allow Coyote Alert to access your microphone for voice assistant features."
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "ff0d12db-dd55-4586-937c-64de0c5da1e"
      }
    }
  }
};
