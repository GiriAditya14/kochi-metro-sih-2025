# Backend API Routes Documentation

This document provides a comprehensive reference for all backend API routes for frontend engineers.

**Base URL**: `http://localhost:3000` (development)  
**API Version**: `v1`  
**Rate Limiting**: 100 requests per 15 minutes per IP

---

## Table of Contents

1. [Health Check](#health-check)
2. [Data Ingestion Routes](#data-ingestion-routes)
3. [Agent Routes](#agent-routes)
4. [Dashboard Routes](#dashboard-routes)
5. [History Routes](#history-routes)
6. [Emergency Routes](#emergency-routes)
7. [WebSocket Events](#websocket-events)

---

## Health Check

### GET `/health`

Check if the server is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Data Ingestion Routes

Base path: `/api/v1/ingestion`

### POST `/api/v1/ingestion/maximo`

Ingest Maximo job cards data.

**Request Body:**
```json
{
  "jobCards": [
    {
      "maximoJobNumber": "string (required)",
      "trainNumber": "string (required)",
      "jobType": "preventive" | "corrective" | "inspection",
      "priority": "critical" | "high" | "medium" | "low",
      "status": "open" | "in_progress" | "closed" | "cancelled",
      "description": "string (optional)",
      "assignedTo": "string (optional)",
      "openedDate": "ISO 8601 datetime (optional)",
      "closedDate": "ISO 8601 datetime (optional)",
      "estimatedCompletionDate": "ISO 8601 datetime (optional)"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "processed": 5,
  "failed": 0,
  "message": "Job cards ingested successfully"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Invalid request data"
}
```

---

### POST `/api/v1/ingestion/fitness-certificate`

Update fitness certificate information.

**Request Body:**
```json
{
  "trainNumber": "string (required)",
  "department": "rolling_stock" | "signalling" | "telecom",
  "certificateNumber": "string (optional)",
  "issuedDate": "YYYY-MM-DD (required)",
  "expiryDate": "YYYY-MM-DD (required)",
  "issuedBy": "string (optional)",
  "notes": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "certificateId": 123,
  "validityStatus": "valid" | "expiring_soon" | "expired"
}
```

**Error Responses:**
- `404`: Train not found
- `400`: Invalid request data

---

### POST `/api/v1/ingestion/mileage`

Record mileage data for a train.

**Request Body:**
```json
{
  "trainNumber": "string (required)",
  "recordedDate": "YYYY-MM-DD (required)",
  "dailyMileage": "number (required, non-negative)",
  "componentType": "bogie" | "brake_pad" | "hvac" | "overall" (optional, default: "overall")
}
```

**Response:**
```json
{
  "success": true,
  "cumulativeMileage": 15000.5
}
```

**Error Responses:**
- `404`: Train not found
- `400`: Invalid request data

---

### POST `/api/v1/ingestion/whatsapp-log`

Process WhatsApp log data and extract structured information.

**Request Body:**
```json
{
  "rawText": "string (required)",
  "timestamp": "ISO 8601 datetime (required)",
  "source": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "extractedData": {
    // Extracted structured data from WhatsApp log
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Invalid request data"
}
```

---

## Agent Routes

Base path: `/api/v1/agents`

### POST `/api/v1/agents/query`

Query agent data for specific agent types.

**Request Body:**
```json
{
  "agentType": "string (required)",
  "query": "string (required)",
  "parameters": {
    // Optional parameters object
    "daysAhead": 7,
    "priority": "high"
  }
}
```

**Supported Agent Types:**
- `fitness_certificate`
  - Query: `get_all_expiring_certificates`
  - Parameters: `{ daysAhead?: number }`
- `job_card`
  - Query: `get_open_job_cards`
  - Parameters: `{ priority?: "critical" | "high" | "medium" | "low" }`
- `branding`
  - Query: `get_active_contracts`

**Response:**
```json
{
  "success": true,
  "data": [
    // Array of results based on agent type and query
  ]
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Unknown agent type: {agentType}"
}
```

---

### GET `/api/v1/agents/train-status/:trainId`

Get comprehensive status for a specific train.

**URL Parameters:**
- `trainId`: number (required)

**Response:**
```json
{
  "trainId": 1,
  "trainNumber": "T001",
  "fitnessCertificates": [...],
  "jobCards": [...],
  "brandingContracts": [...],
  "mileageData": [...],
  "cleaningSlots": [...],
  "stablingGeometry": {...} | null
}
```

**Error Responses:**
- `404`: Train not found
- `500`: Internal server error

---

### POST `/api/v1/agents/decision-submit`

Submit agent decisions/recommendations.

**Request Body:**
```json
{
  "decisionDate": "YYYY-MM-DD (required)",
  "recommendations": [
    {
      "trainId": "number (required)",
      "trainNumber": "string (required)",
      "recommendedAction": "revenue" | "standby" | "maintenance",
      "score": "number (required, 0-100)",
      "reasoning": {
        // Object with reasoning details
      }
    }
  ],
  "conflicts": [
    // Optional array of conflicts
  ]
}
```

**Response:**
```json
{
  "success": true,
  "decisionId": 123,
  "processed": 5
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Invalid request data"
}
```

---

## Dashboard Routes

Base path: `/api/v1/dashboard`

### GET `/api/v1/dashboard/induction-list`

Get ranked induction list for a specific date.

**Query Parameters:**
- `date`: string (optional, format: YYYY-MM-DD, default: today)
- `includeReasoning`: boolean (optional, default: false)

**Response:**
```json
{
  "decisionDate": "2024-01-01",
  "generatedAt": "2024-01-01T00:00:00.000Z",
  "trains": [
    {
      "trainId": 1,
      "trainNumber": "T001",
      "recommendedAction": "revenue" | "standby" | "maintenance",
      "priorityScore": 85.5,
      "reasoning": "string (if includeReasoning=true)",
      "reasoningDetails": "object (if includeReasoning=true)",
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

**Error Response (500):**
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

### POST `/api/v1/dashboard/what-if`

Run what-if simulation scenario.

**Request Body:**
```json
{
  "scenario": {
    "removeTrain": "string (optional, train number)",
    "addMaintenance": ["string"] (optional, array of train numbers),
    "changeBrandingPriority": {
      "trainNumber": "priority"
    } (optional)
  },
  "targetDate": "YYYY-MM-DD (required)"
}
```

**Response:**
```json
{
  "success": true,
  "simulationId": "sim-1234567890",
  "results": {
    "newInductionList": [],
    "impactAnalysis": {
      "punctualityImpact": -0.2,
      "brandingBreaches": 0,
      "mileageImbalance": "moderate",
      "conflicts": []
    },
    "recommendations": [
      "Consider moving T012 to revenue to compensate for removed train"
    ]
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Invalid request data"
}
```

---

### GET `/api/v1/dashboard/conflicts`

Get all active conflict alerts.

**Response:**
```json
{
  "conflicts": [
    {
      "id": 1,
      "trainId": 1,
      "trainNumber": "T001",
      "conflictType": "string",
      "severity": "critical" | "high" | "medium" | "low",
      "description": "string",
      "suggestedResolution": "string",
      "detectedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "summary": {
    "critical": 2,
    "high": 5,
    "medium": 10,
    "low": 3
  }
}
```

**Error Response (500):**
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

### GET `/api/v1/dashboard/digital-twin`

Get depot geometry and digital twin data.

**Response:**
```json
{
  "depots": [
    {
      "depotId": 1,
      "depotName": "Depot A",
      "bays": [
        {
          "bayNumber": "A1",
          "position": {
            "x": 0,
            "y": 0,
            "z": 0
          },
          "trainId": 1,
          "trainNumber": "T001",
          "status": "IN_SERVICE"
        }
      ],
      "geometry": {
        "bounds": {
          "width": 500,
          "length": 800,
          "height": 10
        },
        "entryPoints": [],
        "shuntingPaths": []
      }
    }
  ]
}
```

**Error Response (500):**
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

### POST `/api/v1/dashboard/natural-language`

Process natural language queries.

**Request Body:**
```json
{
  "query": "string (required)",
  "language": "malayalam" | "hindi" | "english" (optional, default: "english")
}
```

**Response:**
```json
{
  "success": true,
  "interpretedQuery": "status_check",
  "response": "20 trains are ready for revenue service tomorrow. 3 on standby, 2 in maintenance.",
  "data": {
    "revenueReady": 20,
    "standby": 3,
    "maintenance": 2
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Invalid request data"
}
```

---

## History Routes

Base path: `/api/v1/history`

### GET `/api/v1/history/decisions`

Get historical decisions with optional filters.

**Query Parameters:**
- `startDate`: string (optional, format: YYYY-MM-DD)
- `endDate`: string (optional, format: YYYY-MM-DD)
- `trainId`: number (optional)

**Response:**
```json
{
  "decisions": [
    {
      "decisionId": 1,
      "decisionDate": "2024-01-01",
      "trainId": 1,
      "trainNumber": "T001",
      "decisionType": "revenue" | "standby" | "maintenance",
      "decisionScore": 85.5,
      "reasoningDetails": "object",
      "outcome": {
        "status": "success" | "failure" | "partial",
        "punctualityImpact": 0.05,
        "issues": "string"
      } | null
    }
  ]
}
```

**Error Response (500):**
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

### POST `/api/v1/history/feedback`

Submit feedback on a decision outcome.

**Request Body:**
```json
{
  "decisionId": "number (required)",
  "outcomeStatus": "success" | "failure" | "partial",
  "punctualityImpact": "number (optional)",
  "actualMileage": "number (optional)",
  "issuesEncountered": "string (optional)",
  "feedbackScore": "number (optional, 1-10)",
  "feedbackNotes": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "feedbackId": 123,
  "learningTriggered": true
}
```

**Error Responses:**
- `404`: Decision not found
- `400`: Invalid request data

---

## Emergency Routes

Base path: `/api/v1/emergency`

### POST `/api/v1/emergency/breakdown`

Handle emergency breakdown alert from IoT sensors.

**Request Body:**
```json
{
  "event_type": "EMERGENCY_BREAKDOWN",
  "train_id": "string (required)",
  "timestamp": "ISO 8601 datetime (required)",
  "location": "string (required)",
  "fault_code": "string (required)",
  "severity": "CRITICAL" | "HIGH" | "MODERATE",
  "passengers_onboard": "number (optional, positive integer)",
  "immediate_action_required": "string (required)",
  "route_affected": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "emergencyLogId": 123,
  "planGenerated": true,
  "planId": 456,
  "crisisMode": false,
  "message": "Emergency logged and replanning initiated."
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Failed to handle emergency breakdown"
}
```

---

### GET `/api/v1/emergency/plan/:emergencyLogId`

Get emergency plan by emergency log ID.

**URL Parameters:**
- `emergencyLogId`: number (required)

**Response:**
```json
{
  "success": true,
  "plan": {
    "id": 123,
    "type": "replacement" | "route_reassignment" | "frequency_reduction",
    "withdrawnTrain": "T001",
    "replacementTrain": "T002",
    "deploymentTimeMinutes": 15,
    "routeAssignment": "R1",
    "confidenceScore": 0.85,
    "reasoning": "string",
    "executionSteps": ["step1", "step2"],
    "impactMitigation": "string",
    "fallbackOptions": ["option1"],
    "status": "pending" | "approved" | "rejected" | "executed",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400`: Invalid emergency log ID
- `404`: Emergency plan not found
- `500`: Failed to get emergency plan

---

### POST `/api/v1/emergency/plan/approve`

Approve and execute emergency plan.

**Request Body:**
```json
{
  "planId": "number (required, positive integer)",
  "approved": "boolean (required)",
  "approvedBy": "string (required)",
  "notes": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Emergency plan approved and executed" | "Emergency plan rejected"
}
```

**Error Responses:**
- `404`: Emergency plan not found
- `500`: Failed to approve emergency plan

---

### GET `/api/v1/emergency/active`

Get all active emergencies.

**Response:**
```json
{
  "success": true,
  "emergencies": [
    {
      "id": 1,
      "trainId": 1,
      "trainNumber": "T001",
      "eventType": "EMERGENCY_BREAKDOWN",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "location": "string",
      "faultCode": "string",
      "severity": "CRITICAL" | "HIGH" | "MODERATE",
      "routeAffected": "string",
      "status": "active" | "resolved",
      "plan": {
        "id": 123,
        "replacementTrain": "T002",
        "status": "pending"
      } | null
    }
  ]
}
```

**Error Response (500):**
```json
{
  "success": false,
  "error": "Failed to get active emergencies"
}
```

---

### POST `/api/v1/emergency/:emergencyLogId/resolve`

Resolve an emergency.

**URL Parameters:**
- `emergencyLogId`: number (required)

**Request Body:**
```json
{
  "resolutionNotes": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Emergency marked as resolved"
}
```

**Error Responses:**
- `400`: Invalid emergency log ID
- `500`: Failed to resolve emergency

---

### GET `/api/v1/emergency/crisis`

Get crisis mode status.

**Response:**
```json
{
  "success": true,
  "crisis": {
    "crisisId": "string",
    "activatedAt": "2024-01-01T00:00:00.000Z",
    "withdrawalCount": 5,
    "serviceDeficit": 3,
    "status": "active" | "resolved",
    "actions": ["action1", "action2"],
    "withdrawnTrains": ["T001", "T002"],
    "projectedRecoveryTime": "2024-01-01T02:00:00.000Z"
  } | null,
  "message": "No active crisis mode" (if crisis is null)
}
```

**Error Response (500):**
```json
{
  "success": false,
  "error": "Failed to get crisis mode"
}
```

---

### POST `/api/v1/emergency/crisis/reoptimize`

Trigger full fleet reoptimization.

**Response:**
```json
{
  "success": true,
  "plan": {
    // Reoptimization plan object
  },
  "message": "Full fleet reoptimization completed"
}
```

**Error Response (500):**
```json
{
  "success": false,
  "error": "Failed to reoptimize fleet"
}
```

---

### POST `/api/v1/emergency/route/reassign`

Reassign train route.

**Request Body:**
```json
{
  "trainId": "number (required, positive integer)",
  "fromRoute": "string (optional)",
  "toRoute": "string (required)",
  "priority": "high" | "medium" | "low" (optional),
  "reason": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "assignment": {
    // Route assignment object
  },
  "message": "Route reassignment completed"
}
```

**Error Response (500):**
```json
{
  "success": false,
  "error": "Failed to reassign route"
}
```

---

### POST `/api/v1/emergency/frequency/reduce`

Reduce service frequency on specified routes.

**Request Body:**
```json
{
  "routes": ["string"] (required, at least one route),
  "newFrequencyMinutes": "number (required, positive integer)",
  "durationHours": "number (required, positive integer)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Service frequency reduced on routes R1, R2"
}
```

**Error Response (500):**
```json
{
  "success": false,
  "error": "Failed to reduce frequency"
}
```

---

## WebSocket Events

The backend uses Socket.IO for real-time updates. Connect to the same server URL.

### Client Events (Subscribe)

#### `subscribe-decisions`
Subscribe to decision updates for a specific date.

**Payload:**
```json
{
  "date": "YYYY-MM-DD"
}
```

#### `subscribe-conflicts`
Subscribe to conflict alerts.

**Payload:** None

#### `subscribe-emergencies`
Subscribe to emergency updates.

**Payload:** None

#### `subscribe-train-tracking`
Subscribe to train tracking updates.

**Payload:**
```json
{
  "trainId": "string"
}
```

#### `subscribe-public-announcements`
Subscribe to public announcements.

**Payload:** None

### Server Events (Receive)

The server will emit events to the subscribed rooms. Listen for events on the socket connection.

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

**HTTP Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors, invalid data)
- `404`: Not Found (resource doesn't exist)
- `500`: Internal Server Error

---

## Authentication

Currently, the API does not require authentication. This may change in future versions.

---

## CORS

CORS is enabled for the configured origin (default: `http://localhost:5173`). Make sure your frontend origin is whitelisted in the backend configuration.

---

## Notes for Frontend Engineers

1. **Date Formats**: All dates should be in `YYYY-MM-DD` format for date-only fields, and ISO 8601 datetime format for timestamp fields.

2. **Validation**: All request bodies are validated using Zod schemas. Invalid requests will return a `400` status with an error message.

3. **Rate Limiting**: The API is rate-limited to 100 requests per 15 minutes per IP address. Plan your requests accordingly.

4. **WebSocket**: Use Socket.IO client library to connect to the WebSocket server for real-time updates.

5. **Error Handling**: Always check the `success` field in responses. Even with a `200` status, the response may indicate failure.

6. **Pagination**: Currently, most list endpoints return all results. Pagination may be added in future versions.

---

## Example Usage

### Fetching Induction List

```typescript
const response = await fetch('http://localhost:3000/api/v1/dashboard/induction-list?date=2024-01-01&includeReasoning=true');
const data = await response.json();
```

### Submitting Emergency Breakdown

```typescript
const response = await fetch('http://localhost:3000/api/v1/emergency/breakdown', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    event_type: 'EMERGENCY_BREAKDOWN',
    train_id: 'T001',
    timestamp: new Date().toISOString(),
    location: 'Station A',
    fault_code: 'FAULT_001',
    severity: 'CRITICAL',
    immediate_action_required: 'Immediate withdrawal required',
    route_affected: 'R1'
  })
});
const data = await response.json();
```

### WebSocket Connection

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  socket.emit('subscribe-emergencies');
});

socket.on('emergency-update', (data) => {
  console.log('Emergency update:', data);
});
```

---

**Last Updated**: 2024-01-01  
**API Version**: 1.0.0

