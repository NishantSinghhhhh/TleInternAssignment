import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;

  name: string;
  email?: string;
  phone?: string;
  
  handle: string;
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

  lastCfSync?: Date;

  // track when they last submitted & how many reminders we’ve sent
  inactivityTracking?: {
    lastSubmissionDate?: Date;
    reminderCount: number;
    lastReminderSent?: Date;
  };

  // per-user on/off switch for inactivity‐reminder emails
  emailNotifications?: {
    inactivityReminders: boolean;
  };

  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      unique: true,
      default: undefined,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
      validate: {
        validator: function(v: string) {
          return v == null || v === '' || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: 'Please enter a valid email address'
      }
    },
    phone: {
      type: String,
      trim: true,
      sparse: true,
      default: undefined,
    },
    handle: {
      type: String,
      required: [true, 'Codeforces handle is required'],
      unique: true,
      index: true,
      trim: true,
      minlength: [1, 'CF handle must be at least 1 character'],
      maxlength: [24, 'CF handle cannot exceed 24 characters'],
      validate: {
        validator: function(v: string) {
          return /^[a-zA-Z0-9_-]+$/.test(v);
        },
        message: 'CF handle can only contain letters, numbers, underscore, and hyphen'
      }
    },
    vkId:         { type: String, trim: true },
    openId:       { type: String, trim: true },
    firstName:    { type: String, trim: true, maxlength: [50, 'First name cannot exceed 50 characters'] },
    lastName:     { type: String, trim: true, maxlength: [50, 'Last name cannot exceed 50 characters'] },
    country:      { type: String, trim: true, maxlength: [100, 'Country name cannot exceed 100 characters'] },
    city:         { type: String, trim: true, maxlength: [100, 'City name cannot exceed 100 characters'] },
    organization: { type: String, trim: true, maxlength: [200, 'Organization name cannot exceed 200 characters'] },
    contribution: { type: Number, default: 0 },
    rank: {
      type: String,
      required: [true, 'Rank is required'],
      enum: [
        'newbie','pupil','specialist','expert','candidate master','master',
        'international master','grandmaster','international grandmaster','legendary grandmaster'
      ],
      default: 'newbie'
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [0, 'Rating cannot be negative'],
      max: [4000, 'Rating cannot exceed 4000'],
      default: 0
    },
    maxRank: {
      type: String,
      required: [true, 'Max rank is required'],
      enum: [
        'newbie','pupil','specialist','expert','candidate master','master',
        'international master','grandmaster','international grandmaster','legendary grandmaster'
      ],
      default: 'newbie'
    },
    maxRating: {
      type: Number,
      required: [true, 'Max rating is required'],
      min: [0, 'Max rating cannot be negative'],
      max: [4000, 'Max rating cannot exceed 4000'],
      default: 0
    },
    lastOnlineTimeSeconds:   { type: Number, required: true, min: 0 },
    registrationTimeSeconds: { type: Number, required: true, min: 0 },
    friendOfCount:           { type: Number, default: 0, min: 0 },
    avatar:                  { type: String, required: true, default: 'https://userpic.codeforces.org/no-avatar.jpg' },
    titlePhoto:              { type: String, default: '' },
    lastCfSync:              { type: Date, default: null, index: true },

    // --- NEW FIELDS ---
    inactivityTracking: {
      lastSubmissionDate: { type: Date },
      reminderCount:       { type: Number, default: 0 },
      lastReminderSent:    { type: Date },
    },

    emailNotifications: {
      inactivityReminders: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret._id = ret._id.toString();
        if (ret.lastCfSync) ret.lastCfSync = ret.lastCfSync.toISOString();
        if (ret.inactivityTracking?.lastSubmissionDate) {
          ret.inactivityTracking.lastSubmissionDate =
            ret.inactivityTracking.lastSubmissionDate.toISOString();
        }
        if (ret.inactivityTracking?.lastReminderSent) {
          ret.inactivityTracking.lastReminderSent =
            ret.inactivityTracking.lastReminderSent.toISOString();
        }
        return ret;
      }
    }
  }
);

// Indexes
UserSchema.index({ handle: 1 });
UserSchema.index({ rating: -1 });
UserSchema.index({ maxRating: -1 });
UserSchema.index({ rank: 1 });
UserSchema.index({ country: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ lastCfSync: -1 });
UserSchema.index({ rating: -1, rank: 1 });
UserSchema.index({ country: 1, rating: -1 });
UserSchema.index({ lastCfSync: -1 });

// Clean up empty strings, lowercase handle, enforce maxRating ≥ rating
UserSchema.pre('save', function(next) {
  if (this.email === '')    this.email = undefined;
  if (this.phone === '')    this.phone = undefined;
  if (this.handle)          this.handle = this.handle.toLowerCase();
  if (this.rating > this.maxRating) this.maxRating = this.rating;
  next();
});

// Handle the same on updates
UserSchema.pre(['findOneAndUpdate','updateOne','updateMany'], function(next) {
  const u = this.getUpdate() as any;
  if (!u) return next();
  if (u.email === '') u.email = undefined;
  if (u.phone === '') u.phone = undefined;
  if (u.$set) {
    if (u.$set.email === '') u.$set.email = undefined;
    if (u.$set.phone === '') u.$set.phone = undefined;
  }
  next();
});

// Instance helpers
UserSchema.methods.getFullName = function(): string {
  return this.firstName && this.lastName
    ? `${this.firstName} ${this.lastName}`
    : this.name;
};

UserSchema.methods.getRatingColor = function(): string {
  const r = this.rating;
  if (r >= 3000) return '#ff0000';
  if (r >= 2600) return '#ff8c00';
  if (r >= 2400) return '#ff0000';
  if (r >= 2300) return '#ff8c00';
  if (r >= 2100) return '#ffcc00';
  if (r >= 1900) return '#aa00aa';
  if (r >= 1600) return '#0066ff';
  if (r >= 1400) return '#03a89e';
  if (r >= 1200) return '#008000';
  return '#808080';
};

// Static queries
UserSchema.statics.findByRatingRange = function(min: number, max: number) {
  return this.find({ rating: { $gte: min, $lte: max } }).sort({ rating: -1 });
};
UserSchema.statics.findByRank = function(rank: string) {
  return this.find({ rank }).sort({ rating: -1 });
};
UserSchema.statics.findByCountry = function(country: string) {
  return this.find({ country }).sort({ rating: -1 });
};

export default mongoose.model<IUser>('User', UserSchema);
