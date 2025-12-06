import { Request, Response } from 'express';
import prisma from '../config/database';
import logger from '../utils/logger';
import {
  maximoIngestionSchema,
  fitnessCertificateSchema,
  mileageIngestionSchema,
  whatsappLogSchema,
} from '../utils/validators';
import { calculateFitnessValidityStatus, extractWhatsAppData } from '../services/dataQualityService';

export async function ingestMaximoData(req: Request, res: Response) {
  try {
    const validated = maximoIngestionSchema.parse(req.body);
    let processed = 0;
    let failed = 0;

    for (const jobCard of validated.jobCards) {
      try {
        // Find train by train number
        const train = await prisma.trainset.findUnique({
          where: { trainNumber: jobCard.trainNumber },
        });

        if (!train) {
          logger.warn(`Train ${jobCard.trainNumber} not found`);
          failed++;
          continue;
        }

        await prisma.jobCard.upsert({
          where: { maximoJobNumber: jobCard.maximoJobNumber },
          update: {
            jobType: jobCard.jobType,
            priority: jobCard.priority,
            status: jobCard.status,
            description: jobCard.description,
            assignedTo: jobCard.assignedTo,
            openedDate: jobCard.openedDate ? new Date(jobCard.openedDate) : null,
            closedDate: jobCard.closedDate ? new Date(jobCard.closedDate) : null,
            estimatedCompletionDate: jobCard.estimatedCompletionDate
              ? new Date(jobCard.estimatedCompletionDate)
              : null,
          },
          create: {
            trainId: train.id,
            maximoJobNumber: jobCard.maximoJobNumber,
            jobType: jobCard.jobType,
            priority: jobCard.priority,
            status: jobCard.status,
            description: jobCard.description,
            assignedTo: jobCard.assignedTo,
            openedDate: jobCard.openedDate ? new Date(jobCard.openedDate) : null,
            closedDate: jobCard.closedDate ? new Date(jobCard.closedDate) : null,
            estimatedCompletionDate: jobCard.estimatedCompletionDate
              ? new Date(jobCard.estimatedCompletionDate)
              : null,
          },
        });

        processed++;
      } catch (error) {
        logger.error(`Error processing job card ${jobCard.maximoJobNumber}:`, error);
        failed++;
      }
    }

    res.json({
      success: true,
      processed,
      failed,
      message: 'Job cards ingested successfully',
    });
  } catch (error: any) {
    logger.error('Error ingesting Maximo data:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Invalid request data',
    });
  }
}

export async function ingestFitnessCertificate(req: Request, res: Response) {
  try {
    const validated = fitnessCertificateSchema.parse(req.body);

    const train = await prisma.trainset.findUnique({
      where: { trainNumber: validated.trainNumber },
    });

    if (!train) {
      return res.status(404).json({
        success: false,
        error: `Train ${validated.trainNumber} not found`,
      });
    }

    const issuedDate = new Date(validated.issuedDate);
    const expiryDate = new Date(validated.expiryDate);
    const validityStatus = await calculateFitnessValidityStatus(expiryDate);

    const certificate = await prisma.fitnessCertificate.upsert({
      where: {
        trainId_department: {
          trainId: train.id,
          department: validated.department,
        },
      },
      update: {
        certificateNumber: validated.certificateNumber,
        issuedDate,
        expiryDate,
        validityStatus,
        issuedBy: validated.issuedBy,
        notes: validated.notes,
      },
      create: {
        trainId: train.id,
        department: validated.department,
        certificateNumber: validated.certificateNumber,
        issuedDate,
        expiryDate,
        validityStatus,
        issuedBy: validated.issuedBy,
        notes: validated.notes,
      },
    });

    res.json({
      success: true,
      certificateId: certificate.id,
      validityStatus: certificate.validityStatus,
    });
  } catch (error: any) {
    logger.error('Error ingesting fitness certificate:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Invalid request data',
    });
  }
}

export async function ingestMileage(req: Request, res: Response) {
  try {
    const validated = mileageIngestionSchema.parse(req.body);

    const train = await prisma.trainset.findUnique({
      where: { trainNumber: validated.trainNumber },
    });

    if (!train) {
      return res.status(404).json({
        success: false,
        error: `Train ${validated.trainNumber} not found`,
      });
    }

    const recordedDate = new Date(validated.recordedDate);
    const cumulativeMileage = Number(train.totalMileage) + validated.dailyMileage;

    await prisma.mileageTracking.create({
      data: {
        trainId: train.id,
        recordedDate,
        dailyMileage: validated.dailyMileage,
        cumulativeMileage,
        componentType: validated.componentType || 'overall',
      },
    });

    await prisma.trainset.update({
      where: { id: train.id },
      data: { totalMileage: cumulativeMileage },
    });

    res.json({
      success: true,
      cumulativeMileage,
    });
  } catch (error: any) {
    logger.error('Error ingesting mileage:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Invalid request data',
    });
  }
}

export async function ingestWhatsAppLog(req: Request, res: Response) {
  try {
    const validated = whatsappLogSchema.parse(req.body);
    const extractedData = await extractWhatsAppData(validated.rawText);

    res.json({
      success: true,
      extractedData,
    });
  } catch (error: any) {
    logger.error('Error ingesting WhatsApp log:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Invalid request data',
    });
  }
}



