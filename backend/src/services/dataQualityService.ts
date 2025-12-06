import prisma from '../config/database';
import logger from '../utils/logger';

export interface ValidationIssue {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  details: any;
}

export async function validateTrainReadiness(trainId: number): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  try {
    // Check fitness certificates
    const certificates = await prisma.fitnessCertificate.findMany({
      where: { trainId },
    });

    const expired = certificates.filter(c => c.validityStatus === 'expired');
    const expiringSoon = certificates.filter(c => c.validityStatus === 'expiring_soon');

    if (expired.length > 0) {
      issues.push({
        type: 'fitness_expired',
        severity: 'critical',
        details: expired,
      });
    }

    if (expiringSoon.length > 0) {
      issues.push({
        type: 'fitness_expiring_soon',
        severity: 'high',
        details: expiringSoon,
      });
    }

    // Check critical job cards
    const criticalJobs = await prisma.jobCard.findMany({
      where: {
        trainId,
        status: { in: ['open', 'in_progress'] },
        priority: 'critical',
      },
    });

    if (criticalJobs.length > 0) {
      issues.push({
        type: 'critical_job_open',
        severity: 'critical',
        details: criticalJobs,
      });
    }

    // Check high priority job cards
    const highPriorityJobs = await prisma.jobCard.findMany({
      where: {
        trainId,
        status: { in: ['open', 'in_progress'] },
        priority: 'high',
      },
    });

    if (highPriorityJobs.length > 0) {
      issues.push({
        type: 'high_priority_job_open',
        severity: 'high',
        details: highPriorityJobs,
      });
    }

    return issues;
  } catch (error) {
    logger.error(`Error validating train readiness for train ${trainId}:`, error);
    throw error;
  }
}

export async function calculateFitnessValidityStatus(expiryDate: Date): Promise<string> {
  const today = new Date();
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) {
    return 'expired';
  } else if (daysUntilExpiry <= 7) {
    return 'expiring_soon';
  } else {
    return 'valid';
  }
}

export async function extractWhatsAppData(rawText: string): Promise<any> {
  // Simple NLP extraction - can be enhanced with actual NLP library
  const extractedData: any = {
    trainNumber: null,
    action: null,
    bayNumber: null,
    status: null,
  };

  // Extract train number (pattern: T### or Train T###)
  const trainMatch = rawText.match(/[Tt]rain\s+([Tt]\d+)/i) || rawText.match(/([Tt]\d+)/);
  if (trainMatch) {
    extractedData.trainNumber = trainMatch[1].toUpperCase();
  }

  // Extract action keywords
  if (rawText.toLowerCase().includes('completed') || rawText.toLowerCase().includes('ready')) {
    extractedData.action = 'cleaning_completed';
    extractedData.status = 'ready';
  } else if (rawText.toLowerCase().includes('maintenance')) {
    extractedData.action = 'maintenance_required';
  }

  // Extract bay number
  const bayMatch = rawText.match(/[Bb]ay\s+(\d+)/i);
  if (bayMatch) {
    extractedData.bayNumber = bayMatch[1];
  }

  return extractedData;
}



