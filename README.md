# Welcome to the Moonrise Project

Moonrise is a React Native meditation app built with Expo, focused on guided meditation journeys that incorporate moon phase tracking and lunar hemisphere awareness.

- **Bundle ID**: `com.kravenworks.moonrise`
- **Current Version**: 1.0.5
- **Platform**: iOS

## Tech Stack

- **Expo** ~53.0.23 (managed React Native)
- **React** 19.0.0 / **React Native** 0.79.5
- **TypeScript** ~5.8.3 (strict mode)
- **Expo Router** ~5.1.7 (file-based routing)
- **Moti** + **Reanimated** (animations)
- **Supabase** (newsletter subscriptions)
- **Firebase** (audio & image storage)
- **Google Sheets API** (announcements CMS)

## Getting Started

### 1. Environment Variables

You will need a `.env` file in the project root with the following variables. Get these from the project owner or your team lead:

```
# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=

# Supabase
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=

# Google Sheets (Announcements CMS)
EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY=
EXPO_PUBLIC_GOOGLE_SHEETS_SHEET_ID=
EXPO_PUBLIC_GOOGLE_SHEETS_RANGE=

# App
EXPO_PUBLIC_APP_STORE_URL=
EXPO_PUBLIC_ENVIRONMENT=
```

**The app will not function without these environment variables.**

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the App

```bash
npx expo start
```

From there you can open the app in a:
- [Development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go)

### 4. Platform Builds

```bash
npm run ios       # iOS
npm run lint      # ESLint
```

## Project Structure

```
app/                    # File-based routes (Expo Router)
  _layout.tsx           # Root layout (ThemeProvider, SafeAreaProvider)
  index.tsx             # Entry redirect (checks if intro video was seen)
  video-intro.tsx       # Onboarding video
  home.tsx              # Main meditation screen
  intention.tsx         # Intention setting screen
  chatboard.tsx         # Announcements board
  menu.tsx              # Settings & info

components/             # Reusable components
  Moon.tsx              # Moon phase visualization with hemisphere support
  CompletionModal.tsx   # Post-meditation modal
  NotificationManager.tsx
  SubscribeModal.tsx    # Newsletter subscription

hooks/                  # Custom hooks
  useCrossfadeAudio.ts  # Audio playback with crossfade transitions
  useMoonLocation.tsx   # Moon phase & hemisphere context

lib/                    # External service clients
  supabase.ts           # Supabase client & newsletter service
  firebase.ts           # Firebase storage init
  googleSheetService.ts # Google Sheets announcements fetcher

utils/
  notifications.ts      # Notification scheduling & permissions

constants/
  Colors.ts             # Theme colors (light/dark)
```

## Key Architecture Details

### Audio System
- 5 audio versions: guided, birth, life, death, full (hosted on Firebase Storage)
- Crossfade transitions between versions with configurable duration (1000ms default)
- Uses a global singleton pattern (`global.__globalIntentionSound`) -- be careful with multiple audio instances
- Position tracking for guided/full pair synchronization

### Moon Phase Tracking
- Calculates moon phase from a reference date (Sept 3, 2024 new moon)
- This reference date must stay consistent across `Moon.tsx` and `useMoonLocation.tsx`
- Supports North/South hemisphere visualization toggle
- 8 phases: new, waxing-crescent, first-quarter, waxing-gibbous, full, waning-gibbous, last-quarter, waning-crescent

### Data Services
| Service | Purpose | Config File |
|---------|---------|-------------|
| Supabase (PostgreSQL) | Newsletter subscribers | `lib/supabase.ts` |
| Firebase Storage | Audio files & images | `lib/firebase.ts` |
| Google Sheets | Announcements CMS (5-min cache) | `lib/googleSheetService.ts` |
| AsyncStorage | Local app state (video seen, prefs) | used throughout |

### Notifications
- 7 rotating daily reminder messages (one per weekday)
- Currently scheduled for 1:00 PM (comment in code notes it should be 7:00 PM)

### Fonts
- Spectral (Bold, Regular)
- Lora (Regular)
- Cormorant Garamond (Bold)

## EAS Build & Submit

This project uses [Expo Application Services (EAS)](https://docs.expo.dev/eas/) for building and submitting to the App Store. Configuration lives in `eas.json` with profiles for development, preview, and production.

### Building for Production

```bash
eas build --platform ios --profile production
```

This creates a production `.ipa` build in the cloud. EAS handles code signing and provisioning profiles automatically.

### Submitting to Apple

After a successful build, submit it to App Store Connect for review:

```bash
eas submit --platform ios
```

You can also combine both steps:

```bash
eas build --platform ios --profile production --auto-submit
```

You'll need an Apple Developer account and an App Store Connect API key configured with EAS. See the [EAS Submit docs](https://docs.expo.dev/submit/ios/) for setup.

## Notes
- There is no authentication system -- newsletter is anonymous, location is optional
- Audio URLs are hardcoded Firebase Storage URLs (no dynamic upload system)
- The `ios/` directory is generated by Expo prebuild and is in `.gitignore`
- Content filtering uses the `bad-words` library on the chatboard
