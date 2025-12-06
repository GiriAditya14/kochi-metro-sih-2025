import { z } from 'zod';

// Fitness Certificate Schema
export const fitnessCertificateSchema = z.object({
  trainNumber: z.string().min(1),
  department: z.enum(['rolling_stock', 'signalling', 'telecom']),
  certificateNumber: z.string().optional(),
  issuedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  issuedBy: z.string().optional(),
  notes: z.string().optional(),
});

// Job Card Schema
export const jobCardSchema = z.object({
  maximoJobNumber: z.string().min(1),
  trainNumber: z.string().min(1),
  jobType: z.enum(['preventive', 'corrective', 'inspection']),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  status: z.enum(['open', 'in_progress', 'closed', 'cancelled']),
  description: z.string().optional(),
  assignedTo: z.string().optional(),
  openedDate: z.string().datetime().optional(),
  closedDate: z.string().datetime().optional(),
  estimatedCompletionDate: z.string().datetime().optional(),
});

// Maximo Ingestion Schema
export const maximoIngestionSchema = z.object({
  jobCards: z.array(jobCardSchema),
});

// Mileage Ingestion Schema
export const mileageIngestionSchema = z.object({
  trainNumber: z.string().min(1),
  recordedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dailyMileage: z.number().nonnegative(),
  componentType: z.enum(['bogie', 'brake_pad', 'hvac', 'overall']).optional(),
});

// WhatsApp Log Schema
export const whatsappLogSchema = z.object({
  rawText: z.string().min(1),
  timestamp: z.string().datetime(),
  source: z.string().optional(),
});

// Agent Query Schema
export const agentQuerySchema = z.object({
  agentType: z.string().min(1),
  query: z.string().min(1),
  parameters: z.record(z.any()).optional(),
});

// Decision Submit Schema
export const decisionSubmitSchema = z.object({
  decisionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  recommendations: z.array(
    z.object({
      trainId: z.number().int(),
      trainNumber: z.string(),
      recommendedAction: z.enum(['revenue', 'standby', 'maintenance']),
      score: z.number().min(0).max(100),
      reasoning: z.record(z.any()),
    })
  ),
  conflicts: z.array(z.any()).optional(),
});

// What-If Simulation Schema
export const whatIfSimulationSchema = z.object({
  scenario: z.object({
    removeTrain: z.string().optional(),
    addMaintenance: z.array(z.string()).optional(),
    changeBrandingPriority: z.record(z.string()).optional(),
  }),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// Natural Language Query Schema
export const naturalLanguageQuerySchema = z.object({
  query: z.string().min(1),
  language: z.enum(['malayalam', 'hindi', 'english']).default('english'),
});

// Feedback Schema
export const feedbackSchema = z.object({
  decisionId: z.number().int(),
  outcomeStatus: z.enum(['success', 'failure', 'partial']),
  punctualityImpact: z.number().optional(),
  actualMileage: z.number().optional(),
  issuesEncountered: z.string().optional(),
  feedbackScore: z.number().int().min(1).max(10).optional(),
  feedbackNotes: z.string().optional(),
});



