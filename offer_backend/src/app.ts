// tslint:disable-next-line:no-any
// @ts-ignore
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { Request, Response, NextFunction } from 'express';
// Route imports
import authRoutes from './routes/auth.routes';
import offerRoutes from './routes/offer.routes';
import customerRoutes from './routes/customer.routes';
import dashboardRoutes from './routes/dashboard.routes';
import adminRoutes from './routes/admin.routes';
import sparePartRoutes from './routes/sparePart.routes';
import auditRoutes from './routes/audit.routes';
import activityRoutes from './routes/activity.routes';
import reportsRoutes from './routes/reports.routes';
import userRoutes from './routes/user.routes';
import targetRoutes from './routes/target.routes';

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
app.use('/api/spare-parts', sparePartRoutes);
app.use('/api/audit', auditRoutes); // Audit logs (alias for activities)
app.use('/api/activities', activityRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/targets', targetRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'offer-funnel-api' });
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
