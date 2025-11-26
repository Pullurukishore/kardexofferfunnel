// tslint:disable-next-line:no-any
// @ts-ignore
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { Request, Response, NextFunction } from 'express';
import { prisma } from './lib/prisma';
// Route imports
import authRoutes from './routes/auth.routes';
import offerRoutes from './routes/offer.routes';
import customerRoutes from './routes/customer.routes';
import dashboardRoutes from './routes/dashboard.routes';
import adminRoutes from './routes/admin.routes';
import assetRoutes from './routes/asset.routes';
import sparePartRoutes from './routes/sparePart.routes';
import auditRoutes from './routes/audit.routes';
import activityRoutes from './routes/activity.routes';
import reportsRoutes from './routes/reports.routes';
import userRoutes from './routes/user.routes';
import targetRoutes from './routes/target.routes';
import forecastRoutes from './routes/forecast.routes';

const app = express();

// CORS Configuration
const corsOptions: cors.CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, origin?: boolean) => void) => {
    if (!origin) return callback(null, true);
    
    if (process.env.CORS_ORIGIN === '*') {
      return callback(null, true);
    }
    
    const allowedOrigins = [
      'http://localhost:3002',
      'http://localhost:3000',
      process.env.CORS_ORIGIN,
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400,
};

// Enable CORS
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Parse JSON bodies
app.use(express.json());

// Parse cookies
app.use(cookieParser());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/spare-parts', sparePartRoutes);
app.use('/api/audit', auditRoutes); // Audit logs (alias for activities)
app.use('/api/activities', activityRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/targets', targetRoutes);
app.use('/api/forecasts', forecastRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'offer-funnel-api' });
});

// Database connection health check for monitoring
app.get('/health/db', async (req: Request, res: Response) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Get connection pool stats
    const poolStats = (prisma as any)._engineConfig?.datasources?.db;
    
    res.json({ 
      status: 'healthy', 
      database: 'connected',
      connections: {
        limit: poolStats?.connectionLimit || 'unknown',
        timeout: poolStats?.poolTimeout || 'unknown',
        idleTimeout: poolStats?.idleTimeout || 'unknown'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(err);
  }
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
});

export { app };
