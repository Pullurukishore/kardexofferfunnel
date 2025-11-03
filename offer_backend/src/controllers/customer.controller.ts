import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth.middleware';
import { AuditService } from '../services/audit.service';

export class CustomerController {
  // Get all customers with filters and pagination
  static async getCustomers(req: AuthRequest, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        zoneId,
        isActive,
        include
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const where: any = {};

      // Zone users can only see customers in their zones
      if (req.user?.role === 'ZONE_USER' && req.user.zoneId) {
        where.zoneId = parseInt(req.user.zoneId);
      }

      // Search filter
      if (search) {
        where.OR = [
          { companyName: { contains: search as string, mode: 'insensitive' } },
          { location: { contains: search as string, mode: 'insensitive' } },
          { city: { contains: search as string, mode: 'insensitive' } },
          { industry: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      // Zone filter
      if (zoneId) {
        where.zoneId = Number(zoneId);
      }

      // Active status filter
      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }

      // Build include object based on request
      const includeObj: any = {
        zone: {
          select: {
            id: true,
            name: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            offers: true,
            contacts: true,
            assets: true
          }
        }
      };

      // Add contacts and assets if requested
      if (include && typeof include === 'string') {
        const includeFields = include.split(',').map(field => field.trim());
        
        if (includeFields.includes('contacts')) {
          includeObj.contacts = {
            where: { isActive: true },
            orderBy: { isPrimary: 'desc' }
          };
        }
        
        if (includeFields.includes('assets')) {
          includeObj.assets = {
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
          };
        }
      }

      const [customers, totalCount] = await Promise.all([
        prisma.customer.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: includeObj
        }),
        prisma.customer.count({ where })
      ]);

      res.json({
        success: true,
        customers,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / Number(limit))
        }
      });
      return;
    } catch (error) {
      logger.error('Get customers error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to fetch customers' 
      });
      return;
    }
  }

  // Get single customer by ID
  static async getCustomer(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const customer = await prisma.customer.findUnique({
        where: { id: parseInt(id) },
        include: {
          zone: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          contacts: {
            where: { isActive: true },
            orderBy: { isPrimary: 'desc' }
          },
          assets: {
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
          },
          offers: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              offerReferenceNumber: true,
              status: true,
              offerValue: true,
              createdAt: true
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          updatedBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      if (!customer) {
        return res.status(404).json({ 
          success: false,
          message: 'Customer not found' 
        });
      }

      // Zone users can only access customers in their zone
      if (req.user?.role === 'ZONE_USER' && req.user.zoneId) {
        if (customer.zoneId !== parseInt(req.user.zoneId)) {
          return res.status(403).json({ 
            success: false,
            message: 'Access denied' 
          });
        }
      }

      res.json({
        success: true,
        customer
      });
      return;
    } catch (error) {
      logger.error('Get customer error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to fetch customer' 
      });
      return;
    }
  }

  // Create new customer
  static async createCustomer(req: AuthRequest, res: Response) {
    try {
      const {
        companyName,
        location,
        department,
        registrationDate,
        industry,
        website,
        address,
        city,
        state,
        country,
        pincode,
        zoneId
      } = req.body;

      // Validation
      if (!companyName) {
        return res.status(400).json({
          success: false,
          message: 'Company name is required'
        });
      }

      // Check if customer with same name already exists
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          companyName: {
            equals: companyName,
            mode: 'insensitive'
          }
        }
      });

      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          message: 'Customer with this company name already exists'
        });
      }

      const customer = await prisma.customer.create({
        data: {
          companyName,
          location,
          department,
          registrationDate: registrationDate ? new Date(registrationDate) : null,
          industry,
          website,
          address,
          city,
          state,
          country: country || 'India',
          pincode,
          zoneId: zoneId ? parseInt(zoneId) : null,
          isActive: true,
          createdById: req.user!.id,
          updatedById: req.user!.id
        },
        include: {
          zone: {
            select: {
              id: true,
              name: true
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      await AuditService.log({
        action: 'CUSTOMER_CREATED',
        entityType: 'Customer',
        entityId: customer.id,
        userId: req.user!.id,
        details: { companyName: customer.companyName },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.status(201).json({
        success: true,
        message: 'Customer created successfully',
        customer
      });
      return;
    } catch (error) {
      logger.error('Create customer error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to create customer' 
      });
      return;
    }
  }

  // Update customer
  static async updateCustomer(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const existingCustomer = await prisma.customer.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existingCustomer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }

      // Zone users can only update customers in their zone
      if (req.user?.role === 'ZONE_USER' && req.user.zoneId) {
        if (existingCustomer.zoneId !== parseInt(req.user.zoneId)) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
      }

      // Prepare update data
      const updateData: any = {
        ...updates,
        updatedById: req.user!.id
      };

      // Handle date conversion
      if (updates.registrationDate) {
        updateData.registrationDate = new Date(updates.registrationDate);
      }

      // Handle zone ID conversion
      if (updates.zoneId) {
        updateData.zoneId = parseInt(updates.zoneId);
      }

      const customer = await prisma.customer.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: {
          zone: {
            select: {
              id: true,
              name: true
            }
          },
          updatedBy: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      await AuditService.log({
        action: 'CUSTOMER_UPDATED',
        entityType: 'Customer',
        entityId: customer.id,
        userId: req.user!.id,
        oldValue: existingCustomer,
        newValue: updates,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({
        success: true,
        message: 'Customer updated successfully',
        customer
      });
      return;
    } catch (error) {
      logger.error('Update customer error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to update customer' 
      });
      return;
    }
  }

  // Delete customer (soft delete)
  static async deleteCustomer(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const customer = await prisma.customer.findUnique({
        where: { id: parseInt(id) },
        include: {
          _count: {
            select: {
              offers: true,
              contacts: true,
              assets: true
            }
          }
        }
      });

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }

      // Check if customer has related data
      if (customer._count.offers > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete customer. It has ${customer._count.offers} associated offers. Please delete or reassign them first.`
        });
      }

      // Soft delete by setting isActive to false
      await prisma.customer.update({
        where: { id: parseInt(id) },
        data: {
          isActive: false,
          updatedById: req.user!.id
        }
      });

      await AuditService.log({
        action: 'CUSTOMER_DELETED',
        entityType: 'Customer',
        entityId: parseInt(id),
        userId: req.user!.id,
        details: { companyName: customer.companyName },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({
        success: true,
        message: 'Customer deleted successfully'
      });
      return;
    } catch (error) {
      logger.error('Delete customer error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to delete customer' 
      });
      return;
    }
  }

  // Get customer statistics
  static async getCustomerStats(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const customer = await prisma.customer.findUnique({
        where: { id: parseInt(id) }
      });

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }

      const [
        totalOffers,
        offerStats,
        totalContacts,
        totalAssets
      ] = await Promise.all([
        prisma.offer.count({
          where: { customerId: parseInt(id) }
        }),
        prisma.offer.groupBy({
          by: ['status'],
          where: { customerId: parseInt(id) },
          _count: { status: true },
          _sum: { offerValue: true }
        }),
        prisma.contact.count({
          where: { customerId: parseInt(id), isActive: true }
        }),
        prisma.asset.count({
          where: { customerId: parseInt(id), isActive: true }
        })
      ]);

      res.json({
        success: true,
        stats: {
          totalOffers,
          totalContacts,
          totalAssets,
          offerStats
        }
      });
      return;
    } catch (error) {
      logger.error('Get customer stats error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to fetch customer statistics' 
      });
      return;
    }
  }

  // Get all contacts for a customer
  static async getCustomerContacts(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const contacts = await prisma.contact.findMany({
        where: {
          customerId: parseInt(id)
        },
        orderBy: {
          contactPersonName: 'asc'
        }
      });

      res.json({
        success: true,
        contacts
      });
      return;
    } catch (error) {
      logger.error('Get customer contacts error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to fetch customer contacts' 
      });
      return;
    }
  }

  // Create new contact for a customer
  static async createContact(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const {
        contactPersonName,
        contactNumber,
        email,
        designation
      } = req.body;

      // Validation
      if (!contactPersonName || !contactNumber) {
        return res.status(400).json({
          success: false,
          message: 'Contact person name and number are required'
        });
      }

      const contact = await prisma.contact.create({
        data: {
          customerId: parseInt(id),
          contactPersonName,
          contactNumber,
          email,
          designation
        }
      });

      // Audit log
      await AuditService.log({
        userId: req.user!.id,
        action: 'CREATE',
        entityType: 'Contact',
        entityId: contact.id,
        details: `Created contact: ${contactPersonName}`
      });

      res.status(201).json({
        success: true,
        message: 'Contact created successfully',
        contact
      });
      return;
    } catch (error) {
      logger.error('Create contact error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to create contact' 
      });
      return;
    }
  }

  // Get all assets for a customer
  static async getCustomerAssets(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const assets = await prisma.asset.findMany({
        where: {
          customerId: parseInt(id)
        },
        orderBy: {
          assetName: 'asc'
        }
      });

      res.json({
        success: true,
        assets
      });
      return;
    } catch (error) {
      logger.error('Get customer assets error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to fetch customer assets' 
      });
      return;
    }
  }

  // Create new asset for a customer
  static async createAsset(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const {
        assetName,
        machineSerialNumber,
        model,
        installationDate,
        warrantyExpiry,
        location
      } = req.body;

      // Validation
      if (!assetName) {
        return res.status(400).json({
          success: false,
          message: 'Asset name is required'
        });
      }

      const asset = await prisma.asset.create({
        data: {
          customerId: parseInt(id),
          assetName,
          machineSerialNumber,
          model,
          installationDate: installationDate ? new Date(installationDate) : null,
          warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : null,
          location
        }
      });

      // Audit log
      await AuditService.log({
        userId: req.user!.id,
        action: 'CREATE',
        entityType: 'Asset',
        entityId: asset.id,
        details: `Created asset: ${assetName}`
      });

      res.status(201).json({
        success: true,
        message: 'Asset created successfully',
        asset
      });
      return;
    } catch (error) {
      logger.error('Create asset error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to create asset' 
      });
      return;
    }
  }
}
