# KMRL Train Planner - React Native App

This is the mobile app version of the KMRL Train Induction Planning System.

## Features

- **Dashboard**: Overview of fleet status, active trains, certificates, jobs, and branding SLAs
- **Night Induction Planner**: View and manage train assignments for tomorrow's service
- **Alerts**: Monitor and resolve system alerts
- **Operations Simulator**: Run passenger and energy simulations
- **Data Playground**: View and manage trains, certificates, job cards, branding contracts
- **AI Copilot**: Chat with AI assistant for train-related queries
- **Multi-language Support**: English, Hindi, Malayalam
- **Dark/Light Theme**: Automatic system theme detection with manual override

## Setup

### Prerequisites

1. Node.js (v18+)
2. Expo CLI: `npm install -g expo-cli`
3. Backend server running on port 8000

### Installation

```bash
cd frontend_App
npm install
```

### Configure API URL

Edit `src/services/api.js` and set the correct API_BASE URL:

- **Android Emulator**: `http://10.0.2.2:8000/api`
- **iOS Simulator**: `http://localhost:8000/api`
- **Physical Device**: `http://YOUR_COMPUTER_IP:8000/api`

### Run the App

```bash
# Start Expo development server
npx expo start

# Or run directly on Android
npx expo start --android

# Or run directly on iOS
npx expo start --ios
```

### Backend Setup

Make sure the backend is running:

```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
```

Note: Use `--host 0.0.0.0` to allow connections from mobile devices on the same network.

## Project Structure

```
frontend_App/
├── App.js                 # Main entry point
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── Badge.js
│   │   ├── Button.js
│   │   ├── Card.js
│   │   ├── Loading.js
│   │   ├── ScoreBar.js
│   │   └── StatCard.js
│   ├── contexts/          # React contexts
│   │   └── ThemeContext.js
│   ├── i18n/              # Internationalization
│   │   ├── config.js
│   │   └── locales/
│   │       ├── en.json
│   │       ├── hi.json
│   │       └── ml.json
│   ├── screens/           # App screens
│   │   ├── DashboardScreen.js
│   │   ├── PlannerScreen.js
│   │   ├── AlertsScreen.js
│   │   ├── SimulatorScreen.js
│   │   ├── DataScreen.js
│   │   ├── TrainDetailsScreen.js
│   │   ├── CopilotScreen.js
│   │   └── SettingsScreen.js
│   └── services/          # API services
│       └── api.js
└── package.json
```

## API Endpoints Used

The app connects to the following backend endpoints:

- `/api/dashboard/summary` - Dashboard data
- `/api/trains` - Train management
- `/api/plans` - Induction plans
- `/api/alerts` - System alerts
- `/api/fitness-certificates` - Fitness certificates
- `/api/job-cards` - Maintenance job cards
- `/api/branding-contracts` - Branding SLAs
- `/api/mileage` - Train mileage data
- `/api/cleaning` - Cleaning records
- `/api/simulation/*` - Simulation endpoints
- `/api/copilot/chat` - AI Copilot
- `/api/mock-data/generate` - Generate demo data
