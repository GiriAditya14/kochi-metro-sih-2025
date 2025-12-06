import { Request, Response } from 'express';
import prisma from '../config/database';
import logger from '../utils/logger';
import { agentQuerySchema, decisionSubmitSchema } from '../utils/validators';
import { organizeAgentResponse } from '../services/llmService';

export async function agentQuery(req: Request, res: Response) {
  try {
    const validated = agentQuerySchema.parse(req.body);
    const { agentType, query, parameters } = validated;

    let data: any[] = [];

    switch (agentType) {
      case 'fitness_certificate':
        if (query === 'get_all_expiring_certificates') {
          const daysAhead = parameters?.daysAhead || 7;
          const targetDate = new Date();
          targetDate.setDate(targetDate.getDate() + daysAhead);

          const certificates = await prisma.fitnessCertificate.findMany({
            where: {
              expiryDate: {
                lte: targetDate,
              },
              validityStatus: { in: ['valid', 'expiring_soon'] },
            },
            include: {
              train: true,
            },
          });

          data = certificates.map((cert) => ({
            trainId: cert.trainId,
            trainNumber: cert.train.trainNumber,
            department: cert.department,
            expiryDate: cert.expiryDate.toISOString().split('T')[0],
            daysRemaining: Math.ceil(
              (cert.expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            ),
          }));
        }
        break;

      case 'job_card':
        if (query === 'get_open_job_cards') {
          const priority = parameters?.priority;
          const jobCards = await prisma.jobCard.findMany({
            where: {
              status: { in: ['open', 'in_progress'] },
              ...(priority && { priority }),
            },
            include: {
              train: true,
            },
          });

          data = jobCards.map((job) => ({
            trainId: job.trainId,
            trainNumber: job.train.trainNumber,
            maximoJobNumber: job.maximoJobNumber,
            jobType: job.jobType,
            priority: job.priority,
            status: job.status,
            description: job.description,
          }));
        }
        break;

      case 'branding':
        if (query === 'get_active_contracts') {
          const contracts = await prisma.brandingContract.findMany({
            where: {
              status: 'active',
            },
            include: {
              train: true,
            },
          });

          data = contracts.map((contract) => ({
            trainId: contract.trainId,
            trainNumber: contract.train.trainNumber,
            advertiserName: contract.advertiserName,
            requiredExposureHours: Number(contract.requiredExposureHours),
            currentExposureHours: Number(contract.currentExposureHours),
            priorityScore: contract.priorityScore,
            endDate: contract.endDate.toISOString().split('T')[0],
          }));
        }
        break;

      default:
        return res.status(400).json({
          success: false,
          error: `Unknown agent type: ${agentType}`,
        });
    }

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    logger.error('Error processing agent query:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Invalid request data',
    });
  }
}

export async function getTrainStatus(req: Request, res: Response) {
  try {
    const trainId = parseInt(req.params.trainId);

    const train = await prisma.trainset.findUnique({
      where: { id: trainId },
      include: {
        fitnessCertificates: true,
        jobCards: true,
        brandingContracts: true,
        mileageTracking: {
          orderBy: { recordedDate: 'desc' },
          take: 30,
        },
        cleaningSlots: {
          orderBy: { slotDate: 'desc' },
          take: 10,
        },
        stablingGeometry: {
          orderBy: { assignedDate: 'desc' },
          take: 1,
        },
      },
    });

    if (!train) {
      return res.status(404).json({
        success: false,
        error: 'Train not found',
      });
    }

    res.json({
      trainId: train.id,
      trainNumber: train.trainNumber,
      fitnessCertificates: train.fitnessCertificates,
      jobCards: train.jobCards,
      brandingContracts: train.brandingContracts,
      mileageData: train.mileageTracking,
      cleaningSlots: train.cleaningSlots,
      stablingGeometry: train.stablingGeometry[0] || null,
    });
  } catch (error: any) {
    logger.error('Error getting train status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}

export async function submitDecision(req: Request, res: Response) {
  try {
    const validated = decisionSubmitSchema.parse(req.body);
    const { decisionDate, recommendations, conflicts } = validated;

    const decisionDateObj = new Date(decisionDate);
    const decisionTime = new Date();

    const createdDecisions = [];

    for (const rec of recommendations) {
      const reasoningSummary = await organizeAgentResponse(
        [rec],
        {
          decisionDate,
          totalTrains: recommendations.length,
        }
      );

      const decision = await prisma.inductionDecision.create({
        data: {
          decisionDate: decisionDateObj,
          decisionTime,
          decisionType: rec.recommendedAction,
          trainId: rec.trainId,
          decisionScore: rec.score,
          reasoningSummary,
          reasoningDetails: rec.reasoning,
          conflictsDetected: conflicts || [],
          createdBy: 'system',
        },
      });

      createdDecisions.push(decision);
    }

    res.json({
      success: true,
      decisionId: createdDecisions[0]?.id,
      processed: createdDecisions.length,
    });
  } catch (error: any) {
    logger.error('Error submitting decision:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Invalid request data',
    });
  }
}



