import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// Helpers to map Offer Funnel schema -> KardexCare-like response shape used by frontend
const mapStatusToBool = (status?: string): boolean | undefined => {
  if (!status) return undefined;
  if (status === 'INACTIVE' || status === 'DECOMMISSIONED') return false;
  return true; // ACTIVE, MAINTENANCE -> true
};

const mapBoolToStatus = (isActive?: boolean): 'ACTIVE' | 'INACTIVE' => {
  return isActive === false ? 'INACTIVE' : 'ACTIVE';
};

const mapWritePayload = (body: any) => {
  // Accept both shapes from UI
  // OF schema fields: assetName, machineSerialNumber, model, installationDate, warrantyExpiry, isActive, location, customerId
  const {
    // Kardex-like
    machineId,
    serialNo,
    purchaseDate,
    warrantyEnd,
    status,
    // Offer Funnel-like
    assetName,
    machineSerialNumber,
    installationDate,
    warrantyExpiry,
    isActive,
    model,
    location,
    customerId,
  } = body || {};

  const mapped: any = {
    assetName: assetName ?? machineId ?? null,
    machineSerialNumber: machineSerialNumber ?? serialNo ?? null,
    model: model ?? null,
    location: location ?? null,
    installationDate: installationDate ? new Date(installationDate) : (purchaseDate ? new Date(purchaseDate) : null),
    warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : (warrantyEnd ? new Date(warrantyEnd) : null),
    isActive: typeof isActive === 'boolean' ? isActive : mapStatusToBool(status),
  };

  if (customerId) mapped.customerId = parseInt(customerId, 10);

  return mapped;
};

const mapReadAsset = (a: any) => {
  if (!a) return a;
  return {
    // Kardex-like fields expected by UI (with fallbacks)
    id: a.id,
    machineId: a.assetName ?? '',
    model: a.model ?? null,
    serialNo: a.machineSerialNumber ?? null,
    location: a.location ?? null,
    status: mapBoolToStatus(a.isActive),
    purchaseDate: a.installationDate ? new Date(a.installationDate).toISOString() : null,
    warrantyEnd: a.warrantyExpiry ? new Date(a.warrantyExpiry).toISOString() : null,
    // Extra fields supported by some UIs
    amcEnd: null,
    warrantyStart: null,
    notes: null,
    customer: a.customer ? { id: a.customer.id, companyName: a.customer.companyName } : undefined,
    _count: { offers: a._count?.offerAssets ?? 0 },
    createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: a.updatedAt ? new Date(a.updatedAt).toISOString() : new Date().toISOString(),
  };
};

export const listAssets = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '1000', search = '', customerId, status } = req.query as Record<string, string>;

    const where: any = {};
    if (customerId) where.customerId = parseInt(customerId, 10);

    if (status && (status === 'ACTIVE' || status === 'INACTIVE')) {
      where.isActive = status === 'ACTIVE';
    }

    if (search) {
      where.OR = [
        { assetName: { contains: search, mode: 'insensitive' } },
        { machineSerialNumber: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
    const take = Math.min(Math.max(parseInt(String(limit), 10) || 1000, 1), 1000);
    const skip = (pageNum - 1) * take;

    const [total, items] = await Promise.all([
      prisma.asset.count({ where }),
      prisma.asset.findMany({
        where,
        include: { 
          customer: { select: { id: true, companyName: true } },
          _count: { select: { offerAssets: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);

    // Fallback: derive offer counts by matching Offer.machineSerialNumber + customerId
    const serials = Array.from(new Set(items.map((i: any) => i.machineSerialNumber).filter(Boolean)));
    let derivedCounts = new Map<string, number>();
    if (serials.length > 0) {
      const customerIds = Array.from(new Set(items.map((i: any) => i.customerId)));
      const offerGroups = await prisma.offer.groupBy({
        by: ['machineSerialNumber', 'customerId'],
        where: {
          machineSerialNumber: { in: serials as string[] },
          ...(customerId ? { customerId: parseInt(String(customerId), 10) } : { customerId: { in: customerIds } })
        },
        _count: { _all: true },
      });
      derivedCounts = new Map(
        offerGroups.map((g: any) => [`${g.machineSerialNumber}|${g.customerId}`, g._count._all])
      );
    }

    const data = items.map((item: any) => {
      const key = `${item.machineSerialNumber}|${item.customerId}`;
      const fallback = derivedCounts.get(key) || 0;
      const merged = { ...item, _count: { offerAssets: item._count?.offerAssets ?? fallback } };
      return mapReadAsset(merged);
    });

    res.json({
      data,
      pagination: {
        total,
        page: pageNum,
        limit: take,
        totalPages: Math.ceil(total / take) || 1,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch assets' });
  }
};

export const getAsset = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid asset ID' });
      return;
    }

    const asset = await prisma.asset.findUnique({
      where: { id },
      include: { 
        customer: { select: { id: true, companyName: true } },
        _count: { select: { offerAssets: true } },
      },
    });

    if (!asset) {
      res.status(404).json({ message: 'Asset not found' });
      return;
    }

    // Fallback single count if relation is empty
    let offersCount = asset._count?.offerAssets ?? 0;
    if (!offersCount && asset.machineSerialNumber) {
      offersCount = await prisma.offer.count({
        where: {
          customerId: asset.customerId,
          machineSerialNumber: asset.machineSerialNumber,
        },
      });
    }
    res.json(mapReadAsset({ ...asset, _count: { offerAssets: offersCount } }));
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch asset' });
  }
};

export const createAsset = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = mapWritePayload(req.body);
    if (!data.customerId) {
      res.status(400).json({ message: 'customerId is required' });
      return;
    }

    const created = await prisma.asset.create({
      data: {
        assetName: data.assetName || 'ASSET',
        machineSerialNumber: data.machineSerialNumber,
        model: data.model,
        location: data.location,
        installationDate: data.installationDate,
        warrantyExpiry: data.warrantyExpiry,
        isActive: data.isActive ?? true,
        customer: { connect: { id: data.customerId } },
      },
      include: { customer: { select: { id: true, companyName: true } } },
    });

    res.status(201).json(mapReadAsset(created));
  } catch (error) {
    res.status(500).json({ message: 'Failed to create asset' });
  }
};

export const updateAsset = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid asset ID' });
      return;
    }

    const data = mapWritePayload(req.body);

    const updated = await prisma.asset.update({
      where: { id },
      data: {
        assetName: data.assetName ?? undefined,
        machineSerialNumber: data.machineSerialNumber ?? undefined,
        model: data.model ?? undefined,
        location: data.location ?? undefined,
        installationDate: data.installationDate ?? undefined,
        warrantyExpiry: data.warrantyExpiry ?? undefined,
        isActive: typeof data.isActive === 'boolean' ? data.isActive : undefined,
        ...(data.customerId ? { customer: { connect: { id: data.customerId } } } : {}),
      },
      include: { customer: { select: { id: true, companyName: true } } },
    });

    res.json(mapReadAsset(updated));
  } catch (error) {
    res.status(500).json({ message: 'Failed to update asset' });
  }
};

export const deleteAsset = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid asset ID' });
      return;
    }

    await prisma.asset.delete({ where: { id } });
    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete asset' });
  }
};
