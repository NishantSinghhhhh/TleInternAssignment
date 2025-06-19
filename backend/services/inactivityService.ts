import axios from 'axios';
import User from '../models/User';
import EmailService from './emailService';

interface CFSubmission {
  id: number;
  contestId: number;
  creationTimeSeconds: number;
  relativeTimeSeconds: number;
  problem: {
    contestId: number;
    index: string;
    name: string;
    type: string;
    rating?: number;
  };
  author: {
    members: Array<{ handle: string }>;
  };
  programmingLanguage: string;
  verdict: string;
  testset: string;
}

interface CFSubmissionsResponse {
  status: 'OK' | 'FAILED';
  result: CFSubmission[];
}

class InactivityService {
  private emailService: EmailService;
  private readonly INACTIVITY_THRESHOLD_DAYS = 7;

  constructor() {
    this.emailService = new EmailService();
  }

  async checkUserActivity(userHandle: string): Promise<{
    isActive: boolean;
    lastSubmissionDate: Date | null;
    daysSinceLastSubmission: number;
  }> {
    try {
      console.log(`🔍 Checking activity for user: ${userHandle}`);

      const response = await axios.get<CFSubmissionsResponse>(
        `https://codeforces.com/api/user.status?handle=${encodeURIComponent(userHandle)}&from=1&count=50`,
        { timeout: 10000 }
      );

      if (response.data.status !== 'OK') {
        console.log(`⚠️ CF API error for ${userHandle}: ${response.data.status}`);
        return { isActive: false, lastSubmissionDate: null, daysSinceLastSubmission: -1 };
      }

      const submissions = response.data.result;
      
      if (!submissions || submissions.length === 0) {
        console.log(`📭 No submissions found for ${userHandle}`);
        return { isActive: false, lastSubmissionDate: null, daysSinceLastSubmission: -1 };
      }

      // Get the most recent submission
      const latestSubmission = submissions[0];
      const lastSubmissionDate = new Date(latestSubmission.creationTimeSeconds * 1000);
      const daysSinceLastSubmission = Math.floor(
        (Date.now() - lastSubmissionDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      const isActive = daysSinceLastSubmission <= this.INACTIVITY_THRESHOLD_DAYS;

      console.log(`📊 ${userHandle}: Last submission ${daysSinceLastSubmission} days ago, Active: ${isActive}`);

      return {
        isActive,
        lastSubmissionDate,
        daysSinceLastSubmission
      };

    } catch (error: any) {
      console.error(`❌ Error checking activity for ${userHandle}:`, error.message);
      return { isActive: false, lastSubmissionDate: null, daysSinceLastSubmission: -1 };
    }
  }

  async runInactivityCheck(): Promise<{
    processed: number;
    inactive: number;
    emailsSent: number;
    errors: string[];
  }> {
    console.log('🔄 Starting inactivity check...');
    
    const results = {
      processed: 0,
      inactive: 0,
      emailsSent: 0,
      errors: [] as string[]
    };

    try {
      // Get all users with email addresses
      const users = await User.find({
        $and: [
          { email: { $exists: true } },
          { email: { $ne: null } },
          { email: { $ne: '' } }
        ]
      }).lean();

      console.log(`👥 Found ${users.length} users with email addresses`);

      // Process users in batches to avoid overwhelming CF API
      const batchSize = 10;
      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);
        
        console.log(`🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(users.length/batchSize)}`);

        // Process batch in parallel but with delay between API calls
        for (const user of batch) {
          try {
            results.processed++;

            // Check user activity
            const activity = await this.checkUserActivity(user.handle);
            
            // Update user's activity tracking
            await User.findByIdAndUpdate(user._id, {
              $set: {
                'inactivityTracking.lastSubmissionCheck': new Date(),
                'inactivityTracking.lastSubmissionDate': activity.lastSubmissionDate,
                'inactivityTracking.isActive': activity.isActive
              }
            });

            // If user is inactive and notifications are enabled
            if (!activity.isActive && user.emailNotifications?.inactivityReminders !== false) {
              results.inactive++;

              // Check if we should send reminder (not sent in last 24 hours)
              const shouldSendReminder = !user.inactivityTracking?.lastReminderSent || 
                (Date.now() - new Date(user.inactivityTracking.lastReminderSent).getTime()) > (24 * 60 * 60 * 1000);

              if (shouldSendReminder) {
                const emailSent = await this.emailService.sendInactivityReminder(user);
                if (emailSent) {
                  results.emailsSent++;
                }
              } else {
                console.log(`⏭️ Skipping ${user.handle}: reminder already sent recently`);
              }
            }

            // Small delay to respect CF API rate limits
            await new Promise(resolve => setTimeout(resolve, 500));

          } catch (userError: any) {
            console.error(`❌ Error processing user ${user.handle}:`, userError.message);
            results.errors.push(`${user.handle}: ${userError.message}`);
          }
        }

        // Longer delay between batches
        if (i + batchSize < users.length) {
          console.log('⏳ Waiting 3 seconds before next batch...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      console.log('✅ Inactivity check completed:', results);
      return results;

    } catch (error: any) {
      console.error('❌ Error in runInactivityCheck:', error.message);
      results.errors.push(`System error: ${error.message}`);
      return results;
    }
  }
}

export default InactivityService;