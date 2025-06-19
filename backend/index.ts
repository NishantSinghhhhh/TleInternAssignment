// backend/src/index.ts

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SyncSettings from './models/SyncSettings';
import CFSyncService from './services/cfSyncService'; 
import studentRoutes from './routes/studentRoutes';
import syncRoutes from './routes/syncRoutes';
import emailRoutes from './routes/emailRoutes';

dotenv.config();

const app: Application = express();
const PORT = parseInt(process.env.PORT || '8000', 10);


app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.use('/students', studentRoutes);
app.use('/sync', syncRoutes);
app.use('/email', emailRoutes);

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
  } catch (error) {
    console.error('❌ Failed to ensure sync settings:', error);
  }
};


const initializeSyncService = async () => {
  try {
    await ensureDefaultSyncSettings();
    
    const syncService = CFSyncService.getInstance();
    await syncService.initialize();
    
    console.log('✅ CF Sync Service initialized - Daily sync at 2 AM enabled');
  } catch (error) {
    console.error('❌ Failed to initialize sync service:', error);
  }
};

const gracefulShutdown = () => {
  console.log('🛑 Received shutdown signal, stopping services...');
  
  const syncService = CFSyncService.getInstance();
  syncService.stop();
  
  mongoose.connection.close().then(() => {
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  }).catch((err) => {
    console.error('❌ Error closing MongoDB connection:', err);
    process.exit(1);
  });
};


process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);


mongoose
  .connect(process.env.MONGO_URI!, {
    // @ts-ignore mongoose driver options
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log('✅ MongoDB connected');
    
    // Initialize sync service after DB connection
    await initializeSyncService();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server listening on http://localhost:${PORT}`);
      console.log(`📅 CF Sync scheduled to run daily at 2 AM (Asia/Kolkata)`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });