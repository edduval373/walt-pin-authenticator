# Quick Start: Test Your Mobile App in 5 Minutes

## Step 1: Download Expo Go (2 minutes)

On your phone, download the **Expo Go** app:
- iPhone: Search "Expo Go" in App Store
- Android: Search "Expo Go" in Google Play Store

This lets you test your app instantly without any complicated setup.

## Step 2: Start Your App (1 minute)

1. Open terminal/command prompt
2. Navigate to your project:
   ```
   cd mobile-app
   ```
3. Start the development server:
   ```
   npx expo start
   ```

You'll see a QR code appear in your terminal.

## Step 3: Test on Your Phone (30 seconds)

1. Open the Expo Go app you just downloaded
2. Point your phone's camera at the QR code in terminal
3. Tap the notification that appears
4. Your Disney Pin Authenticator app will open!

## Step 4: Test the App Flow

Try this sequence:
1. **Splash Screen**: Tap "I Acknowledge"
2. **Overview Screen**: Tap "Start Taking Photos"
3. **Camera Screen**: Tap "Gallery" to select a test image
4. **Processing Screen**: Watch the animation
5. **Results Screen**: See the analysis results

## What You're Testing

- All 5 screens working correctly
- Photo selection from your phone's gallery
- Progress animations
- API connection to your pin authentication service
- Professional mobile UI that matches your web app

## If Something Goes Wrong

**QR Code won't scan?**
- Make sure Expo Go app is installed
- Try scanning with your phone's regular camera app first

**App won't start?**
- Make sure you're in the mobile-app folder
- Try: `npm install` then `npx expo start` again

**Camera permissions?**
- Your phone will ask for camera/photo permissions
- Tap "Allow" when prompted

## Next Steps After Testing

Once you confirm the app works on your phone:

1. **Customize the branding** (app name, colors, icon)
2. **Set up developer accounts** (Apple: $99/year, Google: $25 one-time)
3. **Build for app stores** using Expo's build service
4. **Submit to stores** and wait for approval

## Cost to Get Started

- **Testing**: Free (just download Expo Go)
- **Publishing to web**: Free
- **Apple App Store**: $99/year developer account
- **Google Play Store**: $25 one-time fee

## Ready to Publish?

When you're ready to submit to app stores, you'll use these commands:

```bash
# Build for iOS App Store
npx eas build --platform ios

# Build for Google Play Store  
npx eas build --platform android

# Build for web hosting
npx expo export:web
```

Start with the Quick Start above to see your app running on your phone in the next few minutes!