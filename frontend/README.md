# KMRL Train Induction System - Frontend

Modern, user-friendly frontend for the AI-Driven Train Induction Planning & Scheduling system for Kochi Metro Rail Limited (KMRL).

## Features

- **Dashboard**: View ranked induction list with AI reasoning
- **Emergency Management**: Real-time emergency response and crisis management
- **What-If Simulator**: Test scenarios before committing decisions
- **Decision History**: View past decisions and outcomes
- **Conflict Alerts**: Real-time conflict detection and resolution

## Technology Stack

- **React 19** with TypeScript
- **Vite** for fast development and building
- **HeroUI** for modern UI components
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API communication

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with your backend API URL:
```
VITE_API_URL=http://localhost:3000/api/v1
```

4. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
frontend/
├── src/
│   ├── components/      # Reusable components
│   │   ├── Layout.tsx
│   │   ├── DecisionCard.tsx
│   │   └── ConflictAlerts.tsx
│   ├── pages/          # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Emergency.tsx
│   │   ├── WhatIf.tsx
│   │   └── History.tsx
│   ├── services/       # API services
│   │   └── api.ts
│   ├── lib/           # Utilities
│   │   └── utils.ts
│   ├── types/         # TypeScript types
│   │   └── index.ts
│   ├── App.tsx        # Main app component
│   └── main.tsx       # Entry point
├── public/            # Static assets
└── package.json
```

## API Integration

The frontend communicates with the backend API at `/api/v1`. All API calls are centralized in `src/services/api.ts`.

### Available APIs

- **Dashboard**: `dashboardApi.getInductionList()`, `dashboardApi.getConflicts()`, etc.
- **Emergency**: `emergencyApi.getActiveEmergencies()`, `emergencyApi.getEmergencyPlan()`, etc.
- **History**: `historyApi.getDecisions()`, `historyApi.submitFeedback()`, etc.

## Features Overview

### Dashboard
- View ranked induction list for selected date
- See AI reasoning breakdown for each train
- Monitor conflict alerts
- View summary statistics

### Emergency Management
- View active emergencies in real-time
- Approve/reject emergency replacement plans
- Monitor crisis mode status
- Trigger full fleet reoptimization

### What-If Simulator
- Test different scenarios (remove trains, add maintenance)
- View impact analysis
- See recommendations and conflicts
- Preview new induction list

### Decision History
- Filter decisions by date range
- View past decisions and scores
- Review reasoning summaries

## Development

The frontend uses:
- **HeroUI** components for a modern, accessible UI
- **Tailwind CSS** for utility-first styling
- **TypeScript** for type safety
- **React Router** for client-side routing

## Environment Variables

- `VITE_API_URL`: Backend API base URL (default: `http://localhost:3000/api/v1`)

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

Part of the KMRL Train Induction Optimization System.
