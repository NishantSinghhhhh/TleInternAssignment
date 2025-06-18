// backend/src/routes/studentRoutes.ts

import { Router } from 'express';
import { 
  // Existing functions
  fetch100Users, 
  fetchStudentDetails,
  
  // CREATE operations
  createStudent,
  bulkCreateStudents,
  
  // READ operations
  getStudentById,
  getStudentStats,
  
  // UPDATE operations
  updateStudent,
  
  // DELETE operations
  deleteStudent,

  getStudentProfile,
  getStudentContestHistory,
  getStudentProblemSolving
} from '../controllers/UserController';

const router = Router();

// Add logging to see which routes are being hit
router.use((req, res, next) => {
  console.log(`Students route: ${req.method} ${req.path}`);
  next();
});

// ========== FETCH & UTILITY ROUTES ==========

// GET /students/fetch-100 → Fetch details of 100 CF users with full logging
router.get('/fetch-100', fetch100Users);

// GET /students/list → Get all students from database (for your frontend table)
router.get('/list', fetchStudentDetails);

// GET /students/stats → Get database statistics
router.get('/stats', getStudentStats);

// POST /students → Create new student
router.post('/create-student', createStudent);

// POST /students/bulk → Create multiple students
router.post('/bulk', bulkCreateStudents);

router.get('/:id', getStudentById);

// PUT /students/:id → Update student
router.put('/:id', updateStudent);

router.get('/:id/profile', getStudentProfile);

// GET /students/:id/contest-history → Get contest history for a student
router.get('/:id/contest-history', getStudentContestHistory);

// GET /students/:id/problem-solving → Get problem solving data for a student
router.get('/:id/problem-solving', getStudentProblemSolving);

router.get('/:id', getStudentById);

// DELETE /students/:id → Delete student
router.delete('/:id', deleteStudent);

export default router;