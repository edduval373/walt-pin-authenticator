# Test Your App on Phone - No Terminal Needed

## What You Do ON YOUR COMPUTER (Not Phone)

1. **On your computer**, open terminal/command prompt
2. **On your computer**, navigate to mobile-app folder:
   ```bash
   cd mobile-app
   ```
3. **On your computer**, run:
   ```bash
   node start-mobile-test.js
   ```

This creates a QR code ON YOUR COMPUTER SCREEN.

## What You Do ON YOUR PHONE

1. Download "Expo Go" app from App Store or Google Play
2. Open Expo Go app
3. Point your phone camera at the QR code on your computer screen
4. Tap the notification that appears
5. Your Disney Pin Authenticator app loads on your phone

## No Terminal on Phone Required

Your phone only needs:
- Expo Go app (free download)
- Same WiFi network as your computer
- Camera to scan QR code

The terminal/command prompt runs on your computer, not your phone. Your phone just scans the QR code and runs the app.

## Alternative if QR Code Doesn't Work

If scanning doesn't work, you can:
1. In Expo Go app, tap "Enter URL manually"
2. Type the URL that appears in your computer terminal
3. Usually looks like: `exp://192.168.1.xxx:19000`

Your phone becomes a testing device - no technical setup required on the phone itself.