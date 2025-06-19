// backend/src/controllers/emailController.ts

import { Request, Response, NextFunction } from 'express';
import EmailService from '../services/emailService';
import User from '../models/User';

/** POST /email/send-to-user - Send email to user by ID */
export const sendEmailToUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { 
      userId, 
      emailType = 'custom',
      subject,
      message 
    } = req.body;

    // Validate required fields
    if (!userId) {
      return res.status(400).json({ 
        error: 'User ID is required' 
      });
    }

    if (emailType === 'custom' && !message) {
      return res.status(400).json({ 
        error: 'Message is required for custom emails' 
      });
    }

    console.log(`📧 Email request received for user: ${userId}`);

    const emailService = new EmailService();
    const result = await emailService.sendEmailToUser(userId, emailType, subject, message);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        user: result.user,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }

  } catch (error: any) {
    console.error('Error in sendEmailToUser:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
};

/** POST /email/send-by-handle - Send email to user by handle */
export const sendEmailByHandle = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { 
      handle, 
      emailType = 'custom',
      subject,
      message 
    } = req.body;

    if (!handle) {
      return res.status(400).json({ 
        error: 'Handle is required' 
      });
    }

    // Find user by handle
    const user = await User.findOne({ handle }).lean();
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: `User with handle '${handle}' not found`
      });
    }

    const emailService = new EmailService();
    const result = await emailService.sendEmailToUser(user._id.toString(), emailType, subject, message);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        user: result.user,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }

  } catch (error: any) {
    console.error('Error in sendEmailByHandle:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
};

/** GET /email/test-service - Test email service configuration */
export const testEmailService = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const emailService = new EmailService();
    const isWorking = await emailService.testEmailService();

    res.json({
      success: isWorking,
      message: isWorking ? 'Email service is working correctly' : 'Email service configuration has issues',
      timestamp: new Date().toISOString(),
      config: {
        emailUser: process.env.EMAIL_USER ? '✅ Set' : '❌ Missing',
        clientId: process.env.CLIENT_ID ? '✅ Set' : '❌ Missing',
        clientSecret: process.env.CLIENT_SECRET ? '✅ Set' : '❌ Missing',
        refreshToken: process.env.REFRESH_TOKEN ? '✅ Set' : '❌ Missing'
      }
    });

  } catch (error: any) {
    console.error('Error testing email service:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test email service',
      details: error.message
    });
  }
};