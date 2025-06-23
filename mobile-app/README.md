# Disney Pin Authenticator Mobile App

A cross-platform mobile application built with Expo that authenticates Disney pins using AI image recognition.

## Features

- **Cross-Platform**: Runs on iOS, Android, and Web
- **Camera Integration**: Take photos or select from gallery
- **AI Authentication**: Submit images to master.pinauth.com/mobile-upload
- **Progress Tracking**: Visual progress through authentication flow
- **Professional UI**: Clean, user-friendly interface matching web app

## Installation

1. Install dependencies:
```bash
cd mobile-app
npm install
```

2. Install Expo CLI (if not already installed):
```bash
npm install -g @expo/cli
```

## Development

### Start Development Server
```bash
npm start
```

### Platform-Specific Commands
```bash
# iOS Simulator
npm run ios

# Android Emulator
npm run android

# Web Browser
npm run web
```

## Building for Production

### iOS App Store
```bash
expo build:ios
```

### Android Play Store
```bash
expo build:android
```

### Web Deployment
```bash
expo build:web
```

## Project Structure

```
mobile-app/
├── App.js                 # Main app entry point
├── app.json              # Expo configuration
├── babel.config.js       # Babel configuration
├── package.json          # Dependencies and scripts
├── assets/               # Images and icons
├── src/
│   ├── components/       # Reusable components
│   │   └── ProgressSteps.js
│   ├── screens/          # App screens
│   │   ├── SplashScreen.js
│   │   ├── OverviewScreen.js
│   │   ├── CameraScreen.js
│   │   ├── ProcessingScreen.js
│   │   └── ResultsScreen.js
│   └── services/         # API and utility services
│       └── apiService.js
```

## Key Features

### Screen Flow
1. **Splash Screen**: Legal notice and acknowledgment
2. **Overview Screen**: Instructions and start button
3. **Camera Screen**: Photo capture for front/back/angled views
4. **Processing Screen**: AI analysis with progress indicator
5. **Results Screen**: Authentication results display

### API Integration
- Submits images to `master.pinauth.com/mobile-upload`
- Uses API key: `pim_0w3nfrt5ahgc`
- Supports multiple image formats
- Handles front (required), back, and angled views

### Permissions
- Camera access for photo capture
- Photo library access for image selection
- Network access for API calls

## Configuration

### App Information
- **Name**: Disney Pin Authenticator
- **Bundle ID**: com.walt.disneypinauthenticator
- **Version**: 1.0.0

### Supported Platforms
- iOS 11.0+
- Android API 21+
- Modern web browsers

## Deployment

### iOS Deployment
1. Set up Apple Developer account
2. Configure signing certificates
3. Build and submit to App Store

### Android Deployment
1. Generate signed APK
2. Upload to Google Play Console
3. Configure store listing

### Web Deployment
1. Build web version with `expo build:web`
2. Deploy to hosting service (Netlify, Vercel, etc.)
3. Configure domain and SSL

## Testing

### Device Testing
- Use Expo Go app for quick testing
- Test on multiple device sizes
- Verify camera functionality

### Platform Testing
- iOS Simulator
- Android Emulator
- Web browsers (Chrome, Safari, Firefox)

## Troubleshooting

### Common Issues
- **Camera not working**: Check device permissions
- **API errors**: Verify network connection and API key
- **Build failures**: Update Expo CLI and dependencies

### Debug Commands
```bash
# Clear cache
expo start --clear

# Reset Metro bundler
expo start --reset-cache

# Check for issues
expo doctor
```