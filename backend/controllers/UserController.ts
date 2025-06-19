// backend/src/controllers/studentController.ts

import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import User, { IUser } from '../models/User';
import mongoose from 'mongoose';

// Keep the same CFUserInfo interface for API responses
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

interface Problem {
    contestId?: number;
    index: string;
    name: string;
    rating?: number;
    tags: string[];
  }
  
  interface Submission {
    id: number;
    contestId?: number;
    problem: Problem;
    verdict: string;
    // Add other relevant fields as needed
  }
  
  interface CFContestResponse {
    status: string;
    result: Submission[];
  }
  
// CF API responses
interface CFRatedListResponse {
  status: 'OK' | 'FAILED';
  result: { handle: string }[];
}

interface CFInfoResponse {
  status: 'OK' | 'FAILED';
  result: CFUserInfo[];
}

// ========== EXISTING FUNCTIONS ==========

/** GET /students/fetch-100 - Fetch details of 100 users and optionally save to DB */
export const fetch100Users = async (
  req: Request,
  res: Response<CFUserInfo[]>,
  next: NextFunction
) => {
  try {
    console.log('🚀 Starting to fetch 100 CF users...');
    
    const saveToDb = req.query.save === 'true';
    
    // Step 1: Get list of all rated users
    console.log('📡 Fetching all rated users list...');
    const ratedListResponse = await axios.get<CFRatedListResponse>(
      'https://codeforces.com/api/user.ratedList?activeOnly=false',
      { timeout: 10000 }
    );

    if (ratedListResponse.data.status !== 'OK') {
      throw new Error('Failed to fetch rated users list');
    }

    const allHandles = ratedListResponse.data.result.map(u => u.handle);
    console.log(`✅ Successfully fetched ${allHandles.length} total handles`);

    // Step 2: Take first 100 handles
    const first100Handles = allHandles.slice(0, 100);
    console.log('🎯 Selected first 100 handles:', first100Handles);

    // Step 3: Fetch detailed info for these 100 users
    console.log('📡 Fetching detailed info for 100 users...');
    const handlesString = first100Handles.join(';');
    
    const userInfoResponse = await axios.get<CFInfoResponse>(
      `https://codeforces.com/api/user.info?handles=${handlesString}`,
      { timeout: 15000 }
    );

    if (userInfoResponse.data.status !== 'OK') {
      throw new Error('Failed to fetch user details');
    }

    const userDetails = userInfoResponse.data.result;
    console.log(`✅ Successfully fetched details for ${userDetails.length} users`);

    // Step 4: Optionally save to database
    if (saveToDb) {
      console.log('💾 Saving users to database...');
      
      for (const cfUser of userDetails) {
        try {
          const existingUser = await User.findOne({ handle: cfUser.handle });
          
          if (!existingUser) {
            const newUser = new User({
              name: cfUser.firstName && cfUser.lastName 
                ? `${cfUser.firstName} ${cfUser.lastName}` 
                : cfUser.handle,
              handle: cfUser.handle,
              firstName: cfUser.firstName,
              lastName: cfUser.lastName,
              country: cfUser.country,
              city: cfUser.city,
              organization: cfUser.organization,
              contribution: cfUser.contribution || 0,
              rank: cfUser.rank || 'newbie',
              rating: cfUser.rating || 0,
              maxRank: cfUser.maxRank || cfUser.rank || 'newbie',
              maxRating: cfUser.maxRating || cfUser.rating || 0,
              lastOnlineTimeSeconds: cfUser.lastOnlineTimeSeconds || Date.now() / 1000,
              registrationTimeSeconds: cfUser.registrationTimeSeconds || Date.now() / 1000,
              friendOfCount: cfUser.friendOfCount || 0,
              avatar: cfUser.avatar || 'https://userpic.codeforces.org/no-avatar.jpg',
              titlePhoto: cfUser.titlePhoto || '',
            });
            await newUser.save();
            console.log(`✅ Saved new user: ${cfUser.handle}`);
          } else {
            // Update existing user
            await existingUser.updateOne({
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
            });
            console.log(`🔄 Updated existing user: ${cfUser.handle}`);
          }
        } catch (dbError) {
          console.error(`❌ Failed to save user ${cfUser.handle}:`, dbError.message);
        }
      }
      
      console.log('💾 Database operations completed!');
    }

    res.json(userDetails);

  } catch (err) {
    console.error('❌ Error in fetch100Users:', err);
    next(err);
  }
};


export const fetchStudentDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('📚 Fetching students from database...');
    
    // Parse page & limit, with sane defaults
    const page  = Math.max(1, parseInt((req.query.page  as string) || '1', 10))
    const limit = Math.max(1, parseInt((req.query.limit as string) || '10', 10))
    const skip  = (page - 1) * limit
    
    // 1) Fetch count + page of users
    const [ totalCount, students ] = await Promise.all([
      User.countDocuments(),
      User.find()
        .skip(skip)
        .limit(limit)
        .lean()
    ])
    console.log(`→ total students: ${totalCount}, returning ${students.length} on page ${page}`)
    
    // 2) Prepare CF status requests to check practice solves
    const cutoffSec = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60
    const statusPromises = students.map(s =>
      axios.get<{
        status: 'OK' | 'FAILED'
        result: Array<{ verdict: string; creationTimeSeconds: number }>
      }>(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(s.handle)}`)
    )
    const statusResults = await Promise.allSettled(statusPromises)
    
    // 3) Map into your frontend shape + activeLast7Days
    const formattedStudents = students.map((student, idx) => {
      let activeLast7Days = false
      
      const stat = statusResults[idx]
      if (stat.status === 'fulfilled' && stat.value.data.status === 'OK') {
        activeLast7Days = stat.value.data.result
          .some(sub => 
            sub.verdict === 'OK' &&
            sub.creationTimeSeconds >= cutoffSec
          )
      }
      
      return {
        _id: student._id.toString(),
        name: student.name,
        email: student.email || '',
        phone: student.phone || '',
        cfHandle: student.handle,
        vkId: student.vkId || '',
        openId: student.openId || '',
        firstName: student.firstName || '',
        lastName: student.lastName || '',
        country: student.country || '',
        city: student.city || '',
        organization: student.organization || '',
        contribution: student.contribution,
        rank: student.rank,
        rating: student.rating,
        maxRank: student.maxRank,
        maxRating: student.maxRating,
        friendOfCount: student.friendOfCount,
        avatar: student.avatar || '',
        titlePhoto: student.titlePhoto || '',
        lastOnlineTimeSeconds: student.lastOnlineTimeSeconds,
        registrationTimeSeconds: student.registrationTimeSeconds,
        lastCfSync: student.lastCfSync || null,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
        // new flag:
        activeLast7Days
      }
    })
    
    // 4) Send paginated response
    const totalPages = Math.ceil(totalCount / limit)
    res.json({ data: formattedStudents, page, limit, totalPages, totalCount })
    
  } catch (error) {
    console.error('Error in fetchStudentDetails:', error)
    next(error)
  }
};

export const createStudent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('➕ Creating new student:', req.body);
    
    const {
      name,
      email,
      phone,
      handle,
      firstName,
      lastName,
      country,
      city,
      organization
    } = req.body;

    // Validate required fields
    if (!name || !handle) {
      return res.status(400).json({
        error: 'Name and handle are required'
      });
    }

    // Check if handle already exists
    const existingUser = await User.findOne({ handle });
    if (existingUser) {
      return res.status(409).json({
        error: 'User with this handle already exists'
      });
    }

    // Try to fetch CF data for this handle
    let cfData = null;
    try {
      const cfResponse = await axios.get<CFInfoResponse>(
        `https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`,
        { timeout: 5000 }
      );
      
      if (cfResponse.data.status === 'OK' && cfResponse.data.result.length > 0) {
        cfData = cfResponse.data.result[0];
        console.log(`✅ Found CF data for handle: ${handle}`);
      }
    } catch (cfError) {
      console.log(`⚠️ Could not fetch CF data for handle: ${handle}`);
    }

    // Create new user
    const newUser = new User({
      name,
      email,
      phone,
      handle,
      firstName: firstName || cfData?.firstName,
      lastName: lastName || cfData?.lastName,
      country: country || cfData?.country,
      city: city || cfData?.city,
      organization: organization || cfData?.organization,
      contribution: cfData?.contribution || 0,
      rank: cfData?.rank || 'newbie',
      rating: cfData?.rating || 0,
      maxRank: cfData?.maxRank || cfData?.rank || 'newbie',
      maxRating: cfData?.maxRating || cfData?.rating || 0,
      lastOnlineTimeSeconds: cfData?.lastOnlineTimeSeconds || Date.now() / 1000,
      registrationTimeSeconds: cfData?.registrationTimeSeconds || Date.now() / 1000,
      friendOfCount: cfData?.friendOfCount || 0,
      avatar: cfData?.avatar || 'https://userpic.codeforces.org/no-avatar.jpg',
      titlePhoto: cfData?.titlePhoto || '',
    });

    const savedUser = await newUser.save();
    console.log(`✅ Created new student: ${savedUser.handle}`);

    res.status(201).json({
      message: 'Student created successfully',
      student: {
        _id: savedUser._id.toString(),
        name: savedUser.name,
        email: savedUser.email,
        phone: savedUser.phone,
        cfHandle: savedUser.handle,
        currentRating: savedUser.rating,
        maxRating: savedUser.maxRating,
        rank: savedUser.rank,
        maxRank: savedUser.maxRank,
        country: savedUser.country,
        city: savedUser.city,
        organization: savedUser.organization,
        avatar: savedUser.avatar,
        contribution: savedUser.contribution,
        friendOfCount: savedUser.friendOfCount,
      }
    });

  } catch (error) {
    console.error('Error in createStudent:', error);
    next(error);
  }
};

export const bulkCreateStudents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('➕➕ Creating multiple students:', req.body.students?.length || 0);
    
    const { students } = req.body;
    
    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        error: 'Students array is required and must not be empty'
      });
    }

    const results = {
      created: [],
      errors: [],
      total: students.length
    };

    for (const studentData of students) {
      try {
        const { name, handle, email, phone } = studentData;
        
        if (!name || !handle) {
          results.errors.push({
            handle: handle || 'unknown',
            error: 'Name and handle are required'
          });
          continue;
        }

        // Check if handle already exists
        const existingUser = await User.findOne({ handle });
        if (existingUser) {
          results.errors.push({
            handle,
            error: 'User with this handle already exists'
          });
          continue;
        }

        // Create new user (simplified, without CF data fetch)
        const newUser = new User({
          name,
          email,
          phone,
          handle,
          rank: 'newbie',
          rating: 0,
          maxRank: 'newbie',
          maxRating: 0,
          contribution: 0,
          lastOnlineTimeSeconds: Date.now() / 1000,
          registrationTimeSeconds: Date.now() / 1000,
          friendOfCount: 0,
          avatar: 'https://userpic.codeforces.org/no-avatar.jpg',
          titlePhoto: '',
        });

        const savedUser = await newUser.save();
        results.created.push({
          _id: savedUser._id.toString(),
          name: savedUser.name,
          handle: savedUser.handle
        });

      } catch (error) {
        results.errors.push({
          handle: studentData.handle || 'unknown',
          error: error.message
        });
      }
    }

    console.log(`✅ Bulk creation completed: ${results.created.length} created, ${results.errors.length} errors`);

    res.status(201).json({
      message: `Bulk creation completed: ${results.created.length} created, ${results.errors.length} errors`,
      results
    });

  } catch (error) {
    console.error('Error in bulkCreateStudents:', error);
    next(error);
  }
};

// ========== READ OPERATIONS ==========

/** GET /students/:id - Get student by ID */
export const getStudentById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Getting student by ID: ${id}`);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'Invalid student ID format'
      });
    }

    const student = await User.findById(id).lean();
    
    if (!student) {
      return res.status(404).json({
        error: 'Student not found'
      });
    }

    const formattedStudent = {
      _id: student._id.toString(),
      name: student.name,
      email: student.email || '',
      phone: student.phone || '',
      cfHandle: student.handle,
      currentRating: student.rating,
      maxRating: student.maxRating,
      rank: student.rank,
      maxRank: student.maxRank,
      country: student.country,
      city: student.city,
      organization: student.organization,
      avatar: student.avatar,
      contribution: student.contribution,
      friendOfCount: student.friendOfCount,
      firstName: student.firstName,
      lastName: student.lastName,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
    };

    console.log(`✅ Found student: ${student.handle}`);
    res.json(formattedStudent);

  } catch (error) {
    console.error('Error in getStudentById:', error);
    next(error);
  }
};

/** GET /students/stats - Get database statistics */
export const getStudentStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('📊 Getting database statistics...');

    const [
      totalStudents,
      ratedStudents,
      avgRating,
      maxRating,
      rankDistribution,
      countryDistribution,
      recentStudents
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ rating: { $gt: 0 } }),
      User.aggregate([
        { $match: { rating: { $gt: 0 } } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ]),
      User.findOne().sort({ rating: -1 }).select('rating handle'),
      User.aggregate([
        { $group: { _id: '$rank', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      User.aggregate([
        { $match: { country: { $exists: true, $ne: null } } },
        { $group: { _id: '$country', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      User.find().sort({ createdAt: -1 }).limit(5).select('name handle createdAt')
    ]);

    const stats = {
      totalStudents,
      ratedStudents,
      unratedStudents: totalStudents - ratedStudents,
      averageRating: avgRating[0]?.avgRating ? Math.round(avgRating[0].avgRating) : 0,
      highestRating: maxRating?.rating || 0,
      topRatedUser: maxRating?.handle || null,
      rankDistribution,
      topCountries: countryDistribution,
      recentlyAdded: recentStudents
    };

    console.log('✅ Statistics compiled successfully');
    res.json(stats);

  } catch (error) {
    console.error('Error in getStudentStats:', error);
    next(error);
  }
};

// ========== UPDATE OPERATIONS ==========

/** PUT /students/:id - Update student */
export const updateStudent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    console.log(`✏️ Updating student: ${id}`, req.body);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'Invalid student ID format'
      });
    }

    // First, get the current student data
    const currentStudent = await User.findById(id).lean();
    if (!currentStudent) {
      return res.status(404).json({
        error: 'Student not found'
      });
    }

    const incomingData = { ...req.body };
    delete incomingData._id; // Remove _id from update data

    // Convert empty strings to undefined for unique sparse fields
    if (incomingData.email === '') {
      incomingData.email = undefined;
    }
    if (incomingData.phone === '') {
      incomingData.phone = undefined;
    }

    // Function to normalize values for comparison
    const normalizeValue = (value: any) => {
      if (value === '' || value === null) return undefined;
      return value;
    };

    // Detect changes by comparing current vs incoming data
    const changedFields: { [key: string]: any } = {};
    const fieldsToCheck = [
      'name', 'email', 'phone', 'handle', 'firstName', 'lastName', 
      'country', 'city', 'organization'
    ];

    fieldsToCheck.forEach(field => {
      const currentValue = normalizeValue(currentStudent[field]);
      const incomingValue = normalizeValue(incomingData[field]);
      
      // Compare values (handle undefined/null/empty string equivalency)
      if (currentValue !== incomingValue) {
        changedFields[field] = incomingValue;
        console.log(`🔄 Field '${field}' changed: '${currentValue}' → '${incomingValue}'`);
      }
    });

    // If no fields have changed, return early
    if (Object.keys(changedFields).length === 0) {
      console.log(`⚡ No changes detected for student: ${currentStudent.handle}`);
      
      // Return current student data
      const formattedStudent = {
        _id: currentStudent._id.toString(),
        name: currentStudent.name,
        email: currentStudent.email || '',
        phone: currentStudent.phone || '',
        cfHandle: currentStudent.handle,
        currentRating: currentStudent.rating,
        maxRating: currentStudent.maxRating,
        rank: currentStudent.rank,
        maxRank: currentStudent.maxRank,
        country: currentStudent.country,
        city: currentStudent.city,
        organization: currentStudent.organization,
        avatar: currentStudent.avatar,
        contribution: currentStudent.contribution,
        friendOfCount: currentStudent.friendOfCount,
        firstName: currentStudent.firstName,
        lastName: currentStudent.lastName,
      };

      return res.json({
        message: 'No changes detected - student data unchanged',
        student: formattedStudent,
        changesDetected: false
      });
    }

    // Validate unique constraints for changed fields
    if (changedFields.handle) {
      const existingUser = await User.findOne({ 
        handle: changedFields.handle, 
        _id: { $ne: id } 
      });
      if (existingUser) {
        return res.status(409).json({
          error: 'Another user with this handle already exists'
        });
      }
    }

    if (changedFields.email && changedFields.email !== undefined) {
      const existingEmailUser = await User.findOne({ 
        email: changedFields.email, 
        _id: { $ne: id } 
      });
      if (existingEmailUser) {
        return res.status(409).json({
          error: 'Another user with this email already exists'
        });
      }
    }

    // Perform the update with only changed fields
    console.log(`🎯 Updating ${Object.keys(changedFields).length} changed fields:`, Object.keys(changedFields));
    
    const updatedStudent = await User.findByIdAndUpdate(
      id,
      { $set: changedFields }, // Only update changed fields
      { new: true, runValidators: true }
    ).lean();

    if (!updatedStudent) {
      return res.status(404).json({
        error: 'Student not found during update'
      });
    }

    const formattedStudent = {
      _id: updatedStudent._id.toString(),
      name: updatedStudent.name,
      email: updatedStudent.email || '',
      phone: updatedStudent.phone || '',
      cfHandle: updatedStudent.handle,
      currentRating: updatedStudent.rating,
      maxRating: updatedStudent.maxRating,
      rank: updatedStudent.rank,
      maxRank: updatedStudent.maxRank,
      country: updatedStudent.country,
      city: updatedStudent.city,
      organization: updatedStudent.organization,
      avatar: updatedStudent.avatar,
      contribution: updatedStudent.contribution,
      friendOfCount: updatedStudent.friendOfCount,
      firstName: updatedStudent.firstName,
      lastName: updatedStudent.lastName,
    };

    console.log(`✅ Successfully updated student: ${updatedStudent.handle}`);
    res.json({
      message: 'Student updated successfully',
      student: formattedStudent,
      changesDetected: true,
      updatedFields: Object.keys(changedFields),
      changesSummary: Object.keys(changedFields).map(field => ({
        field,
        oldValue: normalizeValue(currentStudent[field]) || null,
        newValue: normalizeValue(changedFields[field]) || null
      }))
    });

  } catch (error) {
    console.error('Error in updateStudent:', error);
    
    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'field';
      return res.status(409).json({
        error: `Another user with this ${field} already exists`
      });
    }
    
    next(error);
  }
};

// ========== DELETE OPERATIONS ==========

/** DELETE /students/:id - Delete student */
export const deleteStudent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Deleting student: ${id}`);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'Invalid student ID format'
      });
    }

    const deletedStudent = await User.findByIdAndDelete(id);

    if (!deletedStudent) {
      return res.status(404).json({
        error: 'Student not found'
      });
    }

    console.log(`✅ Deleted student: ${deletedStudent.handle}`);
    res.json({
      message: 'Student deleted successfully',
      deletedStudent: {
        _id: deletedStudent._id.toString(),
        name: deletedStudent.name,
        handle: deletedStudent.handle
      }
    });

  } catch (error) {
    console.error('Error in deleteStudent:', error);
    next(error);
  }
};

interface CFRatingChange {
    contestId: number;
    contestName: string;
    handle: string;
    rank: number;
    ratingUpdateTimeSeconds: number;
    oldRating: number;
    newRating: number;
  }
  
  interface CFSubmission {
    id: number;
    contestId?: number;
    creationTimeSeconds: number;
    relativeTimeSeconds: number;
    problem: {
      contestId?: number;
      index: string;
      name: string;
      type: string;
      points?: number;
      rating?: number;
      tags: string[];
    };
    author: {
      contestId?: number;
      members: Array<{
        handle: string;
        name?: string;
      }>;
      participantType: string;
      ghost: boolean;
      room?: number;
      startTimeSeconds?: number;
    };
    programmingLanguage: string;
    verdict: string;
    testset: string;
    passedTestCount: number;
    timeConsumedMillis: number;
    memoryConsumedBytes: number;
  }
  
  interface CFRatingResponse {
    status: 'OK' | 'FAILED';
    result: CFRatingChange[];
  }
  
  interface CFStatusResponse {
    status: 'OK' | 'FAILED';
    result: CFSubmission[];
  }
  
// Add these interfaces to your controller file
// Add these interfaces to your controller file

interface CFContest {
  id: number;
  name: string;
  type: string;
  phase: string;
  frozen: boolean;
  durationSeconds: number;
  startTimeSeconds?: number;
  relativeTimeSeconds?: number;
}

interface CFContestListResponse {
  status: 'OK' | 'FAILED';
  result: CFContest[];
}

interface CFContestStandingsResponse {
  status: 'OK' | 'FAILED';
  result: {
    contest: CFContest;
    problems: Array<{
      contestId: number;
      index: string;
      name: string;
      type: string;
      points?: number;
      rating?: number;
      tags: string[];
    }>;
    rows: any[];
  };
}

/** GET /students/:id/contest-history - Get contest history for a student */
export const getStudentContestHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { days = '365' } = req.query;
    
    console.log(`📊 Getting contest history for student: ${id}, days: ${days}`);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'Invalid student ID format'
      });
    }

    // Get student from database
    const student = await User.findById(id).lean();
    if (!student) {
      return res.status(404).json({
        error: 'Student not found'
      });
    }

    // Fetch data from Codeforces API
    console.log(`📡 Fetching data for handle: ${student.handle}`);
    
    const [cfRatingResponse, cfSubmissionsResponse] = await Promise.all([
      axios.get<CFRatingResponse>(
        `https://codeforces.com/api/user.rating?handle=${encodeURIComponent(student.handle)}`,
        { timeout: 10000 }
      ),
      axios.get<CFStatusResponse>(
        `https://codeforces.com/api/user.status?handle=${encodeURIComponent(student.handle)}`,
        { timeout: 15000 }
      )
    ]);

    if (cfRatingResponse.data.status !== 'OK' || cfSubmissionsResponse.data.status !== 'OK') {
      return res.status(400).json({
        error: 'Failed to fetch data from Codeforces'
      });
    }

    const allRatingChanges = cfRatingResponse.data.result;
    const allSubmissions = cfSubmissionsResponse.data.result;
    
    // Filter rating changes by date range
    const daysNumber = parseInt(days as string, 10);
    const cutoffTime = Math.floor(Date.now() / 1000) - (daysNumber * 24 * 60 * 60);
    
    const filteredChanges = allRatingChanges.filter(
      change => change.ratingUpdateTimeSeconds >= cutoffTime
    );

    // Get unique contest IDs from filtered changes
    const contestIds = [...new Set(filteredChanges.map(change => change.contestId))];
    
    // Create a map of user's solved problems (ever, not just in contest period)
    const solvedProblems = new Set<string>();
    allSubmissions
      .filter(sub => sub.verdict === 'OK')
      .forEach(sub => {
        if (sub.problem.contestId) {
          solvedProblems.add(`${sub.problem.contestId}${sub.problem.index}`);
        }
      });

    // Function to get contest problems count
    const getContestProblemsCount = async (contestId: number): Promise<number> => {
      try {
        // First try to get from contest standings (more reliable)
        const standingsResponse = await axios.get<CFContestStandingsResponse>(
          `https://codeforces.com/api/contest.standings?contestId=${contestId}&from=1&count=1`,
          { timeout: 8000 }
        );
        
        if (standingsResponse.data.status === 'OK') {
          return standingsResponse.data.result.problems.length;
        }
      } catch (error) {
        console.log(`⚠️ Could not fetch standings for contest ${contestId}, trying alternative`);
      }

      // Fallback: estimate from submissions in that contest
      const contestSubmissions = allSubmissions.filter(sub => sub.problem.contestId === contestId);
      const uniqueProblems = new Set(contestSubmissions.map(sub => sub.problem.index));
      return uniqueProblems.size || 0;
    };

    // Process contest history with detailed problem information
    const contestHistoryPromises = filteredChanges.map(async (change) => {
      let totalProblems = 0;
      let unsolvedProblems = 0;
      let contestProblems: Array<{
        index: string;
        name: string;
        rating?: number;
        tags: string[];
        solved: boolean;
        url: string;
      }> = [];

      try {
        // Get detailed contest information including problems
        const standingsResponse = await axios.get<CFContestStandingsResponse>(
          `https://codeforces.com/api/contest.standings?contestId=${change.contestId}&from=1&count=1`,
          { timeout: 8000 }
        );
        
        if (standingsResponse.data.status === 'OK') {
          const problems = standingsResponse.data.result.problems;
          totalProblems = problems.length;
          
          // Process each problem to determine if user solved it
          contestProblems = problems.map(problem => {
            const problemKey = `${problem.contestId}${problem.index}`;
            const isSolved = solvedProblems.has(problemKey);
            
            return {
              index: problem.index,
              name: problem.name,
              rating: problem.rating,
              tags: problem.tags || [],
              solved: isSolved,
              url: `https://codeforces.com/contest/${problem.contestId}/problem/${problem.index}`
            };
          });
          
          // Count solved and unsolved
          const solvedCount = contestProblems.filter(p => p.solved).length;
          unsolvedProblems = totalProblems - solvedCount;
          
          console.log(`Contest ${change.contestId}: ${totalProblems} total, ${solvedCount} solved, ${unsolvedProblems} unsolved`);
        } else {
          // Fallback: try to get problems from user submissions
          const contestSubmissions = allSubmissions.filter(sub => sub.problem.contestId === change.contestId);
          const uniqueProblemsMap = new Map();
          
          contestSubmissions.forEach(sub => {
            const problemKey = `${sub.problem.contestId}${sub.problem.index}`;
            if (!uniqueProblemsMap.has(problemKey)) {
              uniqueProblemsMap.set(problemKey, {
                index: sub.problem.index,
                name: sub.problem.name,
                rating: sub.problem.rating,
                tags: sub.problem.tags || [],
                solved: solvedProblems.has(problemKey),
                url: `https://codeforces.com/contest/${sub.problem.contestId}/problem/${sub.problem.index}`
              });
            }
          });
          
          contestProblems = Array.from(uniqueProblemsMap.values());
          totalProblems = contestProblems.length;
          const solvedCount = contestProblems.filter(p => p.solved).length;
          unsolvedProblems = totalProblems - solvedCount;
        }
      } catch (error) {
        console.error(`Error processing contest ${change.contestId}:`, error);
        // Set defaults if we can't determine
        totalProblems = 0;
        unsolvedProblems = 0;
        contestProblems = [];
      }

      return {
        contestId: change.contestId,
        contestName: change.contestName,
        date: new Date(change.ratingUpdateTimeSeconds * 1000).toISOString(),
        rank: change.rank,
        oldRating: change.oldRating,
        newRating: change.newRating,
        ratingChange: change.newRating - change.oldRating,
        timestamp: change.ratingUpdateTimeSeconds,
        totalProblems,
        unsolvedProblems,
        solvedProblems: totalProblems - unsolvedProblems,
        problems: contestProblems.sort((a, b) => a.index.localeCompare(b.index)) // Sort by problem index (A, B, C, etc.)
      };
    });

    // Wait for all contest processing to complete
    const contestHistory = await Promise.all(contestHistoryPromises);

    // Calculate statistics
    const stats = {
      totalContests: contestHistory.length,
      averageRank: contestHistory.length > 0 
        ? Math.round(contestHistory.reduce((sum, c) => sum + c.rank, 0) / contestHistory.length)
        : 0,
      ratingChange: contestHistory.length > 0
        ? contestHistory[contestHistory.length - 1].newRating - contestHistory[0].oldRating
        : 0,
      bestRank: contestHistory.length > 0 
        ? Math.min(...contestHistory.map(c => c.rank))
        : 0,
      worstRank: contestHistory.length > 0
        ? Math.max(...contestHistory.map(c => c.rank))
        : 0,
      totalUnsolvedProblems: contestHistory.reduce((sum, c) => sum + c.unsolvedProblems, 0),
      totalSolvedProblems: contestHistory.reduce((sum, c) => sum + c.solvedProblems, 0),
      averageProblemsPerContest: contestHistory.length > 0
        ? Math.round(contestHistory.reduce((sum, c) => sum + c.totalProblems, 0) / contestHistory.length)
        : 0
    };

    console.log(`✅ Contest history processed: ${contestHistory.length} contests found`);

    res.json({
      student: {
        _id: student._id.toString(),
        name: student.name,
        handle: student.handle,
        currentRating: student.rating,
        maxRating: student.maxRating,
        rank: student.rank
      },
      contestHistory: contestHistory.reverse(), // Most recent first
      stats,
      filterDays: daysNumber
    });

  } catch (error) {
    console.error('Error in getStudentContestHistory:', error);
    
    if (error.response?.status === 400) {
      return res.status(400).json({
        error: 'Invalid Codeforces handle or user not found'
      });
    }
    
    next(error);
  }
};
  
  /** GET /students/:id/problem-solving - Get problem solving data for a student */
  /** GET /students/:id/problem-solving - Get problem solving data for a student */
export const getStudentProblemSolving = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const { days = '30' } = req.query;
      
      console.log(`🧮 Getting problem solving data for student: ${id}, days: ${days}`);
  
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          error: 'Invalid student ID format'
        });
      }
  
      // Get student from database
      const student = await User.findById(id).lean();
      if (!student) {
        return res.status(404).json({
          error: 'Student not found'
        });
      }
  
      // Fetch submissions from Codeforces API
      console.log(`📡 Fetching submissions for handle: ${student.handle}`);
      
      const cfResponse = await axios.get<CFStatusResponse>(
        `https://codeforces.com/api/user.status?handle=${encodeURIComponent(student.handle)}`,
        { timeout: 15000 }
      );
  
      if (cfResponse.data.status !== 'OK') {
        return res.status(400).json({
          error: 'Failed to fetch submissions from Codeforces'
        });
      }
  
      const allSubmissions = cfResponse.data.result;
      
      // Filter by date range and only accepted submissions
      const daysNumber = parseInt(days as string, 10);
      const cutoffTime = Math.floor(Date.now() / 1000) - (daysNumber * 24 * 60 * 60);
      
      const acceptedSubmissions = allSubmissions.filter(
        sub => sub.verdict === 'OK' && sub.creationTimeSeconds >= cutoffTime
      );
  
      // Get unique problems solved (by contestId + index)
      const uniqueProblems = new Map();
      acceptedSubmissions.forEach(sub => {
        const problemKey = `${sub.problem.contestId || 'gym'}-${sub.problem.index}`;
        if (!uniqueProblems.has(problemKey)) {
          uniqueProblems.set(problemKey, {
            contestId: sub.problem.contestId,
            index: sub.problem.index,
            name: sub.problem.name,
            rating: sub.problem.rating,
            tags: sub.problem.tags,
            solvedAt: sub.creationTimeSeconds,
            date: new Date(sub.creationTimeSeconds * 1000).toISOString().split('T')[0]
          });
        }
      });
  
      const uniqueProblemsArray = Array.from(uniqueProblems.values());
      
      // Calculate statistics
      const problemsWithRating = uniqueProblemsArray.filter(p => p.rating);
      const totalProblems = uniqueProblemsArray.length;
      
      const stats = {
        totalProblems,
        mostDifficultProblem: problemsWithRating.length > 0
          ? problemsWithRating.reduce((max, p) => p.rating > max.rating ? p : max)
          : null,
        averageRating: problemsWithRating.length > 0
          ? Math.round(problemsWithRating.reduce((sum, p) => sum + p.rating, 0) / problemsWithRating.length)
          : 0,
        averageProblemsPerDay: daysNumber > 0 ? (totalProblems / daysNumber).toFixed(2) : '0'
      };
  
      // Create rating buckets for bar chart
      const ratingBuckets = {
        '800-999': 0,
        '1000-1199': 0,
        '1200-1399': 0,
        '1400-1599': 0,
        '1600-1799': 0,
        '1800-1999': 0,
        '2000-2199': 0,
        '2200-2399': 0,
        '2400+': 0,
        'Unrated': 0
      };
  
      problemsWithRating.forEach(problem => {
        const rating = problem.rating;
        if (rating >= 2400) ratingBuckets['2400+']++;
        else if (rating >= 2200) ratingBuckets['2200-2399']++;
        else if (rating >= 2000) ratingBuckets['2000-2199']++;
        else if (rating >= 1800) ratingBuckets['1800-1999']++;
        else if (rating >= 1600) ratingBuckets['1600-1799']++;
        else if (rating >= 1400) ratingBuckets['1400-1599']++;
        else if (rating >= 1200) ratingBuckets['1200-1399']++;
        else if (rating >= 1000) ratingBuckets['1000-1199']++;
        else if (rating >= 800) ratingBuckets['800-999']++;
      });
  
      // Problems without rating
      ratingBuckets['Unrated'] = totalProblems - problemsWithRating.length;
  
      // Create heat map data (GitHub-style calendar)
      const heatMapData = {};
      uniqueProblemsArray.forEach(problem => {
        const date = problem.date;
        heatMapData[date] = (heatMapData[date] || 0) + 1;
      });
  
      // Generate GitHub-style calendar heatmap
      const generateCalendarHeatmap = (days: number) => {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
        
        // Adjust start date to begin from Sunday of that week for proper calendar alignment
        const startDayOfWeek = startDate.getDay();
        const adjustedStartDate = new Date(startDate.getTime() - startDayOfWeek * 24 * 60 * 60 * 1000);
        
        const weeks = [];
        const monthLabels = [];
        let currentWeek = [];
        let currentDate = new Date(adjustedStartDate);
        
        // Track months for labels
        let lastMonth = -1;
        let weekIndex = 0;
        
        // Generate calendar data week by week
        while (currentDate <= endDate || currentWeek.length > 0) {
          if (currentWeek.length === 7) {
            weeks.push([...currentWeek]);
            currentWeek = [];
            weekIndex++;
          }
          
          if (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const isInRange = currentDate >= startDate && currentDate <= endDate;
            const month = currentDate.getMonth();
            const day = currentDate.getDate();
            
            // Add month label if it's a new month and we're in the first week of the month
            if (isInRange && month !== lastMonth && day <= 7) {
              const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              monthLabels.push({
                month: monthNames[month],
                weekIndex: weekIndex
              });
              lastMonth = month;
            }
            
            currentWeek.push({
              date: dateStr,
              count: isInRange ? (heatMapData[dateStr] || 0) : 0,
              dayOfWeek: currentDate.getDay(), // 0 = Sunday, 1 = Monday, etc.
              isInRange: isInRange,
              month: month,
              day: day
            });
            
            currentDate.setDate(currentDate.getDate() + 1);
          } else {
            // Fill remaining days of the last week with empty cells
            while (currentWeek.length < 7) {
              currentWeek.push({
                date: '',
                count: 0,
                dayOfWeek: currentWeek.length,
                isInRange: false,
                month: -1,
                day: 0
              });
            }
            break;
          }
        }
        
        // Add the last week if it has content
        if (currentWeek.length > 0) {
          weeks.push(currentWeek);
        }
        
        // Calculate total contributions and max count for intensity scaling
        const totalContributions = Object.values(heatMapData).reduce((sum: number, count: number) => sum + count, 0);
        const maxCount = Math.max(...(Object.values(heatMapData) as number[]), 0);
        
        return {
          weeks,
          monthLabels,
          totalContributions,
          maxCount
        };
      };
  
      const calendarHeatmap = generateCalendarHeatmap(daysNumber);
  
      console.log(`✅ Problem solving data processed: ${totalProblems} unique problems found`);
  
      res.json({
        student: {
          _id: student._id.toString(),
          name: student.name,
          handle: student.handle,
          currentRating: student.rating,
          maxRating: student.maxRating,
          rank: student.rank
        },
        stats,
        ratingBuckets,
        heatMapData: calendarHeatmap,
        recentProblems: uniqueProblemsArray
          .sort((a, b) => b.solvedAt - a.solvedAt)
          .slice(0, 10), // Last 10 problems solved
        filterDays: daysNumber
      });
  
    } catch (error) {
      console.error('Error in getStudentProblemSolving:', error);
      
      if (error.response?.status === 400) {
        return res.status(400).json({
          error: 'Invalid Codeforces handle or user not found'
        });
      }
      
      next(error);
    }
  };
  
  /** GET /students/:id/profile - Get complete student profile data */
  export const getStudentProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      console.log(`👤 Getting complete profile for student: ${id}`);
  
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          error: 'Invalid student ID format'
        });
      }
  
      // Get student from database
      const student = await User.findById(id).lean();
      if (!student) {
        return res.status(404).json({
          error: 'Student not found'
        });
      }
  
      // Fetch basic user info from Codeforces API to get latest data
      console.log(`📡 Fetching latest user info for handle: ${student.handle}`);
      
      try {
        const cfUserResponse = await axios.get<CFInfoResponse>(
          `https://codeforces.com/api/user.info?handles=${encodeURIComponent(student.handle)}`,
          { timeout: 10000 }
        );
  
        if (cfUserResponse.data.status === 'OK' && cfUserResponse.data.result.length > 0) {
          const cfUser = cfUserResponse.data.result[0];
          
          // Update student data in database with latest CF info
          await User.findByIdAndUpdate(id, {
            rating: cfUser.rating || 0,
            maxRating: cfUser.maxRating || cfUser.rating || 0,
            rank: cfUser.rank || 'newbie',
            maxRank: cfUser.maxRank || cfUser.rank || 'newbie',
            contribution: cfUser.contribution || 0,
            friendOfCount: cfUser.friendOfCount || 0,
            lastOnlineTimeSeconds: cfUser.lastOnlineTimeSeconds || student.lastOnlineTimeSeconds,
            avatar: cfUser.avatar || student.avatar
          });
  
          console.log(`✅ Updated student data from CF API: ${student.handle}`);
        }
      } catch (cfError) {
        console.log(`⚠️ Could not fetch latest CF data for handle: ${student.handle}`);
      }
  
      // Get updated student data
      const updatedStudent = await User.findById(id).lean();
  
      const profileData = {
        _id: updatedStudent._id.toString(),
        name: updatedStudent.name,
        email: updatedStudent.email || '',
        phone: updatedStudent.phone || '',
        cfHandle: updatedStudent.handle,
        currentRating: updatedStudent.rating,
        maxRating: updatedStudent.maxRating,
        rank: updatedStudent.rank,
        maxRank: updatedStudent.maxRank,
        country: updatedStudent.country,
        city: updatedStudent.city,
        organization: updatedStudent.organization,
        avatar: updatedStudent.avatar,
        contribution: updatedStudent.contribution,
        friendOfCount: updatedStudent.friendOfCount,
        firstName: updatedStudent.firstName,
        lastName: updatedStudent.lastName,
        lastOnlineTimeSeconds: updatedStudent.lastOnlineTimeSeconds,
        registrationTimeSeconds: updatedStudent.registrationTimeSeconds,
        createdAt: updatedStudent.createdAt,
        updatedAt: updatedStudent.updatedAt
      };
  
      console.log(`✅ Profile data compiled for: ${updatedStudent.handle}`);
  
      res.json({
        student: profileData,
        cfProfileUrl: `https://codeforces.com/profile/${updatedStudent.handle}`,
        lastUpdated: new Date().toISOString()
      });
  
    } catch (error) {
      console.error('Error in getStudentProfile:', error);
      next(error);
    }
  };