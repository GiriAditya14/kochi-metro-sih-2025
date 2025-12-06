export type RecommendedAction = 'revenue' | 'standby' | 'maintenance';

export interface ReasoningDetails {
  fitness?: { status: string; score: number; details: string };
  jobCards?: { status: string; score: number; details: string };
  branding?: { priority: string; score: number; details: string };
  mileage?: { balance: string; score: number; details: string };
  cleaning?: { status: string; score: number; details: string };
  stabling?: { position: string; score: number; details: string };
}

export interface Conflict {
  id: number;
  trainId: number;
  trainNumber: string;
  conflictType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  suggestedResolution?: string;
  detectedAt: string;
}

export interface TrainDecision {
  trainId: number;
  trainNumber: string;
  recommendedAction: RecommendedAction;
  priorityScore: number;
  reasoning?: string;
  reasoningDetails?: ReasoningDetails;
  conflicts?: Conflict[];
}

export interface InductionListResponse {
  decisionDate: string;
  generatedAt: string;
  trains: TrainDecision[];
  summary: {
    totalTrains: number;
    revenueReady: number;
    standby: number;
    maintenance: number;
  };
}

export interface Emergency {
  id: number;
  trainId: number;
  trainNumber: string;
  eventType: string;
  timestamp: string;
  location?: string;
  faultCode?: string;
  severity: string;
  routeAffected?: string;
  status: string;
  plan?: {
    id: number;
    replacementTrain?: string;
    status: string;
  };
}

export interface EmergencyPlan {
  id: number;
  type: string;
  withdrawnTrain?: string;
  replacementTrain?: string;
  deploymentTimeMinutes?: number;
  routeAssignment?: string;
  confidenceScore?: number;
  reasoning?: string;
  executionSteps?: string[];
  impactMitigation?: string;
  fallbackOptions?: string[];
  status: string;
  createdAt: string;
}

