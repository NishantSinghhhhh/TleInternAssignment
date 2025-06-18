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
      sparse: true, // allows multiple null values but enforces uniqueness for non-null
      unique: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email'
      ],
    },
    phone: {
      type: String,
      trim: true,
      sparse: true,
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
    vkId: {
      type: String,
      trim: true,
    },
    openId: {
      type: String,
      trim: true,
    },
    firstName: {
      type: String,
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    country: {
      type: String,
      trim: true,
      maxlength: [100, 'Country name cannot exceed 100 characters'],
    },
    city: {
      type: String,
      trim: true,
      maxlength: [100, 'City name cannot exceed 100 characters'],
    },
    organization: {
      type: String,
      trim: true,
      maxlength: [200, 'Organization name cannot exceed 200 characters'],
    },
    contribution: {
      type: Number,
      default: 0,
    },
    rank: {
      type: String,
      required: [true, 'Rank is required'],
      enum: [
        'newbie',
        'pupil', 
        'specialist',
        'expert',
        'candidate master',
        'master',
        'international master',
        'grandmaster',
        'international grandmaster',
        'legendary grandmaster'
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
        'newbie',
        'pupil', 
        'specialist',
        'expert',
        'candidate master',
        'master',
        'international master',
        'grandmaster',
        'international grandmaster',
        'legendary grandmaster'
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
    lastOnlineTimeSeconds: {
      type: Number,
      required: [true, 'Last online time is required'],
      min: [0, 'Last online time cannot be negative'],
    },
    registrationTimeSeconds: {
      type: Number,
      required: [true, 'Registration time is required'],
      min: [0, 'Registration time cannot be negative'],
    },
    friendOfCount: {
      type: Number,
      default: 0,
      min: [0, 'Friend count cannot be negative'],
    },
    avatar: {
      type: String,
      required: [true, 'Avatar URL is required'],
      default: 'https://userpic.codeforces.org/no-avatar.jpg',
    },
    titlePhoto: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
    toJSON: {
      transform: function(doc, ret) {
        ret._id = ret._id.toString();
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

// Compound indexes
UserSchema.index({ rating: -1, rank: 1 });
UserSchema.index({ country: 1, rating: -1 });

// Pre-save middleware
UserSchema.pre('save', function(next) {
  // Normalize handle to lowercase
  if (this.handle) {
    this.handle = this.handle.toLowerCase();
  }
  
  // Ensure maxRating is at least equal to current rating
  if (this.rating > this.maxRating) {
    this.maxRating = this.rating;
  }
  
  next();
});

// Instance methods
UserSchema.methods.getFullName = function(): string {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.name;
};

UserSchema.methods.getRatingColor = function(): string {
  const rating = this.rating;
  if (rating >= 3000) return '#ff0000'; // red (legendary grandmaster)
  if (rating >= 2600) return '#ff8c00'; // orange (international grandmaster)
  if (rating >= 2400) return '#ff0000'; // red (grandmaster)
  if (rating >= 2300) return '#ff8c00'; // orange (international master)
  if (rating >= 2100) return '#ffcc00'; // yellow (master)
  if (rating >= 1900) return '#aa00aa'; // purple (candidate master)
  if (rating >= 1600) return '#0066ff'; // blue (expert)
  if (rating >= 1400) return '#03a89e'; // cyan (specialist)
  if (rating >= 1200) return '#008000'; // green (pupil)
  return '#808080'; // gray (newbie)
};

// Static methods
UserSchema.statics.findByRatingRange = function(minRating: number, maxRating: number) {
  return this.find({
    rating: { $gte: minRating, $lte: maxRating }
  }).sort({ rating: -1 });
};

UserSchema.statics.findByRank = function(rank: string) {
  return this.find({ rank }).sort({ rating: -1 });
};

UserSchema.statics.findByCountry = function(country: string) {
  return this.find({ country }).sort({ rating: -1 });
};

export default mongoose.model<IUser>('User', UserSchema);