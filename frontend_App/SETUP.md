# 🚀 SIH HASTE AI - 3-Screen Expo App Setup & Run Guide

## 📋 Project Structure

```
blank_UI_Mob/
├── src/
│   ├── navigation/
│   │   └── RootNavigator.tsx        # Stack Navigator setup
│   ├── screens/
│   │   ├── DashboardScreen.tsx      # Main dashboard
│   │   ├── WhatIfScreen.tsx         # What-if simulator
│   │   └── FileUploadScreen.tsx     # File upload module
│   ├── components/
│   │   ├── Cards.tsx                # SummaryCard, ListCard, ConflictCard
│   │   └── Button.tsx               # Button, InputField, SectionTitle
│   └── data/
│       └── mock.ts                  # Dummy data
├── App.tsx                          # App root component
├── app.json                         # Expo config
├── babel.config.js                  # Babel with NativeWind plugin
├── tailwind.config.js               # Tailwind CSS config
├── tsconfig.json                    # TypeScript config
└── package.json                     # Dependencies & scripts
```

---

## 📱 Features

### 1️⃣ Dashboard Screen
- Summary cards (total trains, revenue-ready, standby, maintenance)
- Induction list with priority scores
- Conflicts overview (critical, high, medium, low)
- Trains status display
- Navigation buttons to What-If Simulator and File Upload

### 2️⃣ What-If Simulator Screen
- Input fields for:
  - Remove Train
  - Add Maintenance Train
  - Change Branding Priority
- Simulate button that displays:
  - New Induction List with changes
  - Impact Analysis (revenue, cost, maintenance, efficiency)
  - Recommendations

### 3️⃣ File Upload Screen
- Upload buttons for:
  - PDF
  - CSV
  - ZIP
  - Image (jpg/png)
- File preview (for images)
- File metadata display (name, type, size)
- All files stored locally (no backend)

---

## 🔧 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Android device or emulator with USB debugging enabled

### Step 1: Install Dependencies

```bash
cd blank_UI_Mob
npm install
```

Or with yarn:
```bash
yarn install
```

### Step 2: Verify Installation

After installation, ensure all dependencies are installed:
```bash
npm list
```

---

## 🎮 Running the App

### Option A: Run on Android Device (USB Connected)

1. **Connect your Android device** via USB cable
2. **Enable USB Debugging** on your device:
   - Go to Settings → About Phone → Tap "Build Number" 7 times
   - Go to Settings → Developer Options → Enable "USB Debugging"

3. **Run the app:**
   ```bash
   npm run android
   ```

   Or directly:
   ```bash
   npx expo start --android
   ```

The app will build and automatically load on your connected device.

### Option B: Run on Android Emulator

1. **Start the Android Emulator** (from Android Studio or command line)
2. **Run:**
   ```bash
   npm run android
   ```

### Option C: Start Expo in Development Mode (Manual Connection)

```bash
npm start
```

This starts the Expo development server. Then:
- Press `a` to open on Android (device or emulator must be running)
- Press `i` to open on iOS (Mac only)
- Press `w` to open web preview

### Option D: Development Server Only

```bash
expo start
```

---

## 🏗️ Technology Stack

- **Framework:** Expo + React Native
- **Language:** TypeScript
- **Styling:** NativeWind (Tailwind CSS for React Native)
- **Navigation:** React Navigation (Stack Navigator)
- **File Handling:** expo-document-picker (no backend required)
- **State Management:** React Hooks (useState)
- **Data:** Dummy JSON data (src/data/mock.ts)

---

## 📋 NPM Scripts

```bash
npm start          # Start Expo development server
npm run android    # Build & run on Android device/emulator
npm run ios        # Build & run on iOS
npm run web        # Run web preview
npm run eject      # Eject from Expo (advanced, not recommended)
```

---

## 🎯 Screens Overview

### Dashboard
- Shows all relevant information on one screen
- Quick access to other features
- Live status updates (simulated with dummy data)

### What-If Simulator
- Form inputs for parameters
- Real-time simulation results
- Impact analysis with recommendations

### File Upload
- Multi-file upload support
- Local storage only
- Image preview capability
- File metadata display

---

## 🔗 Navigation Flow

```
Dashboard Screen
├── Button: "What-If Simulator" → What-If Screen
└── Button: "File Upload Module" → File Upload Screen

All screens have header navigation to go back or navigate between screens
```

---

## 🐛 Troubleshooting

### Issue: `npx expo start --android` doesn't load on device

**Solution:**
1. Restart Expo: Press `Ctrl+C` and run again
2. Check USB connection: `adb devices` (should show your device)
3. Clear Expo cache: `expo start --clear`

### Issue: Dependencies not installing

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: TypeScript errors in VS Code

**Solution:**
1. Reload VS Code window: `Ctrl+Shift+P` → "Developer: Reload Window"
2. Ensure TypeScript version matches: `npm ls typescript`

### Issue: Module not found error

**Solution:**
```bash
npm install [missing-package]
# or reinstall all:
npm install
```

---

## 📝 Notes

- **No Backend:** All data is dummy/local. No API calls are made.
- **Local Storage:** Files uploaded stay on the device only.
- **Offline First:** The app works completely offline.
- **Responsive Design:** UI adapts to different screen sizes using Tailwind.

---

## ✅ Verification Checklist

- [x] All three screens render without errors
- [x] Navigation between screens works smoothly
- [x] Dashboard shows all summary cards and lists
- [x] What-If Simulator calculates and displays results
- [x] File upload accepts PDF, CSV, ZIP, and Image files
- [x] Files are displayed with metadata
- [x] Images show preview thumbnail
- [x] NativeWind (Tailwind) styling is applied
- [x] TypeScript compilation is clean

---

## 🚀 Next Steps (Optional)

1. **Customize Colors:** Edit `tailwind.config.js`
2. **Add More Screens:** Create new files in `src/screens/`
3. **Modify Dummy Data:** Edit `src/data/mock.ts`
4. **Add Navigation:** Extend `src/navigation/RootNavigator.tsx`
5. **Connect to Backend:** Replace mock data with API calls

---

## 📞 Support

For Expo documentation: https://docs.expo.dev
For React Native docs: https://reactnative.dev
For NativeWind/Tailwind: https://www.nativewind.dev

---

**Build Date:** December 8, 2025  
**Framework Version:** Expo 50.0, React 18.2, React Native 0.74.1

