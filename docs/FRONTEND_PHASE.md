# Frontend Phase Documentation
## NeuralInduction AI - KMRL Train Induction Optimization System

---

## 1. Overview & Objectives

### 1.1 Purpose
The frontend provides an intuitive, real-time decision support interface for KMRL supervisors, displaying ranked induction lists, explainable AI reasoning, conflict alerts, what-if simulations, and immersive 3D depot visualization. It transforms complex multi-agent decisions into actionable, understandable insights.

### 1.2 Core Responsibilities
- **Decision Visualization**: Display ranked induction list with explainable reasoning
- **Real-time Updates**: Live data streaming and conflict alerts
- **What-If Simulation**: Interactive scenario testing interface
- **3D Digital Twin**: Immersive depot visualization with train positions
- **Natural Language Interface**: Voice/text input in Malayalam/Hindi/English
- **Gamified Dashboard**: Engagement-driven UX with points, badges, achievements
- **Conflict Management**: Alert system with actionable recommendations
- **Accessibility**: WCAG 2.1 AA compliance for government systems

### 1.3 Success Metrics
- <2 second page load time
- Real-time updates with <500ms latency
- 99.5% UI uptime
- Mobile-responsive design (tablet/desktop)
- Zero accessibility violations

---

## 2. Architecture & Design

### 2.1 Technology Stack
- **Framework**: React.js 18+ with TypeScript
- **State Management**: Redux Toolkit + RTK Query
- **3D Visualization**: Three.js + React Three Fiber
- **Data Visualization**: D3.js + Recharts
- **UI Components**: Material-UI (MUI) v5
- **Real-time**: Socket.io-client
- **Routing**: React Router v6
- **Form Handling**: React Hook Form + Zod validation
- **Internationalization**: i18next (Malayalam/Hindi/English)

### 2.2 Component Architecture
```
src/
├── components/
│   ├── dashboard/
│   │   ├── InductionList.tsx          # Ranked train list
│   │   ├── DecisionCard.tsx            # Individual train decision
│   │   ├── ReasoningPanel.tsx          # Explainable AI display
│   │   ├── ConflictAlerts.tsx          # Alert management
│   │   └── SummaryStats.tsx            # KPI overview
│   ├── simulation/
│   │   ├── WhatIfSimulator.tsx         # Scenario testing
│   │   ├── ScenarioBuilder.tsx         # Build custom scenarios
│   │   └── ImpactAnalysis.tsx          # Show simulation results
│   ├── digital-twin/
│   │   ├── Depot3DView.tsx             # Three.js 3D visualization
│   │   ├── TrainMarker.tsx             # Train position markers
│   │   ├── ShuntingPath.tsx            # Movement visualization
│   │   └── Controls.tsx                # 3D view controls
│   ├── natural-language/
│   │   ├── VoiceInput.tsx              # Speech recognition
│   │   ├── TextInput.tsx                # Text query input
│   │   ├── QueryResults.tsx            # NL query results
│   │   └── LanguageSelector.tsx         # Malayalam/Hindi/English
│   ├── gamification/
│   │   ├── PointsDisplay.tsx           # Current points
│   │   ├── Badges.tsx                   # Achievement badges
│   │   ├── Leaderboard.tsx              # Rankings
│   │   └── Achievements.tsx             # Achievement history
│   └── common/
│       ├── LoadingSpinner.tsx
│       ├── ErrorBoundary.tsx
│       └── ToastNotifications.tsx
├── pages/
│   ├── Dashboard.tsx                    # Main dashboard
│   ├── Simulation.tsx                   # What-if page
│   ├── DigitalTwin.tsx                  # 3D depot view
│   ├── History.tsx                      # Decision history
│   └── Settings.tsx                     # User preferences
├── services/
│   ├── api.ts                           # Backend API client
│   ├── websocket.ts                     # Real-time connections
│   └── nlp.ts                           # Natural language processing
├── store/
│   ├── slices/
│   │   ├── decisionsSlice.ts
│   │   ├── conflictsSlice.ts
│   │   ├── simulationSlice.ts
│   │   └── gamificationSlice.ts
│   └── store.ts
└── utils/
    ├── formatters.ts
    ├── validators.ts
    └── constants.ts
```

### 2.3 Data Flow
```
User Interaction
    ↓
React Component
    ↓
Redux Action / RTK Query
    ↓
API Service / WebSocket
    ↓
Backend API (docs/BACKEND_PHASE.md)
    ↓
Response Processing
    ↓
State Update
    ↓
UI Re-render
```

---

## 3. Core Features Implementation

### 3.1 Ranked Induction List Display

#### 3.1.1 Component: `InductionList.tsx`
```typescript
interface InductionListProps {
  decisionDate: string;
  onTrainSelect: (trainId: number) => void;
}

interface TrainDecision {
  trainId: number;
  trainNumber: string;
  recommendedAction: 'revenue' | 'standby' | 'maintenance';
  priorityScore: number;
  reasoning: string;
  reasoningDetails: ReasoningDetails;
  conflicts: Conflict[];
}

const InductionList: React.FC<InductionListProps> = ({ decisionDate, onTrainSelect }) => {
  const { data, isLoading } = useGetInductionListQuery(decisionDate);
  
  return (
    <Box>
      <Typography variant="h5">Ranked Induction List - {formatDate(decisionDate)}</Typography>
      <Grid container spacing={2}>
        {data?.trains.map((train, index) => (
          <Grid item xs={12} key={train.trainId}>
            <DecisionCard
              train={train}
              rank={index + 1}
              onSelect={() => onTrainSelect(train.trainId)}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
```

#### 3.1.2 Component: `DecisionCard.tsx`
**Features**:
- Priority score visualization (0-100)
- Color-coded action badges (Revenue: Green, Standby: Yellow, Maintenance: Red)
- Expandable reasoning panel
- Conflict indicators
- Quick actions (View Details, Override, What-If)

```typescript
const DecisionCard: React.FC<DecisionCardProps> = ({ train, rank, onSelect }) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <Card sx={{ mb: 2 }}>
      <CardHeader
        avatar={<Avatar sx={{ bgcolor: getActionColor(train.recommendedAction) }}>
          {rank}
        </Avatar>}
        title={`Train ${train.trainNumber}`}
        subheader={`Priority Score: ${train.priorityScore.toFixed(1)}`}
        action={
          <Chip
            label={train.recommendedAction.toUpperCase()}
            color={getActionColor(train.recommendedAction)}
          />
        }
      />
      <CardContent>
        <Typography variant="body2">{train.reasoning}</Typography>
        {train.conflicts.length > 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {train.conflicts.length} conflict(s) detected
          </Alert>
        )}
      </CardContent>
      <CardActions>
        <Button onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Hide' : 'Show'} Detailed Reasoning
        </Button>
        <Button onClick={onSelect}>View Details</Button>
      </CardActions>
      {expanded && <ReasoningPanel details={train.reasoningDetails} />}
    </Card>
  );
};
```

### 3.2 Explainable AI Interface

#### 3.2.1 Component: `ReasoningPanel.tsx`
**Purpose**: Display SHAP/LIME-style explainable reasoning from agents

```typescript
interface ReasoningDetails {
  fitness: { status: string; score: number; details: string };
  jobCards: { status: string; score: number; details: string };
  branding: { priority: string; score: number; details: string };
  mileage: { balance: string; score: number; details: string };
  cleaning: { status: string; score: number; details: string };
  stabling: { position: string; score: number; details: string };
}

const ReasoningPanel: React.FC<{ details: ReasoningDetails }> = ({ details }) => {
  return (
    <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
      <Typography variant="h6">Decision Reasoning Breakdown</Typography>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        {Object.entries(details).map(([key, value]) => (
          <Grid item xs={12} md={6} key={key}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" textTransform="capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={value.score}
                sx={{ mt: 1, mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                Status: {value.status}
              </Typography>
              <Typography variant="caption">{value.details}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          * Scores represent agent confidence and constraint satisfaction (0-100)
        </Typography>
      </Box>
    </Box>
  );
};
```

### 3.3 What-If Simulator Interface

#### 3.3.1 Component: `WhatIfSimulator.tsx`
**Purpose**: Interactive scenario testing before committing decisions

```typescript
const WhatIfSimulator: React.FC = () => {
  const [scenario, setScenario] = useState<Scenario>({
    removeTrain: null,
    addMaintenance: [],
    changeBrandingPriority: {}
  });
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  
  const handleRunSimulation = async () => {
    const result = await runWhatIfSimulation(scenario);
    setSimulationResult(result);
  };
  
  return (
    <Container>
      <Typography variant="h4">What-If Scenario Simulator</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <ScenarioBuilder
            scenario={scenario}
            onChange={setScenario}
            onRun={handleRunSimulation}
          />
        </Grid>
        <Grid item xs={12} md={8}>
          {simulationResult && (
            <ImpactAnalysis result={simulationResult} />
          )}
        </Grid>
      </Grid>
    </Container>
  );
};
```

#### 3.3.2 Component: `ScenarioBuilder.tsx`
**Features**:
- Remove train from revenue service
- Add trains to maintenance
- Change branding priorities
- Set custom constraints
- Save/load scenario templates

```typescript
const ScenarioBuilder: React.FC<ScenarioBuilderProps> = ({ scenario, onChange, onRun }) => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6">Build Scenario</Typography>
      
      <FormControl fullWidth sx={{ mt: 2 }}>
        <InputLabel>Remove Train from Service</InputLabel>
        <Select
          value={scenario.removeTrain || ''}
          onChange={(e) => onChange({ ...scenario, removeTrain: e.target.value })}
        >
          <MenuItem value="">None</MenuItem>
          {availableTrains.map(train => (
            <MenuItem key={train.id} value={train.number}>{train.number}</MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <Autocomplete
        multiple
        options={availableTrains}
        getOptionLabel={(option) => option.number}
        value={scenario.addMaintenance}
        onChange={(_, newValue) => onChange({ ...scenario, addMaintenance: newValue })}
        renderInput={(params) => (
          <TextField {...params} label="Add to Maintenance" sx={{ mt: 2 }} />
        )}
      />
      
      <Button
        variant="contained"
        fullWidth
        onClick={onRun}
        sx={{ mt: 3 }}
      >
        Run Simulation
      </Button>
    </Paper>
  );
};
```

#### 3.3.3 Component: `ImpactAnalysis.tsx`
**Purpose**: Display simulation results with visual impact indicators

```typescript
const ImpactAnalysis: React.FC<{ result: SimulationResult }> = ({ result }) => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6">Simulation Impact Analysis</Typography>
      
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={6}>
          <StatCard
            title="Punctuality Impact"
            value={`${result.impactAnalysis.punctualityImpact > 0 ? '+' : ''}${result.impactAnalysis.punctualityImpact}%`}
            color={result.impactAnalysis.punctualityImpact >= 0 ? 'success' : 'error'}
            icon={<TrendingUp />}
          />
        </Grid>
        <Grid item xs={6}>
          <StatCard
            title="Branding Breaches"
            value={result.impactAnalysis.brandingBreaches}
            color={result.impactAnalysis.brandingBreaches === 0 ? 'success' : 'warning'}
            icon={<Warning />}
          />
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1">New Recommended Induction List</Typography>
        <InductionListPreview trains={result.newInductionList} />
      </Box>
      
      {result.conflicts.length > 0 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="subtitle2">Conflicts Detected:</Typography>
          <List>
            {result.conflicts.map((conflict, idx) => (
              <ListItem key={idx}>
                <ListItemText primary={conflict.description} />
              </ListItem>
            ))}
          </List>
        </Alert>
      )}
      
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1">Recommendations</Typography>
        {result.recommendations.map((rec, idx) => (
          <Chip key={idx} label={rec} sx={{ m: 0.5 }} />
        ))}
      </Box>
    </Paper>
  );
};
```

### 3.4 Conflict Alerts Dashboard

#### 3.4.1 Component: `ConflictAlerts.tsx`
**Purpose**: Real-time conflict detection and resolution interface

```typescript
const ConflictAlerts: React.FC = () => {
  const { data: conflicts } = useGetConflictsQuery();
  const [filter, setFilter] = useState<'all' | 'critical' | 'high'>('all');
  
  const filteredConflicts = conflicts?.conflicts.filter(c => 
    filter === 'all' || c.severity === filter
  ) || [];
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Conflict Alerts</Typography>
        <ToggleButtonGroup value={filter} exclusive onChange={(_, v) => setFilter(v)}>
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="critical">Critical</ToggleButton>
          <ToggleButton value="high">High</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      
      {filteredConflicts.map(conflict => (
        <Alert
          key={conflict.id}
          severity={getSeverityColor(conflict.severity)}
          sx={{ mb: 2 }}
          action={
            <Button size="small" onClick={() => handleResolve(conflict.id)}>
              Resolve
            </Button>
          }
        >
          <AlertTitle>
            Train {conflict.trainNumber} - {conflict.conflictType}
          </AlertTitle>
          {conflict.description}
          {conflict.suggestedResolution && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption">
                <strong>Suggested:</strong> {conflict.suggestedResolution}
              </Typography>
            </Box>
          )}
        </Alert>
      ))}
    </Box>
  );
};
```

### 3.5 3D Digital Twin Visualization

#### 3.5.1 Component: `Depot3DView.tsx`
**Purpose**: Immersive Three.js visualization of depot with train positions

```typescript
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

const Depot3DView: React.FC = () => {
  const { data: depotData } = useGetDigitalTwinQuery();
  
  return (
    <Box sx={{ width: '100%', height: '600px', bgcolor: 'black' }}>
      <Canvas>
        <PerspectiveCamera makeDefault position={[100, 100, 100]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} />
        
        {/* Depot Structure */}
        <DepotGeometry geometry={depotData?.geometry} />
        
        {/* Train Markers */}
        {depotData?.depots.map(depot => 
          depot.bays.map(bay => (
            <TrainMarker
              key={bay.trainId}
              position={[bay.position.x, bay.position.y, bay.position.z]}
              train={bay}
            />
          ))
        )}
        
        {/* Shunting Paths */}
        <ShuntingPaths paths={depotData?.shuntingPaths} />
        
        <OrbitControls />
      </Canvas>
      
      <Box sx={{ position: 'absolute', top: 10, left: 10, bgcolor: 'rgba(0,0,0,0.7)', p: 2, color: 'white' }}>
        <Typography variant="h6">Depot 3D View</Typography>
        <Typography variant="body2">Use mouse to rotate, zoom, and pan</Typography>
      </Box>
    </Box>
  );
};
```

#### 3.5.2 Component: `TrainMarker.tsx`
**Purpose**: 3D representation of trains in depot

```typescript
const TrainMarker: React.FC<TrainMarkerProps> = ({ position, train }) => {
  const [hovered, setHovered] = useState(false);
  
  return (
    <group position={[position[0], position[1], position[2]]}>
      <mesh
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[10, 5, 20]} />
        <meshStandardMaterial
          color={getTrainColor(train.status)}
          emissive={hovered ? getTrainColor(train.status) : 'black'}
          emissiveIntensity={hovered ? 0.5 : 0}
        />
      </mesh>
      {hovered && (
        <Html>
          <Box sx={{ bgcolor: 'white', p: 1, borderRadius: 1 }}>
            <Typography variant="caption">
              Train {train.trainNumber}<br />
              Status: {train.status}
            </Typography>
          </Box>
        </Html>
      )}
    </group>
  );
};
```

### 3.6 Natural Language Interface

#### 3.6.1 Component: `VoiceInput.tsx`
**Purpose**: Speech recognition for Malayalam/Hindi/English queries

```typescript
const VoiceInput: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [language, setLanguage] = useState<'malayalam' | 'hindi' | 'english'>('english');
  
  const recognition = new (window as any).webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = getLanguageCode(language);
  
  recognition.onresult = (event: any) => {
    const transcript = event.results[0][0].transcript;
    setTranscript(transcript);
    handleQuery(transcript, language);
  };
  
  const startListening = () => {
    recognition.start();
    setIsListening(true);
  };
  
  return (
    <Box>
      <LanguageSelector value={language} onChange={setLanguage} />
      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Button
          variant="contained"
          startIcon={isListening ? <Stop /> : <Mic />}
          onClick={isListening ? () => recognition.stop() : startListening}
          color={isListening ? 'error' : 'primary'}
        >
          {isListening ? 'Stop Listening' : 'Start Voice Input'}
        </Button>
      </Box>
      {transcript && (
        <Typography variant="body2" sx={{ mt: 2 }}>
          Heard: {transcript}
        </Typography>
      )}
    </Box>
  );
};
```

#### 3.6.2 Component: `TextInput.tsx`
**Purpose**: Text-based natural language query input

```typescript
const TextInput: React.FC = () => {
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState<'malayalam' | 'hindi' | 'english'>('english');
  const [result, setResult] = useState<NLQueryResult | null>(null);
  
  const handleSubmit = async () => {
    const response = await processNaturalLanguageQuery(query, language);
    setResult(response);
  };
  
  return (
    <Box>
      <LanguageSelector value={language} onChange={setLanguage} />
      <TextField
        fullWidth
        multiline
        rows={3}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={getPlaceholder(language)}
        sx={{ mt: 2 }}
      />
      <Button
        variant="contained"
        onClick={handleSubmit}
        sx={{ mt: 2 }}
      >
        Submit Query
      </Button>
      {result && <QueryResults result={result} />}
    </Box>
  );
};
```

### 3.7 Gamified Dashboard

#### 3.7.1 Component: `PointsDisplay.tsx`
**Purpose**: Display user points and achievements

```typescript
const PointsDisplay: React.FC = () => {
  const { data: gamification } = useGetGamificationQuery();
  
  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <StarIcon color="primary" />
        <Typography variant="h5">{gamification?.totalPoints || 0}</Typography>
        <Typography variant="body2" color="text.secondary">Total Points</Typography>
      </Box>
      <Box sx={{ mt: 2 }}>
        <Typography variant="caption">Today's Score: +{gamification?.todayPoints || 0}</Typography>
        <LinearProgress
          variant="determinate"
          value={(gamification?.todayPoints || 0) / 100 * 100}
          sx={{ mt: 1 }}
        />
      </Box>
    </Paper>
  );
};
```

#### 3.7.2 Component: `Badges.tsx`
**Purpose**: Display achievement badges

```typescript
const Badges: React.FC = () => {
  const { data: badges } = useGetBadgesQuery();
  
  return (
    <Box>
      <Typography variant="h6">Achievement Badges</Typography>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        {badges?.map(badge => (
          <Grid item key={badge.id}>
            <Tooltip title={badge.description}>
              <Badge
                badgeContent={badge.unlocked ? '✓' : null}
                color="success"
              >
                <Avatar
                  sx={{
                    width: 64,
                    height: 64,
                    bgcolor: badge.unlocked ? 'primary.main' : 'grey.300'
                  }}
                >
                  {badge.icon}
                </Avatar>
              </Badge>
            </Tooltip>
            <Typography variant="caption" display="block" textAlign="center">
              {badge.name}
            </Typography>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
```

---

## 4. Real-time Updates

### 4.1 WebSocket Integration
```typescript
// services/websocket.ts
import io from 'socket.io-client';

const socket = io(process.env.REACT_APP_WS_URL || 'http://localhost:3000');

export const subscribeToDecisions = (date: string, callback: (data: any) => void) => {
  socket.emit('subscribe-decisions', date);
  socket.on('decision-updated', callback);
};

export const subscribeToConflicts = (callback: (conflict: Conflict) => void) => {
  socket.emit('subscribe-conflicts');
  socket.on('conflict-detected', callback);
};

export const unsubscribe = () => {
  socket.off('decision-updated');
  socket.off('conflict-detected');
};
```

### 4.2 Real-time Data Visualization
- Animated progress bars for agent processing
- Live conflict alert notifications (toast + sound)
- Real-time induction list updates
- Live 3D train position updates

---

## 5. API Integration

### 5.1 RTK Query Setup
```typescript
// services/api.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const api = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getInductionList: builder.query<InductionListResponse, string>({
      query: (date) => `/dashboard/induction-list?date=${date}&includeReasoning=true`,
    }),
    runWhatIfSimulation: builder.mutation<SimulationResult, Scenario>({
      query: (scenario) => ({
        url: '/dashboard/what-if',
        method: 'POST',
        body: scenario,
      }),
    }),
    getConflicts: builder.query<ConflictsResponse, void>({
      query: () => '/dashboard/conflicts',
    }),
    getDigitalTwin: builder.query<DigitalTwinResponse, void>({
      query: () => '/dashboard/digital-twin',
    }),
    processNaturalLanguage: builder.mutation<NLQueryResult, { query: string; language: string }>({
      query: ({ query, language }) => ({
        url: '/dashboard/natural-language',
        method: 'POST',
        body: { query, language },
      }),
    }),
  }),
});

export const {
  useGetInductionListQuery,
  useRunWhatIfSimulationMutation,
  useGetConflictsQuery,
  useGetDigitalTwinQuery,
  useProcessNaturalLanguageMutation,
} = api;
```

---

## 6. State Management

### 6.1 Redux Slices
```typescript
// store/slices/decisionsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface DecisionsState {
  currentDecision: InductionListResponse | null;
  selectedTrain: number | null;
  loading: boolean;
  error: string | null;
}

const initialState: DecisionsState = {
  currentDecision: null,
  selectedTrain: null,
  loading: false,
  error: null,
};

const decisionsSlice = createSlice({
  name: 'decisions',
  initialState,
  reducers: {
    setSelectedTrain: (state, action: PayloadAction<number>) => {
      state.selectedTrain = action.payload;
    },
    clearSelection: (state) => {
      state.selectedTrain = null;
    },
  },
});

export const { setSelectedTrain, clearSelection } = decisionsSlice.actions;
export default decisionsSlice.reducer;
```

---

## 7. Responsive Design

### 7.1 Breakpoints
- **Mobile**: < 600px (stacked layout, simplified 3D view)
- **Tablet**: 600px - 960px (2-column layout)
- **Desktop**: > 960px (full multi-column layout)

### 7.2 Mobile Optimizations
- Collapsible sidebar navigation
- Simplified 3D view (2D top-down)
- Touch-optimized controls
- Swipe gestures for train cards

---

## 8. Accessibility (WCAG 2.1 AA)

### 8.1 Requirements
- Keyboard navigation for all interactive elements
- Screen reader support (ARIA labels)
- Color contrast ratios (4.5:1 minimum)
- Focus indicators
- Alt text for all images/icons

### 8.2 Implementation
```typescript
// Example accessible component
<Button
  aria-label="View train T001 details"
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
>
  View Details
</Button>
```

---

## 9. Performance Optimization

### 9.1 Code Splitting
- Lazy load 3D components (Three.js)
- Route-based code splitting
- Dynamic imports for heavy libraries

### 9.2 Memoization
- React.memo for expensive components
- useMemo for computed values
- useCallback for event handlers

### 9.3 Virtualization
- Virtual scrolling for long train lists (react-window)
- Lazy loading for 3D scene objects

---

## 10. Testing Requirements

### 10.1 Unit Tests
- Component rendering
- User interactions
- State management
- API mocking

### 10.2 Integration Tests
- End-to-end user flows
- API integration
- WebSocket real-time updates

### 10.3 Visual Regression Tests
- Screenshot comparisons
- 3D view rendering
- Responsive layout checks

---

## 11. Deployment Considerations

### 11.1 Build Configuration
```json
// package.json scripts
{
  "build": "react-scripts build",
  "build:prod": "NODE_ENV=production npm run build"
}
```

### 11.2 Environment Variables
```env
REACT_APP_API_URL=http://localhost:3000/api/v1
REACT_APP_WS_URL=http://localhost:3000
REACT_APP_GROQ_API_KEY=your_key
```

### 11.3 Static Asset Optimization
- Image compression
- SVG optimization
- Font subsetting

---

## 12. Integration with Other Phases

### 12.1 Backend Integration
- **Reference**: See `docs/BACKEND_PHASE.md`
- **APIs**: All `/api/v1/dashboard/*` endpoints
- **WebSocket**: Real-time updates from backend

### 12.2 Agent Phase Integration
- **Reference**: See `docs/AGENT_PHASE.md`
- **Display**: Agent reasoning and decision outputs
- **Interaction**: Trigger what-if simulations that invoke agents

### 12.3 ML Models Phase Integration
- **Reference**: See `docs/ML_MODELS_PHASE.md`
- **Visualization**: ML prediction results in decision cards
- **Feedback**: Submit user feedback for learning loop

---

## 13. Wow Factor Implementation Details

### 13.1 Real-time Animated Data Ingestion
- Progress animations for agent processing
- Live data stream visualization
- Animated conflict alerts
- Smooth transitions for list updates

### 13.2 3D Digital Twin
- Immersive Three.js visualization
- Interactive train markers
- Shunting path animations
- Real-time position updates

### 13.3 Natural Language Interface
- Multi-language support (Malayalam/Hindi/English)
- Voice recognition integration
- Context-aware query processing
- Visual query results

### 13.4 Gamification
- Points system for accurate decisions
- Achievement badges
- Leaderboard rankings
- Progress tracking

---

## 14. Success Criteria Checklist

- [ ] All core components implemented and functional
- [ ] Ranked induction list displays with reasoning
- [ ] What-if simulator operational
- [ ] 3D digital twin visualization working
- [ ] Natural language interface (voice + text) functional
- [ ] Gamification system implemented
- [ ] Real-time WebSocket updates working
- [ ] Conflict alerts system operational
- [ ] Responsive design (mobile/tablet/desktop)
- [ ] WCAG 2.1 AA accessibility compliance
- [ ] Performance targets met (<2s load time)
- [ ] Integration with Backend Phase tested
- [ ] Integration with Agent Phase tested
- [ ] Integration with ML Models Phase tested

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-15  
**Next Review**: After Backend API integration testing