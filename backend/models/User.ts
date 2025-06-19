// backend/src/models/User.ts

import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  
  // Basic user info
  name: string;
  email?: string;
  phone?: string;
  
  // Codeforces profile data
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

  // Sync timestamp
  lastCfSync?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    // Basic user information
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
      default: undefined, // This ensures empty emails are stored as undefined, not ""
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
      validate: {
        validator: function(v: string) {
          // Allow undefined/null, but if provided, must be valid email
          return v == null || v === '' || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: 'Please enter a valid email address'
      }
    },
    phone: {
      type: String,
      trim: true,
      sparse: true,
      default: undefined, // Same for phone
    },
    
    // Codeforces profile data
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
    vkId: { type: String, trim: true },
    openId: { type: String, trim: true },
    firstName: { type: String, trim: true, maxlength: [50, 'First name cannot exceed 50 characters'] },
    lastName: { type: String, trim: true, maxlength: [50, 'Last name cannot exceed 50 characters'] },
    country: { type: String, trim: true, maxlength: [100, 'Country name cannot exceed 100 characters'] },
    city: { type: String, trim: true, maxlength: [100, 'City name cannot exceed 100 characters'] },
    organization: { type: String, trim: true, maxlength: [200, 'Organization name cannot exceed 200 characters'] },
    contribution: { type: Number, default: 0 },
    rank: {
      type: String,
      required: [true, 'Rank is required'],
      enum: [
        'newbie','pupil','specialist','expert','candidate master','master','international master','grandmaster','international grandmaster','legendary grandmaster'
      ],
      default: 'newbie'
    },
    rating: { type: Number, required: [true, 'Rating is required'], min: [0, 'Rating cannot be negative'], max: [4000, 'Rating cannot exceed 4000'], default: 0 },
    maxRank: {
      type: String,
      required: [true, 'Max rank is required'],
      enum: [
        'newbie','pupil','specialist','expert','candidate master','master','international master','grandmaster','international grandmaster','legendary grandmaster'
      ],
      default: 'newbie'
    },
    maxRating: { type: Number, required: [true, 'Max rating is required'], min: [0, 'Max rating cannot be negative'], max: [4000, 'Max rating cannot exceed 4000'], default: 0 },
    lastOnlineTimeSeconds: { type: Number, required: [true, 'Last online time is required'], min: [0, 'Last online time cannot be negative'] },
    registrationTimeSeconds: { type: Number, required: [true, 'Registration time is required'], min: [0, 'Registration time cannot be negative'] },
    friendOfCount: { type: Number, default: 0, min: [0, 'Friend count cannot be negative'] },
    avatar: { type: String, required: [true, 'Avatar URL is required'], default: 'https://userpic.codeforces.org/no-avatar.jpg' },
    titlePhoto: { type: String, default: '' },
    
    // Sync timestamp
    lastCfSync: { type: Date, default: null, index: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        ret._id = ret._id.toString();
        if (ret.lastCfSync) ret.lastCfSync = ret.lastCfSync.toISOString();
        return ret;
      }
    }
  }
);

// Indexes for better query performance
UserSchema.index({ handle: 1 });
UserSchema.index({ rating: -1 });
UserSchema.index({ maxRating: -1 });
UserSchema.index({ rank: 1 });
UserSchema.index({ country: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ lastCfSync: -1 });

// Compound indexes
UserSchema.index({ rating: -1, rank: 1 });
UserSchema.index({ country: 1, rating: -1 });
UserSchema.index({ lastCfSync: -1 });
// Pre-save middleware to handle empty strings
UserSchema.pre('save', function(next) {
  // Convert empty strings to undefined for unique sparse fields
  if (this.email === '') this.email = undefined;
  if (this.phone === '') this.phone = undefined;
  
  // Handle lowercase conversion for handle
  if (this.handle) this.handle = this.handle.toLowerCase();
  
  // Ensure maxRating is always >= rating
  if (this.rating > this.maxRating) this.maxRating = this.rating;
  
  next();
});

// Pre-update middleware to handle empty strings in updates
UserSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
  const update = this.getUpdate() as any;
  
  if (update) {
    // Handle direct updates
    if (update.email === '') update.email = undefined;
    if (update.phone === '') update.phone = undefined;
    
    // Handle $set updates
    if (update.$set) {
      if (update.$set.email === '') update.$set.email = undefined;
      if (update.$set.phone === '') update.$set.phone = undefined;
    }
  }
  
  next();
});

// Instance methods
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

// Static methods
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