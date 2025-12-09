# 🐛 Android App - Pixel 8 Troubleshooting Guide

## Problem: App Unable to Run on Android Studio with Pixel 8

### 🔍 Diagnosis Steps

---

## ✅ Solution 1: Basic Setup Check

### Step 1: Verify Android SDK is Properly Installed
```powershell
# Check Android SDK path
$env:ANDROID_HOME
# Should return: C:\Users\YourUsername\AppData\Local\Android\Sdk
# Or wherever your Android SDK is installed
```

If empty, add it:
```powershell
$env:ANDROID_HOME = "C:\Users\YourUsername\AppData\Local\Android\Sdk"
[Environment]::SetEnvironmentVariable("ANDROID_HOME", $env:ANDROID_HOME, "User")
```

### Step 2: Verify Gradle Wrapper
```powershell
cd "frontend_app\android"
# On Windows
gradlew.bat --version
# On macOS/Linux
./gradlew --version
```

---

## ✅ Solution 2: Clean Build & Cache

### Step 1: Clear Everything
```powershell
cd "frontend_app"

# Clear npm cache
npm cache clean --force

# Remove node_modules
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json

# Clear Gradle cache
cd android
gradlew.bat clean
cd ..

# Clear Expo cache
Remove-Item -Recurse -Force .expo
```

### Step 2: Reinstall Dependencies
```powershell
cd "frontend_app"
npm install
```

---

## ✅ Solution 3: Configure Pixel 8 Emulator in Android Studio

### Step 1: Create/Update Pixel 8 Emulator
1. Open **Android Studio**
2. Click **Device Manager** (bottom right or Tools → Device Manager)
3. If no Pixel 8 exists:
   - Click **Create device**
   - Select **Pixel 8**
   - Choose **API Level 34** or higher
   - Click **Next** → **Finish**

### Step 2: Start the Emulator
```powershell
# Or just click the Play button in Device Manager
# Make sure emulator fully boots (wait 2-3 minutes)
```

### Step 3: Verify Emulator is Running
```powershell
adb devices
# Should show your Pixel 8 emulator in the list
```

---

## ✅ Solution 4: Run App on Pixel 8

### Step 1: Start Emulator First
```powershell
# Wait until emulator fully boots and you see the home screen
```

### Step 2: Run the App
```powershell
cd "frontend_app"
npm run android
```

### Step 3: Wait for Build
- First build takes 3-5 minutes
- You'll see: "Building..."
- Then: "Installing APK..."
- Finally: App opens automatically

---

## ✅ Solution 5: If Build Still Fails

### Check for Build Errors:

#### Error: "ANDROID_SDK_ROOT is not set"
```powershell
# Set it temporarily
$env:ANDROID_SDK_ROOT = "C:\Users\YourUsername\AppData\Local\Android\Sdk"

# Or permanently (PowerShell as Admin)
[Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT", "C:\Users\YourUsername\AppData\Local\Android\Sdk", "User")
```

#### Error: "Gradle version not found"
```powershell
cd frontend_app/android
gradlew.bat wrapper --gradle-version 8.10.2
```

#### Error: "Java not found"
```powershell
# Check Java
java -version
# If not found, download Java 17 or later
# https://www.oracle.com/java/technologies/downloads/
```

#### Error: "Metro bundler error"
```powershell
cd frontend_app
npm start -- --reset-cache
# Then in the menu, press 'a' for android
```

---

## ✅ Solution 6: Manual ADB Installation

If automatic installation fails:

```powershell
# Build APK first
cd frontend_app/android
gradlew.bat assembleDebug

# Find the APK
dir app\build\outputs\apk\debug\

# Install it manually using adb
adb install -r "app\build\outputs\apk\debug\app-debug.apk"

# Launch the app
adb shell am start -n com.sih.hasteai/.MainActivity
```

---

## ✅ Solution 7: Check Emulator Resources

### Make sure Pixel 8 has enough resources:
1. Open Android Studio → Device Manager
2. Right-click Pixel 8 → Edit
3. Set Memory: **8 GB** (or more)
4. Set Storage: **4 GB**
5. Click **Finish**

---

## ✅ Solution 8: Full Reset (Nuclear Option)

If nothing works:

```powershell
cd "frontend_app"

# 1. Remove everything
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force android/.gradle
Remove-Item -Recurse -Force .expo
Remove-Item -Force package-lock.json

# 2. Reinstall
npm install

# 3. Clear cache
npm start -- --reset-cache

# 4. In Android Studio, delete and recreate Pixel 8 emulator
```

---

## 🔍 Debugging Logs

To see detailed build logs:

```powershell
cd "frontend_app"

# Run with verbose logging
npm run android -- --verbose

# Or use Expo CLI directly
npx expo run:android --verbose
```

Check for errors in the output. Common issues:

- **Compilation errors** - Check TypeScript
- **Module not found** - Run `npm install` again
- **Permission errors** - Check Windows Defender/Antivirus
- **Out of memory** - Increase emulator memory

---

## 📋 Checklist Before Running

- [x] Android Studio installed
- [x] Pixel 8 emulator created
- [x] Emulator started and fully booted
- [x] Java JDK 17+ installed
- [x] Android SDK installed
- [x] npm dependencies installed (`npm install`)
- [x] ANDROID_HOME environment variable set
- [x] No TypeScript errors (`npm run type-check` if available)
- [x] Gradle cache cleared

---

## 🚀 Quick Command to Run Everything

```powershell
# Copy-paste this entire block:
cd "a:\chaitanyaWork\reactNattive\lastRoundEvalProject\KOCHI-SIH-2025\frontend_app"
npm cache clean --force
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
npm install
npm run android
```

---

## 📞 Common Error Messages & Fixes

| Error | Solution |
|-------|----------|
| `No Android connected device found` | Start emulator in Device Manager |
| `Gradle build failed` | Run `npm cache clean --force` |
| `ANDROID_SDK_ROOT not set` | Set environment variable (see Solution 5) |
| `Metro bundler error` | Run `npm start -- --reset-cache` |
| `Permission denied` | Run PowerShell as Administrator |
| `Out of memory` | Increase emulator RAM in settings |
| `Java not found` | Install Java 17+ from oracle.com |

---

## 🎯 Expected Output When It Works

```
Building... [████████████████████] 100%
⠹ Installing APK...
✓ App installed successfully
✓ Starting app...
[App opens on Pixel 8 emulator]
```

---

**Last Updated:** December 9, 2025  
**Tested On:** Android Studio 2024.1.1, React Native 0.74.5, Expo 51.0.0
