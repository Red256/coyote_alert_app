// Copy this file to env.js and fill in your real values.
// env.js is gitignored and must never be committed.

export const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_WEB_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// From https://console.cloud.google.com/apis/credentials
// Restrict this key (by Android package + SHA-1, iOS bundle ID, and HTTP referrer)
// before shipping — see googleMapsConfig.js for details.
export const GOOGLE_MAPS_API_KEY = "YOUR_GOOGLE_MAPS_API_KEY";

// From https://platform.openai.com/api-keys - use a project key with a spending limit.
export const OPENAI_API_KEY = "YOUR_OPENAI_API_KEY";

// Where "Contact admin" messages from the Profile screen are sent.
export const ADMIN_CONTACT_EMAIL = "YOUR_ADMIN_EMAIL";
