// backend/src/services/emailService.ts - Updated with OAuth2

import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import EmailLog from '../models/EmailLog';
import User from '../models/User';
import mongoose from 'mongoose';

interface EmailConfig {
  user: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private from: string;
  private oauth2Client: any;

  constructor() {
    this.from = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@cpsheet.com';
    this.initializeOAuth2();
  }

  private async initializeOAuth2() {
    try {
      const { OAuth2 } = google.auth;
      
      this.oauth2Client = new OAuth2(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        'https://developers.google.com/oauthplayground' // Redirect URL
      );

      this.oauth2Client.setCredentials({
        refresh_token: process.env.REFRESH_TOKEN
      });

      console.log('✅ OAuth2 client initialized');
    } catch (error) {
      console.error('❌ Failed to initialize OAuth2:', error);
    }
  }

  private async createTransporter(): Promise<nodemailer.Transporter> {
    try {
      const accessToken = await this.oauth2Client.getAccessToken();

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: process.env.EMAIL_USER,
          clientId: process.env.CLIENT_ID,
          clientSecret: process.env.CLIENT_SECRET,
          refreshToken: process.env.REFRESH_TOKEN,
          accessToken: accessToken.token,
        },
      });

      return transporter;
    } catch (error) {
      console.error('❌ Error creating transporter:', error);
      throw error;
    }
  }

  async sendEmailToUser(userId: string, emailType: 'inactivity_reminder' | 'custom' = 'custom', customSubject?: string, customMessage?: string): Promise<{
    success: boolean;
    message: string;
    user?: any;
  }> {
    try {
      console.log(`📧 Attempting to send email to user ID: ${userId}`);

      // Find user by ID
      const user = await User.findById(userId).lean();
      
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      if (!user.email) {
        return {
          success: false,
          message: `User ${user.handle} does not have an email address`
        };
      }

      // Check if user has email notifications enabled for this type
      if (emailType === 'inactivity_reminder' && user.emailNotifications?.inactivityReminders === false) {
        return {
          success: false,
          message: `User ${user.handle} has disabled inactivity reminder emails`
        };
      }

      let emailContent;
      let htmlContent;

      if (emailType === 'inactivity_reminder') {
        emailContent = {
          subject: `🎯 Time to get back to coding, ${user.firstName || user.handle}!`,
          template: 'inactivity_reminder',
          data: {
            name: user.firstName || user.handle,
            handle: user.handle,
            daysSinceLastSubmission: user.inactivityTracking?.lastSubmissionDate 
              ? Math.floor((Date.now() - new Date(user.inactivityTracking.lastSubmissionDate).getTime()) / (1000 * 60 * 60 * 24))
              : 'unknown',
            profileUrl: `https://codeforces.com/profile/${user.handle}`,
            reminderCount: (user.inactivityTracking?.reminderCount || 0) + 1
          }
        };
        htmlContent = this.generateInactivityEmailHTML(emailContent.data);
      } else {
        // Custom email
        emailContent = {
          subject: customSubject || `Message from CP-31 Team`,
          template: 'custom',
          data: {
            name: user.firstName || user.handle,
            handle: user.handle,
            message: customMessage || 'Hello from CP-31 Team!',
            profileUrl: `https://codeforces.com/profile/${user.handle}`
          }
        };
        htmlContent = this.generateCustomEmailHTML(emailContent.data);
      }

      // Create email log entry
      const emailLog = new EmailLog({
        userId: user._id,
        userHandle: user.handle,
        emailType,
        emailStatus: 'pending',
        emailContent
      });

      try {
        // Create transporter and send email
        const transporter = await this.createTransporter();
        
        await transporter.sendMail({
          from: this.from,
          to: user.email,
          subject: emailContent.subject,
          html: htmlContent
        });

        // Update email log
        emailLog.emailStatus = 'sent';
        emailLog.sentAt = new Date();
        await emailLog.save();

        // Update user's reminder tracking if it's an inactivity reminder
        if (emailType === 'inactivity_reminder') {
          await User.findByIdAndUpdate(user._id, {
            $inc: { 'inactivityTracking.reminderCount': 1 },
            $set: { 'inactivityTracking.lastReminderSent': new Date() }
          });
        }

        console.log(`✅ Email sent successfully to ${user.handle} (${user.email})`);
        
        return {
          success: true,
          message: `Email sent successfully to ${user.handle}`,
          user: {
            handle: user.handle,
            email: user.email,
            name: user.firstName || user.name
          }
        };

      } catch (emailError: any) {
        emailLog.emailStatus = 'failed';
        emailLog.error = emailError.message;
        await emailLog.save();

        console.error(`❌ Failed to send email to ${user.handle}:`, emailError.message);
        
        return {
          success: false,
          message: `Failed to send email: ${emailError.message}`
        };
      }

    } catch (error: any) {
      console.error(`❌ Error in sendEmailToUser for ${userId}:`, error.message);
      return {
        success: false,
        message: `Error: ${error.message}`
      };
    }
  }

  async sendInactivityReminder(user: any): Promise<boolean> {
    const result = await this.sendEmailToUser(user._id.toString(), 'inactivity_reminder');
    return result.success;
  }

  private generateInactivityEmailHTML(data: any): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Time to Code!</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
            .stats { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎯 Time to Get Back to Coding!</h1>
                <p>Hey ${data.name}, we miss seeing your submissions!</p>
            </div>
            
            <div class="content">
                <p>Hi <strong>${data.name}</strong>,</p>
                
                <p>We noticed you haven't made any submissions on Codeforces in the last <strong>7 days</strong>. 
                ${data.daysSinceLastSubmission !== 'unknown' 
                  ? `Your last submission was ${data.daysSinceLastSubmission} days ago.` 
                  : 'We couldn\'t find recent submission data.'}
                </p>
                
                <div class="stats">
                    <h3>🏆 Keep Your Momentum Going!</h3>
                    <p>Consistent practice is key to improving your competitive programming skills. Here are some suggestions:</p>
                    <ul>
                        <li>🔥 Solve at least one problem daily</li>
                        <li>📚 Review problems you found challenging</li>
                        <li>🎲 Try problems slightly above your current rating</li>
                        <li>⚡ Participate in upcoming contests</li>
                    </ul>
                </div>
                
                <div style="text-align: center;">
                    <a href="https://codeforces.com/problemset" class="button">🚀 Start Solving Problems</a>
                    <a href="${data.profileUrl}" class="button" style="background: #28a745;">👤 View Your Profile</a>
                </div>
                
                <p><strong>Pro Tip:</strong> Even solving one easy problem can help maintain your problem-solving rhythm!</p>
                
                ${data.reminderCount > 1 ? `
                <p style="color: #666; font-size: 14px;">
                    <em>This is reminder #${data.reminderCount}. You can disable these reminders in your profile settings.</em>
                </p>
                ` : ''}
            </div>
            
            <div class="footer">
                <p>Happy Coding! 💻<br>
                The CP-31 Team</p>
                <p style="font-size: 12px;">
                    Need help? Contact us at support@cpsheet.com
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private generateCustomEmailHTML(data: any): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Message from CP-31</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
            .message-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📧 Message from CP-31 Team</h1>
                <p>Hello ${data.name}!</p>
            </div>
            
            <div class="content">
                <p>Hi <strong>${data.name}</strong>,</p>
                
                <div class="message-box">
                    <p>${data.message}</p>
                </div>
                
                <div style="text-align: center;">
                    <a href="${data.profileUrl}" class="button">👤 View Your Profile</a>
                    <a href="https://codeforces.com/problemset" class="button" style="background: #28a745;">🚀 Practice Problems</a>
                </div>
            </div>
            
            <div class="footer">
                <p>Best regards,<br>
                The CP-31 Team</p>
                <p style="font-size: 12px;">
                    Need help? Contact us at support@cpsheet.com
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  async getEmailStats(userId: string): Promise<any> {
    const stats = await EmailLog.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$emailType',
          total: { $sum: 1 },
          sent: { $sum: { $cond: [{ $eq: ['$emailStatus', 'sent'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$emailStatus', 'failed'] }, 1, 0] } },
          lastSent: { $max: '$sentAt' }
        }
      }
    ]);

    return stats;
  }

  async testEmailService(): Promise<boolean> {
    try {
      const { token } = await this.oauth2Client.getAccessToken();
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type:         'OAuth2',
          user:         process.env.EMAIL_USER,
          clientId:     process.env.CLIENT_ID,
          clientSecret: process.env.CLIENT_SECRET,
          refreshToken: process.env.REFRESH_TOKEN,
          accessToken:  token,
        },
      });
      return transporter;
    } catch (error) {
      console.error('❌ Error creating transporter:', error);
      throw error;
    }
  }
}

export default EmailService;