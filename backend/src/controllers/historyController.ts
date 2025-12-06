import { Request, Response } from 'express';
import prisma from '../config/database';
import logger from '../utils/logger';
import { feedbackSchema } from '../utils/validators';

export async function getDecisions(req: Request, res: Response) {
  try {
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const trainId = req.query.trainId ? parseInt(req.query.trainId as string) : undefined;

    const where: any = {};

    if (startDate && endDate) {
      where.decisionDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (trainId) {
      where.trainId = trainId;
    }

    const decisions = await prisma.inductionDecision.findMany({
      where,
      include: {
        train: true,
        decisionHistory: true,
      },
      orderBy: {
        decisionDate: 'desc',
      },
    });

    res.json({
      decisions: decisions.map((decision) => ({
        decisionId: decision.id,
        decisionDate: decision.decisionDate.toISOString().split('T')[0],
        trainId: decision.trainId,
        trainNumber: decision.train?.trainNumber,
        decisionType: decision.decisionType,
        decisionScore: decision.decisionScore ? Number(decision.decisionScore) : null,
        reasoningDetails: decision.reasoningDetails,
        outcome: decision.decisionHistory[0] ? {
          status: decision.decisionHistory[0].outcomeStatus,
          punctualityImpact: decision.decisionHistory[0].punctualityImpact
            ? Number(decision.decisionHistory[0].punctualityImpact)
            : null,
          issues: decision.decisionHistory[0].issuesEncountered || '',
        } : null,
      })),
    });
  } catch (error: any) {
    logger.error('Error getting decisions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}

export async function submitFeedback(req: Request, res: Response) {
  try {
    const validated = feedbackSchema.parse(req.body);
    const {
      decisionId,
      outcomeStatus,
      punctualityImpact,
      actualMileage,
      issuesEncountered,
      feedbackScore,
      feedbackNotes,
    } = validated;

    const decision = await prisma.inductionDecision.findUnique({
      where: { id: decisionId },
    });

    if (!decision) {
      return res.status(404).json({
        success: false,
        error: 'Decision not found',
      });
    }

    const history = await prisma.decisionHistory.create({
      data: {
        decisionId,
        trainId: decision.trainId,
        outcomeStatus,
        punctualityImpact: punctualityImpact || null,
        actualMileage: actualMileage || null,
        issuesEncountered: issuesEncountered || null,
        feedbackScore: feedbackScore || null,
        feedbackNotes: feedbackNotes || null,
      },
    });

    res.json({
      success: true,
      feedbackId: history.id,
      learningTriggered: true,
    });
  } catch (error: any) {
    logger.error('Error submitting feedback:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Invalid request data',
    });
  }
}



