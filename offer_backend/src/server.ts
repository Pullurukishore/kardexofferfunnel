import 'dotenv/config';
import { createServer } from 'http';
import { app } from './app';
import { prisma } from './lib/prisma';
import { logger } from './utils/logger';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5002;

const server = createServer(app);

// Shutdown handler
const shutdown = () => {
  logger.info('Shutting down server...');
  
  server.close(() => {
    prisma.$disconnect()
      .then(() => {
        logger.info('Server shut down gracefully');
        process.exit(0);
      })
      .catch((error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Error closing database:', errorMessage);
        process.exit(1);
      });
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
    
    server.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Offer Funnel API running on port ${PORT}`);
      logger.info(`   Access at http://localhost:${PORT}`);
      logger.info(`   Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Server startup failed:', error);
    process.exit(1);
  }
};

startServer();
