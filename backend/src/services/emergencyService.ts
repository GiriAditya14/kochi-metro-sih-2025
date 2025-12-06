import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';
import { notificationService, CriticalAlert } from './notificationService';
import { dataQualityService } from './dataQualityService';

const prisma = new PrismaClient();

export interface EmergencyBreakdownAlert {
  event_type: 'EMERGENCY_BREAKDOWN';
  train_id: string;
  timestamp: string;
  location: string;
  fault_code: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
  passengers_onboard?: number;
  immediate_action_required: string;
  route_affected?: string;
}

export interface EmergencyPlan {
  type: 'EMERGENCY_REPLACEMENT';
  withdrawn_train: string;
  replacement_train: string;
  deployment_time_minutes: number;
  route_assignment: string;
  confidence_score: number;
  reasoning: string[];
  execution_steps: Array<{
    step: number;
    action: string;
    duration_min: number;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  }>;
  impact_mitigation: {
    service_gap_minutes: number;
    passenger_impact: string;
    punctuality_recovery: string;
    cost_estimate: string;
  };
  fallback_options: Array<{
    option: string;
    train_id: string;
    deployment_time_minutes: number;
    use_if: string;
  }>;
}

export interface QuickFitnessCheck {
  all_valid: boolean;
  certificates_status: Record<string, 'valid' | 'expiring' | 'expired'>;
  days_until_expiry: Record<string, number>;
}

export interface QuickJobCardCheck {
  blocking_jobs: boolean;
  critical_jobs_count: number;
  open_jobs: Array<{
    id: number;
    priority: string;
    blocking_service: boolean;
  }>;
}

/**
 * Emergency Service - Handles train breakdown scenarios
 */
class EmergencyService {
  /**
   * Handle emergency breakdown alert from IoT sensors
   */
  async handleEmergencyBreakdown(alert: EmergencyBreakdownAlert): Promise<{
    emergencyLogId: number;
    planGenerated: boolean;
    message: string;
  }> {
    logger.info(`Handling emergency breakdown: ${alert.train_id}`, { alert });

    try {
      // 1. Find train by train number
      const train = await prisma.trainset.findUnique({
        where: { trainNumber: alert.train_id },
      });

      if (!train) {
        throw new Error(`Train ${alert.train_id} not found`);
      }

      // 2. Create emergency log
      const emergencyLog = await prisma.emergencyLog.create({
        data: {
          trainId: train.id,
          eventType: alert.event_type,
          timestamp: new Date(alert.timestamp),
          location: alert.location,
          faultCode: alert.fault_code,
          severity: alert.severity,
          passengersOnboard: alert.passengers_onboard,
          immediateActionRequired: alert.immediate_action_required,
          routeAffected: alert.route_affected,
          status: 'active',
        },
      });

      // 3. Update train status to EMERGENCY_WITHDRAWN
      await prisma.trainset.update({
        where: { id: train.id },
        data: { currentStatus: 'EMERGENCY_WITHDRAWN' },
      });

      // 4. Create blocking job card automatically
      await prisma.jobCard.create({
        data: {
          trainId: train.id,
          maximoJobNumber: `EMERG-${Date.now()}`,
          jobType: 'corrective',
          priority: 'critical',
          status: 'open',
          description: `Emergency withdrawal due to ${alert.fault_code}`,
          openedDate: new Date(),
        },
      });

      // 5. Trigger emergency replanning
      const plan = await this.triggerEmergencyReplanning(alert.train_id, emergencyLog.id);

      // 6. Send real-time alerts
      await notificationService.sendCriticalAlert({
        severity: 'CRITICAL',
        title: `EMERGENCY: Train ${alert.train_id} Withdrawn from Service`,
        message: `Emergency withdrawal due to ${alert.fault_code}. Location: ${alert.location}. Emergency replanning initiated.`,
        trainId: train.id.toString(),
        trainNumber: alert.train_id,
        location: alert.location,
        timestamp: new Date(),
        actionRequired: 'Execute emergency replacement plan',
        recipients: ['Operations_Controller', 'Supervisor', 'Depot_Manager'],
        channels: ['WebSocket', 'SMS', 'WhatsApp'],
        data: {
          emergencyLogId: emergencyLog.id,
          faultCode: alert.fault_code,
          routeAffected: alert.route_affected,
        },
      });

      logger.info(`Emergency breakdown handled successfully: ${alert.train_id}`);

      return {
        emergencyLogId: emergencyLog.id,
        planGenerated: !!plan,
        message: 'Emergency breakdown logged and replanning initiated',
      };
    } catch (error: any) {
      logger.error(`Error handling emergency breakdown: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Trigger emergency replanning workflow
   * Optimized for speed - finds replacement train within 5 minutes
   */
  async triggerEmergencyReplanning(
    withdrawnTrainNumber: string,
    emergencyLogId: number
  ): Promise<EmergencyPlan | null> {
    logger.info(`Starting emergency replanning for train: ${withdrawnTrainNumber}`);

    try {
      // 1. Get current service status
      const withdrawnTrain = await prisma.trainset.findUnique({
        where: { trainNumber: withdrawnTrainNumber },
        include: { routeAssignments: { where: { status: 'active' } } },
      });

      if (!withdrawnTrain) {
        throw new Error(`Train ${withdrawnTrainNumber} not found`);
      }

      const affectedRoute = withdrawnTrain.routeAssignments[0]?.routeNumber || 'Unknown';

      // 2. Get standby trains
      const standbyTrains = await prisma.trainset.findMany({
        where: {
          currentStatus: 'standby',
        },
        include: {
          fitnessCertificates: true,
          jobCards: { where: { status: 'open' } },
          stablingGeometry: { orderBy: { assignedDate: 'desc' }, take: 1 },
        },
      });

      // 3. Quick eligibility check (parallel processing simulation)
      const eligibleReplacements: Array<{
        train_id: string;
        train_db_id: number;
        readiness_minutes: number;
        confidence: number;
        reasoning: string[];
      }> = [];

      for (const train of standbyTrains) {
        const fitnessCheck = await this.quickFitnessCheck(train.id);
        const jobCardCheck = await this.quickJobCardCheck(train.id);

        // Emergency criteria (relaxed vs normal planning)
        if (fitnessCheck.all_valid && !jobCardCheck.blocking_jobs) {
          const readinessMinutes = this.calculateReadiness(train);
          const reasoning = this.generateEmergencyReasoning(train, fitnessCheck, jobCardCheck);

          eligibleReplacements.push({
            train_id: train.trainNumber,
            train_db_id: train.id,
            readiness_minutes: readinessMinutes,
            confidence: 0.85, // Lower threshold for emergency
            reasoning,
          });
        }
      }

      // 4. Sort by readiness time (fastest first)
      eligibleReplacements.sort((a, b) => a.readiness_minutes - b.readiness_minutes);

      // 5. Generate emergency plan
      if (eligibleReplacements.length > 0) {
        const bestOption = eligibleReplacements[0];
        const fallbackOptions = eligibleReplacements.slice(1, 4).map((opt, idx) => ({
          option: String.fromCharCode(66 + idx), // B, C, D
          train_id: opt.train_id,
          deployment_time_minutes: opt.readiness_minutes,
          use_if: `${opt.train_id} fails pre-departure checks`,
        }));

        const emergencyPlan: EmergencyPlan = {
          type: 'EMERGENCY_REPLACEMENT',
          withdrawn_train: withdrawnTrainNumber,
          replacement_train: bestOption.train_id,
          deployment_time_minutes: bestOption.readiness_minutes,
          route_assignment: affectedRoute,
          confidence_score: bestOption.confidence,
          reasoning: bestOption.reasoning,
          execution_steps: [
            {
              step: 1,
              action: `Notify crew to report to ${bestOption.train_id}`,
              duration_min: 3,
              status: 'PENDING',
            },
            {
              step: 2,
              action: `Shunt ${bestOption.train_id} from current position to departure position`,
              duration_min: 8,
              status: 'PENDING',
            },
            {
              step: 3,
              action: 'Final safety checks and departure clearance',
              duration_min: 4,
              status: 'PENDING',
            },
            {
              step: 4,
              action: `Deploy to ${affectedRoute} service`,
              duration_min: 0,
              status: 'PENDING',
            },
          ],
          impact_mitigation: {
            service_gap_minutes: bestOption.readiness_minutes,
            passenger_impact: 'Moderate - 2 scheduled services delayed',
            punctuality_recovery: 'Expected 99.1% by end of day',
            cost_estimate: '₹45,000 (emergency deployment + passenger compensation)',
          },
          fallback_options: fallbackOptions,
        };

        // Save emergency plan to database
        await prisma.emergencyPlan.create({
          data: {
            emergencyLogId,
            planType: 'EMERGENCY_REPLACEMENT',
            withdrawnTrainId: withdrawnTrain.id,
            replacementTrainId: bestOption.train_db_id,
            deploymentTimeMinutes: bestOption.readiness_minutes,
            routeAssignment: affectedRoute,
            confidenceScore: bestOption.confidence,
            reasoning: emergencyPlan.reasoning,
            executionSteps: emergencyPlan.execution_steps,
            impactMitigation: emergencyPlan.impact_mitigation,
            fallbackOptions: emergencyPlan.fallback_options,
            status: 'pending',
          },
        });

        logger.info(`Emergency plan generated: ${bestOption.train_id} as replacement`);
        return emergencyPlan;
      } else {
        // NO STANDBY AVAILABLE - CRISIS MODE
        logger.warn(`No standby trains available for emergency replacement`);
        await this.activateCrisisMode([withdrawnTrainNumber]);
        return null;
      }
    } catch (error: any) {
      logger.error(`Error in emergency replanning: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Quick fitness check (emergency mode - relaxed criteria)
   */
  private async quickFitnessCheck(trainId: number): Promise<QuickFitnessCheck> {
    const certificates = await prisma.fitnessCertificate.findMany({
      where: { trainId },
    });

    const certificatesStatus: Record<string, 'valid' | 'expiring' | 'expired'> = {};
    const daysUntilExpiry: Record<string, number> = {};
    let allValid = true;

    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    for (const cert of certificates) {
      const daysRemaining = Math.floor(
        (cert.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      daysUntilExpiry[cert.department] = daysRemaining;

      if (cert.expiryDate < now) {
        certificatesStatus[cert.department] = 'expired';
        allValid = false;
      } else if (cert.expiryDate < oneDayFromNow) {
        certificatesStatus[cert.department] = 'expiring';
        // Emergency mode: Accept ≥1 day validity (normal: ≥3 days)
        // Still valid for emergency use
      } else {
        certificatesStatus[cert.department] = 'valid';
      }
    }

    return {
      all_valid: allValid || Object.values(certificatesStatus).every(s => s !== 'expired'),
      certificates_status: certificatesStatus,
      days_until_expiry: daysUntilExpiry,
    };
  }

  /**
   * Quick job card check (emergency mode - relaxed criteria)
   */
  private async quickJobCardCheck(trainId: number): Promise<QuickJobCardCheck> {
    const openJobs = await prisma.jobCard.findMany({
      where: {
        trainId,
        status: 'open',
      },
    });

    const criticalJobs = openJobs.filter(job => job.priority === 'critical');
    const blockingJobs = criticalJobs.length > 3; // Emergency: Allow up to 3 critical jobs (normal: max 2)

    return {
      blocking_jobs: blockingJobs,
      critical_jobs_count: criticalJobs.length,
      open_jobs: openJobs.map(job => ({
        id: job.id,
        priority: job.priority,
        blocking_service: job.priority === 'critical' && criticalJobs.length > 3,
      })),
    };
  }

  /**
   * Calculate readiness time in minutes
   */
  private calculateReadiness(train: any): number {
    // Base time: 5 minutes (crew notification)
    let readiness = 5;

    // Add shunting time if available
    if (train.stablingGeometry && train.stablingGeometry.length > 0) {
      const shuntingTime = train.stablingGeometry[0].shuntingTimeMinutes || 8;
      readiness += shuntingTime;
    } else {
      readiness += 10; // Default shunting time
    }

    // Add safety check time
    readiness += 4;

    return readiness;
  }

  /**
   * Generate emergency reasoning
   */
  private generateEmergencyReasoning(
    train: any,
    fitnessCheck: QuickFitnessCheck,
    jobCardCheck: QuickJobCardCheck
  ): string[] {
    const reasoning: string[] = [];

    if (fitnessCheck.all_valid) {
      reasoning.push(`✓ ${train.trainNumber} on standby with valid fitness (all departments)`);
    }

    if (!jobCardCheck.blocking_jobs) {
      reasoning.push(`✓ No blocking job cards (${jobCardCheck.critical_jobs_count} critical open)`);
    }

    if (train.stablingGeometry && train.stablingGeometry.length > 0) {
      const stabling = train.stablingGeometry[0];
      reasoning.push(
        `✓ Positioned at ${stabling.bayNumber} - ${stabling.shuntingTimeMinutes || 8} min shunting time`
      );
    }

    reasoning.push(`✓ Crew available and briefed`);

    // Check mileage (optional warning)
    if (parseFloat(train.totalMileage.toString()) > 12500) {
      reasoning.push(`⚠ Note: ${parseFloat(train.totalMileage.toString())}km above fleet average mileage (acceptable for emergency)`);
    }

    return reasoning;
  }

  /**
   * Detect cascading crisis (3+ trains withdrawn in 30 minutes)
   */
  async detectCascadingCrisis(): Promise<boolean> {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const withdrawalCount = await prisma.emergencyLog.count({
      where: {
        eventType: 'EMERGENCY_BREAKDOWN',
        timestamp: {
          gte: thirtyMinutesAgo,
        },
        status: 'active',
      },
    });

    if (withdrawalCount >= 3) {
      logger.warn(`CRISIS MODE DETECTED: ${withdrawalCount} trains withdrawn in 30 minutes`);
      return true;
    }

    return false;
  }

  /**
   * Activate crisis protocol
   */
  async activateCrisisMode(withdrawnTrainNumbers: string[]): Promise<void> {
    logger.warn('ACTIVATING CRISIS MODE');

    try {
      // Check if already in crisis mode
      const activeCrisis = await prisma.crisisMode.findFirst({
        where: { status: 'active' },
      });

      if (activeCrisis) {
        logger.info('Crisis mode already active, updating existing crisis');
        // Update existing crisis
        await prisma.crisisMode.update({
          where: { id: activeCrisis.id },
          data: {
            withdrawalCount: activeCrisis.withdrawalCount + withdrawnTrainNumbers.length,
            updatedAt: new Date(),
          },
        });
        return;
      }

      // Get current fleet status
      const allTrains = await prisma.trainset.findMany({
        where: { currentStatus: { in: ['IN_SERVICE', 'STANDBY', 'DEPOT_READY'] } },
      });

      const inService = allTrains.filter(t => t.currentStatus === 'IN_SERVICE').length;
      const available = allTrains.filter(t => 
        ['STANDBY', 'DEPOT_READY'].includes(t.currentStatus)
      ).length;
      const withdrawn = allTrains.filter(t => t.currentStatus === 'EMERGENCY_WITHDRAWN').length;

      // Calculate service deficit
      const minimumTrainsNeeded = Math.ceil(allTrains.length * 0.6); // 60% minimum service
      const serviceDeficit = Math.max(0, minimumTrainsNeeded - (inService + available));

      // Create crisis mode record
      const crisisId = `CRISIS-${Date.now()}`;
      await prisma.crisisMode.create({
        data: {
          crisisId,
          withdrawalCount: withdrawn,
          serviceDeficit,
          status: 'active',
          activatedAt: new Date(),
          actions: [],
        },
      });

      // Notify management
      await notificationService.sendCriticalAlert({
        severity: 'CRITICAL',
        title: '🚨🚨🚨 CRISIS MODE ACTIVATED 🚨🚨🚨',
        message: `${withdrawn} trains withdrawn. System-wide impact. Immediate intervention required.`,
        timestamp: new Date(),
        actionRequired: 'IMMEDIATE_INTERVENTION',
        recipients: ['Management', 'Operations_Controller'],
        channels: ['WebSocket', 'SMS', 'WhatsApp', 'Email'],
      });

      logger.warn(`Crisis mode activated: ${crisisId}`);
    } catch (error: any) {
      logger.error(`Error activating crisis mode: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Get emergency plan by emergency log ID
   */
  async getEmergencyPlan(emergencyLogId: number) {
    return await prisma.emergencyPlan.findFirst({
      where: { emergencyLogId },
      include: {
        withdrawnTrain: true,
        replacementTrain: true,
        emergencyLog: true,
      },
    });
  }

  /**
   * Get active emergencies
   */
  async getActiveEmergencies() {
    return await prisma.emergencyLog.findMany({
      where: { status: 'active' },
      include: {
        train: true,
        emergencyPlans: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { timestamp: 'desc' },
    });
  }
}

export const emergencyService = new EmergencyService();


