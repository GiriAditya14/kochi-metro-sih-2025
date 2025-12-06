import logger from '../utils/logger';
import { io } from '../server';

export interface NotificationChannel {
  type: 'websocket' | 'sms' | 'whatsapp' | 'email';
  enabled: boolean;
}

export interface NotificationRecipient {
  type: 'Operations_Controller' | 'Supervisor' | 'Depot_Manager' | 'Management' | 'Public';
  channels: NotificationChannel[];
}

export interface CriticalAlert {
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  message: string;
  title: string;
  trainId?: string;
  trainNumber?: string;
  location?: string;
  timestamp: Date;
  actionRequired?: string;
  recipients: string[];
  channels: ('WebSocket' | 'SMS' | 'WhatsApp' | 'Email')[];
  data?: Record<string, any>;
}

/**
 * Notification Service for Emergency Alerts
 * Handles real-time notifications via multiple channels
 */
class NotificationService {
  /**
   * Send critical emergency alert
   */
  async sendCriticalAlert(alert: CriticalAlert): Promise<void> {
    logger.info(`Sending critical alert: ${alert.title}`, { alert });

    try {
      // WebSocket notification (always enabled for real-time frontend updates)
      if (alert.channels.includes('WebSocket')) {
        await this.sendWebSocketAlert(alert);
      }

      // SMS notification (mock implementation)
      if (alert.channels.includes('SMS')) {
        await this.sendSMSAlert(alert);
      }

      // WhatsApp notification (mock implementation)
      if (alert.channels.includes('WhatsApp')) {
        await this.sendWhatsAppAlert(alert);
      }

      // Email notification (mock implementation)
      if (alert.channels.includes('Email')) {
        await this.sendEmailAlert(alert);
      }

      logger.info(`Critical alert sent successfully: ${alert.title}`);
    } catch (error: any) {
      logger.error(`Error sending critical alert: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Send WebSocket alert to frontend
   */
  private async sendWebSocketAlert(alert: CriticalAlert): Promise<void> {
    try {
      const alertPayload = {
        ...alert,
        timestamp: alert.timestamp.toISOString(),
      };

      // Broadcast to emergency channel
      io.to('emergencies').emit('emergency-alert', alertPayload);

      // Also broadcast to specific train tracking rooms
      if (alert.trainId) {
        io.to(`train-${alert.trainId}`).emit('emergency-alert', alertPayload);
      }

      logger.info(`WebSocket alert sent: ${alert.title}`);
    } catch (error: any) {
      logger.error(`Error sending WebSocket alert: ${error.message}`, error);
    }
  }

  /**
   * Send SMS alert (mock - integrate with SMS gateway in production)
   */
  private async sendSMSAlert(alert: CriticalAlert): Promise<void> {
    // TODO: Integrate with SMS gateway (Twilio, AWS SNS, etc.)
    logger.info(`[MOCK] SMS alert sent to ${alert.recipients.length} recipients: ${alert.title}`);
    
    // Mock implementation
    for (const recipient of alert.recipients) {
      const smsMessage = `${alert.title}\n${alert.message}\nTime: ${alert.timestamp.toISOString()}`;
      logger.debug(`[MOCK SMS] To: ${recipient}, Message: ${smsMessage.substring(0, 100)}...`);
    }
  }

  /**
   * Send WhatsApp alert (mock - integrate with WhatsApp Business API in production)
   */
  private async sendWhatsAppAlert(alert: CriticalAlert): Promise<void> {
    // TODO: Integrate with WhatsApp Business API
    logger.info(`[MOCK] WhatsApp alert sent to ${alert.recipients.length} recipients: ${alert.title}`);
    
    // Mock implementation
    for (const recipient of alert.recipients) {
      const whatsappMessage = `🚨 *EMERGENCY ALERT*\n\n${alert.title}\n\n${alert.message}\n\n📍 Location: ${alert.location || 'N/A'}\n🕐 Time: ${alert.timestamp.toLocaleString()}`;
      logger.debug(`[MOCK WhatsApp] To: ${recipient}, Message: ${whatsappMessage.substring(0, 200)}...`);
    }
  }

  /**
   * Send Email alert (mock - integrate with email service in production)
   */
  private async sendEmailAlert(alert: CriticalAlert): Promise<void> {
    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    logger.info(`[MOCK] Email alert sent to ${alert.recipients.length} recipients: ${alert.title}`);
    
    // Mock implementation
    for (const recipient of alert.recipients) {
      logger.debug(`[MOCK Email] To: ${recipient}, Subject: ${alert.title}`);
    }
  }

  /**
   * Send public announcement for passenger communication
   */
  async sendPublicAnnouncement(message: string, channels: string[] = ['Metro_App', 'Station_Displays']): Promise<void> {
    logger.info(`Sending public announcement: ${message.substring(0, 50)}...`);

    try {
      // Broadcast via WebSocket for Metro App
      if (channels.includes('Metro_App')) {
        io.to('public-announcements').emit('public-announcement', {
          message,
          timestamp: new Date().toISOString(),
        });
      }

      // TODO: Integrate with station display systems
      if (channels.includes('Station_Displays')) {
        logger.info(`[MOCK] Station display announcement: ${message}`);
      }

      // TODO: Integrate with social media APIs
      if (channels.includes('Social_Media')) {
        logger.info(`[MOCK] Social media announcement: ${message}`);
      }

      logger.info('Public announcement sent successfully');
    } catch (error: any) {
      logger.error(`Error sending public announcement: ${error.message}`, error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();


