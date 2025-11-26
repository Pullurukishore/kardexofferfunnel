import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Enhanced Prisma configuration for 30+ users
export const prisma = global.prisma || new PrismaClient({
  log: ['error'], // Minimal logging for performance
  errorFormat: 'minimal',
});

// Configure connection pool for 30+ concurrent users
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
  
  // Increase connection limits for high concurrency
  (prisma as any)._engineConfig = {
    ...(prisma as any)._engineConfig,
    datasources: {
      ...(prisma as any)._engineConfig?.datasources,
      db: {
        ...(prisma as any)._engineConfig?.datasources?.db,
        // Enhanced connection pool settings
        connectionLimit: 100,       // Support 30+ concurrent users
        poolTimeout: 30000,         // 30 seconds
        connectTimeout: 30000,      // 30 seconds
        idleTimeout: 600000,        // 10 minutes
        maxLifetime: 7200000,       // 2 hours
      }
    }
  };
} else {
  // Production settings
  (prisma as any)._engineConfig = {
    ...(prisma as any)._engineConfig,
    datasources: {
      ...(prisma as any)._engineConfig?.datasources,
      db: {
        ...(prisma as any)._engineConfig?.datasources?.db,
        connectionLimit: 200,       // Production can handle more
        poolTimeout: 15000,
        connectTimeout: 15000,
        idleTimeout: 1200000,
        maxLifetime: 14400000,
      }
    }
  };
}
