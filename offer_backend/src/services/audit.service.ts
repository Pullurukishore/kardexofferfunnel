import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

interface AuditLogData {
  action: string;
  userId?: number;
  ipAddress?: string;
  userAgent?: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, any>;
  offerId?: number;
}

export class AuditService {
  static async log(data: AuditLogData): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action: data.action,
          userId: data.userId,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          entityType: data.entityType || 'User',
          entityId: data.entityId || (data.userId?.toString() ?? ''),
          details: data.details,
          offerId: data.offerId,
        },
      });
    } catch (error) {
      logger.error('Failed to create audit log:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }
}
