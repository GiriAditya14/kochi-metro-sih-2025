import { z } from 'zod';

/**
 * Emergency Breakdown Alert Schema
 */
export const emergencyBreakdownSchema = z.object({
  event_type: z.literal('EMERGENCY_BREAKDOWN'),
  train_id: z.string().min(1, 'Train ID is required'),
  timestamp: z.string().datetime('Invalid timestamp format'),
  location: z.string().min(1, 'Location is required'),
  fault_code: z.string().min(1, 'Fault code is required'),
  severity: z.enum(['CRITICAL', 'HIGH', 'MODERATE']),
  passengers_onboard: z.number().int().positive().optional(),
  immediate_action_required: z.string().min(1, 'Action required is mandatory'),
  route_affected: z.string().optional(),
});

/**
 * Emergency Plan Approval Schema
 */
export const emergencyPlanApprovalSchema = z.object({
  planId: z.number().int().positive(),
  approved: z.boolean(),
  approvedBy: z.string().min(1, 'Approver name is required'),
  notes: z.string().optional(),
});

/**
 * Crisis Mode Activation Schema
 */
export const crisisModeSchema = z.object({
  crisisId: z.string().optional(),
  withdrawalCount: z.number().int().nonnegative(),
  serviceDeficit: z.number().int(),
});

/**
 * Route Reassignment Schema
 */
export const routeReassignmentSchema = z.object({
  trainId: z.number().int().positive(),
  fromRoute: z.string().optional(),
  toRoute: z.string().min(1, 'Target route is required'),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  reason: z.string().optional(),
});

/**
 * Service Frequency Reduction Schema
 */
export const frequencyReductionSchema = z.object({
  routes: z.array(z.string()).min(1, 'At least one route required'),
  newFrequencyMinutes: z.number().int().positive(),
  durationHours: z.number().int().positive(),
});

export type EmergencyBreakdownInput = z.infer<typeof emergencyBreakdownSchema>;
export type EmergencyPlanApprovalInput = z.infer<typeof emergencyPlanApprovalSchema>;
export type CrisisModeInput = z.infer<typeof crisisModeSchema>;
export type RouteReassignmentInput = z.infer<typeof routeReassignmentSchema>;
export type FrequencyReductionInput = z.infer<typeof frequencyReductionSchema>;


