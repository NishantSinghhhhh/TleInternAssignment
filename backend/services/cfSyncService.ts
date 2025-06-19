// backend/src/services/cfSyncService.ts

import axios from 'axios';
import * as cron from 'node-cron';
import User, { IUser } from '../models/User';
import SyncSettings, { ISyncSettings } from '../models/SyncSettings';

interface CFUserInfo {
  handle: string;
  email?: string;
  vkId?: string;
  openId?: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  city?: string;
  organization?: string;
  contribution: number;
  rank: string;
  rating: number;
  maxRank: string;
  maxRating: number;
  lastOnlineTimeSeconds: number;
  registrationTimeSeconds: number;
  friendOfCount: number;
  avatar: string;
  titlePhoto: string;
}

interface CFInfoResponse {
  status: 'OK' | 'FAILED';
  result: CFUserInfo[];
}

interface SyncResult {
  success: boolean;
  usersSynced: number;
  usersSkipped: number;
  usersFailed: number;
  duration: number;
  error?: string;
  failedUsers: Array<{ handle: string; error: string }>;
}

class CFSyncService {
  private static instance: CFSyncService;
  private cronJob: cron.ScheduledTask | null = null;
  private isRunning = false;

  private constructor() {}

  public static getInstance(): CFSyncService {
    if (!CFSyncService.instance) {
      CFSyncService.instance = new CFSyncService();
    }
    return CFSyncService.instance;
  }

  /**
   * Initialize the sync service with current settings
   */
  public async initialize(): Promise<void> {
    try {
      const settings = await SyncSettings.getCurrentSettings();
      await this.updateCronJob(settings);
      console.log('🚀 CF Sync Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize CF Sync Service:', error);
    }
  }

  /**
   * Update the cron job with new settings
   */
  public async updateCronJob(settings: ISyncSettings): Promise<void> {
    // Stop existing cron job
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob.destroy();
      this.cronJob = null;
    }

    if (!settings.enabled) {
      console.log('⏸️ CF Sync is disabled');
      return;
    }

    // Create new cron job
    this.cronJob = cron.schedule(
      settings.cronTime,
      async () => {
        console.log('⏰ Scheduled CF sync started');
        await this.runSync('scheduled');
      },
      {
        timezone: settings.timezone
      }
    );

    console.log(`📅 CF Sync scheduled: ${settings.cronTime} (${settings.timezone})`);
    console.log(`🕐 Next run: ${this.getNextRunTime()}`);
  }

  /**
   * Run a complete sync of all users
   */
  public async runSync(triggerType: 'manual' | 'scheduled' = 'manual'): Promise<SyncResult> {
    if (this.isRunning) {
      throw new Error('Sync is already running');
    }

    const startTime = Date.now();
    this.isRunning = true;

    console.log(`🔄 Starting CF sync (${triggerType})`);

    try {
      // Get sync settings
      const settings = await SyncSettings.getCurrentSettings();
      
      // Update sync start status
      settings.lastSyncStart = new Date();
      settings.lastSyncStatus = 'running';
      await settings.save();

      // Get all users that need syncing
      const users = await User.find({}, 'handle lastCfSync').lean();
      console.log(`👥 Found ${users.length} users to sync`);

      const result: SyncResult = {
        success: true,
        usersSynced: 0,
        usersSkipped: 0,
        usersFailed: 0,
        duration: 0,
        failedUsers: []
      };

      // Process users in batches
      const batches = this.createBatches(users, settings.batchSize);
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`🔄 Processing batch ${i + 1}/${batches.length} (${batch.length} users)`);

        const batchResult = await this.syncUserBatch(batch, settings);
        
        result.usersSynced += batchResult.usersSynced;
        result.usersSkipped += batchResult.usersSkipped;
        result.usersFailed += batchResult.usersFailed;
        result.failedUsers.push(...batchResult.failedUsers);

        // Delay between batches to avoid rate limiting
        if (i < batches.length - 1) {
          await this.sleep(settings.delayBetweenBatches);
        }
      }

      const endTime = Date.now();
      result.duration = endTime - startTime;

      // Update sync completion status
      settings.lastSyncEnd = new Date();
      settings.lastSyncStatus = result.usersFailed > 0 ? 'partial' : 'success';
      settings.usersSynced = result.usersSynced;
      settings.usersSkipped = result.usersSkipped;
      settings.usersFailed = result.usersFailed;
      settings.totalSyncs += 1;
      settings.avgSyncDuration = (settings.avgSyncDuration + result.duration) / settings.totalSyncs;
      settings.lastSyncError = result.failedUsers.length > 0 
        ? `${result.failedUsers.length} users failed to sync`
        : undefined;

      await settings.save();

      console.log(`✅ CF sync completed: ${result.usersSynced} synced, ${result.usersFailed} failed`);
      return result;

    } catch (error) {
      console.error('❌ CF sync failed:', error);

      // Update error status
      const settings = await SyncSettings.getCurrentSettings();
      settings.lastSyncEnd = new Date();
      settings.lastSyncStatus = 'failed';
      settings.lastSyncError = error.message;
      await settings.save();

      const result: SyncResult = {
        success: false,
        usersSynced: 0,
        usersSkipped: 0,
        usersFailed: 0,
        duration: Date.now() - startTime,
        error: error.message,
        failedUsers: []
      };

      return result;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Sync a specific user by handle
   */
  public async syncUser(handle: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🔄 Syncing user: ${handle}`);

      // Fetch data from CF API
      const cfResponse = await axios.get<CFInfoResponse>(
        `https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`,
        { timeout: 10000 }
      );

      if (cfResponse.data.status !== 'OK' || cfResponse.data.result.length === 0) {
        throw new Error('User not found on Codeforces');
      }

      const cfUser = cfResponse.data.result[0];

      // Update user in database
      const updateData = {
        firstName: cfUser.firstName,
        lastName: cfUser.lastName,
        country: cfUser.country,
        city: cfUser.city,
        organization: cfUser.organization,
        contribution: cfUser.contribution,
        rank: cfUser.rank,
        rating: cfUser.rating,
        maxRank: cfUser.maxRank,
        maxRating: cfUser.maxRating,
        lastOnlineTimeSeconds: cfUser.lastOnlineTimeSeconds,
        friendOfCount: cfUser.friendOfCount,
        avatar: cfUser.avatar,
        titlePhoto: cfUser.titlePhoto,
        lastCfSync: new Date()
      };

      await User.findOneAndUpdate(
        { handle: handle },
        { $set: updateData },
        { new: true }
      );

      console.log(`✅ User synced successfully: ${handle}`);
      return { success: true };

    } catch (error) {
      console.error(`❌ Failed to sync user ${handle}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync a batch of users
   */
  private async syncUserBatch(
    users: Array<{ handle: string; _id: any }>, 
    settings: ISyncSettings
  ): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      usersSynced: 0,
      usersSkipped: 0,
      usersFailed: 0,
      duration: 0,
      failedUsers: []
    };

    // Prepare handles for batch API call
    const handles = users.map(u => u.handle).join(';');

    try {
      // Fetch data from CF API for all users in batch
      const cfResponse = await axios.get<CFInfoResponse>(
        `https://codeforces.com/api/user.info?handles=${encodeURIComponent(handles)}`,
        { timeout: 15000 }
      );

      if (cfResponse.data.status !== 'OK') {
        throw new Error('CF API returned error status');
      }

      const cfUsers = cfResponse.data.result;

      // Update each user
      for (const cfUser of cfUsers) {
        try {
          const updateData = {
            firstName: cfUser.firstName,
            lastName: cfUser.lastName,
            country: cfUser.country,
            city: cfUser.city,
            organization: cfUser.organization,
            contribution: cfUser.contribution,
            rank: cfUser.rank,
            rating: cfUser.rating,
            maxRank: cfUser.maxRank,
            maxRating: cfUser.maxRating,
            lastOnlineTimeSeconds: cfUser.lastOnlineTimeSeconds,
            friendOfCount: cfUser.friendOfCount,
            avatar: cfUser.avatar,
            titlePhoto: cfUser.titlePhoto,
            lastCfSync: new Date()
          };

          await User.findOneAndUpdate(
            { handle: cfUser.handle },
            { $set: updateData },
            { new: true }
          );

          result.usersSynced++;
        } catch (error) {
          result.usersFailed++;
          result.failedUsers.push({
            handle: cfUser.handle,
            error: error.message
          });
        }
      }

      // Handle users not found in CF response
      const foundHandles = new Set(cfUsers.map(u => u.handle));
      for (const user of users) {
        if (!foundHandles.has(user.handle)) {
          result.usersSkipped++;
          console.log(`⚠️ User not found on CF: ${user.handle}`);
        }
      }

    } catch (error) {
      // If batch fails, mark all users as failed
      for (const user of users) {
        result.usersFailed++;
        result.failedUsers.push({
          handle: user.handle,
          error: error.message
        });
      }
    }

    return result;
  }

  /**
   * Get sync status
   */
  public async getSyncStatus(): Promise<ISyncSettings> {
    return await SyncSettings.getCurrentSettings();
  }

  /**
   * Check if sync is currently running
   */
  public isCurrentlyRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get next scheduled run time
   */
  public getNextRunTime(): Date | null {
    if (!this.cronJob) return null;
    
    // Simple calculation for next 2 AM
    const now = new Date();
    const next = new Date(now);
    next.setHours(2, 0, 0, 0);
    
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    
    return next;
  }

  /**
   * Utility methods
   */
  private createBatches<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Stop the service
   */
  public stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob.destroy();
      this.cronJob = null;
    }
    console.log('🛑 CF Sync Service stopped');
  }
}

export default CFSyncService;