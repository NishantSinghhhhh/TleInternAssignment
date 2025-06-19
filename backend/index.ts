// backend/src/index.ts
import express, {
  Application,
  Request,
  Response,
  NextFunction,
  ErrorRequestHandler,
} from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cron from 'node-cron';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';

import SyncSettings from './models/SyncSettings';
import CFSyncService from './services/cfSyncService';
import EmailService from './services/emailService';
import User from './models/User';
import studentRoutes from './routes/studentRoutes';
import syncRoutes from './routes/syncRoutes';
import emailRoutes from './routes/emailRoutes';

dotenv.config();

const app: Application = express();
const PORT = parseInt(process.env.PORT || '8000', 10);

/* ────────────────────────────────── Middle-ware ────────────────────────────────── */
app.disable('x-powered-by');
app.use(helmet());
app.use(compression());
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// Parse allowed origins from environment variable
const allowed = (process.env.CLIENT_URL ?? '')
  .split(',')
  .map(s => s.trim().replace(/\/$/, ''))  // Remove trailing slashes
  .filter(Boolean);  // Remove empty strings

// Add your production frontend URLs explicitly
const productionOrigins = [
  'https://tle-intern-assignment.vercel.app',
  'https://tle-intern-assignment-kzrc7s9mp.vercel.app'
];

// Combine all allowed origins
const allAllowedOrigins = [...new Set([...allowed, ...productionOrigins])];

console.log('Allowed CORS origins:', allAllowedOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }
      
      // Remove trailing slash from origin for comparison
      const cleanOrigin = origin.replace(/\/$/, '');
      
      // Check if the origin is in our allowed list
      if (allAllowedOrigins.includes(cleanOrigin)) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        // In development, you might want to allow all origins
        if (process.env.NODE_ENV !== 'production') {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    credentials: true,
    optionsSuccessStatus: 204,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

/* ─────────────────────────────────── Routes ────────────────────────────────────── */
app.get('/', (_req, res) => {
  res.type('text/html').send(
    `<h1>TLE Backend API</h1>
     <p>Status: <a href="/health">/health</a></p>
     <p>Environment: ${process.env.NODE_ENV || 'development'}</p>`,
  );
});

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

app.use('/students', studentRoutes);
app.use('/sync', syncRoutes);
app.use('/email', emailRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware (must be last and have 4 parameters)
// TypeScript fix: Cast the error handler to the correct type
const errorHandler: express.ErrorRequestHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.message === 'Not allowed by CORS') {
    res.status(403).json({ error: 'CORS policy violation' });
  } else {
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
  
  next(); // Ensure the middleware chain continues
};

app.use(errorHandler);

// Serverless: Export app without starting server
if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
  // For Vercel, we just export the app
  module.exports = app;
  
  // Connect to MongoDB but don't start server
  mongoose.connect(process.env.MONGO_URI!)
    .then(() => {
      console.log('✅ MongoDB connected (serverless mode)');
    })
    .catch((err) => {
      console.error('❌ MongoDB connection error:', err);
    });
} else {
  // Development mode: Start server normally
  const ensureDefaultSyncSettings = async () => {
    try {
      const existingSettings = await SyncSettings.findOne();
      if (!existingSettings) {
        console.log('📝 Creating default sync settings...');
        const defaultSettings = new SyncSettings({
          cronTime: '0 2 * * *',
          frequency: 'daily',
          timezone: 'Asia/Kolkata',
          enabled: true,
          batchSize: 50,
          delayBetweenBatches: 2000,
          maxRetries: 3,
          lastSyncStatus: 'success',
          usersSynced: 0,
          usersSkipped: 0,
          usersFailed: 0,
          totalSyncs: 0,
          avgSyncDuration: 0,
          createdBy: 'system',
          updatedBy: 'system'
        });
        await defaultSettings.save();
        console.log('✅ Default sync settings created');
      } else {
        console.log('📋 Sync settings already exist');
        console.log(`🕐 Current cron schedule: ${existingSettings.cronTime}`);
        console.log(`🌍 Timezone: ${existingSettings.timezone}`);
        console.log(`📊 Enabled: ${existingSettings.enabled}`);
      }
    } catch (error: any) {
      console.error('❌ Failed to ensure sync settings:', error);
    }
  };

  const initializeSyncService = async () => {
    try {
      await ensureDefaultSyncSettings();
      const syncService = CFSyncService.getInstance();
      await syncService.initialize();
      console.log('✅ CF Sync Service initialized - Daily sync at 2 AM enabled');
    } catch (error: any) {
      console.error('❌ Failed to initialize sync service:', error);
    }
  };

  const gracefulShutdown = () => {
    console.log('🛑 Received shutdown signal, stopping services...');
    const syncService = CFSyncService.getInstance();
    syncService.stop();
    mongoose.connection.close()
      .then(() => {
        console.log('🔌 MongoDB connection closed');
        process.exit(0);
      })
      .catch((err) => {
        console.error('❌ Error closing MongoDB connection:', err);
        process.exit(1);
      });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  mongoose
    .connect(process.env.MONGO_URI!)
    .then(async () => {
      console.log('✅ MongoDB connected');

      await initializeSyncService();

      app.listen(PORT, () => {
        console.log(`🚀 Server listening on http://localhost:${PORT}`);
        console.log(`📅 CF Sync scheduled to run daily at 2 AM (Asia/Kolkata)`);
      });

      cron.schedule(
        process.env.EMAIL_REMINDER_CRON || '0 2 * * *',
        async () => {
          console.log('⏰ Running daily inactivity reminder job at 2 AM');
          const emailService = new EmailService();
          const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          const toRemind = await User.find({
            email: { $exists: true, $ne: '' },
            'emailNotifications.inactivityReminders': true,
            $or: [
              { 'inactivityTracking.lastSubmissionDate': { $lte: cutoff } },
              { inactivityTracking: { $exists: false } }
            ]
          }).lean();
          console.log(`⚙️  Found ${toRemind.length} users to remind`);
          for (const u of toRemind) {
            try {
              const ok = await emailService.sendInactivityReminder(u);
              console.log(`  → ${u.handle}: ${ok ? 'sent' : 'skipped'}`);
            } catch (err) {
              console.error(`  ❌ Error sending to ${u.handle}:`, err);
            }
          }
        },
        { timezone: 'Asia/Kolkata' }
      );
    })
    .catch((err) => {
      console.error('❌ MongoDB connection error:', err);
      process.exit(1);
    });
}

export default app;