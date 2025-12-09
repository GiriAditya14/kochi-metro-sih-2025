# 📱 Complete USB Connection Guide for Running the App on Android

## ✅ Step 1: Enable USB Debugging on Your Android Phone

**IMPORTANT: Do this FIRST before connecting!**

1. **Go to Settings** on your phone
2. **Scroll down** and tap **"About Phone"**
3. **Look for "Build Number"** (usually at the bottom)
4. **Tap "Build Number" 7 times rapidly** 
   - You should see a toast message: "You are now a developer!"
5. **Go back** to Settings
6. **Now you'll see a new option: "Developer Options"** (near the bottom)
7. **Tap "Developer Options"**
8. **Find and Enable "USB Debugging"** ✓
   - You might see a dialog asking to allow USB debugging - tap **"Allow"**
9. **Also Enable "Install apps via USB"** (if available)

**Your phone is now ready for USB connection!**

---

## 🔌 Step 2: Connect Your Phone via USB Cable

1. **Turn on your phone**
2. **Use an original USB cable** (some cheap cables don't work)
3. **Connect to your computer**
4. **A dialog might appear on your phone** asking "Allow USB debugging?"
   - Tap **"Allow"** and check the box "Always allow from this computer"
5. **On your computer**, open **PowerShell** and verify connection:

```powershell
# Type this command:
adb devices

# You should see:
# List of attached devices
# XXXXXXXXX        device
```

If you see your phone listed as "device" (not "unauthorized"), you're connected! ✅

---

## 🚀 Step 3: Run the App

### **Method 1: Direct Connection (Recommended)**

1. **Open PowerShell**
2. **Navigate to the app folder:**
   ```powershell
   cd "a:\chaitanyaWork\reactNattive\SIH-HASTE-ai-agent-upgrade\blank_UI_Mob"
   ```

3. **Start the development server:**
   ```powershell
   npm start
   ```

4. **Wait for the QR code to appear** (takes 30-60 seconds)

5. **You'll see options like:**
   ```
   › Press a │ open Android
   › Press w │ open web
   › Press r │ reload app
   ```

6. **Press `a`** (then Enter) to deploy to your connected Android device
   - This will build and install the app on your phone
   - **Takes 3-5 minutes on first run**

7. **The app will open on your phone automatically!**

---

### **Method 2: Using Expo Go (If Method 1 Doesn't Work)**

**Your phone likely already has "Expo Go" installed (blue icon with orange)**

1. **Open PowerShell and run:**
   ```powershell
   cd "a:\chaitanyaWork\reactNattive\SIH-HASTE-ai-agent-upgrade\blank_UI_Mob"
   npm start
   ```

2. **Wait for the QR code**

3. **On your phone**, open the **Expo Go** app

4. **Tap the QR code scanner icon** (bottom right, usually)

5. **Point at the QR code** in the terminal - it will scan and load the app

6. **The app loads in 30 seconds!**

---

## 🔧 Troubleshooting USB Connection

### **Problem: "adb devices" shows "unauthorized"**

**Solution:**
1. Unplug USB cable
2. On phone: Go to Settings → Apps → find "Expo" or "Metro" → Clear Cache
3. On phone: Go to Developer Options → Revoke USB Debugging Authorizations
4. Plug USB cable back in
5. When dialog appears, tap **"Allow"** and check "Always allow"
6. Run `adb devices` again

### **Problem: adb command not found**

**Solution:**
```powershell
# Install Android tools (if using Android Studio):
# or use this path:
"C:\Users\YourUsername\AppData\Local\Android\Sdk\platform-tools\adb" devices
```

### **Problem: No devices found even after connecting**

**Solution:**
1. Try a **different USB cable** (original recommended)
2. Try a **different USB port** on computer
3. On phone: Go to Settings → Storage → USB → Select **"File Transfer"** mode
4. Unplug, wait 5 seconds, reconnect
5. Run `adb devices` again

### **Problem: Phone charges but doesn't show as connected**

**Solution:**
1. Go to **Settings → Storage (or USB)** on your phone
2. Change USB mode from "Charge Only" to **"File Transfer"** or **"MTP"**
3. Reconnect cable

---

## ✅ Full Workflow from Start to Finish

**Step 1: Phone Setup (Do Once)**
```
Settings → About Phone → Build Number (tap 7x) 
→ Developer Options → USB Debugging (ON) → Allow USB Debugging
```

**Step 2: Connect Phone with USB Cable**
```
Plug in cable → Phone shows "Allow USB Debugging?" → Tap "Allow"
```

**Step 3: Verify Connection on Computer**
```powershell
adb devices
# Shows: XXXXXXXXX        device
```

**Step 4: Run the App**
```powershell
cd "a:\chaitanyaWork\reactNattive\SIH-HASTE-ai-agent-upgrade\blank_UI_Mob"
npm start
```

**Step 5: Launch on Phone**
```
When terminal shows options, press 'a' and Enter
```

**Step 6: Wait 3-5 minutes** for build to complete

**Step 7: App opens on your phone!** ✅

---

## 📋 What to See When It Works

**In PowerShell Terminal:**
```
› Metro waiting on exp://YOUR_IP:8081
› Press a │ open Android
› Press w │ open web
› Press r │ reload app
```

**When You Press 'a':**
```
› Opening app on Android device
› Building project...
› Installing app...
[████████████] 100% ✓
```

**On Your Phone:**
- App starts loading
- Shows **SIH HASTE AI** header
- **Dashboard screen** appears with Summary cards
- You can tap buttons to navigate

---

## 🎮 What You Can Do Once App Loads

✅ **Dashboard Screen** - See all summary cards and train data  
✅ **What-If Simulator** - Fill form and see impact analysis  
✅ **File Upload** - Upload PDF, CSV, ZIP, or Images  
✅ **Navigate between screens** - Use back button or tap links  

---

## 💡 Quick Reference Commands

```powershell
# Check connected devices
adb devices

# Clear app cache on phone
adb shell pm clear com.example.app

# View phone logs (for debugging)
adb logcat

# Reinstall app
adb uninstall com.example.app
npm run android

# Start development server
npm start

# Run on Android directly
npm run android

# Reload app (press in terminal)
# Just type 'r' and press Enter
```

---

## 🚨 If All Else Fails

1. **Restart everything:**
   ```powershell
   # Close the terminal (Ctrl+C)
   # Unplug USB cable
   # Turn phone off and on
   # Plug USB cable back in
   # Run npm start again
   ```

2. **Clear all caches:**
   ```powershell
   cd "a:\chaitanyaWork\reactNattive\SIH-HASTE-ai-agent-upgrade\blank_UI_Mob"
   rm -r .expo node_modules
   npm install
   npm start
   ```

3. **Use Expo Go as fallback:**
   - Even if direct USB fails, Expo Go usually works
   - Just scan the QR code with Expo Go app on phone

---

## ✨ Final Checklist Before Running

- [ ] USB Debugging is **ON** in phone Settings
- [ ] Phone is connected with USB cable
- [ ] `adb devices` shows your phone as "device" (not "unauthorized")
- [ ] You're in the correct folder: `blank_UI_Mob`
- [ ] You ran `npm install` successfully
- [ ] You ran `npx expo install --fix` successfully

**If all ✓, then run: `npm start` and press `a`**

---

**Build Date: December 8, 2025**  
**Last Updated: Now**  
**Working on: Expo 49 + React Native 0.72**

