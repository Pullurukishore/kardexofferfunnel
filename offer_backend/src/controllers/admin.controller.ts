import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';

// Dashboard Analytics
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [
      totalOffers,
      totalZones,
      activeUsers,
      offerStats,
      zonePerformance,
      recentOffers
    ] = await Promise.all([
      // Total offers count
      prisma.offer.count(),
      
      // Total zones count
      prisma.serviceZone.count({ where: { isActive: true } }),
      
      // Active users count
      prisma.user.count({ where: { isActive: true } }),
      
      // Offer statistics by status
      prisma.offer.groupBy({
        by: ['status'],
        _count: { status: true },
        _sum: { offerValue: true }
      }),
      
      // Zone performance
      prisma.serviceZone.findMany({
        where: { isActive: true },
        include: {
          offers: {
            select: {
              id: true,
              offerValue: true,
              status: true
            }
          },
          _count: {
            select: { offers: true }
          }
        }
      }),
      
      // Recent offers
      prisma.offer.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { companyName: true } },
          zone: { select: { name: true } },
          createdBy: { select: { name: true } }
        }
      })
    ]);

    // Calculate total value
    const totalValue = offerStats.reduce((sum: number, stat: any) => 
      sum + (stat._sum.offerValue?.toNumber() || 0), 0
    );

    // Format zone performance
    const formattedZonePerformance = zonePerformance.map((zone: any) => ({
      id: zone.id,
      name: zone.name,
      totalOffers: zone._count.offers,
      totalValue: zone.offers.reduce((sum: number, offer: any) => 
        sum + (offer.offerValue?.toNumber() || 0), 0
      ),
      wonOffers: zone.offers.filter((offer: any) => offer.status === 'WON').length
    }));

    // Format recent offers
    const formattedRecentOffers = recentOffers.map((offer: any) => ({
      id: offer.id,
      offerReferenceNumber: offer.offerReferenceNumber,
      customer: offer.customer.companyName,
      zone: offer.zone.name,
      value: offer.offerValue?.toNumber() || 0,
      status: offer.status,
      addedBy: offer.createdBy.name,
      createdAt: offer.createdAt
    }));

    res.json({
      success: true,
      data: {
        totalOffers,
        totalZones,
        activeUsers,
        totalValue,
        offerStats,
        zonePerformance: formattedZonePerformance,
        recentOffers: formattedRecentOffers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
};

// Offer Management
export const getAllOffers = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      zone,
      status,
      priority,
      dateFrom,
      dateTo,
      minValue,
      maxValue
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    
    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { offerReferenceNumber: { contains: search as string, mode: 'insensitive' } },
        { customer: { companyName: { contains: search as string, mode: 'insensitive' } } },
        { createdBy: { name: { contains: search as string, mode: 'insensitive' } } }
      ];
    }
    
    if (zone && zone !== 'All Zones') {
      where.zone = { name: zone as string };
    }
    
    if (status && status !== 'All Status') {
      where.status = status as string;
    }
    
    if (priority && priority !== 'All Priority') {
      where.priority = priority as string;
    }
    
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom as string);
      if (dateTo) where.createdAt.lte = new Date(dateTo as string);
    }
    
    if (minValue || maxValue) {
      where.offerValue = {};
      if (minValue) where.offerValue.gte = Number(minValue);
      if (maxValue) where.offerValue.lte = Number(maxValue);
    }

    const [offers, totalCount] = await Promise.all([
      prisma.offer.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { companyName: true } },
          zone: { select: { name: true } },
          createdBy: { select: { name: true } },
          assignedTo: { select: { name: true } }
        }
      }),
      prisma.offer.count({ where })
    ]);

    const formattedOffers = offers.map((offer: any) => ({
      id: offer.id,
      offerReferenceNumber: offer.offerReferenceNumber,
      offerReferenceDate: offer.offerReferenceDate,
      company: offer.company,
      location: offer.location,
      department: offer.department,
      contactPersonName: offer.contactPersonName,
      contactNumber: offer.contactNumber,
      email: offer.email,
      machineSerialNumber: offer.machineSerialNumber,
      productType: offer.productType,
      lead: offer.lead,
      zone: offer.zone.name,
      offerValue: offer.offerValue?.toNumber() || 0,
      offerMonth: offer.offerMonth,
      poExpectedMonth: offer.poExpectedMonth,
      probabilityPercentage: offer.probabilityPercentage,
      poNumber: offer.poNumber,
      poDate: offer.poDate,
      poValue: offer.poValue?.toNumber() || 0,
      poReceivedMonth: offer.poReceivedMonth,
      openFunnel: offer.openFunnel,
      remarks: offer.remarks,
      status: offer.status,
      stage: offer.stage,
      priority: offer.priority,
      bookingDateInSap: offer.bookingDateInSap,
      offerEnteredInCrm: offer.offerEnteredInCrm,
      offerClosedInCrm: offer.offerClosedInCrm,
      addedBy: offer.createdBy.name,
      assignedTo: offer.assignedTo?.name,
      createdAt: offer.createdAt
    }));

    res.json({
      success: true,
      data: {
        offers: formattedOffers,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / Number(limit))
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch offers'
    });
  }
};

// User Management
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      zone,
      isActive
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    if (role && role !== 'All Roles') {
      where.role = role as string;
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          serviceZones: {
            include: {
              serviceZone: { select: { name: true } }
            }
          },
          createdOffers: {
            select: {
              id: true,
              offerValue: true,
              status: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    const formattedUsers = users.map((user: any) => {
      const userZones = user.serviceZones.map((sz: any) => sz.serviceZone.name);
      const offerStats = user.createdOffers.reduce((acc: any, offer: any) => {
        acc.count++;
        acc.totalValue += offer.offerValue?.toNumber() || 0;
        if (offer.status === 'WON') acc.wonCount++;
        return acc;
      }, { count: 0, totalValue: 0, wonCount: 0 });

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        zones: userZones,
        isActive: user.isActive,
        lastLogin: user.lastLoginAt,
        createdAt: user.createdAt,
        offersCount: offerStats.count,
        totalValue: offerStats.totalValue,
        winRate: offerStats.count > 0 ? Math.round((offerStats.wonCount / offerStats.count) * 100) : 0
      };
    });

    res.json({
      success: true,
      data: {
        users: formattedUsers,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / Number(limit))
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, role, zoneIds, password } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        role,
        password: hashedPassword,
        tokenVersion: require('crypto').randomUUID()
      }
    });

    // Assign zones if role is ZONE_USER
    if (role === 'ZONE_USER' && zoneIds && zoneIds.length > 0) {
      await prisma.servicePersonZone.createMany({
        data: zoneIds.map((zoneId: number) => ({
          userId: user.id,
          serviceZoneId: zoneId
        }))
      });
    }

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { userId: user.id }
    });
    return;
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create user'
    });
    return;
  }
};

// Zone Management

/**
 * Create a new service zone
 */
export const createZone = async (req: any, res: Response) => {
  try {
    const { name, description } = req.body;

    // Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Zone name is required'
      });
    }

    // Check if zone already exists
    const existingZone = await prisma.serviceZone.findFirst({
      where: { name: name.trim() }
    });

    if (existingZone) {
      return res.status(400).json({
        success: false,
        message: 'Zone with this name already exists'
      });
    }

    // Create new zone
    const zone = await prisma.serviceZone.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isActive: true
      }
    });


    return res.status(201).json({
      success: true,
      message: 'Zone created successfully',
      data: {
        id: zone.id,
        name: zone.name,
        description: zone.description,
        isActive: zone.isActive,
        createdAt: zone.createdAt
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create zone'
    });
  }
};

/**
 * Update a service zone
 */
export const updateZone = async (req: any, res: Response) => {
  try {
    const { zoneId } = req.params;
    const { name, description, isActive } = req.body;

    const zone = await prisma.serviceZone.findUnique({
      where: { id: parseInt(zoneId) }
    });

    if (!zone) {
      return res.status(404).json({
        success: false,
        message: 'Zone not found'
      });
    }

    // Check if new name already exists (if changing name)
    if (name && name.trim() !== zone.name) {
      const existingZone = await prisma.serviceZone.findFirst({
        where: { name: name.trim() }
      });

      if (existingZone) {
        return res.status(400).json({
          success: false,
          message: 'Zone with this name already exists'
        });
      }
    }

    const updatedZone = await prisma.serviceZone.update({
      where: { id: parseInt(zoneId) },
      data: {
        name: name ? name.trim() : zone.name,
        description: description !== undefined ? description?.trim() || null : zone.description,
        isActive: isActive !== undefined ? isActive : zone.isActive
      }
    });


    return res.json({
      success: true,
      message: 'Zone updated successfully',
      data: {
        id: updatedZone.id,
        name: updatedZone.name,
        description: updatedZone.description,
        isActive: updatedZone.isActive,
        createdAt: updatedZone.createdAt
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update zone'
    });
  }
};

export const getAllZones = async (req: Request, res: Response) => {
  try {
    const zones = await prisma.serviceZone.findMany({
      include: {
        offers: {
          select: {
            id: true,
            offerValue: true,
            status: true
          }
        },
        servicePersons: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                isActive: true
              }
            }
          }
        }
      }
    });

    const formattedZones = zones.map((zone: any) => {
      const zoneStats = zone.offers.reduce((acc: any, offer: any) => {
        acc.totalOffers++;
        acc.totalValue += Number(offer.offerValue) || 0;
        if (offer.status === 'WON') acc.wonOffers++;
        return acc;
      }, { totalOffers: 0, totalValue: 0, wonOffers: 0 });

      return {
        id: zone.id,
        name: zone.name,
        description: zone.description,
        isActive: zone.isActive,
        createdAt: zone.createdAt,
        totalOffers: zoneStats.totalOffers,
        totalValue: zoneStats.totalValue,
        winRate: zoneStats.totalOffers > 0 ? Math.round((zoneStats.wonOffers / zoneStats.totalOffers) * 100) : 0,
        activeUsers: zone.servicePersons.filter((sp: any) => sp.user.isActive).length,
        users: zone.servicePersons.map((sp: any) => ({
          id: sp.user.id,
          name: sp.user.name,
          email: sp.user.email,
          isActive: sp.user.isActive
        }))
      };
    });

    res.json({
      success: true,
      data: formattedZones
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch zones'
    });
  }
};

// Analytics
export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const { dateRange = 'last30days', zone } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (dateRange) {
      case 'last7days':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'last30days':
        startDate.setDate(now.getDate() - 30);
        break;
      case 'last90days':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'thisyear':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    const whereClause: any = {
      createdAt: {
        gte: startDate,
        lte: now
      }
    };

    if (zone && zone !== 'all') {
      whereClause.zone = { name: zone as string };
    }

    const [
      offerTrends,
      statusDistribution,
      zonePerformance,
      userPerformance
    ] = await Promise.all([
      // Monthly offer trends
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "createdAt") as month,
          COUNT(*) as offers,
          SUM(COALESCE("offerValue", 0)) as value,
          COUNT(CASE WHEN status = 'WON' THEN 1 END) as won,
          COUNT(CASE WHEN status = 'LOST' THEN 1 END) as lost
        FROM "Offer" 
        WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${now}
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY month
      `,
      
      // Status distribution
      prisma.offer.groupBy({
        by: ['status'],
        where: whereClause,
        _count: { status: true }
      }),
      
      // Zone performance
      prisma.serviceZone.findMany({
        where: { isActive: true },
        include: {
          offers: {
            where: {
              createdAt: {
                gte: startDate,
                lte: now
              }
            },
            select: {
              offerValue: true,
              status: true
            }
          }
        }
      }),
      
      // User performance
      prisma.user.findMany({
        where: { 
          role: 'ZONE_USER',
          isActive: true 
        },
        include: {
          createdOffers: {
            where: {
              createdAt: {
                gte: startDate,
                lte: now
              }
            },
            select: {
              offerValue: true,
              status: true
            }
          },
          serviceZones: {
            include: {
              serviceZone: { select: { name: true } }
            }
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        offerTrends,
        statusDistribution,
        zonePerformance: zonePerformance.map((zone: any) => ({
          zone: zone.name,
          offers: zone.offers.length,
          value: zone.offers.reduce((sum: number, offer: any) => sum + (offer.offerValue?.toNumber() || 0), 0),
          winRate: zone.offers.length > 0 ? 
            Math.round((zone.offers.filter((o: any) => o.status === 'WON').length / zone.offers.length) * 100) : 0
        })),
        userPerformance: userPerformance.map((user: any) => ({
          name: user.name,
          zone: user.serviceZones[0]?.serviceZone.name || 'Unassigned',
          offers: user.createdOffers.length,
          value: user.createdOffers.reduce((sum: number, offer: any) => sum + (offer.offerValue?.toNumber() || 0), 0),
          winRate: user.createdOffers.length > 0 ?
            Math.round((user.createdOffers.filter((o: any) => o.status === 'WON').length / user.createdOffers.length) * 100) : 0
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data'
    });
  }
};

// Activity Logs
export const getActivityLogs = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 50,
      search,
      action,
      severity,
      userId,
      dateFrom,
      dateTo
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    
    const where: any = {};
    
    if (search) {
      where.OR = [
        { action: { contains: search as string, mode: 'insensitive' } },
        { details: { path: ['description'], string_contains: search as string } }
      ];
    }
    
    if (action && action !== 'All Actions') {
      where.action = action as string;
    }
    
    if (userId && userId !== 'All Users') {
      where.userId = Number(userId);
    }
    
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom as string);
      if (dateTo) where.createdAt.lte = new Date(dateTo as string);
    }

    const [logs, totalCount] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.auditLog.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        logs: logs.map((log: any) => ({
          id: log.id,
          timestamp: log.createdAt,
          action: log.action,
          user: log.user?.name || 'System',
          userId: log.userId,
          entityType: log.entityType,
          entityId: log.entityId,
          details: log.details,
          ipAddress: log.ipAddress
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / Number(limit))
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity logs'
    });
  }
};

export const getZoneUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, search, isActive } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    // Get the current user's zone from their serviceZones
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        serviceZones: {
          include: {
            serviceZone: true
          }
        }
      }
    });

    if (!currentUser || currentUser.serviceZones.length === 0) {
      return res.json({
        success: true,
        data: {
          users: [],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: 0,
            pages: 0
          }
        }
      });
    }

    const userZoneNames = currentUser.serviceZones.map(sz => sz.serviceZone.name);
    
    const where: any = {
      OR: [
        // Include all zone managers
        { role: 'ZONE_MANAGER' },
        // Include users from the same zones
        {
          serviceZones: {
            some: {
              serviceZone: {
                name: { in: userZoneNames }
              }
            }
          }
        }
      ]
    };
    
    if (search) {
      where.OR = [
        ...where.OR,
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          serviceZones: {
            include: {
              serviceZone: { select: { name: true } }
            }
          },
          createdOffers: {
            select: {
              id: true,
              offerValue: true,
              status: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    const formattedUsers = users.map((user: any) => {
      const userZones = user.serviceZones.map((sz: any) => sz.serviceZone.name);
      const offerStats = user.createdOffers.reduce((acc: any, offer: any) => {
        acc.count++;
        acc.totalValue += offer.offerValue?.toNumber() || 0;
        if (offer.status === 'WON') acc.wonCount++;
        return acc;
      }, { count: 0, totalValue: 0, wonCount: 0 });

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        zones: userZones,
        isActive: user.isActive,
        lastLogin: user.lastLoginAt,
        createdAt: user.createdAt,
        offersCount: offerStats.count,
        totalValue: offerStats.totalValue,
        winRate: offerStats.count > 0 ? Math.round((offerStats.wonCount / offerStats.count) * 100) : 0
      };
    });

    return res.json({
      success: true,
      data: {
        users: formattedUsers,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / Number(limit))
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch zone users'
    });
  }
};
