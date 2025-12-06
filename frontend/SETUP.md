# Frontend Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure Environment**
   - The `.env` file should already be created with default API URL
   - Update `VITE_API_URL` if your backend runs on a different port

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Access the Application**
   - Open `http://localhost:5173` in your browser
   - Make sure the backend is running on `http://localhost:3000`

## Features Implemented

### ✅ Dashboard Page
- Ranked induction list display
- Summary statistics (Total, Revenue Ready, Standby, Maintenance)
- Date selection for viewing past/future decisions
- Real-time conflict alerts
- Expandable reasoning panels for each train decision

### ✅ Emergency Management
- Active emergencies list with real-time updates
- Emergency plan viewing and approval
- Crisis mode detection and management
- Full fleet reoptimization trigger
- Emergency resolution workflow

### ✅ What-If Simulator
- Scenario builder (remove trains, add maintenance)
- Impact analysis display
- Recommendations and conflict detection
- New induction list preview

### ✅ Decision History
- Date range filtering
- Historical decision viewing
- Decision scores and reasoning

### ✅ Conflict Alerts
- Real-time conflict detection
- Severity-based filtering
- Suggested resolutions
- Visual alerts

## Component Structure

```
src/
├── components/
│   ├── Layout.tsx           # Main layout with navigation
│   ├── DecisionCard.tsx     # Train decision card with reasoning
│   └── ConflictAlerts.tsx   # Conflict alerts display
├── pages/
│   ├── Dashboard.tsx        # Main dashboard
│   ├── Emergency.tsx        # Emergency management
│   ├── WhatIf.tsx           # What-if simulator
│   └── History.tsx          # Decision history
├── services/
│   └── api.ts               # API client with all endpoints
├── lib/
│   └── utils.ts             # Utility functions
└── types/
    └── index.ts             # TypeScript type definitions
```

## API Integration

All API calls are centralized in `src/services/api.ts`:

- **Dashboard APIs**: `dashboardApi.getInductionList()`, `dashboardApi.getConflicts()`, etc.
- **Emergency APIs**: `emergencyApi.getActiveEmergencies()`, `emergencyApi.getEmergencyPlan()`, etc.
- **History APIs**: `historyApi.getDecisions()`, `historyApi.submitFeedback()`, etc.

## Styling

- **HeroUI**: Modern component library for UI elements
- **Tailwind CSS**: Utility-first CSS framework
- **Dark Mode**: Supported via HeroUI theme

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Troubleshooting

### API Connection Issues
- Verify backend is running on `http://localhost:3000`
- Check `VITE_API_URL` in `.env` file
- Check browser console for CORS errors

### Build Issues
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version (requires v18+)

### Styling Issues
- Ensure Tailwind CSS is properly configured
- Check that `@tailwind` directives are in `src/index.css`

## Next Steps

1. Connect to backend API
2. Test all features with real data
3. Add authentication if needed
4. Deploy to production

