// backend/src/controllers/syncController.ts

import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import CFSyncService from '../services/cfSyncService';
import SyncSettings from '../models/SyncSettings';
import User from '../models/User';

// CF API Response interfaces
interface CFUserInfo {
  handle: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  city?: string;
  organization?: string;
  contribution?: number;
  rank?: string;
  rating?: number;
  maxRank?: string;
  maxRating?: number;
  lastOnlineTimeSeconds?: number;
  friendOfCount?: number;
  avatar?: string;
  titlePhoto?: string;
}

interface CFInfoResponse {
  status: string;
  result: CFUserInfo[];
  comment?: string;
}

/** POST /sync/run - Manually trigger a sync */
export const runManualSync = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('🚀 Manual sync triggered for existing users');

    // Get all existing users from database
    const existingUsers = await User.find({}, 'handle _id name').lean();
    console.log(`📊 Found ${existingUsers.length} existing users to sync`);

    if (existingUsers.length === 0) {
      return res.status(400).json({
        error: 'No users found in database to sync. Please fetch some users first.'
      });
    }

    // Start sync in background
    syncExistingUsersInBackground(existingUsers);

    res.json({
      message: 'Manual sync started for existing users',
      userCount: existingUsers.length,
      startTime: new Date()
    });

  } catch (error: any) {
    console.error('Error starting manual sync:', error);
    next(error);
  }
};
const syncExistingUsersInBackground = async (users: Array<{_id: any, handle: string, name?: string}>) => {
    const batchSize = 50;
    const results = {
      updated: 0,
      failed: 0,
      notFound: 0,
      invalidHandles: 0,
      errors: [] as string[],
      startTime: new Date(),
      endTime: null as Date | null
    };
  
    console.log(`🔄 Starting background sync for ${users.length} users in batches of ${batchSize}`);
  
    // Helper function to validate and clean handles
    const validateAndCleanHandle = (handle: string): { isValid: boolean, cleanedHandle: string, reason?: string } => {
      // Basic validation rules for CF handles
      const originalHandle = handle;
      let cleanedHandle = handle.trim();
      
      // Check for empty or undefined handles
      if (!cleanedHandle) {
        return { isValid: false, cleanedHandle, reason: 'Empty handle' };
      }
      
      // Check length (CF handles are typically 3-24 characters)
      if (cleanedHandle.length < 3 || cleanedHandle.length > 24) {
        return { isValid: false, cleanedHandle, reason: `Invalid length: ${cleanedHandle.length}` };
      }
      
      // Check for invalid characters (CF allows letters, numbers, underscore, hyphen)
      const validPattern = /^[a-zA-Z0-9_-]+$/;
      if (!validPattern.test(cleanedHandle)) {
        return { isValid: false, cleanedHandle, reason: `Invalid characters in: ${cleanedHandle}` };
      }
      
      // Check for common problematic patterns
      if (cleanedHandle.includes('*') || cleanedHandle.includes(' ') || cleanedHandle.includes('.')) {
        return { isValid: false, cleanedHandle, reason: `Contains problematic characters: ${cleanedHandle}` };
      }
      
      return { isValid: true, cleanedHandle };
    };
  
    try {
      // Update sync settings at start
      const currentSettings = await SyncSettings.getCurrentSettings();
      currentSettings.lastSyncStart = new Date();
      currentSettings.lastSyncStatus = 'running';
      await currentSettings.save();
  
      // Pre-validate all handles
      const validUsers: Array<{_id: any, handle: string, name?: string}> = [];
      const invalidUsers: Array<{handle: string, reason: string}> = [];
      
      for (const user of users) {
        const validation = validateAndCleanHandle(user.handle);
        if (validation.isValid) {
          validUsers.push({...user, handle: validation.cleanedHandle});
        } else {
          invalidUsers.push({handle: user.handle, reason: validation.reason || 'Unknown validation error'});
          results.invalidHandles++;
        }
      }
      
      console.log(`📋 Validation results: ${validUsers.length} valid, ${invalidUsers.length} invalid handles`);
      
      if (invalidUsers.length > 0) {
        console.log('❌ Invalid handles found:', invalidUsers);
        results.errors.push(`Invalid handles: ${invalidUsers.map(u => `${u.handle} (${u.reason})`).join(', ')}`);
      }
  
      // Process valid users in batches
      for (let i = 0; i < validUsers.length; i += batchSize) {
        const batch = validUsers.slice(i, i + batchSize);
        const handles = batch.map(u => u.handle);
        
        console.log(`📡 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(validUsers.length/batchSize)}: ${handles.join(', ')}`);
  
        try {
          // URL encode handles to handle special characters properly
          const encodedHandles = handles.map(h => encodeURIComponent(h));
          const handlesString = encodedHandles.join(';');
          
          console.log(`🔗 API URL: https://codeforces.com/api/user.info?handles=${handlesString}`);
          
          const userInfoResponse = await axios.get<CFInfoResponse>(
            `https://codeforces.com/api/user.info?handles=${handlesString}`,
            { 
              timeout: 15000,
              headers: {
                'User-Agent': 'CF-Sync-Bot/1.0'
              }
            }
          );
  
          if (userInfoResponse.data.status !== 'OK') {
            console.error(`❌ CF API error for batch: ${userInfoResponse.data.comment}`);
            results.failed += batch.length;
            results.errors.push(`API Error: ${userInfoResponse.data.comment}`);
            
            // Mark all users in this batch as failed but synced
            for (const user of batch) {
              try {
                await User.updateOne(
                  { handle: user.handle },
                  {
                    $set: {
                      lastCfSync: new Date(),
                      updatedAt: new Date()
                    }
                  }
                );
              } catch (dbError: any) {
                console.error(`❌ Failed to mark as synced: ${user.handle}`, dbError.message);
              }
            }
            continue;
          }
  
          const cfUsers = userInfoResponse.data.result;
          console.log(`✅ CF API returned data for ${cfUsers.length}/${handles.length} users`);
  
          // Create a map for case-insensitive lookup
          const cfUserMap = new Map();
          cfUsers.forEach(cfUser => {
            cfUserMap.set(cfUser.handle.toLowerCase(), cfUser);
          });
  
          // Process each user in the batch
          for (const user of batch) {
            const originalHandle = user.handle;
            
            // Try to find user with exact match first, then case-insensitive
            let cfUser = cfUsers.find(cu => cu.handle === originalHandle);
            if (!cfUser) {
              cfUser = cfUserMap.get(originalHandle.toLowerCase());
            }
            
            if (cfUser) {
              try {
                const updateResult = await User.updateOne(
                  { handle: originalHandle },
                  {
                    $set: {
                      // Update handle to match CF's exact casing
                      handle: cfUser.handle,
                      firstName: cfUser.firstName || '',
                      lastName: cfUser.lastName || '',
                      country: cfUser.country || '',
                      city: cfUser.city || '',
                      organization: cfUser.organization || '',
                      contribution: cfUser.contribution || 0,
                      rank: cfUser.rank || 'newbie',
                      rating: cfUser.rating || 0,
                      maxRank: cfUser.maxRank || cfUser.rank || 'newbie',
                      maxRating: cfUser.maxRating || cfUser.rating || 0,
                      lastOnlineTimeSeconds: cfUser.lastOnlineTimeSeconds || 0,
                      friendOfCount: cfUser.friendOfCount || 0,
                      avatar: cfUser.avatar || 'https://userpic.codeforces.org/no-avatar.jpg',
                      titlePhoto: cfUser.titlePhoto || '',
                      lastCfSync: new Date(),
                      updatedAt: new Date()
                    }
                  }
                );
  
                if (updateResult.modifiedCount > 0) {
                  results.updated++;
                  console.log(`✅ Updated: ${originalHandle} -> ${cfUser.handle}`);
                } else {
                  console.log(`ℹ️ No changes needed for: ${cfUser.handle}`);
                  results.updated++; // Still count as successful sync
                }
              } catch (dbError: any) {
                console.error(`❌ DB update failed for ${originalHandle}:`, dbError.message);
                results.failed++;
                results.errors.push(`DB update failed for ${originalHandle}: ${dbError.message}`);
              }
            } else {
              // User not found in CF response
              console.log(`⚠️ User not found on CF: ${originalHandle}`);
              results.notFound++;
              
              // Still mark as synced but log the issue
              try {
                await User.updateOne(
                  { handle: originalHandle },
                  {
                    $set: {
                      lastCfSync: new Date(),
                      updatedAt: new Date()
                    }
                  }
                );
                console.log(`⚠️ Marked as synced (not found on CF): ${originalHandle}`);
              } catch (dbError: any) {
                console.error(`❌ Failed to mark as synced: ${originalHandle}`, dbError.message);
                results.failed++;
              }
            }
          }
  
          // Add delay between batches to respect rate limits
          if (i + batchSize < validUsers.length) {
            console.log('⏳ Waiting 3 seconds before next batch...');
            await new Promise(resolve => setTimeout(resolve, 3000)); // Increased delay
          }
  
        } catch (apiError: any) {
          console.error(`❌ API error for batch ${Math.floor(i/batchSize) + 1}:`, apiError.message);
          results.failed += batch.length;
          results.errors.push(`Batch ${Math.floor(i/batchSize) + 1} failed: ${apiError.message}`);
          
          // Mark all users in failed batch as synced to avoid infinite retry
          for (const user of batch) {
            try {
              await User.updateOne(
                { handle: user.handle },
                {
                  $set: {
                    lastCfSync: new Date(),
                    updatedAt: new Date()
                  }
                }
              );
            } catch (dbError: any) {
              console.error(`❌ Failed to mark failed user as synced: ${user.handle}`);
            }
          }
          continue;
        }
      }
  
      // Handle invalid users - mark them as synced so they don't keep failing
      for (const invalidUser of invalidUsers) {
        try {
          await User.updateOne(
            { handle: invalidUser.handle },
            {
              $set: {
                lastCfSync: new Date(),
                updatedAt: new Date()
              }
            }
          );
          console.log(`⚠️ Marked invalid handle as synced: ${invalidUser.handle} (${invalidUser.reason})`);
        } catch (dbError: any) {
          console.error(`❌ Failed to mark invalid handle as synced: ${invalidUser.handle}`);
        }
      }
  
      results.endTime = new Date();
      console.log('🏁 Background sync completed!', {
        ...results,
        syncDuration: `${Math.round((results.endTime.getTime() - results.startTime.getTime()) / 1000)}s`
      });
  
      // Update sync settings at end
      const finalSettings = await SyncSettings.getCurrentSettings();
      finalSettings.lastSyncEnd = results.endTime;
      finalSettings.lastSyncStatus = results.failed > 0 ? 'partial' : 'success';
      finalSettings.usersSynced = results.updated;
      finalSettings.usersSkipped = results.notFound + results.invalidHandles;
      finalSettings.usersFailed = results.failed;
      finalSettings.totalSyncs = (finalSettings.totalSyncs || 0) + 1;
      
      if (results.errors.length > 0) {
        finalSettings.lastSyncError = results.errors.slice(0, 3).join(' | ');
      } else {
        finalSettings.lastSyncError = undefined;
      }
      
      await finalSettings.save();
  
    } catch (error: any) {
      console.error('🚨 Critical error in background sync:', error);
      results.endTime = new Date();
      
      // Update settings with error status
      const errorSettings = await SyncSettings.getCurrentSettings();
      errorSettings.lastSyncEnd = results.endTime;
      errorSettings.lastSyncStatus = 'failed';
      errorSettings.lastSyncError = error.message;
      await errorSettings.save();
    }
  };
  

/** GET /sync/status - Get current sync status and settings */
export const getSyncStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('📊 Getting sync status');

    const syncService = CFSyncService.getInstance();
    const syncSettings = await SyncSettings.getCurrentSettings();
    const isRunning = syncSettings.lastSyncStatus === 'running';

    // Get some additional stats
    const totalUsers = await User.countDocuments();
    const usersWithSync = await User.countDocuments({ lastCfSync: { $exists: true, $ne: null } });
    const recentSyncs = await User.countDocuments({
      lastCfSync: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    res.json({
      settings: {
        cronTime: syncSettings.cronTime,
        frequency: syncSettings.frequency,
        timezone: syncSettings.timezone,
        enabled: syncSettings.enabled,
        batchSize: syncSettings.batchSize,
        delayBetweenBatches: syncSettings.delayBetweenBatches
      },
      status: {
        isRunning,
        lastSyncStart: syncSettings.lastSyncStart,
        lastSyncEnd: syncSettings.lastSyncEnd,
        lastSyncStatus: syncSettings.lastSyncStatus,
        lastSyncError: syncSettings.lastSyncError,
        usersSynced: syncSettings.usersSynced,
        usersSkipped: syncSettings.usersSkipped,
        usersFailed: syncSettings.usersFailed
      },
      statistics: {
        totalUsers,
        usersWithSync,
        unsyncedUsers: totalUsers - usersWithSync,
        recentSyncs,
        totalSyncs: syncSettings.totalSyncs || 0
      }
    });

  } catch (error: any) {
    console.error('Error getting sync status:', error);
    next(error);
  }
};

/** POST /sync/user/:handle - Sync a specific user */
export const syncSingleUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { handle } = req.params;
    console.log(`🔄 Manual user sync requested: ${handle}`);

    // Validate user exists
    const user = await User.findOne({ handle });
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    try {
      // Fetch user info from CF API
      const userInfoResponse = await axios.get<CFInfoResponse>(
        `https://codeforces.com/api/user.info?handles=${handle}`,
        { timeout: 10000 }
      );

      if (userInfoResponse.data.status !== 'OK' || !userInfoResponse.data.result.length) {
        return res.status(400).json({
          error: 'User not found on Codeforces'
        });
      }

      const cfUser = userInfoResponse.data.result[0];

      // Update user in database
      const updatedUser = await User.findOneAndUpdate(
        { handle },
        {
          $set: {
            firstName: cfUser.firstName || '',
            lastName: cfUser.lastName || '',
            country: cfUser.country || '',
            city: cfUser.city || '',
            organization: cfUser.organization || '',
            contribution: cfUser.contribution || 0,
            rank: cfUser.rank || 'newbie',
            rating: cfUser.rating || 0,
            maxRank: cfUser.maxRank || cfUser.rank || 'newbie',
            maxRating: cfUser.maxRating || cfUser.rating || 0,
            lastOnlineTimeSeconds: cfUser.lastOnlineTimeSeconds || 0,
            friendOfCount: cfUser.friendOfCount || 0,
            avatar: cfUser.avatar || 'https://userpic.codeforces.org/no-avatar.jpg',
            titlePhoto: cfUser.titlePhoto || '',
            lastCfSync: new Date(),
            updatedAt: new Date()
          }
        },
        { new: true }
      );

      res.json({
        message: 'User synced successfully',
        user: {
          _id: updatedUser!._id.toString(),
          name: updatedUser!.name,
          handle: updatedUser!.handle,
          rating: updatedUser!.rating,
          rank: updatedUser!.rank,
          lastCfSync: updatedUser!.lastCfSync
        }
      });

    } catch (apiError: any) {
      console.error('CF API error:', apiError.message);
      res.status(400).json({
        error: 'Failed to fetch user data from Codeforces'
      });
    }

  } catch (error: any) {
    console.error('Error syncing single user:', error);
    next(error);
  }
};

/** PUT /sync/settings - Update sync settings */
export const updateSyncSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('⚙️ Updating sync settings:', req.body);

    const {
      cronTime,
      frequency,
      timezone,
      enabled,
      batchSize,
      delayBetweenBatches,
      maxRetries
    } = req.body;

    // Get current settings
    const currentSyncSettings = await SyncSettings.getCurrentSettings();

    // Update fields if provided
    if (cronTime !== undefined) currentSyncSettings.cronTime = cronTime;
    if (frequency !== undefined) currentSyncSettings.frequency = frequency;
    if (timezone !== undefined) currentSyncSettings.timezone = timezone;
    if (enabled !== undefined) currentSyncSettings.enabled = enabled;
    if (batchSize !== undefined) currentSyncSettings.batchSize = batchSize;
    if (delayBetweenBatches !== undefined) currentSyncSettings.delayBetweenBatches = delayBetweenBatches;
    if (maxRetries !== undefined) currentSyncSettings.maxRetries = maxRetries;

    currentSyncSettings.updatedBy = 'admin';
    await currentSyncSettings.save();

    // Update cron job with new settings
    const syncService = CFSyncService.getInstance();
    await syncService.updateCronJob(currentSyncSettings);

    res.json({
      message: 'Sync settings updated successfully',
      settings: {
        cronTime: currentSyncSettings.cronTime,
        frequency: currentSyncSettings.frequency,
        timezone: currentSyncSettings.timezone,
        enabled: currentSyncSettings.enabled,
        batchSize: currentSyncSettings.batchSize,
        delayBetweenBatches: currentSyncSettings.delayBetweenBatches,
        maxRetries: currentSyncSettings.maxRetries
      }
    });

  } catch (error: any) {
    console.error('Error updating sync settings:', error);
    next(error);
  }
};

/** GET /sync/logs - Get sync history/logs */
export const getSyncLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = '1', limit = '10' } = req.query;
    
    console.log('📋 Getting sync logs');

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get sync history from settings
    const syncLogs = await SyncSettings.find()
      .select('lastSyncStart lastSyncEnd lastSyncStatus usersSynced usersSkipped usersFailed lastSyncError totalSyncs')
      .sort({ lastSyncStart: -1 })
      .skip(skip)
      .limit(limitNum);

    const totalLogs = await SyncSettings.countDocuments();

    res.json({
      logs: syncLogs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalLogs,
        pages: Math.ceil(totalLogs / limitNum)
      }
    });

  } catch (error: any) {
    console.error('Error getting sync logs:', error);
    next(error);
  }
};

/** GET /sync/users-status - Get users with their last sync status */
export const getUsersSyncStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = '1', limit = '20' } = req.query;
    
    console.log('👥 Getting users sync status');

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const users = await User.find()
      .select('name handle rating rank lastCfSync')
      .sort({ lastCfSync: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const totalUsers = await User.countDocuments();

    const usersWithSyncStatus = users.map(user => ({
      _id: user._id.toString(),
      name: user.name,
      handle: user.handle,
      rating: user.rating,
      rank: user.rank,
      lastCfSync: user.lastCfSync,
      syncAge: user.lastCfSync 
        ? Math.floor((Date.now() - new Date(user.lastCfSync).getTime()) / (1000 * 60 * 60)) // Hours ago
        : null,
      needsSync: !user.lastCfSync || 
        (Date.now() - new Date(user.lastCfSync).getTime()) > (24 * 60 * 60 * 1000) // Older than 24 hours
    }));

    res.json({
      users: usersWithSyncStatus,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalUsers,
        pages: Math.ceil(totalUsers / limitNum)
      }
    });

  } catch (error: any) {
    console.error('Error getting users sync status:', error);
    next(error);
  }
};

export const checkUserHandle = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { handle } = req.params;
      
      console.log(`🔍 Checking handle: ${handle}`);
      
      // Check in database first
      const dbUser = await User.findOne({ handle });
      
      // Check on Codeforces
      let cfExists = false;
      let cfUser = null;
      
      try {
        const response = await axios.get<CFInfoResponse>(
          `https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`,
          { timeout: 10000 }
        );
        
        if (response.data.status === 'OK' && response.data.result.length > 0) {
          cfExists = true;
          cfUser = response.data.result[0];
        }
      } catch (cfError: any) {
        console.log(`CF API error for ${handle}:`, cfError.message);
      }
      
      res.json({
        handle,
        existsInDb: !!dbUser,
        existsOnCf: cfExists,
        dbData: dbUser ? {
          _id: dbUser._id,
          name: dbUser.name,
          rating: dbUser.rating,
          rank: dbUser.rank,
          lastCfSync: dbUser.lastCfSync
        } : null,
        cfData: cfUser ? {
          handle: cfUser.handle,
          rating: cfUser.rating,
          rank: cfUser.rank,
          country: cfUser.country
        } : null
      });
      
    } catch (error: any) {
      console.error('Error checking user handle:', error);
      next(error);
    }
  };