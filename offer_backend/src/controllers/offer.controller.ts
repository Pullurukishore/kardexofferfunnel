import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth.middleware';
import { ActivityController } from './activity.controller';

export class OfferController {
  // Get next offer reference number (for preview)
  static async getNextOfferReferenceNumber(req: AuthRequest, res: Response) {
    try {
      const { zoneId, productType } = req.query;
      
      if (!zoneId || !productType) {
        return res.status(400).json({ error: 'Zone ID and product type are required' });
      }

      // Zone users and zone managers can only request next reference for their own zones
      if ((req.user?.role === 'ZONE_USER' || req.user?.role === 'ZONE_MANAGER')) {
        const userZoneIds = req.user.zoneIds || (req.user.zoneId ? [req.user.zoneId] : []);
        if (!userZoneIds.includes(zoneId as string)) {
          return res.status(403).json({ error: 'Access denied: zone not in your authorized zones' });
        }
      }

      const nextRef = await OfferController.generateOfferReferenceNumber(
        parseInt(zoneId as string),
        productType as string,
        req.user!.id
      );
      res.json({
        success: true,
        nextOfferReferenceNumber: nextRef
      });
      return;
    } catch (error) {
      logger.error('Get next offer reference error:', error);
      res.status(500).json({ error: 'Failed to generate offer reference number' });
      return;
    }
  }

  // Generate structured offer reference number: KRIND/W/SPP/AB25042
  // Matches company's existing format with zone, product type, and user initials
  // Uses atomic transaction to prevent race conditions and duplicate IDs
  static async generateOfferReferenceNumber(
    zoneId: number,
    productType: string,
    userId: number
  ): Promise<string> {
    const maxRetries = 5;
    let attempts = 0;

    while (attempts < maxRetries) {
      try {
        // Use a transaction to ensure atomic ID generation
        const result = await prisma.$transaction(async (tx) => {
          // Get zone and user info
          const [zone, user] = await Promise.all([
            tx.serviceZone.findUnique({
              where: { id: zoneId },
              select: { shortForm: true }
            }),
            tx.user.findUnique({
              where: { id: userId },
              select: { shortForm: true, name: true }
            })
          ]);

          if (!zone || !user) {
            throw new Error('Zone or user not found for offer reference generation');
          }

          // Product type mapping to match your company format
          const productTypeMap: Record<string, string> = {
            'SPP': 'SPP',           // Spare Parts -> SPP (same as company format)
            'CONTRACT': 'CON',      // Contract -> CON
            'RELOCATION': 'REL',    // Relocation -> REL
            'UPGRADE_KIT': 'UPG',   // Upgrade Kit -> UPG
            'SOFTWARE': 'SFT'       // Software -> SFT
          };

          // Generate user short form if not exists
          let userShortForm = user.shortForm;
          if (!userShortForm && user.name) {
            // Auto-generate from name (first letter of first two words)
            const nameParts = user.name.trim().split(' ');
            userShortForm = nameParts.length >= 2 
              ? (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase()
              : nameParts[0].substring(0, 2).toUpperCase();
          } else if (!userShortForm) {
            userShortForm = 'XX'; // Fallback
          }

          const companyPrefix = 'KRIND';
          const zoneAbbr = (zone.shortForm || 'X').toString().trim().toUpperCase();
          // Derive a clean 3-letter product abbreviation (letters only)
          const deriveAbbr = (val: string) => (val || '').replace(/[^A-Za-z]/g, '').toUpperCase();
          const productAbbrRaw = productTypeMap[productType] || deriveAbbr(productType).substring(0, 3);
          const productAbbr = productAbbrRaw && productAbbrRaw.length > 0 ? productAbbrRaw : 'GEN';

          // Sequence should be continuous company-wide across ALL zones, users and product types
          // Example: KRIND/S/SPP/AU00007 -> next anywhere is KRIND/R/CON/PU00008
          // Compute max 5-digit suffix globally for KRIND prefix and increment
          let nextNumber = 1;
          const globalMax: any = await tx.$queryRaw`
            SELECT COALESCE(MAX(CAST(substring("offerReferenceNumber" FROM '([0-9]{5})$') AS INTEGER)), 0) AS "maxSeq"
            FROM "Offer"
            WHERE "offerReferenceNumber" LIKE ${`${companyPrefix}/%`}
          `;
          const maxSeq = Array.isArray(globalMax) ? Number(globalMax[0]?.maxSeq || 0) : Number((globalMax as any)?.maxSeq || 0);
          nextNumber = (Number.isFinite(maxSeq) ? maxSeq : 0) + 1;

          // Generate the new offer reference number
          const newOfferRef = `${companyPrefix}/${zoneAbbr}/${productAbbr}/${userShortForm}${String(nextNumber).padStart(5, '0')}`;
          
          // Double-check uniqueness within the transaction
          const existingWithSameRef = await tx.offer.findUnique({
            where: { offerReferenceNumber: newOfferRef },
            select: { id: true }
          });
          
          if (existingWithSameRef) {
            throw new Error('Generated offer reference number already exists, retrying...');
          }
          
          return newOfferRef;
        });
        
        return result;
        
      } catch (error: any) {
        attempts++;
        logger.warn(`Offer ID generation attempt ${attempts} failed:`, error.message);
        
        if (attempts >= maxRetries) {
          logger.error('Failed to generate unique offer ID after maximum retries');
          throw new Error('Unable to generate unique offer reference number. Please try again.');
        }
        
        // Wait a small random amount before retrying to reduce collision probability
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
      }
    }

    throw new Error('Unexpected error in offer reference number generation');
  }

  // Get all offers (filtered by zone for zone users)
  static async getOffers(req: AuthRequest, res: Response) {
    try {
      const { 
        status, 
        stage, 
        customerId, 
        assignedToId,
        createdById, 
        search, 
        page = 1, 
        limit = 20,
        productType,
        offerMonth,
        poExpectedMonth,
        openFunnel,
        myOffers
      } = req.query;

      const where: any = {};

      // Zone users and zone managers can only see offers in their zones
      if ((req.user?.role === 'ZONE_USER' || req.user?.role === 'ZONE_MANAGER')) {
        const userZoneIds = req.user.zoneIds || (req.user.zoneId ? [req.user.zoneId] : []);
        if (userZoneIds.length > 0) {
          where.zoneId = { in: userZoneIds.map(id => parseInt(id)) };
        }
      }

      // Filter by current user's offers only
      if (myOffers === 'true' && req.user?.id) {
        where.createdById = req.user.id;
      }

      if (status) where.status = status;
      if (stage) where.stage = stage;
      if (customerId) where.customerId = parseInt(customerId as string);
      if (assignedToId) where.assignedToId = parseInt(assignedToId as string);
      if (createdById) where.createdById = parseInt(createdById as string);
      if (productType) where.productType = productType; // Enum field - use exact match
      if (offerMonth) where.offerMonth = offerMonth;
      if (poExpectedMonth) where.poExpectedMonth = poExpectedMonth;
      if (openFunnel !== undefined) where.openFunnel = openFunnel === 'true';

      if (search) {
        where.OR = [
          { title: { contains: search as string, mode: 'insensitive' } },
          { offerReferenceNumber: { contains: search as string, mode: 'insensitive' } },
          { company: { contains: search as string, mode: 'insensitive' } },
          { contactPersonName: { contains: search as string, mode: 'insensitive' } },
          { poNumber: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      const [offers, total] = await Promise.all([
        prisma.offer.findMany({
          where,
          include: {
            customer: {
              select: {
                id: true,
                companyName: true,
                location: true,
                department: true,
                registrationDate: true,
              },
            },
            contact: {
              select: {
                id: true,
                contactPersonName: true,
                contactNumber: true,
                email: true,
              },
            },
            zone: {
              select: {
                id: true,
                name: true,
              },
            },
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
        prisma.offer.count({ where }),
      ]);

      res.json({
        offers,
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      });
      return;
    } catch (error) {
      logger.error('Get offers error:', error);
      res.status(500).json({ error: 'Failed to fetch offers' });
      return;
    }
  }

  // Get single offer
  static async getOffer(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const offer = await prisma.offer.findUnique({
        where: { id: parseInt(id) },
        include: {
          customer: {
            include: {
              contacts: {
                where: {
                  role: 'ACCOUNT_OWNER',
                  isActive: true,
                },
              },
            },
          },
          contact: true,
          zone: true,
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
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
          offerSpareParts: {
            include: {
              sparePart: true,
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          offerAssets: {
            include: {
              asset: {
                include: {
                  customer: {
                    select: {
                      companyName: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          stageRemarks: {
            include: {
              createdBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      if (!offer) {
        return res.status(404).json({ error: 'Offer not found' });
      }

      // Zone users and zone managers can only access offers in their zones
      if ((req.user?.role === 'ZONE_USER' || req.user?.role === 'ZONE_MANAGER')) {
        const userZoneIds = req.user.zoneIds || (req.user.zoneId ? [req.user.zoneId] : []);
        if (!userZoneIds.includes(offer.zoneId.toString())) {
          return res.status(403).json({ error: 'Access denied: offer not in your authorized zones' });
        }
      }

      res.json({ offer });
      return;
    } catch (error) {
      logger.error('Get offer error:', error);
      res.status(500).json({ error: 'Failed to fetch offer' });
      return;
    }
  }

  // Create new offer (both admin and zone users)
  static async createOffer(req: AuthRequest, res: Response) {
    try {
      const {
        // Essential fields for initial stage
        title,
        productType,
        lead,
        company,
        location,
        department,
        contactPersonName,
        contactNumber,
        email,
        machineSerialNumber,
        customerId,
        contactId,
        assetIds,
        zoneId,
        stage,
        status,
        spareParts,
        
        // Optional fields for later stages
        offerReferenceDate,
        assignedToId,
        offerValue,
        offerMonth,
        poExpectedMonth,
        probabilityPercentage,
        poNumber,
        poDate,
        poValue,
        poReceivedMonth,
        remarks,
      } = req.body;

      // Zone users and zone managers can only create offers in their assigned zone
      if ((req.user?.role === 'ZONE_USER' || req.user?.role === 'ZONE_MANAGER')) {
        if (!req.user.zoneId) {
          return res.status(400).json({ error: 'Zone ID is required for zone users' });
        }
        if (parseInt(zoneId) !== parseInt(req.user.zoneId)) {
          return res.status(403).json({ error: 'Access denied: cannot create offer for a different zone' });
        }
      }

      // Convert date strings to proper Date objects
      let poDateObj = null;
      if (poDate) {
        if (typeof poDate === 'string' && poDate.length === 10) {
          // If it's just a date (YYYY-MM-DD), convert to ISO DateTime
          poDateObj = new Date(poDate + 'T00:00:00.000Z');
        } else {
          poDateObj = new Date(poDate);
        }
      }

      // Auto-generate offer reference number with the new structured format
      const autoGeneratedOfferRef = await OfferController.generateOfferReferenceNumber(
        parseInt(zoneId),
        productType,
        req.user!.id
      );

      // Create the offer first
      const offer = await prisma.offer.create({
        data: {
          // Basic Information
          offerReferenceNumber: autoGeneratedOfferRef,
          offerReferenceDate: offerReferenceDate ? new Date(offerReferenceDate) : null,
          title,
          description: `${productType} offer for ${company}`, // Auto-generate description
          productType,
          lead,
          
          // Customer Information (duplicated for easy access)
          registrationDate: new Date(), // Auto-generate current date
          company,
          location,
          department,
          
          // Contact Information (duplicated for easy access)
          contactPersonName,
          contactNumber,
          email,
          
          // Asset Information (duplicated for easy access)
          machineSerialNumber,
          
          // Relations
          customerId: parseInt(customerId),
          contactId: parseInt(contactId),
          zoneId: parseInt(zoneId),
          assignedToId: assignedToId ? parseInt(assignedToId) : null,
          
          // Financial Information (optional for initial stage)
          offerValue: offerValue ? parseFloat(offerValue) : null,
          offerMonth,
          poExpectedMonth,
          probabilityPercentage: probabilityPercentage ? parseInt(probabilityPercentage) : null,
          
          // PO Information (optional for initial stage)
          poNumber,
          poDate: poDateObj,
          poValue: poValue ? parseFloat(poValue) : null,
          poReceivedMonth,
          
          // Remarks
          remarks: remarks || null,
          
          // Business Information
          openFunnel: true, // Default to true for all new offers
          
          // System Dates
          bookingDateInSap: null,
          offerEnteredInCrm: new Date(),
          offerClosedInCrm: null,
          
          // Status & Progress (use provided values or defaults)
          status: status || 'DRAFT',
          stage: stage || 'INITIAL',
          priority: 'MEDIUM',
          
          // Tracking
          createdById: req.user!.id,
          updatedById: req.user!.id,
        },
        include: {
          customer: true,
          contact: true,
          zone: true,
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Create OfferSparePart entries if SPP product type and spare parts provided
      if (productType === 'SPP' && spareParts && Array.isArray(spareParts) && spareParts.length > 0) {
        const sparePartEntries = spareParts.map((part: any) => {
          const quantity = parseInt(part.quantity) || 1;
          const unitPrice = parseFloat(part.price) || 0;
          const totalPrice = quantity * unitPrice;

          return {
            offerId: offer.id,
            sparePartId: parseInt(part.name), // 'name' field contains the spare part ID from frontend
            quantity: quantity,
            unitPrice: unitPrice,
            totalPrice: totalPrice,
            notes: part.notes || null,
          };
        });

        // Create all spare part entries
        await prisma.offerSparePart.createMany({
          data: sparePartEntries,
        });

        logger.info(`Created ${sparePartEntries.length} spare part entries for offer ${offer.id}`);
      }

      // TODO: Create offer-asset relationships after schema migration
      // For now, we'll store asset info in the machineSerialNumber field

      // Log offer creation to audit trail
      await ActivityController.logOfferCreate({
        offerId: offer.id,
        offerReferenceNumber: offer.offerReferenceNumber,
        offerData: offer,
        userId: req.user!.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      // Fetch the complete offer with spare parts to return
      const completeOffer = await prisma.offer.findUnique({
        where: { id: offer.id },
        include: {
          customer: true,
          contact: true,
          zone: true,
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          offerSpareParts: {
            include: {
              sparePart: true,
            },
          },
        },
      });

      res.status(201).json({ offer: completeOffer });
      return;
    } catch (error) {
      logger.error('Create offer error:', error);
      res.status(500).json({ error: 'Failed to create offer' });
      return;
    }
  }

  // Update offer
  static async updateOffer(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Convert date strings to ISO DateTime format
      if (updates.poDate && typeof updates.poDate === 'string') {
        // If it's just a date (YYYY-MM-DD), convert to ISO DateTime
        if (updates.poDate.length === 10) {
          updates.poDate = new Date(updates.poDate + 'T00:00:00.000Z').toISOString();
        }
      }

      const existingOffer = await prisma.offer.findUnique({
        where: { id: parseInt(id) },
      });

      if (!existingOffer) {
        return res.status(404).json({ error: 'Offer not found' });
      }

      // Zone users and zone managers can only update offers in their zone
      if ((req.user?.role === 'ZONE_USER' || req.user?.role === 'ZONE_MANAGER') && req.user.zoneId) {
        if (existingOffer.zoneId !== parseInt(req.user.zoneId)) {
          return res.status(403).json({ error: 'Access denied' });
        }
      }

      // Check if stage is changing and remarks are provided
      const isStageChanging = updates.stage && updates.stage !== existingOffer.stage;
      const hasRemarks = updates.remarks && updates.remarks.trim();

      // If stage is changing and remarks are provided, save stage-specific remarks
      if (isStageChanging && hasRemarks) {
        await prisma.stageRemark.create({
          data: {
            offerId: parseInt(id),
            stage: updates.stage,
            remarks: updates.remarks.trim(),
            createdById: req.user!.id,
          },
        });
        
        logger.info(`Stage remark saved for offer ${id}, stage: ${updates.stage}`);
        
        // Clear the remarks field after saving to StageRemark to avoid duplication
        updates.remarks = null;
      } else if (!isStageChanging && hasRemarks) {
        // If stage is NOT changing but remarks are provided, save for current stage
        await prisma.stageRemark.create({
          data: {
            offerId: parseInt(id),
            stage: existingOffer.stage,
            remarks: updates.remarks.trim(),
            createdById: req.user!.id,
          },
        });
        
        logger.info(`Stage remark updated for offer ${id}, stage: ${existingOffer.stage}`);
        
        // Clear the remarks field after saving to StageRemark
        updates.remarks = null;
      }

      const offer = await prisma.offer.update({
        where: { id: parseInt(id) },
        data: {
          ...updates,
          updatedById: req.user!.id,
        },
        include: {
          customer: true,
          contact: true,
          zone: true,
          assignedTo: true,
          createdBy: true,
          updatedBy: true,
        },
      });

      // Log offer update with automatic change detection
      await ActivityController.logOfferUpdate({
        offerId: offer.id,
        offerReferenceNumber: offer.offerReferenceNumber,
        oldData: existingOffer,
        newData: updates,
        userId: req.user!.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ offer });
      return;
    } catch (error) {
      logger.error('Update offer error:', error);
      res.status(500).json({ error: 'Failed to update offer' });
      return;
    }
  }

  // Update offer status
  static async updateStatus(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status, stage, notes } = req.body;

      const existingOffer = await prisma.offer.findUnique({
        where: { id: parseInt(id) },
      });

      if (!existingOffer) {
        return res.status(404).json({ error: 'Offer not found' });
      }

      // Zone users and zone managers can only update offers in their zone
      if ((req.user?.role === 'ZONE_USER' || req.user?.role === 'ZONE_MANAGER') && req.user.zoneId) {
        if (existingOffer.zoneId !== parseInt(req.user.zoneId)) {
          return res.status(403).json({ error: 'Access denied' });
        }
      }

      const updateData: any = {
        updatedById: req.user!.id,
      };

      if (status) updateData.status = status;
      if (stage) updateData.stage = stage;

      // Set closed date if status is WON or LOST
      if (status === 'WON' || status === 'LOST') {
        updateData.closedAt = new Date();
        updateData.actualCloseDate = new Date();
      }

      const offer = await prisma.offer.update({
        where: { id: parseInt(id) },
        data: updateData,
      });

      // Log status change in audit log instead of separate status history
      await ActivityController.logOfferStatusChange({
        offerId: offer.id,
        offerReferenceNumber: offer.offerReferenceNumber,
        fromStatus: existingOffer.status,
        toStatus: status || existingOffer.status,
        fromStage: existingOffer.stage,
        toStage: stage || existingOffer.stage,
        notes,
        userId: req.user!.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({ offer });
      return;
    } catch (error) {
      logger.error('Update status error:', error);
      res.status(500).json({ error: 'Failed to update status' });
      return;
    }
  }

  // Delete offer (admin only)
  static async deleteOffer(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const offer = await prisma.offer.findUnique({
        where: { id: parseInt(id) },
      });

      if (!offer) {
        return res.status(404).json({ error: 'Offer not found' });
      }

      await prisma.offer.delete({
        where: { id: parseInt(id) },
      });

      await ActivityController.logOfferDelete({
        offerId: offer.id,
        offerReferenceNumber: offer.offerReferenceNumber,
        userId: req.user!.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ message: 'Offer deleted successfully' });
      return;
    } catch (error) {
      logger.error('Delete offer error:', error);
      res.status(500).json({ error: 'Failed to delete offer' });
      return;
    }
  }

  // Add note to offer
  static async addNote(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { content } = req.body;

      const offer = await prisma.offer.findUnique({
        where: { id: parseInt(id) },
      });

      if (!offer) {
        return res.status(404).json({ error: 'Offer not found' });
      }

      // Zone users and zone managers can only add notes to offers in their zone
      if ((req.user?.role === 'ZONE_USER' || req.user?.role === 'ZONE_MANAGER') && req.user.zoneId) {
        if (offer.zoneId !== parseInt(req.user.zoneId)) {
          return res.status(403).json({ error: 'Access denied' });
        }
      }

      // Log note as audit entry since offerNote model doesn't exist
      await ActivityController.logOfferNoteAdded({
        offerId: offer.id,
        offerReferenceNumber: offer.offerReferenceNumber,
        content,
        userId: req.user!.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({ 
        success: true, 
        message: 'Note added successfully',
        note: {
          content,
          offerId: parseInt(id),
          authorId: req.user!.id,
          createdAt: new Date(),
          author: {
            id: req.user!.id,
            email: req.user!.email
          }
        }
      });
      return;
    } catch (error) {
      logger.error('Add note error:', error);
      res.status(500).json({ error: 'Failed to add note' });
      return;
    }
  }

  // Get offer for quote generation (Zone Manager/User)
  static async getOfferForQuote(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const offer = await prisma.offer.findUnique({
        where: { id: parseInt(id) },
        include: {
          customer: {
            include: {
              contacts: {
                where: {
                  role: 'ACCOUNT_OWNER',
                  isActive: true,
                },
              },
            },
          },
          contact: true,
          zone: true,
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
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
          offerSpareParts: {
            include: {
              sparePart: true,
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          offerAssets: {
            include: {
              asset: {
                include: {
                  customer: {
                    select: {
                      companyName: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          stageRemarks: {
            include: {
              createdBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      if (!offer) {
        return res.status(404).json({ error: 'Offer not found' });
      }

      // Zone users and zone managers can only access offers in their zones
      if ((req.user?.role === 'ZONE_USER' || req.user?.role === 'ZONE_MANAGER')) {
        const userZoneIds = req.user.zoneIds || (req.user.zoneId ? [req.user.zoneId] : []);
        if (!userZoneIds.includes(offer.zoneId.toString())) {
          return res.status(403).json({ error: 'Access denied: offer not in your authorized zones' });
        }
      }

      res.json({ offer });
      return;
    } catch (error) {
      logger.error('Get offer for quote error:', error);
      res.status(500).json({ error: 'Failed to fetch offer' });
      return;
    }
  }

  // Get offer for quote generation (Admin only)
  static async getOfferForQuoteAdmin(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const offer = await prisma.offer.findUnique({
        where: { id: parseInt(id) },
        include: {
          customer: {
            include: {
              contacts: {
                where: {
                  role: 'ACCOUNT_OWNER',
                  isActive: true,
                },
              },
            },
          },
          contact: true,
          zone: true,
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
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
          offerSpareParts: {
            include: {
              sparePart: true,
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          offerAssets: {
            include: {
              asset: {
                include: {
                  customer: {
                    select: {
                      companyName: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          stageRemarks: {
            include: {
              createdBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      if (!offer) {
        return res.status(404).json({ error: 'Offer not found' });
      }

      res.json({ offer });
      return;
    } catch (error) {
      logger.error('Get offer for quote admin error:', error);
      res.status(500).json({ error: 'Failed to fetch offer' });
      return;
    }
  }
}
