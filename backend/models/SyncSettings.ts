// backend/src/models/SyncSettings.ts

import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ISyncSettings extends Document {
  _id: mongoose.Types.ObjectId;
  
  // Cron settings
  cronTime: string; // Cron expression (e.g., "0 2 * * *" for 2 AM daily)
  frequency: 'daily' | 'weekly' | 'monthly';
  timezone: string; // e.g., "Asia/Kolkata", "America/New_York"
  enabled: boolean;
  
  // Sync configuration
  batchSize: number; // Number of users to sync in one batch
  delayBetweenBatches: number; // Delay in milliseconds between batches
  maxRetries: number; // Max retries for failed syncs
  
  // Last sync info
  lastSyncStart?: Date;
  lastSyncEnd?: Date;
  lastSyncStatus: 'success' | 'failed' | 'partial' | 'running';
  lastSyncError?: string;
  usersSynced: number;
  usersSkipped: number;
  usersFailed: number;
  
  // Performance metrics
  totalSyncs: number;
  avgSyncDuration: number; // in milliseconds
  
  // Admin settings
  createdBy: string;
  updatedBy: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  getNextRunTime(): Date;
}

// Interface for static methods
export interface ISyncSettingsModel extends Model<ISyncSettings> {
  getCurrentSettings(): Promise<ISyncSettings>;
}

const SyncSettingsSchema: Schema<ISyncSettings> = new Schema(
  {
    cronTime: {
      type: String,
      required: [true, 'Cron time is required'],
      default: '0 2 * * *', // 2 AM daily
      validate: {
        validator: function(v: string) {
          // Basic cron validation (5 or 6 fields)
          const cronParts = v.split(' ');
          return cronParts.length === 5 || cronParts.length === 6;
        },
        message: 'Invalid cron expression format'
      }
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'daily'
    },
    timezone: {
      type: String,
      default: 'UTC',
      validate: {
        validator: function(v: string) {
          try {
            Intl.DateTimeFormat(undefined, { timeZone: v });
            return true;
          } catch {
            return false;
          }
        },
        message: 'Invalid timezone'
      }
    },
    enabled: {
      type: Boolean,
      default: true
    },
    
    // Sync configuration
    batchSize: {
      type: Number,
      default: 10,
      min: [1, 'Batch size must be at least 1'],
      max: [100, 'Batch size cannot exceed 100']
    },
    delayBetweenBatches: {
      type: Number,
      default: 2000, // 2 seconds
      min: [100, 'Delay must be at least 100ms'],
      max: [30000, 'Delay cannot exceed 30 seconds']
    },
    maxRetries: {
      type: Number,
      default: 3,
      min: [0, 'Max retries cannot be negative'],
      max: [10, 'Max retries cannot exceed 10']
    },
    
    // Last sync info
    lastSyncStart: { type: Date },
    lastSyncEnd: { type: Date },
    lastSyncStatus: {
      type: String,
      enum: ['success', 'failed', 'partial', 'running'],
      default: 'success'
    },
    lastSyncError: { type: String },
    usersSynced: { type: Number, default: 0 },
    usersSkipped: { type: Number, default: 0 },
    usersFailed: { type: Number, default: 0 },
    
    // Performance metrics
    totalSyncs: { type: Number, default: 0 },
    avgSyncDuration: { type: Number, default: 0 },
    
    // Admin settings
    createdBy: { type: String, default: 'system' },
    updatedBy: { type: String, default: 'system' }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        ret._id = ret._id.toString();
        return ret;
      }
    }
  }
);

// Indexes
SyncSettingsSchema.index({ enabled: 1 });
SyncSettingsSchema.index({ lastSyncStart: -1 });

// Static method to get current settings (singleton pattern)
SyncSettingsSchema.statics.getCurrentSettings = async function(): Promise<ISyncSettings> {
  let settings = await this.findOne().sort({ createdAt: -1 });
  
  if (!settings) {
    // Create default settings if none exist
    settings = await this.create({
      cronTime: '0 2 * * *', // 2 AM daily
      frequency: 'daily',
      timezone: 'UTC',
      enabled: true
    });
  }
  
  return settings;
};

// Instance method to get next run time
SyncSettingsSchema.methods.getNextRunTime = function(): Date {
  // Simple calculation for next 2 AM
  const now = new Date();
  const tomorrow2AM = new Date(now);
  tomorrow2AM.setDate(tomorrow2AM.getDate() + 1);
  tomorrow2AM.setHours(2, 0, 0, 0);
  
  return tomorrow2AM;
};

export default mongoose.model<ISyncSettings, ISyncSettingsModel>('SyncSettings', SyncSettingsSchema);