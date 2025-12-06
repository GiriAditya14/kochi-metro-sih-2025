import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';
import { notificationService } from './notificationService';
import { emergencyService } from './emergencyService';

const prisma = new PrismaClient();

export interface CrisisOptimizationPlan {
  mode: 'CRISIS_OPTIMIZATION';
  withdrawn_trains: number;
  available_replacements: number;
  service_deficit: number;
  actions: Array<{
    action: string;
    train_id?: string;
    from_route?: string;
    to_route?: string;
    priority?: string;
    reason?: string;
    affected_routes?: string[];
    new_frequency_minutes?: number;
    duration?: string;
    target_trains?: string[];
    additional_resources?: string;
    target_completion?: string;
  }>;
}

/**
 * Crisis Mode Service - Handles cascading failures and full fleet reoptimization
 */
class CrisisModeService {
  /**
   * Full fleet reoptimization in crisis mode
   */
  async fullFleetReoptimization(): Promise<CrisisOptimizationPlan> {
    logger.info('Starting full fleet reoptimization in crisis mode');

    try {
      // 1. Get current status
      const allTrains = await prisma.trainset.findMany({
        include: {
          routeAssignments: { where: { status: 'active' } },
          fitnessCertificates: true,
          jobCards: { where: { status: 'open' } },
        },
      });

      const inService = allTrains.filter(t => t.currentStatus === 'IN_SERVICE');
      const available = allTrains.filter(t => 
        ['STANDBY', 'DEPOT_READY'].includes(t.currentStatus)
      );
      const withdrawn = allTrains.filter(t => t.currentStatus === 'EMERGENCY_WITHDRAWN');

      // 2. Calculate service requirements
      const criticalRoutes = this.identifyCriticalRoutes();
      const minimumTrainsNeeded = this.calculateMinimumFleet(criticalRoutes);
      const serviceDeficit = Math.max(0, minimumTrainsNeeded - (inService.length + available.length));

      const crisisPlan: CrisisOptimizationPlan = {
        mode: 'CRISIS_OPTIMIZATION',
        withdrawn_trains: withdrawn.length,
        available_replacements: available.length,
        service_deficit: serviceDeficit,
        actions: [],
      };

      // Action 1: Deploy ALL available standby trains
      const eligibleStandby = await this.getEligibleReplacements(available);
      for (const train of eligibleStandby) {
        crisisPlan.actions.push({
          action: 'DEPLOY_STANDBY',
          train_id: train.trainNumber,
          priority: 'IMMEDIATE',
        });

        // Update train status to IN_SERVICE
        await prisma.trainset.update({
          where: { id: train.id },
          data: { currentStatus: 'IN_SERVICE' },
        });
      }

      // Action 2: Reassign trains from low-priority routes to high-priority routes
      let reassignedCount = 0;
      if (serviceDeficit > 0) {
        const lowPriorityTrains = this.getTrainsOnLowDemandRoutes(inService);
        reassignedCount = Math.min(serviceDeficit, lowPriorityTrains.length);

        for (let i = 0; i < reassignedCount; i++) {
          const train = lowPriorityTrains[i];
          const currentRoute = train.routeAssignments[0]?.routeNumber || 'Unknown';
          const targetRoute = criticalRoutes[0] || 'Route 1';

          crisisPlan.actions.push({
            action: 'REASSIGN_ROUTE',
            train_id: train.trainNumber,
            from_route: currentRoute,
            to_route: targetRoute,
            reason: 'Prioritize high-demand service',
          });

          // Update route assignment
          if (train.routeAssignments.length > 0) {
            await prisma.routeAssignment.updateMany({
              where: { trainId: train.id, status: 'active' },
              data: { status: 'inactive', endedAt: new Date() },
            });
          }

          await prisma.routeAssignment.create({
            data: {
              trainId: train.id,
              routeNumber: targetRoute,
              assignmentType: 'reassigned',
              assignedDate: new Date(),
              assignedTime: new Date(),
              priority: 'high',
              status: 'active',
            },
          });
        }
      }

      // Action 3: Temporary service frequency reduction
      const remainingDeficit = serviceDeficit - reassignedCount;
      if (remainingDeficit > 0) {
        const lowPriorityRoutes = ['Route 4', 'Route 5'];
        crisisPlan.actions.push({
          action: 'REDUCE_FREQUENCY',
          affected_routes: lowPriorityRoutes,
          new_frequency_minutes: 15, // From 10 minutes
          duration: '2 hours or until crisis resolved',
        });
      }

      // Action 4: Emergency maintenance acceleration
      const withdrawnTrainNumbers = withdrawn.map(t => t.trainNumber);
      crisisPlan.actions.push({
        action: 'EXPEDITE_REPAIRS',
        target_trains: withdrawnTrainNumbers,
        additional_resources: 'Call in off-duty technicians',
        target_completion: '2 hours',
      });

      // Update crisis mode with actions
      const activeCrisis = await prisma.crisisMode.findFirst({
        where: { status: 'active' },
      });

      if (activeCrisis) {
        await prisma.crisisMode.update({
          where: { id: activeCrisis.id },
          data: {
            actions: crisisPlan.actions,
            serviceDeficit: crisisPlan.service_deficit,
            updatedAt: new Date(),
          },
        });
      }

      logger.info('Full fleet reoptimization completed', { crisisPlan });
      return crisisPlan;
    } catch (error: any) {
      logger.error(`Error in full fleet reoptimization: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Identify critical routes (high-demand routes)
   */
  private identifyCriticalRoutes(): string[] {
    // In production, this would query route demand data
    // For now, return typical high-demand routes
    return ['Route 1', 'Route 2', 'Route 3'];
  }

  /**
   * Calculate minimum fleet needed for critical routes
   */
  private calculateMinimumFleet(criticalRoutes: string[]): number {
    // Base calculation: ~2-3 trains per critical route
    return criticalRoutes.length * 2.5;
  }

  /**
   * Get eligible replacements (quick eligibility check)
   */
  private async getEligibleReplacements(trains: any[]): Promise<any[]> {
    const eligible: any[] = [];

    for (const train of trains) {
      // Quick fitness check
      const expiredCerts = train.fitnessCertificates.filter(
        (cert: any) => cert.expiryDate < new Date()
      );

      // Quick job card check
      const blockingJobs = train.jobCards.filter(
        (job: any) => job.priority === 'critical'
      ).length > 3;

      if (expiredCerts.length === 0 && !blockingJobs) {
        eligible.push(train);
      }
    }

    return eligible;
  }

  /**
   * Get trains on low-demand routes
   */
  private getTrainsOnLowDemandRoutes(inServiceTrains: any[]): any[] {
    const lowDemandRoutes = ['Route 4', 'Route 5'];
    return inServiceTrains.filter(train => {
      const currentRoute = train.routeAssignments[0]?.routeNumber;
      return currentRoute && lowDemandRoutes.includes(currentRoute);
    });
  }

  /**
   * Get active crisis mode status
   */
  async getActiveCrisis(): Promise<any> {
    const crisis = await prisma.crisisMode.findFirst({
      where: { status: 'active' },
      include: {
        // Could add related emergency logs if needed
      },
    });

    if (!crisis) {
      return null;
    }

    // Get withdrawn trains
    const withdrawnTrains = await prisma.emergencyLog.findMany({
      where: {
        timestamp: {
          gte: crisis.activatedAt,
        },
        status: 'active',
      },
      include: {
        train: true,
      },
    });

    return {
      ...crisis,
      withdrawnTrains: withdrawnTrains.map(el => ({
        trainNumber: el.train.trainNumber,
        location: el.location,
        faultCode: el.faultCode,
        timestamp: el.timestamp,
      })),
    };
  }

  /**
   * Deactivate crisis mode
   */
  async deactivateCrisisMode(crisisId: string): Promise<void> {
    await prisma.crisisMode.update({
      where: { crisisId },
      data: {
        status: 'resolved',
        deactivatedAt: new Date(),
      },
    });

    logger.info(`Crisis mode deactivated: ${crisisId}`);
  }

  /**
   * Reduce service frequency on specific routes
   */
  async reduceServiceFrequency(
    routes: string[],
    newFrequencyMinutes: number,
    durationHours: number = 2
  ): Promise<void> {
    logger.info(`Reducing frequency on routes ${routes.join(', ')} to ${newFrequencyMinutes} minutes`);

    // In production, this would update route scheduling configuration
    // For now, log the action
    logger.info(`[MOCK] Service frequency reduced: ${routes.join(', ')} → ${newFrequencyMinutes} min for ${durationHours} hours`);
  }
}

export const crisisModeService = new CrisisModeService();


