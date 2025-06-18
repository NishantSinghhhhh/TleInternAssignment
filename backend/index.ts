// backend/src/index.ts

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import studentRoutes from './routes/studentRoutes';

dotenv.config();

const app: Application = express();
const PORT = parseInt(process.env.PORT || '8000', 10);

// ——— Middlewares —————————————————————————————
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// ——— Health Check ————————————————————————————
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// ——— Routes ——————————————————————————————————
app.use('/students', studentRoutes);

// ——— Start Server & Connect DB ————————————————————
mongoose
  .connect(process.env.MONGO_URI!, {
    // @ts-ignore mongoose driver options
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`🚀 Server listening on http://localhost:${PORT}`);

      // Schedule daily Codeforces sync at the hour configured in SYNC_CRON or 2 AM by default
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });
