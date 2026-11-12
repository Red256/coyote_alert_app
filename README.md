# Coyote Alert

A community app for reporting and tracking coyote sightings. Built with Expo / React Native and Firebase.

Get it on Google Play: https://play.google.com/store/apps/details?id=com.coyotealert.app
Link to demo video: https://youtu.be/-5YTVguN8ew

## Features

- Report a sighting with a location and photo
- Activity map and nearby sightings
- Analysis reports
- Chat with Koko, an AI safety assistant
- Safety Q&A and a knowledge quiz

## Setup

1. `npm install`
2. Copy `env.example.js` to `env.js` and fill in your own Firebase, Google Maps and OpenAI keys.
3. Copy `google-services.json.example` to `google-services.json` and replace it with the file from your Firebase project.
4. For Android release builds, copy `android/keystore.properties.example` and `android/secrets.properties.example` and fill them in.
5. `npx expo start`

No real keys, keystores or service-account files are in this repository.

The in-app presentation slides (`assets/presentation/`) are third-party material and are not included, so the presentation screen needs your own images there.

## Pages

`index.html` (data deletion request) and `privacy-policy.html` are served with GitHub Pages for the Play Store listing.
