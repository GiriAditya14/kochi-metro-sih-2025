# Backend Phase Documentation
## NeuralInduction AI - KMRL Train Induction Optimization System

---

## 1. Overview & Objectives

### 1.1 Purpose
The backend serves as the central data orchestration layer, managing data ingestion from heterogeneous sources, providing APIs for agent communication, serving frontend requests, and integrating with Groq LLM for response organization and natural language processing.

### 1.2 Core Responsibilities
- **Data Ingestion**: Consolidate data from IBM Maximo, IoT sensors, WhatsApp logs, and manual inputs
- **Database Management**: PostgreSQL schema design supporting 25→40 trainsets and 1→2 depots
- **Agent Communication**: Provide APIs for LangGraph orchestrator and 6 specialized agents
- **LLM Integration**: Groq Llama 3 integration for explainable reasoning and NL processing
- **Decision Storage**: Audit trails, historical decisions, and learning feedback data
- **Real-time Processing**: Sub-10-second response times for decision support queries

### 1.3 Success Metrics
- 99.5%+ system uptime
- <10 second API response times
- Support for 40 trainsets and 2 depots
- Seamless integration with all data sources
- Complete audit trail for regulatory compliance

---

## 2. Architecture & Design

### 2.1 Technology Stack
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: PostgreSQL 14+
- **LLM Integration**: Groq API (Llama 3 70B)
- **Real-time**: WebSocket (Socket.io)
- **Validation**: Joi/Zod
- **ORM**: Prisma or TypeORM

### 2.2 Microservices Architecture
```
┌─────────────────────────────────────────────────────────┐
│                    API Gateway Layer                     │
│              (Express.js Router + Middleware)            │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────▼──────┐  ┌───────▼──────┐  ┌───────▼──────┐
│ Data         │  │ Agent        │  │ Frontend     │
│ Ingestion    │  │ Communication │  │ API Service  │
│ Service      │  │ Service       │  │              │
└───────┬──────┘  └───────┬──────┘  └───────┬──────┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
┌─────────────────────────▼─────────────────────────────┐
│              Groq LLM Integration Layer                │
│         (Response Organization + NL Processing)        │
└─────────────────────────┬─────────────────────────────┘
                          │
┌─────────────────────────▼─────────────────────────────┐
│              PostgreSQL Database Layer                 │
│         (Prisma ORM + Connection Pooling)             │
└───────────────────────────────────────────────────────┘
```

### 2.3 Data Flow
1. **Ingestion**: External sources → Validation → Database
2. **Agent Request**: LangGraph → Backend API → Database Query → Response
3. **Frontend Request**: React App → Backend API → Database/Agent → Response
4. **LLM Processing**: Agent Response → Groq LLM → Organized Explanation → Frontend
5. **Learning Loop**: Decision Outcome → Feedback Storage → ML Model Training Data

---

## 3. Database Schema Design

### 3.1 Core Tables

#### 3.1.1 `trainsets`
```sql
CREATE TABLE trainsets (
    id SERIAL PRIMARY KEY,
    train_number VARCHAR(10) UNIQUE NOT NULL,
    car_count INTEGER DEFAULT 4,
    current_status VARCHAR(20) NOT NULL, -- 'active', 'standby', 'maintenance', 'inspection'
    depot_id INTEGER REFERENCES depots(id),
    stabling_position VARCHAR(50), -- Physical bay position
    total_mileage DECIMAL(10,2) DEFAULT 0,
    last_maintenance_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trainsets_status ON trainsets(current_status);
CREATE INDEX idx_trainsets_depot ON trainsets(depot_id);
```

#### 3.1.2 `fitness_certificates`
```sql
CREATE TABLE fitness_certificates (
    id SERIAL PRIMARY KEY,
    train_id INTEGER REFERENCES trainsets(id) ON DELETE CASCADE,
    department VARCHAR(50) NOT NULL, -- 'rolling_stock', 'signalling', 'telecom'
    certificate_number VARCHAR(100),
    issued_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    validity_status VARCHAR(20) NOT NULL, -- 'valid', 'expiring_soon', 'expired'
    issued_by VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(train_id, department)
);

CREATE INDEX idx_fitness_train ON fitness_certificates(train_id);
CREATE INDEX idx_fitness_expiry ON fitness_certificates(expiry_date);
CREATE INDEX idx_fitness_status ON fitness_certificates(validity_status);
```

#### 3.1.3 `job_cards`
```sql
CREATE TABLE job_cards (
    id SERIAL PRIMARY KEY,
    train_id INTEGER REFERENCES trainsets(id) ON DELETE CASCADE,
    maximo_job_number VARCHAR(100) UNIQUE,
    job_type VARCHAR(50) NOT NULL, -- 'preventive', 'corrective', 'inspection'
    priority VARCHAR(20) NOT NULL, -- 'critical', 'high', 'medium', 'low'
    status VARCHAR(20) NOT NULL, -- 'open', 'in_progress', 'closed', 'cancelled'
    description TEXT,
    assigned_to VARCHAR(100),
    opened_date TIMESTAMP,
    closed_date TIMESTAMP,
    estimated_completion_date TIMESTAMP,
    actual_completion_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_jobcards_train ON job_cards(train_id);
CREATE INDEX idx_jobcards_status ON job_cards(status);
CREATE INDEX idx_jobcards_priority ON job_cards(priority);
```

#### 3.1.4 `branding_contracts`
```sql
CREATE TABLE branding_contracts (
    id SERIAL PRIMARY KEY,
    train_id INTEGER REFERENCES trainsets(id) ON DELETE CASCADE,
    advertiser_name VARCHAR(200) NOT NULL,
    contract_number VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    required_exposure_hours DECIMAL(10,2) NOT NULL,
    current_exposure_hours DECIMAL(10,2) DEFAULT 0,
    priority_score INTEGER DEFAULT 0, -- Higher = more urgent
    penalty_amount DECIMAL(12,2),
    status VARCHAR(20) NOT NULL, -- 'active', 'completed', 'breached'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_branding_train ON branding_contracts(train_id);
CREATE INDEX idx_branding_priority ON branding_contracts(priority_score DESC);
CREATE INDEX idx_branding_status ON branding_contracts(status);
```

#### 3.1.5 `mileage_tracking`
```sql
CREATE TABLE mileage_tracking (
    id SERIAL PRIMARY KEY,
    train_id INTEGER REFERENCES trainsets(id) ON DELETE CASCADE,
    recorded_date DATE NOT NULL,
    daily_mileage DECIMAL(8,2) DEFAULT 0,
    cumulative_mileage DECIMAL(10,2) NOT NULL,
    component_type VARCHAR(50), -- 'bogie', 'brake_pad', 'hvac', 'overall'
    wear_indicator DECIMAL(5,2), -- Percentage or normalized value
    maintenance_threshold DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mileage_train ON mileage_tracking(train_id);
CREATE INDEX idx_mileage_date ON mileage_tracking(recorded_date);
```

#### 3.1.6 `cleaning_slots`
```sql
CREATE TABLE cleaning_slots (
    id SERIAL PRIMARY KEY,
    train_id INTEGER REFERENCES trainsets(id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    slot_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 120,
    bay_number VARCHAR(50),
    manpower_assigned INTEGER DEFAULT 0,
    manpower_required INTEGER DEFAULT 2,
    status VARCHAR(20) NOT NULL, -- 'scheduled', 'in_progress', 'completed', 'cancelled'
    cleaning_type VARCHAR(50), -- 'deep', 'regular', 'detailing'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cleaning_train ON cleaning_slots(train_id);
CREATE INDEX idx_cleaning_date ON cleaning_slots(slot_date);
CREATE INDEX idx_cleaning_status ON cleaning_slots(status);
```

#### 3.1.7 `depots`
```sql
CREATE TABLE depots (
    id SERIAL PRIMARY KEY,
    depot_name VARCHAR(100) UNIQUE NOT NULL,
    location VARCHAR(200),
    total_bays INTEGER NOT NULL,
    bay_configuration JSONB, -- {bay_number: {capacity, position, type}}
    active_trainsets INTEGER DEFAULT 0,
    max_capacity INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3.1.8 `stabling_geometry`
```sql
CREATE TABLE stabling_geometry (
    id SERIAL PRIMARY KEY,
    train_id INTEGER REFERENCES trainsets(id) ON DELETE CASCADE,
    depot_id INTEGER REFERENCES depots(id),
    bay_number VARCHAR(50) NOT NULL,
    position_x DECIMAL(8,2), -- For 3D visualization
    position_y DECIMAL(8,2),
    position_z DECIMAL(8,2),
    shunting_distance DECIMAL(8,2), -- Distance to service entry
    shunting_time_minutes INTEGER,
    assigned_date DATE NOT NULL,
    is_optimal BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stabling_train ON stabling_geometry(train_id);
CREATE INDEX idx_stabling_depot ON stabling_geometry(depot_id);
```

#### 3.1.9 `induction_decisions`
```sql
CREATE TABLE induction_decisions (
    id SERIAL PRIMARY KEY,
    decision_date DATE NOT NULL,
    decision_time TIMESTAMP NOT NULL,
    decision_type VARCHAR(50) NOT NULL, -- 'revenue', 'standby', 'maintenance'
    train_id INTEGER REFERENCES trainsets(id),
    decision_score DECIMAL(5,2), -- Agent-generated priority score
    reasoning_summary TEXT, -- LLM-generated explanation
    reasoning_details JSONB, -- Detailed breakdown from agents
    conflicts_detected JSONB, -- Array of conflict objects
    created_by VARCHAR(100), -- Supervisor ID or 'system'
    is_override BOOLEAN DEFAULT false,
    override_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_decisions_date ON induction_decisions(decision_date);
CREATE INDEX idx_decisions_train ON induction_decisions(train_id);
CREATE INDEX idx_decisions_type ON induction_decisions(decision_type);
```

#### 3.1.10 `decision_history`
```sql
CREATE TABLE decision_history (
    id SERIAL PRIMARY KEY,
    decision_id INTEGER REFERENCES induction_decisions(id),
    train_id INTEGER REFERENCES trainsets(id),
    outcome_status VARCHAR(50), -- 'success', 'failure', 'partial'
    punctuality_impact DECIMAL(5,2), -- Percentage impact
    actual_mileage DECIMAL(10,2),
    issues_encountered TEXT,
    feedback_score INTEGER, -- 1-10 rating
    feedback_notes TEXT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_history_decision ON decision_history(decision_id);
CREATE INDEX idx_history_train ON decision_history(train_id);
```

#### 3.1.11 `conflict_alerts`
```sql
CREATE TABLE conflict_alerts (
    id SERIAL PRIMARY KEY,
    train_id INTEGER REFERENCES trainsets(id),
    conflict_type VARCHAR(50) NOT NULL, -- 'fitness_expired', 'job_card_open', 'branding_breach', etc.
    severity VARCHAR(20) NOT NULL, -- 'critical', 'high', 'medium', 'low'
    description TEXT NOT NULL,
    suggested_resolution TEXT,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active' -- 'active', 'resolved', 'ignored'
);

CREATE INDEX idx_conflicts_train ON conflict_alerts(train_id);
CREATE INDEX idx_conflicts_status ON conflict_alerts(status);
CREATE INDEX idx_conflicts_severity ON conflict_alerts(severity);
```

#### 3.1.12 `learning_feedback`
```sql
CREATE TABLE learning_feedback (
    id SERIAL PRIMARY KEY,
    decision_id INTEGER REFERENCES induction_decisions(id),
    feature_vector JSONB, -- Input features used in decision
    predicted_outcome JSONB, -- What agents predicted
    actual_outcome JSONB, -- What actually happened
    accuracy_score DECIMAL(5,2),
    model_version VARCHAR(50),
    feedback_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_feedback_decision ON learning_feedback(decision_id);
```

### 3.2 Data Relationships
```
trainsets (1) ──< (N) fitness_certificates
trainsets (1) ──< (N) job_cards
trainsets (1) ──< (N) branding_contracts
trainsets (1) ──< (N) mileage_tracking
trainsets (1) ──< (N) cleaning_slots
trainsets (1) ──< (N) stabling_geometry
trainsets (1) ──< (N) induction_decisions
trainsets (1) ──< (N) conflict_alerts
depots (1) ──< (N) trainsets
depots (1) ──< (N) stabling_geometry
induction_decisions (1) ──< (N) decision_history
induction_decisions (1) ──< (N) learning_feedback
```

---

## 4. API Endpoints

### 4.1 Data Ingestion APIs

#### 4.1.1 `POST /api/v1/ingestion/maximo`
**Purpose**: Receive job card data from IBM Maximo system
```json
Request Body:
{
  "jobCards": [
    {
      "maximoJobNumber": "JOB-2024-001",
      "trainNumber": "T001",
      "jobType": "preventive",
      "priority": "high",
      "status": "open",
      "description": "Bogie inspection",
      "openedDate": "2024-01-15T10:00:00Z"
    }
  ]
}

Response:
{
  "success": true,
  "processed": 5,
  "failed": 0,
  "message": "Job cards ingested successfully"
}
```

#### 4.1.2 `POST /api/v1/ingestion/fitness-certificate`
**Purpose**: Update fitness certificate status
```json
Request Body:
{
  "trainNumber": "T001",
  "department": "rolling_stock",
  "certificateNumber": "FC-RS-2024-001",
  "issuedDate": "2024-01-01",
  "expiryDate": "2024-04-01",
  "issuedBy": "Rolling Stock Dept"
}

Response:
{
  "success": true,
  "certificateId": 123,
  "validityStatus": "valid"
}
```

#### 4.1.3 `POST /api/v1/ingestion/mileage`
**Purpose**: Record daily mileage data
```json
Request Body:
{
  "trainNumber": "T001",
  "recordedDate": "2024-01-15",
  "dailyMileage": 450.5,
  "componentType": "overall"
}

Response:
{
  "success": true,
  "cumulativeMileage": 12500.75
}
```

#### 4.1.4 `POST /api/v1/ingestion/whatsapp-log`
**Purpose**: Process WhatsApp log entries via NLP
```json
Request Body:
{
  "rawText": "Train T005 completed deep cleaning at Bay 3. Ready for service.",
  "timestamp": "2024-01-15T21:30:00Z",
  "source": "supervisor_whatsapp"
}

Response:
{
  "success": true,
  "extractedData": {
    "trainNumber": "T005",
    "action": "cleaning_completed",
    "bayNumber": "3",
    "status": "ready"
  }
}
```

### 4.2 Agent Communication APIs

#### 4.2.1 `POST /api/v1/agents/query`
**Purpose**: Agent query endpoint for data retrieval
```json
Request Body:
{
  "agentType": "fitness_certificate",
  "query": "get_all_expiring_certificates",
  "parameters": {
    "daysAhead": 7
  }
}

Response:
{
  "success": true,
  "data": [
    {
      "trainId": 5,
      "trainNumber": "T005",
      "department": "telecom",
      "expiryDate": "2024-01-22",
      "daysRemaining": 7
    }
  ]
}
```

#### 4.2.2 `POST /api/v1/agents/decision-submit`
**Purpose**: Receive agent-generated decision recommendations
```json
Request Body:
{
  "decisionDate": "2024-01-16",
  "recommendations": [
    {
      "trainId": 1,
      "trainNumber": "T001",
      "recommendedAction": "revenue",
      "score": 95.5,
      "reasoning": {
        "fitnessCertificates": "all_valid",
        "jobCards": "no_critical_open",
        "brandingPriority": "high",
        "mileageBalance": "optimal",
        "cleaningStatus": "completed",
        "stablingPosition": "optimal"
      }
    }
  ],
  "conflicts": []
}

Response:
{
  "success": true,
  "decisionId": 456,
  "processed": 25
}
```

#### 4.2.3 `GET /api/v1/agents/train-status/:trainId`
**Purpose**: Get comprehensive train status for agent analysis
```json
Response:
{
  "trainId": 1,
  "trainNumber": "T001",
  "fitnessCertificates": [...],
  "jobCards": [...],
  "brandingContracts": [...],
  "mileageData": {...},
  "cleaningSlots": [...],
  "stablingGeometry": {...}
}
```

### 4.3 Frontend APIs

#### 4.3.1 `GET /api/v1/dashboard/induction-list`
**Purpose**: Get ranked induction list for display
```json
Query Parameters:
- date: YYYY-MM-DD (default: today)
- includeReasoning: boolean (default: true)

Response:
{
  "decisionDate": "2024-01-16",
  "generatedAt": "2024-01-15T22:30:00Z",
  "trains": [
    {
      "trainId": 1,
      "trainNumber": "T001",
      "recommendedAction": "revenue",
      "priorityScore": 95.5,
      "reasoning": "All fitness certificates valid, no critical job cards...",
      "reasoningDetails": {
        "fitness": { "status": "valid", "score": 100 },
        "jobCards": { "status": "clear", "score": 100 },
        "branding": { "priority": "high", "score": 90 },
        "mileage": { "balance": "optimal", "score": 95 },
        "cleaning": { "status": "completed", "score": 100 },
        "stabling": { "position": "optimal", "score": 90 }
      },
      "conflicts": []
    }
  ],
  "summary": {
    "totalTrains": 25,
    "revenueReady": 20,
    "standby": 3,
    "maintenance": 2
  }
}
```

#### 4.3.2 `POST /api/v1/dashboard/what-if`
**Purpose**: What-if scenario simulation
```json
Request Body:
{
  "scenario": {
    "removeTrain": "T005",
    "addMaintenance": ["T010"],
    "changeBrandingPriority": {
      "T015": "high"
    }
  },
  "targetDate": "2024-01-16"
}

Response:
{
  "success": true,
  "simulationId": "sim-123",
  "results": {
    "newInductionList": [...],
    "impactAnalysis": {
      "punctualityImpact": -0.2,
      "brandingBreaches": 1,
      "mileageImbalance": "moderate",
      "conflicts": [...]
    },
    "recommendations": [
      "Consider moving T012 to revenue to compensate for T005 removal"
    ]
  }
}
```

#### 4.3.3 `GET /api/v1/dashboard/conflicts`
**Purpose**: Get active conflict alerts
```json
Response:
{
  "conflicts": [
    {
      "id": 1,
      "trainId": 5,
      "trainNumber": "T005",
      "conflictType": "fitness_expired",
      "severity": "critical",
      "description": "Telecom fitness certificate expired",
      "suggestedResolution": "Move train to IBL for certificate renewal",
      "detectedAt": "2024-01-15T21:45:00Z"
    }
  ],
  "summary": {
    "critical": 2,
    "high": 5,
    "medium": 8,
    "low": 3
  }
}
```

#### 4.3.4 `GET /api/v1/dashboard/digital-twin`
**Purpose**: Get depot geometry data for 3D visualization
```json
Response:
{
  "depots": [
    {
      "depotId": 1,
      "depotName": "Main Depot",
      "bays": [
        {
          "bayNumber": "B01",
          "position": { "x": 0, "y": 0, "z": 0 },
          "trainId": 1,
          "trainNumber": "T001",
          "status": "stabled"
        }
      ],
      "geometry": {
        "bounds": { "width": 500, "length": 800, "height": 10 },
        "entryPoints": [...],
        "shuntingPaths": [...]
      }
    }
  ]
}
```

#### 4.3.5 `POST /api/v1/dashboard/natural-language`
**Purpose**: Process natural language queries (Malayalam/Hindi/English)
```json
Request Body:
{
  "query": "എത്ര ട്രെയിനുകൾ നാളെ സേവനത്തിന് തയ്യാറാണ്?",
  "language": "malayalam"
}

Response:
{
  "success": true,
  "interpretedQuery": "How many trains are ready for service tomorrow?",
  "response": "20 trains are ready for revenue service tomorrow. 3 on standby, 2 in maintenance.",
  "data": {
    "revenueReady": 20,
    "standby": 3,
    "maintenance": 2
  }
}
```

### 4.4 Historical Data APIs

#### 4.4.1 `GET /api/v1/history/decisions`
**Purpose**: Get historical decision data for ML training
```json
Query Parameters:
- startDate: YYYY-MM-DD
- endDate: YYYY-MM-DD
- trainId: integer (optional)

Response:
{
  "decisions": [
    {
      "decisionId": 123,
      "decisionDate": "2024-01-10",
      "trainId": 1,
      "decisionType": "revenue",
      "decisionScore": 92.5,
      "reasoningDetails": {...},
      "outcome": {
        "status": "success",
        "punctualityImpact": 0.0,
        "issues": []
      }
    }
  ]
}
```

#### 4.4.2 `POST /api/v1/history/feedback`
**Purpose**: Submit decision outcome feedback for learning loop
```json
Request Body:
{
  "decisionId": 123,
  "outcomeStatus": "success",
  "punctualityImpact": 0.0,
  "actualMileage": 450.5,
  "issuesEncountered": "",
  "feedbackScore": 9,
  "feedbackNotes": "Smooth operation, no issues"
}

Response:
{
  "success": true,
  "feedbackId": 456,
  "learningTriggered": true
}
```

---

## 5. Groq LLM Integration

### 5.1 Configuration
```javascript
// config/groq.js
const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const MODEL = 'llama3-70b-8192'; // Llama 3 70B model
```

### 5.2 Response Organization Service
```javascript
// services/llmService.js

async function organizeAgentResponse(agentResponse, context) {
  const prompt = `
You are an AI assistant explaining train induction decisions for Kochi Metro.

Agent Analysis:
${JSON.stringify(agentResponse, null, 2)}

Context:
- Decision Date: ${context.decisionDate}
- Total Trains: ${context.totalTrains}
- Requirements: 99.5% punctuality target

Generate a clear, explainable reasoning summary in the following format:
1. Primary Recommendation (revenue/standby/maintenance)
2. Key Factors (list top 3-5 factors)
3. Risk Assessment (any concerns)
4. Alternative Considerations (what-if scenarios)

Use simple, clear language that supervisors can understand.
`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: MODEL,
    temperature: 0.3,
    max_tokens: 1000
  });

  return completion.choices[0].message.content;
}
```

### 5.3 Natural Language Query Processing
```javascript
async function processNaturalLanguageQuery(query, language) {
  const prompt = `
Translate and process this ${language} query about train operations:
"${query}"

Determine the intent and extract parameters:
- Query type: (status_check, decision_query, conflict_check, etc.)
- Parameters: (train numbers, dates, etc.)
- Response format needed: (list, summary, detailed)

Respond in JSON format.
`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: MODEL,
    temperature: 0.2,
    response_format: { type: 'json_object' }
  });

  return JSON.parse(completion.choices[0].message.content);
}
```

---

## 6. Data Validation & Quality Assurance

### 6.1 Input Validation Schemas
```javascript
// validators/trainValidator.js
const Joi = require('joi');

const fitnessCertificateSchema = Joi.object({
  trainNumber: Joi.string().required(),
  department: Joi.string().valid('rolling_stock', 'signalling', 'telecom').required(),
  certificateNumber: Joi.string().required(),
  issuedDate: Joi.date().required(),
  expiryDate: Joi.date().greater(Joi.ref('issuedDate')).required()
});

const jobCardSchema = Joi.object({
  maximoJobNumber: Joi.string().required(),
  trainNumber: Joi.string().required(),
  jobType: Joi.string().valid('preventive', 'corrective', 'inspection').required(),
  priority: Joi.string().valid('critical', 'high', 'medium', 'low').required(),
  status: Joi.string().valid('open', 'in_progress', 'closed', 'cancelled').required()
});
```

### 6.2 Data Consistency Checks
```javascript
// services/dataQualityService.js

async function validateTrainReadiness(trainId) {
  const issues = [];
  
  // Check fitness certificates
  const certificates = await getFitnessCertificates(trainId);
  const expired = certificates.filter(c => c.validityStatus === 'expired');
  if (expired.length > 0) {
    issues.push({
      type: 'fitness_expired',
      severity: 'critical',
      details: expired
    });
  }
  
  // Check critical job cards
  const criticalJobs = await getCriticalJobCards(trainId);
  if (criticalJobs.length > 0) {
    issues.push({
      type: 'critical_job_open',
      severity: 'high',
      details: criticalJobs
    });
  }
  
  return issues;
}
```

---

## 7. Integration Points

### 7.1 IBM Maximo Integration
- **Mock Implementation**: For prototype, create mock API endpoints
- **Production**: REST API integration with Maximo system
- **Sync Frequency**: Real-time webhooks + hourly batch sync
- **Error Handling**: Retry logic with exponential backoff

### 7.2 IoT Data Integration
- **Endpoints**: `/api/v1/ingestion/iot/:sensorType`
- **Supported Types**: UNS, CBM, SCADA
- **Processing**: Real-time stream processing with validation
- **Storage**: Time-series data in PostgreSQL with partitioning

### 7.3 WhatsApp Log Processing
- **NLP Extraction**: Use spaCy/NLTK for text parsing
- **Pattern Recognition**: Train models on historical WhatsApp logs
- **Manual Override**: Allow supervisor confirmation of extracted data

---

## 8. Real-time Communication

### 8.1 WebSocket Implementation
```javascript
// websocket/decisionSocket.js
const io = require('socket.io')(server);

io.on('connection', (socket) => {
  socket.on('subscribe-decisions', (date) => {
    socket.join(`decisions-${date}`);
  });
  
  socket.on('subscribe-conflicts', () => {
    socket.join('conflicts');
  });
});

// Broadcast decision updates
function broadcastDecisionUpdate(decision) {
  io.to(`decisions-${decision.decisionDate}`).emit('decision-updated', decision);
}

// Broadcast conflict alerts
function broadcastConflictAlert(conflict) {
  io.to('conflicts').emit('conflict-detected', conflict);
}
```

---

## 9. Performance Optimization

### 9.1 Database Indexing Strategy
- Index all foreign keys
- Composite indexes on frequently queried combinations
- Partition large tables (decision_history, mileage_tracking) by date

### 9.2 Caching Strategy
- Redis cache for frequently accessed data:
  - Current induction list (TTL: 5 minutes)
  - Train status summaries (TTL: 1 minute)
  - Conflict alerts (TTL: 30 seconds)

### 9.3 Query Optimization
- Use connection pooling (max 20 connections)
- Implement pagination for large result sets
- Use prepared statements for repeated queries

---

## 10. Security & Compliance

### 10.1 Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC):
  - `supervisor`: Read decisions, submit feedback
  - `admin`: Override decisions, system configuration
  - `system`: Agent communication, automated ingestion

### 10.2 Audit Trail
- Log all decision changes
- Track manual overrides with user ID and timestamp
- Immutable decision history for regulatory compliance

### 10.3 Data Encryption
- Encrypt sensitive data at rest (PostgreSQL encryption)
- TLS 1.3 for all API communications
- Secure API key storage (environment variables)

---

## 11. Testing Requirements

### 11.1 Unit Tests
- API endpoint validation
- Database query functions
- LLM service integration
- Data validation schemas

### 11.2 Integration Tests
- End-to-end agent communication flow
- Frontend API integration
- Database transaction handling
- WebSocket real-time updates

### 11.3 Performance Tests
- Load testing: 100 concurrent requests
- Response time: <10 seconds for decision queries
- Database query performance: <500ms for complex joins

---

## 12. Deployment Considerations

### 12.1 Environment Configuration
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/kmrl_db
GROQ_API_KEY=your_groq_api_key
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
```

### 12.2 Scalability
- Horizontal scaling with load balancer
- Database read replicas for reporting queries
- Microservices can be deployed independently

### 12.3 Monitoring
- Application performance monitoring (APM)
- Database query performance tracking
- API response time metrics
- Error rate monitoring

---

## 13. Integration with Other Phases

### 13.1 Agent Phase Integration
- **Reference**: See `docs/AGENT_PHASE.md`
- **APIs**: `/api/v1/agents/*` endpoints
- **Data Flow**: Agents query backend → Backend returns data → Agents process → Submit decisions

### 13.2 Frontend Phase Integration
- **Reference**: See `docs/FRONTEND_PHASE.md`
- **APIs**: `/api/v1/dashboard/*` endpoints
- **Real-time**: WebSocket connections for live updates

### 13.3 ML Models Phase Integration
- **Reference**: See `docs/ML_MODELS_PHASE.md`
- **Data Export**: Historical decision data via `/api/v1/history/*`
- **Feedback Loop**: Learning feedback via `/api/v1/history/feedback`

---

## 14. Wow Factor Implementation

### 14.1 Real-time Data Streaming
- WebSocket streaming of data ingestion events
- Animated progress indicators for agent processing
- Live conflict detection notifications

### 14.2 Natural Language Interface Backend
- Groq LLM processing for Malayalam/Hindi queries
- Multi-language support with translation
- Voice command processing (via frontend speech-to-text)

### 14.3 Gamification Backend Logic
- Scoring system for decision accuracy
- Achievement tracking in database
- Leaderboard calculations
- Badge assignment logic

---

## 15. Success Criteria Checklist

- [ ] All 12 database tables implemented with proper indexes
- [ ] All API endpoints functional and documented
- [ ] Groq LLM integration working for response organization
- [ ] Real-time WebSocket communication operational
- [ ] Data validation and quality checks implemented
- [ ] Integration with Agent Phase (LangGraph) tested
- [ ] Integration with Frontend Phase tested
- [ ] Integration with ML Models Phase (feedback loop) tested
- [ ] Performance targets met (<10s response time)
- [ ] Security and audit trail implemented
- [ ] Scalability tested for 40 trainsets and 2 depots

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-15  
**Next Review**: After Agent Phase integration testing