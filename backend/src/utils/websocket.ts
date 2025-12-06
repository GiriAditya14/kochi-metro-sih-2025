import { io } from '../server';
import logger from './logger';

export function broadcastDecisionUpdate(decision: any) {
  const date = decision.decisionDate instanceof Date
    ? decision.decisionDate.toISOString().split('T')[0]
    : decision.decisionDate;
  
  io.to(`decisions-${date}`).emit('decision-updated', decision);
  logger.info(`Broadcasted decision update for date: ${date}`);
}

export function broadcastConflictAlert(conflict: any) {
  io.to('conflicts').emit('conflict-detected', conflict);
  logger.info(`Broadcasted conflict alert for train: ${conflict.trainId}`);
}

export function broadcastEmergencyAlert(emergency: any) {
  io.to('emergencies').emit('emergency-alert', emergency);
  logger.info(`Broadcasted emergency alert: ${emergency.title}`);
}

// Subscribe to emergency channels
export function subscribeToEmergencies(socket: any) {
  socket.on('subscribe-emergencies', () => {
    socket.join('emergencies');
    logger.info(`Client ${socket.id} subscribed to emergencies`);
  });

  socket.on('subscribe-train-tracking', (trainId: string) => {
    socket.join(`train-${trainId}`);
    logger.info(`Client ${socket.id} subscribed to train ${trainId} tracking`);
  });
}

