// backend/src/models/EmailLog.ts

import mongoose, { Document, Schema } from 'mongoose';

export interface IEmailLog extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userHandle: string;
  emailType: 'inactivity_reminder' | 'welcome' | 'sync_notification';
  emailStatus: 'sent' | 'failed' | 'pending';
  sentAt: Date;
  emailContent: {
    subject: string;
    template: string;
    data: any;
  };
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmailLogSchema: Schema<IEmailLog> = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    userHandle: {
      type: String,
      required: true,
      index: true
    },
    emailType: {
      type: String,
      enum: ['inactivity_reminder', 'welcome', 'sync_notification'],
      required: true,
      index: true
    },
    emailStatus: {
      type: String,
      enum: ['sent', 'failed', 'pending'],
      default: 'pending',
      index: true
    },
    sentAt: {
      type: Date,
      index: true
    },
    emailContent: {
      subject: { type: String, required: true },
      template: { type: String, required: true },
      data: { type: Schema.Types.Mixed }
    },
    error: { type: String }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        ret._id = ret._id.toString();
        ret.userId = ret.userId.toString();
        return ret;
      }
    }
  }
);

// Indexes for performance
EmailLogSchema.index({ userId: 1, emailType: 1, sentAt: -1 });
EmailLogSchema.index({ userHandle: 1, emailType: 1 });
EmailLogSchema.index({ sentAt: -1 });

export default mongoose.model<IEmailLog>('EmailLog', EmailLogSchema);
