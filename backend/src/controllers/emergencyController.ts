import { Request, Response } from 'express';
import logger from '../utils/logger';
import { emergencyService } from '../services/emergencyService';
import { crisisModeService } from '../services/crisisModeService';
import { notificationService } from '../services/notificationService';
import {
  emergencyBreakdownSchema,
  emergencyPlanApprovalSchema,
  routeReassignmentSchema,
  frequencyReductionSchema,
} from '../utils/emergencyValidators';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Handle emergency breakdown alert from IoT sensors
 * POST /api/v1/emergency/breakdown
 */
export async function handleEmergencyBreakdown(req: Request, res: Response) {
  try {
    const validated = emergencyBreakdownSchema.parse(req.body);

    const result = await emergencyService.handleEmergencyBreakdown(validated);

    // Check for cascading crisis
    const isCrisis = await emergencyService.detectCascadingCrisis();
    if (isCrisis) {
      await emergencyService.activateCrisisMode([validated.train_id]);
    }

    res.status(201).json({
      success: true,
      ...result,
      crisisMode: isCrisis,
      message: isCrisis
        ? 'Emergency logged. Crisis mode activated due to multiple failures.'
        : 'Emergency logged and replanning initiated.',
    });
  } catch (error: any) {
    logger.error('Error handling emergency breakdown:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to handle emergency breakdown',
    });
  }
}

/**
 * Get emergency plan by emergency log ID
 * GET /api/v1/emergency/plan/:emergencyLogId
 */
export async function getEmergencyPlan(req: Request, res: Response) {
  try {
    const emergencyLogId = parseInt(req.params.emergencyLogId, 10);

    if (isNaN(emergencyLogId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid emergency log ID',
      });
    }

    const plan = await emergencyService.getEmergencyPlan(emergencyLogId);

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Emergency plan not found',
      });
    }

    res.json({
      success: true,
      plan: {
        id: plan.id,
        type: plan.planType,
        withdrawnTrain: plan.withdrawnTrain?.trainNumber,
        replacementTrain: plan.replacementTrain?.trainNumber,
        deploymentTimeMinutes: plan.deploymentTimeMinutes,
        routeAssignment: plan.routeAssignment,
        confidenceScore: plan.confidenceScore,
        reasoning: plan.reasoning,
        executionSteps: plan.executionSteps,
        impactMitigation: plan.impactMitigation,
        fallbackOptions: plan.fallbackOptions,
        status: plan.status,
        createdAt: plan.createdAt,
      },
    });
  } catch (error: any) {
    logger.error('Error getting emergency plan:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get emergency plan',
    });
  }
}

/**
 * Approve and execute emergency plan
 * POST /api/v1/emergency/plan/approve
 */
export async function approveEmergencyPlan(req: Request, res: Response) {
  try {
    const validated = emergencyPlanApprovalSchema.parse(req.body);
    const { planId, approved, approvedBy, notes } = validated;

    const plan = await prisma.emergencyPlan.findUnique({
      where: { id: planId },
      include: {
        replacementTrain: true,
        withdrawnTrain: true,
      },
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Emergency plan not found',
      });
    }

    if (approved) {
      // Execute the plan
      if (plan.replacementTrainId) {
        await prisma.trainset.update({
          where: { id: plan.replacementTrainId },
          data: { currentStatus: 'IN_SERVICE' },
        });

        // Create route assignment
        if (plan.routeAssignment) {
          await prisma.routeAssignment.create({
            data: {
              trainId: plan.replacementTrainId,
              routeNumber: plan.routeAssignment,
              assignmentType: 'revenue',
              assignedDate: new Date(),
              assignedTime: new Date(),
              priority: 'high',
              status: 'active',
            },
          });
        }
      }

      await prisma.emergencyPlan.update({
        where: { id: planId },
        data: {
          status: 'approved',
          approvedBy,
          approvedAt: new Date(),
          executedAt: new Date(),
        },
      });

      // Send notification
      await notificationService.sendCriticalAlert({
        severity: 'HIGH',
        title: 'Emergency Plan Executed',
        message: `Emergency replacement plan approved and executed. Train ${plan.replacementTrain?.trainNumber} deployed.`,
        trainId: plan.replacementTrainId?.toString(),
        trainNumber: plan.replacementTrain?.trainNumber,
        timestamp: new Date(),
        recipients: ['Operations_Controller', 'Supervisor'],
        channels: ['WebSocket', 'SMS'],
      });
    } else {
      await prisma.emergencyPlan.update({
        where: { id: planId },
        data: {
          status: 'rejected',
          approvedBy,
          approvedAt: new Date(),
        },
      });
    }

    res.json({
      success: true,
      message: approved ? 'Emergency plan approved and executed' : 'Emergency plan rejected',
    });
  } catch (error: any) {
    logger.error('Error approving emergency plan:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to approve emergency plan',
    });
  }
}

/**
 * Get active emergencies
 * GET /api/v1/emergency/active
 */
export async function getActiveEmergencies(req: Request, res: Response) {
  try {
    const emergencies = await emergencyService.getActiveEmergencies();

    res.json({
      success: true,
      emergencies: emergencies.map((emergency) => ({
        id: emergency.id,
        trainId: emergency.train.id,
        trainNumber: emergency.train.trainNumber,
        eventType: emergency.eventType,
        timestamp: emergency.timestamp,
        location: emergency.location,
        faultCode: emergency.faultCode,
        severity: emergency.severity,
        routeAffected: emergency.routeAffected,
        status: emergency.status,
        plan: emergency.emergencyPlans[0]
          ? {
              id: emergency.emergencyPlans[0].id,
              replacementTrain: emergency.emergencyPlans[0].replacementTrain?.trainNumber,
              status: emergency.emergencyPlans[0].status,
            }
          : null,
      })),
    });
  } catch (error: any) {
    logger.error('Error getting active emergencies:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get active emergencies',
    });
  }
}

/**
 * Get crisis mode status
 * GET /api/v1/emergency/crisis
 */
export async function getCrisisMode(req: Request, res: Response) {
  try {
    const crisis = await crisisModeService.getActiveCrisis();

    if (!crisis) {
      return res.json({
        success: true,
        crisis: null,
        message: 'No active crisis mode',
      });
    }

    res.json({
      success: true,
      crisis: {
        crisisId: crisis.crisisId,
        activatedAt: crisis.activatedAt,
        withdrawalCount: crisis.withdrawalCount,
        serviceDeficit: crisis.serviceDeficit,
        status: crisis.status,
        actions: crisis.actions,
        withdrawnTrains: crisis.withdrawnTrains || [],
        projectedRecoveryTime: crisis.projectedRecoveryTime,
      },
    });
  } catch (error: any) {
    logger.error('Error getting crisis mode:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get crisis mode',
    });
  }
}

/**
 * Trigger full fleet reoptimization
 * POST /api/v1/emergency/crisis/reoptimize
 */
export async function triggerFullFleetReoptimization(req: Request, res: Response) {
  try {
    const plan = await crisisModeService.fullFleetReoptimization();

    res.json({
      success: true,
      plan,
      message: 'Full fleet reoptimization completed',
    });
  } catch (error: any) {
    logger.error('Error in full fleet reoptimization:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to reoptimize fleet',
    });
  }
}

/**
 * Reassign train route
 * POST /api/v1/emergency/route/reassign
 */
export async function reassignRoute(req: Request, res: Response) {
  try {
    const validated = routeReassignmentSchema.parse(req.body);

    // End current route assignment
    if (validated.fromRoute) {
      await prisma.routeAssignment.updateMany({
        where: {
          trainId: validated.trainId,
          routeNumber: validated.fromRoute,
          status: 'active',
        },
        data: {
          status: 'inactive',
          endedAt: new Date(),
        },
      });
    }

    // Create new route assignment
    const newAssignment = await prisma.routeAssignment.create({
      data: {
        trainId: validated.trainId,
        routeNumber: validated.toRoute,
        assignmentType: 'reassigned',
        assignedDate: new Date(),
        assignedTime: new Date(),
        priority: validated.priority || 'high',
        status: 'active',
        notes: validated.reason,
      },
    });

    res.json({
      success: true,
      assignment: newAssignment,
      message: 'Route reassignment completed',
    });
  } catch (error: any) {
    logger.error('Error reassigning route:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to reassign route',
    });
  }
}

/**
 * Reduce service frequency
 * POST /api/v1/emergency/frequency/reduce
 */
export async function reduceFrequency(req: Request, res: Response) {
  try {
    const validated = frequencyReductionSchema.parse(req.body);

    await crisisModeService.reduceServiceFrequency(
      validated.routes,
      validated.newFrequencyMinutes,
      validated.durationHours
    );

    // Send public announcement
    await notificationService.sendPublicAnnouncement(
      `Service delays on routes ${validated.routes.join(', ')} due to technical issues. Frequency temporarily reduced to ${validated.newFrequencyMinutes} minutes.`,
      ['Metro_App', 'Station_Displays']
    );

    res.json({
      success: true,
      message: `Service frequency reduced on routes ${validated.routes.join(', ')}`,
    });
  } catch (error: any) {
    logger.error('Error reducing frequency:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to reduce frequency',
    });
  }
}

/**
 * Resolve emergency
 * POST /api/v1/emergency/:emergencyLogId/resolve
 */
export async function resolveEmergency(req: Request, res: Response) {
  try {
    const emergencyLogId = parseInt(req.params.emergencyLogId, 10);
    const { resolutionNotes } = req.body;

    if (isNaN(emergencyLogId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid emergency log ID',
      });
    }

    await prisma.emergencyLog.update({
      where: { id: emergencyLogId },
      data: {
        status: 'resolved',
        resolvedAt: new Date(),
        resolutionNotes: resolutionNotes || 'Emergency resolved',
      },
    });

    res.json({
      success: true,
      message: 'Emergency marked as resolved',
    });
  } catch (error: any) {
    logger.error('Error resolving emergency:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to resolve emergency',
    });
  }
}


