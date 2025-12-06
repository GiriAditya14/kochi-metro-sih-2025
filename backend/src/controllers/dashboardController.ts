import { Request, Response } from 'express';
import prisma from '../config/database';
import logger from '../utils/logger';
import { whatIfSimulationSchema, naturalLanguageQuerySchema } from '../utils/validators';
import { processNaturalLanguageQuery } from '../services/llmService';

export async function getInductionList(req: Request, res: Response) {
  try {
    const date = req.query.date as string || new Date().toISOString().split('T')[0];
    const includeReasoning = req.query.includeReasoning === 'true';

    const decisionDate = new Date(date);

    const decisions = await prisma.inductionDecision.findMany({
      where: {
        decisionDate: {
          gte: new Date(decisionDate.setHours(0, 0, 0, 0)),
          lt: new Date(decisionDate.setHours(23, 59, 59, 999)),
        },
      },
      include: {
        train: true,
      },
      orderBy: {
        decisionScore: 'desc',
      },
    });

    const trains = decisions.map((decision) => ({
      trainId: decision.trainId,
      trainNumber: decision.train?.trainNumber,
      recommendedAction: decision.decisionType,
      priorityScore: decision.decisionScore ? Number(decision.decisionScore) : 0,
      reasoning: includeReasoning ? decision.reasoningSummary : undefined,
      reasoningDetails: includeReasoning ? decision.reasoningDetails : undefined,
      conflicts: decision.conflictsDetected || [],
    }));

    const summary = {
      totalTrains: trains.length,
      revenueReady: trains.filter((t) => t.recommendedAction === 'revenue').length,
      standby: trains.filter((t) => t.recommendedAction === 'standby').length,
      maintenance: trains.filter((t) => t.recommendedAction === 'maintenance').length,
    };

    res.json({
      decisionDate: date,
      generatedAt: new Date().toISOString(),
      trains,
      summary,
    });
  } catch (error: any) {
    logger.error('Error getting induction list:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}

export async function runWhatIfSimulation(req: Request, res: Response) {
  try {
    const validated = whatIfSimulationSchema.parse(req.body);
    const { scenario, targetDate } = validated;

    // This is a simplified simulation - in production, this would trigger agent re-evaluation
    const simulationId = `sim-${Date.now()}`;

    // Mock impact analysis - in production, this would come from agent re-evaluation
    const impactAnalysis = {
      punctualityImpact: scenario.removeTrain ? -0.2 : 0,
      brandingBreaches: scenario.addMaintenance?.length || 0,
      mileageImbalance: 'moderate',
      conflicts: [],
    };

    const recommendations = [
      'Consider moving T012 to revenue to compensate for removed train',
    ];

    res.json({
      success: true,
      simulationId,
      results: {
        newInductionList: [], // Would contain re-evaluated list
        impactAnalysis,
        recommendations,
      },
    });
  } catch (error: any) {
    logger.error('Error running what-if simulation:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Invalid request data',
    });
  }
}

export async function getConflicts(req: Request, res: Response) {
  try {
    const conflicts = await prisma.conflictAlert.findMany({
      where: {
        status: 'active',
      },
      include: {
        train: true,
      },
      orderBy: [
        { severity: 'asc' },
        { detectedAt: 'desc' },
      ],
    });

    const summary = {
      critical: conflicts.filter((c) => c.severity === 'critical').length,
      high: conflicts.filter((c) => c.severity === 'high').length,
      medium: conflicts.filter((c) => c.severity === 'medium').length,
      low: conflicts.filter((c) => c.severity === 'low').length,
    };

    res.json({
      conflicts: conflicts.map((conflict) => ({
        id: conflict.id,
        trainId: conflict.trainId,
        trainNumber: conflict.train.trainNumber,
        conflictType: conflict.conflictType,
        severity: conflict.severity,
        description: conflict.description,
        suggestedResolution: conflict.suggestedResolution,
        detectedAt: conflict.detectedAt.toISOString(),
      })),
      summary,
    });
  } catch (error: any) {
    logger.error('Error getting conflicts:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}

export async function getDigitalTwin(req: Request, res: Response) {
  try {
    const depots = await prisma.depot.findMany({
      include: {
        trainsets: {
          include: {
            stablingGeometry: {
              orderBy: { assignedDate: 'desc' },
              take: 1,
            },
          },
        },
        stablingGeometry: {
          include: {
            train: true,
          },
        },
      },
    });

    const formattedDepots = depots.map((depot) => ({
      depotId: depot.id,
      depotName: depot.depotName,
      bays: depot.stablingGeometry.map((stabling) => ({
        bayNumber: stabling.bayNumber,
        position: {
          x: stabling.positionX ? Number(stabling.positionX) : 0,
          y: stabling.positionY ? Number(stabling.positionY) : 0,
          z: stabling.positionZ ? Number(stabling.positionZ) : 0,
        },
        trainId: stabling.trainId,
        trainNumber: stabling.train.trainNumber,
        status: stabling.train.currentStatus,
      })),
      geometry: {
        bounds: {
          width: 500,
          length: 800,
          height: 10,
        },
        entryPoints: [],
        shuntingPaths: [],
      },
    }));

    res.json({
      depots: formattedDepots,
    });
  } catch (error: any) {
    logger.error('Error getting digital twin data:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}

export async function processNaturalLanguage(req: Request, res: Response) {
  try {
    const validated = naturalLanguageQuerySchema.parse(req.body);
    const { query, language } = validated;

    const interpretedQuery = await processNaturalLanguageQuery(query, language);

    // Simple response based on query type - in production, this would query the database
    let response = '';
    let data: any = {};

    if (interpretedQuery.intent === 'status_check') {
      response = '20 trains are ready for revenue service tomorrow. 3 on standby, 2 in maintenance.';
      data = {
        revenueReady: 20,
        standby: 3,
        maintenance: 2,
      };
    } else {
      response = 'Query processed successfully.';
    }

    res.json({
      success: true,
      interpretedQuery: interpretedQuery.intent,
      response,
      data,
    });
  } catch (error: any) {
    logger.error('Error processing natural language query:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Invalid request data',
    });
  }
}



