import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { ActivityController } from './activity.controller';

/**
 * AuditController - Alias for ActivityController
 * Maintains backward compatibility while using the new ActivityController
 */
export class AuditController {
  /**
   * Get audit logs for a specific offer
   * Delegates to ActivityController.getOfferActivities
   */
  static async getOfferAuditLogs(req: AuthRequest, res: Response) {
    return ActivityController.getOfferActivities(req, res);
  }
}
