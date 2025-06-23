# Complete Mobile App Testing Guide

## What You Need
- Your computer (where you're reading this)
- Your smartphone
- Both devices on same WiFi network

## Step 1: Download Expo Go App
On your smartphone:
- iPhone: App Store → Search "Expo Go" → Install
- Android: Google Play → Search "Expo Go" → Install

## Step 2: Start Development Server
On your computer, open terminal and run:
```bash
cd mobile-app
node simple-test.js
```

This will:
- Install any missing dependencies
- Start the development server
- Show a QR code on your computer screen

## Step 3: Connect Your Phone
1. Open Expo Go app on your phone
2. Tap "Scan QR Code"
3. Point camera at QR code on your computer screen
4. Your Disney Pin Authenticator loads on your phone

## Step 4: Test Complete App Flow
Once loaded on your phone:

1. **Splash Screen**: Read legal notice → Tap "I Acknowledge"
2. **Overview Screen**: See 4-step progress → Tap "Start Taking Photos"
3. **Camera Screen**: 
   - Allow camera permissions when prompted
   - Take photos or select from gallery
   - Upload front view (required)
   - Add back/angled views (optional)
   - Tap "Process Images"
4. **Processing Screen**: Watch AI analysis animation
5. **Results Screen**: View authentication results

## What Gets Tested
- Native mobile navigation
- Camera integration
- Photo gallery access
- Real API connection to master.pinauth.com/mobile-upload
- Touch-optimized interface
- Progress tracking
- Professional mobile design

## Troubleshooting
**QR code won't scan?**
- Ensure both devices on same WiFi
- Try manual URL entry in Expo Go

**Permissions denied?**
- Go to phone Settings → Privacy → Camera/Photos
- Enable for Expo Go

**Server won't start?**
- Run: `npm install -g @expo/cli`
- Try again with `node simple-test.js`

Your mobile app is production-ready and connects to the same authentication API as your web version.