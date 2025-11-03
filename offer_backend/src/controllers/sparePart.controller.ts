import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth.middleware';
import { AuditService } from '../services/audit.service';

export class SparePartController {
  // Get all spare parts
  static async getSpareParts(req: AuthRequest, res: Response) {
    try {
      const { 
        search, 
        page = 1, 
        limit = 50,
        category,
        status = 'ACTIVE'
      } = req.query;

      const where: any = {};

      if (status !== 'ALL') {
        where.status = status;
      }

      if (category) {
        where.category = category;
      }

      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { partNumber: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } },
          { category: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      const [spareParts, total] = await Promise.all([
        prisma.sparePart.findMany({
          where,
          orderBy: { name: 'asc' },
          skip,
          take,
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },
            updatedBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),
        prisma.sparePart.count({ where }),
      ]);

      res.json({
        spareParts,
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      });
      return;
    } catch (error) {
      logger.error('Get spare parts error:', error);
      res.status(500).json({ error: 'Failed to fetch spare parts' });
      return;
    }
  }

  // Get single spare part
  static async getSparePart(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const sparePart = await prisma.sparePart.findUnique({
        where: { id: parseInt(id) },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          updatedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!sparePart) {
        return res.status(404).json({ error: 'Spare part not found' });
      }

      res.json({ sparePart });
      return;
    } catch (error) {
      logger.error('Get spare part error:', error);
      res.status(500).json({ error: 'Failed to fetch spare part' });
      return;
    }
  }

  // Create new spare part (admin only)
  static async createSparePart(req: AuthRequest, res: Response) {
    try {
      const {
        name,
        partNumber,
        description,
        category,
        basePrice,
        imageUrl,
        specifications,
        status = 'ACTIVE',
      } = req.body;

      // Validation
      if (!name || !partNumber || !basePrice) {
        return res.status(400).json({ 
          error: 'Name, part number, and base price are required' 
        });
      }

      // Check if part number already exists
      const existingPart = await prisma.sparePart.findUnique({
        where: { partNumber },
      });

      if (existingPart) {
        return res.status(400).json({ 
          error: 'Part number already exists' 
        });
      }

      const sparePart = await prisma.sparePart.create({
        data: {
          name,
          partNumber,
          description,
          category,
          basePrice: parseFloat(basePrice),
          imageUrl,
          specifications: specifications ? JSON.stringify(specifications) : null,
          status,
          createdById: req.user!.id,
          updatedById: req.user!.id,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      await AuditService.log({
        action: 'SPARE_PART_CREATED',
        entityType: 'SparePart',
        entityId: sparePart.id,
        userId: req.user!.id,
        details: { name: sparePart.name, partNumber: sparePart.partNumber },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(201).json({ sparePart });
      return;
    } catch (error) {
      logger.error('Create spare part error:', error);
      res.status(500).json({ error: 'Failed to create spare part' });
      return;
    }
  }

  // Update spare part (admin only)
  static async updateSparePart(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const existingSparePart = await prisma.sparePart.findUnique({
        where: { id: parseInt(id) },
      });

      if (!existingSparePart) {
        return res.status(404).json({ error: 'Spare part not found' });
      }

      // If updating part number, check for duplicates
      if (updates.partNumber && updates.partNumber !== existingSparePart.partNumber) {
        const existingPart = await prisma.sparePart.findUnique({
          where: { partNumber: updates.partNumber },
        });

        if (existingPart) {
          return res.status(400).json({ 
            error: 'Part number already exists' 
          });
        }
      }

      // Handle specifications as JSON
      if (updates.specifications && typeof updates.specifications === 'object') {
        updates.specifications = JSON.stringify(updates.specifications);
      }

      // Convert basePrice to float if provided
      if (updates.basePrice) {
        updates.basePrice = parseFloat(updates.basePrice);
      }

      const sparePart = await prisma.sparePart.update({
        where: { id: parseInt(id) },
        data: {
          ...updates,
          updatedById: req.user!.id,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          updatedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      await AuditService.log({
        action: 'SPARE_PART_UPDATED',
        entityType: 'SparePart',
        entityId: sparePart.id,
        userId: req.user!.id,
        oldValue: existingSparePart,
        newValue: updates,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ sparePart });
      return;
    } catch (error) {
      logger.error('Update spare part error:', error);
      res.status(500).json({ error: 'Failed to update spare part' });
      return;
    }
  }

  // Delete spare part (admin only)
  static async deleteSparePart(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const sparePart = await prisma.sparePart.findUnique({
        where: { id: parseInt(id) },
      });

      if (!sparePart) {
        return res.status(404).json({ error: 'Spare part not found' });
      }

      // Soft delete by setting status to INACTIVE
      const updatedSparePart = await prisma.sparePart.update({
        where: { id: parseInt(id) },
        data: {
          status: 'INACTIVE',
          updatedById: req.user!.id,
        },
      });

      await AuditService.log({
        action: 'SPARE_PART_DELETED',
        entityType: 'SparePart',
        entityId: parseInt(id),
        userId: req.user!.id,
        details: { name: sparePart.name, partNumber: sparePart.partNumber },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ message: 'Spare part deleted successfully' });
      return;
    } catch (error) {
      logger.error('Delete spare part error:', error);
      res.status(500).json({ error: 'Failed to delete spare part' });
      return;
    }
  }

  // Get spare part categories
  static async getCategories(req: AuthRequest, res: Response) {
    try {
      const categories = await prisma.sparePart.findMany({
        where: {
          status: 'ACTIVE',
          category: {
            not: null,
          },
        },
        select: {
          category: true,
        },
        distinct: ['category'],
        orderBy: {
          category: 'asc',
        },
      });

      const categoryList = categories
        .map((item: any) => item.category)
        .filter(Boolean) as string[];

      res.json({ categories: categoryList });
      return;
    } catch (error) {
      logger.error('Get categories error:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
      return;
    }
  }

  // Bulk update prices (admin only)
  static async bulkUpdatePrices(req: AuthRequest, res: Response) {
    try {
      const { updates } = req.body; // Array of { id, basePrice }

      if (!Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({ error: 'Updates array is required' });
      }

      const results = [];
      
      for (const update of updates) {
        if (!update.id || !update.basePrice) {
          continue;
        }

        try {
          const sparePart = await prisma.sparePart.update({
            where: { id: parseInt(update.id) },
            data: {
              basePrice: parseFloat(update.basePrice),
              updatedById: req.user!.id,
            },
          });
          results.push(sparePart);
        } catch (error) {
          logger.error(`Failed to update spare part ${update.id}:`, error);
        }
      }

      await AuditService.log({
        action: 'SPARE_PARTS_BULK_PRICE_UPDATE',
        entityType: 'SparePart',
        userId: req.user!.id,
        details: { updatedCount: results.length, updates },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ 
        message: `Successfully updated ${results.length} spare parts`,
        updatedParts: results 
      });
      return;
    } catch (error) {
      logger.error('Bulk update prices error:', error);
      res.status(500).json({ error: 'Failed to bulk update prices' });
      return;
    }
  }
}
